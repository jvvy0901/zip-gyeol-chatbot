"""집결 챗봇 서버.

  GET  /            채팅 화면 (위젯 팝업 안에 iframe으로 열려요)
  POST /api/chat    답변 스트리밍 (Server-Sent Events)
  GET  /widget/...  캐릭터 위젯 스크립트와 영상 (집결 사이트에서 <script>로 불러요)
  GET  /healthz     상태 확인

실행:  .venv/bin/uvicorn app:app --reload --port 8000
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

import openai
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

load_dotenv()

from chatbot.agent import Knowledge, stream_answer  # noqa: E402  (.env를 먼저 읽어야 해요)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("zipgyeol")

ROOT = Path(__file__).resolve().parent
WEBSITE_URL = os.getenv("WEBSITE_URL", "http://localhost:5000").rstrip("/")
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MIN", "15"))   # IP당 1분에 보낼 수 있는 질문 수


def _origin(url: str) -> str:
    p = urlsplit(url)
    return f"{p.scheme}://{p.netloc}" if p.scheme and p.netloc else ""


# 채팅 화면을 iframe으로 넣을 수 있는 곳: 이 서버 자신 + 집결 사이트
FRAME_ANCESTORS = " ".join(filter(None, ["'self'", _origin(WEBSITE_URL), os.getenv("EXTRA_FRAME_ANCESTORS", "")]))

kb = Knowledge()
_client: openai.AsyncOpenAI | None = None


def get_client() -> openai.AsyncOpenAI:
    """키가 없어도 서버(화면·위젯)는 뜨도록, 클라이언트는 첫 질문 때 만들어요."""
    global _client
    if _client is None:
        _client = openai.AsyncOpenAI()   # OPENAI_API_KEY 를 읽어요
    return _client


if not os.getenv("OPENAI_API_KEY"):
    log.warning("OPENAI_API_KEY가 없어요. .env에 넣어야 답변을 만들 수 있어요. (.env.example 참고)")
app = FastAPI(title="집결 챗봇", docs_url=None, redoc_url=None)

# 위젯 영상은 집결 사이트(다른 주소)에서 fetch로 받아요. 읽기(GET)만 허용해요.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"], allow_headers=[])
@app.middleware("http")
async def cache_headers(request: Request, call_next):
    """위젯 스크립트·채팅 화면 파일은 매번 서버에 바뀌었는지 물어봐요(no-cache + ETag).
    그래서 고친 내용이 새로고침 한 번에 바로 보여요. 영상은 크고 잘 안 바뀌어서 하루 동안 그대로 써요."""
    response = await call_next(request)
    path = request.url.path
    if path.startswith("/widget/clips/"):
        response.headers.setdefault("Cache-Control", "public, max-age=86400")
    elif path.startswith(("/widget/", "/web/")) or path == "/":
        response.headers["Cache-Control"] = "no-cache"
    return response


app.mount("/widget", StaticFiles(directory=ROOT / "widget"), name="widget")
app.mount("/web", StaticFiles(directory=ROOT / "web"), name="web")


# ---------- 요청 형식 ----------
class Turn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    history: list[Turn] = Field(default_factory=list, max_length=20)
    page: str | None = Field(default=None, max_length=200)


_PAGE = re.compile(r"^/[A-Za-z0-9/_\-.]*$")


# ---------- 간단한 요청 제한 (API 비용 보호) ----------
_hits: dict[str, deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    return fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "?")


def _allow(ip: str) -> bool:
    now = time.monotonic()
    q = _hits[ip]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= RATE_LIMIT:
        return False
    q.append(now)
    return True


# ---------- 라우트 ----------
@app.get("/", response_class=HTMLResponse)
def chat_page() -> HTMLResponse:
    html = (ROOT / "web" / "index.html").read_text(encoding="utf-8")
    config = json.dumps({"websiteUrl": WEBSITE_URL}, ensure_ascii=False).replace("</", "<\\/")
    html = html.replace("/*__CONFIG__*/{}", config)
    return HTMLResponse(html, headers={"Content-Security-Policy": f"frame-ancestors {FRAME_ANCESTORS}"})


@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True, "chunks": len(kb.chunks)}


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


@app.post("/api/chat")
async def chat(req: ChatRequest, request: Request):
    if not req.message.strip():
        return JSONResponse({"error": "질문을 입력해 주세요."}, status_code=422)
    if not _allow(_client_ip(request)):
        return JSONResponse({"error": "질문이 너무 많아요. 1분 뒤에 다시 보내 주세요."}, status_code=429)

    page = req.page if req.page and _PAGE.match(req.page) and req.page != "/" else None
    history = [t.model_dump() for t in req.history]

    async def events():
        try:
            async for ev in stream_answer(kb, get_client(), req.message.strip(), history, page):
                yield _sse(ev)
        except openai.AuthenticationError:
            log.error("OpenAI 인증 실패: .env의 OPENAI_API_KEY를 확인하세요.")
            yield _sse({"type": "error", "message": "챗봇 설정에 문제가 있어요. 잠시 뒤 다시 시도해 주세요."})
        except openai.RateLimitError as e:
            # 요청이 몰렸거나, 크레딧이 떨어졌을 때(insufficient_quota)도 429예요.
            log.error("OpenAI 429: %s", e.message)
            yield _sse({"type": "error", "message": "지금 질문이 몰려 있어요. 잠시 뒤 다시 보내 주세요."})
        except openai.APIConnectionError:
            yield _sse({"type": "error", "message": "답변 서버에 연결하지 못했어요. 잠시 뒤 다시 보내 주세요."})
        except openai.APIStatusError as e:
            log.error("OpenAI API 오류 %s: %s", e.status_code, e.message)
            yield _sse({"type": "error", "message": "답변을 만들지 못했어요. 잠시 뒤 다시 보내 주세요."})
        except openai.OpenAIError as e:
            # 키가 아예 없으면 클라이언트를 만들 때 이 오류가 나요.
            log.error("OpenAI 설정 오류: %s", e)
            yield _sse({"type": "error", "message": "챗봇 설정에 문제가 있어요. 잠시 뒤 다시 시도해 주세요."})
        except Exception:
            log.exception("답변 중 오류")
            yield _sse({"type": "error", "message": "답변을 만들지 못했어요. 잠시 뒤 다시 보내 주세요."})
        finally:
            yield _sse({"type": "state", "state": "default"})
            yield _sse({"type": "done"})

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
