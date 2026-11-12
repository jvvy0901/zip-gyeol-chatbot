"""docs/*.md 를 제목(##, ###) 단위 조각으로 나눠요.

- 조각(Chunk) 하나 = 검색 단위 = 모델에게 넘기는 <문서 번호="n"> 하나 = 화면의 출처 하나
- 조각 안의 blocks = 표의 행, 목록 항목, 문단(FAQ 질문+답) 단위로 나눈 본문이에요.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

DOCS_DIR = Path(__file__).resolve().parent.parent / "docs"

# 검색 대상에서 빼는 문서: 목록(README)과 챗봇 설정 문서(시스템 프롬프트로 써요)
EXCLUDED = {"README.md", "10_챗봇_응답_가이드.md"}
GUIDE_FILE = "10_챗봇_응답_가이드.md"

# 검색과 상관없이 항상 넣는 문서·조각.
# 매물 문서는 통째로 넣어요. "강아지 되는 집", "엘리베이터 있는 원룸"처럼 매물 속성으로 거르는 질문은
# 12개 상세를 모두 봐야 빠뜨리지 않아요. (검색 상위 몇 개만 넣었을 때 "1곳"이라고 틀리게 답했어요)
# 약 2천 토큰이고, 매 요청 앞부분이 같아서 OpenAI 프롬프트 캐시가 적용돼요.
PINNED_DOCS = ["04_매물_정보.md"]
PINNED = [
    ("01_서비스_소개.md", "지금 서비스 범위"),
]


@dataclass
class Chunk:
    id: str                      # 예: "04-07"
    doc: str                     # 파일 이름
    doc_title: str               # 문서 제목 (# 줄)
    heading: str                 # "## 제목 > ### 제목"
    blocks: list[str] = field(default_factory=list)

    @property
    def title(self) -> str:
        return f"{self.doc_title} > {self.heading}"

    @property
    def source(self) -> str:
        return f"kb://{self.id}"

    @property
    def text(self) -> str:
        return "\n".join(self.blocks)


_HEADING = re.compile(r"^(#{1,3})\s+(.*)$")
_TABLE_SEP = re.compile(r"^\|?\s*:?-{2,}")


def _nfc(text: str) -> str:
    return unicodedata.normalize("NFC", text)


def _clean_heading(text: str) -> str:
    return text.strip()


_LIST_ITEM = re.compile(r"^([-*]|\d+\.)\s+")


def _split_blocks(lines: list[str]) -> list[str]:
    """조각 본문을 인용 단위 블록으로 나눠요.
    표는 머리줄 한 블록 + 행마다 한 블록, 목록은 항목(하위 항목 포함)마다 한 블록,
    나머지는 빈 줄로 나뉜 문단마다 한 블록이에요."""
    blocks: list[str] = []
    buf: list[str] = []

    def flush():
        text = "\n".join(buf).strip()
        if text:
            blocks.append(text)
        buf.clear()

    for raw in lines:
        line = raw.rstrip()
        s = line.strip()
        if not s or s in ("---", "***"):         # 빈 줄·가로줄 = 블록 끝
            flush()
        elif s.startswith("|"):                   # 표
            flush()
            if not _TABLE_SEP.match(s):           # 구분선(|---|)은 버려요
                blocks.append(s)
        elif _LIST_ITEM.match(line):              # 맨 앞 목록 항목 = 새 블록
            flush()
            buf.append(line)
        else:                                     # 문단 줄, 들여쓴 하위 항목
            buf.append(line)
    flush()
    return blocks


def load_chunks(docs_dir: Path = DOCS_DIR) -> list[Chunk]:
    chunks: list[Chunk] = []
    for path in sorted(docs_dir.glob("*.md")):
        name = _nfc(path.name)   # macOS 파일 이름은 자모가 풀린(NFD) 형태라 맞춰 줘요
        if name in EXCLUDED:
            continue
        prefix = name.split("_", 1)[0]
        doc_title = path.stem
        h2 = h3 = None
        body: list[str] = []
        in_code = False

        def emit():
            heading = " > ".join(h for h in (h2, h3) if h) or "개요"
            blocks = _split_blocks(body)
            if blocks:
                chunks.append(Chunk(
                    id=f"{prefix}-{len([c for c in chunks if c.doc == name]) + 1:02d}",
                    doc=name, doc_title=doc_title, heading=heading, blocks=blocks,
                ))

        for raw in _nfc(path.read_text(encoding="utf-8")).splitlines():
            if raw.strip().startswith("```"):
                in_code = not in_code
                body.append(raw)
                continue
            m = None if in_code else _HEADING.match(raw)
            if not m:
                body.append(raw)
                continue
            level, text = len(m.group(1)), _clean_heading(m.group(2))
            if level == 1:
                doc_title = text
                continue
            emit()
            body = []
            if level == 2:
                h2, h3 = text, None
            else:
                h3 = text
        emit()
    return chunks


def pinned_chunks(chunks: list[Chunk]) -> list[Chunk]:
    out = [c for doc in PINNED_DOCS for c in chunks if c.doc == doc]
    if len(out) < len(PINNED_DOCS):
        raise RuntimeError(f"고정 문서를 찾지 못했어요: {PINNED_DOCS}")
    for doc, heading in PINNED:
        for c in chunks:
            if c.doc == doc and _strip_marks(c.heading) == heading:
                out.append(c)
                break
        else:
            raise RuntimeError(f"고정 조각을 찾지 못했어요: {doc} / {heading}")
    return out


def _strip_marks(heading: str) -> str:
    """'한눈에 보기 ✅ > 빠른 분류 ✅' → '한눈에 보기 > 빠른 분류'"""
    parts = [re.sub(r"\s*[✅🧪].*$", "", p).strip() for p in heading.split(" > ")]
    return " > ".join(parts)


def load_guide(docs_dir: Path = DOCS_DIR) -> str:
    """챗봇 응답 가이드에서 말투·규칙·상황별 대응·예시 대화만 꺼내요.
    (정체성 표와 '시스템 프롬프트 초안'은 시스템 프롬프트에서 따로 다뤄요)"""
    path = next(p for p in docs_dir.glob("*.md") if _nfc(p.name) == GUIDE_FILE)
    text = _nfc(path.read_text(encoding="utf-8"))
    keep = ("말투", "지켜야 할 규칙", "상황별 대응", "예시 대화")
    out: list[str] = []
    take = False
    for line in text.splitlines():
        m = re.match(r"^##\s+(.*)$", line)
        if m:
            take = m.group(1).startswith(keep)
        if take:
            out.append(line)
    return "\n".join(out).strip()


if __name__ == "__main__":
    cs = load_chunks()
    for c in cs:
        print(f"{c.id:6} {c.title}  ({len(c.blocks)} blocks, {len(c.text)} chars)")
    print(len(cs), "chunks;", "pinned:", [c.id for c in pinned_chunks(cs)])
