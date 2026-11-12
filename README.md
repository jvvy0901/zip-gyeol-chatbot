# 집결 챗봇 (겨리)

`docs/` 문서만 근거로 답하는 RAG 챗봇이에요. 집결 사이트에는 캐릭터 위젯으로 붙고, 누르면 팝업으로 열려요.

```
집결 사이트 ── <script src=".../widget/zipgyeol-widget.js"> ──▶ 겨리 캐릭터 + 팝업(iframe)
                                                                  │
                                                     이 서버  GET /         채팅 화면
                                                              POST /api/chat 답변 스트리밍
```

## 답변이 만들어지는 과정

1. **검색**: 캐릭터 상태는 `searching`이에요.
   - `docs/*.md`를 제목(`##`, `###`) 단위 조각 74개로 나눠 두었어요. (`chatbot/knowledge.py`)
   - 매물 12개 요약표와 서비스 범위는 항상 넣어요. 조건으로 매물을 고를 때 빠뜨리지 않기 위해서예요.
   - 질문으로 BM25 상위 6개 조각을 더 찾아요. (`chatbot/retriever.py`) 외부 임베딩 서비스는 쓰지 않아요.
2. **답변**: 캐릭터 상태는 `thinking`이에요. (`chatbot/agent.py`)
   - 찾은 조각에 번호를 붙여 `<문서 번호="3">` 형태로 OpenAI 모델(`gpt-6-luna`, Responses API)에 넘겨요.
   - 모델은 근거로 쓴 문장 끝에 `【3】`처럼 문서 번호를 달아요. 서버가 이 표시를 떼어 화면의 출처 번호로 바꿔요. 없는 번호는 버려요.
   - 결과가 부족하면 모델이 `search_docs` 도구로 다른 표현을 넣어 다시 찾아요. 최대 3번까지예요. 예: "강아지" → "반려동물 소형견"
   - 문서에 없는 내용이면 **"문서에서 그 정보를 찾지 못했어요."**라고 말하도록 시스템 프롬프트로 정해 두었어요.
3. **끝**: 캐릭터 상태는 `default`예요. 화면에 "참고한 문서" 목록이 나와요.

`docs/10_챗봇_응답_가이드.md`는 검색하지 않아요. 말투, 규칙, 예시 대화만 꺼내서 시스템 프롬프트에 넣어요.

## 로컬 실행

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env        # OPENAI_API_KEY 채우기
.venv/bin/uvicorn app:app --reload --port 8000
```

- 채팅 화면: http://localhost:8000
- 위젯 데모: http://localhost:8000/widget/demo.html

## 테스트

| 명령 | 내용 | API 키 |
|---|---|---|
| `.venv/bin/python -m tests.test_retrieval` | 검색 정확도. 질문 40개 중 정답 조각이 찾아지는 비율 | 필요 없음 |
| `.venv/bin/python -m tests.test_agent_flow` | 다시 찾기, 인용, 출처, 이전 대화 처리 흐름 | 필요 없음 |
| `.venv/bin/python -m tests.eval_answers` | 실제 답변 품질. 문서에 없는 질문에 "찾지 못했어요"라고 하는지 등 | **필요** (16문항에 약 $0.02~0.05) |

문서를 고치면 `test_retrieval`을 다시 돌려 보세요. 조각 번호(`04-04` 등)가 바뀌면 테스트의 정답 번호도 맞춰야 해요.

## 환경 변수 (.env)

| 이름 | 기본값 | 설명 |
|---|---|---|
| `OPENAI_API_KEY` | — | OpenAI API 키 |
| `WEBSITE_URL` | `http://localhost:5000` | 집결 사이트 주소. 답변 속 `/listings/1` 링크가 이 주소로 열리고, 이 주소에서만 채팅 화면을 iframe으로 넣을 수 있어요 |
| `CHAT_MODEL` | `gpt-6-luna` | 답변 모델. 입력 $0.10 / 출력 $0.50 (100만 토큰당), 질문 1개에 약 $0.001 |
| `CHAT_REASONING` | `medium` | 추론 강도 (`none` / `low` / `medium` / `high`). `low`는 더 빠르지만 평가에서 2문항을 틀렸어요(15/17) |
| `RATE_LIMIT_PER_MIN` | `15` | IP당 1분에 보낼 수 있는 질문 수 |
| `EXTRA_FRAME_ANCESTORS` | — | iframe을 허용할 주소를 더 넣을 때 (공백으로 구분) |

## 배포 (Render)

`render.yaml`에 설정을 넣어 두었어요.

1. 이 폴더를 GitHub 저장소에 올려요. `.env`는 `.gitignore`에 있어서 올라가지 않아요.
2. Render 대시보드에서 **New → Blueprint**를 누르고 저장소를 골라요.
3. 처음 만들 때 두 값을 물어봐요.
   - `OPENAI_API_KEY`
   - `WEBSITE_URL` (예: `https://zipgyeol.onrender.com`)
4. 배포가 끝나면 `https://<챗봇 주소>/healthz`에서 `{"ok": true, ...}`가 나오는지 확인해요.

설정 요약: 무료 플랜, 싱가포르 지역(한국에서 가장 가까움), Python 3.14(`.python-version`), 커밋하면 자동 배포.

배포한 뒤 집결 사이트 공통 템플릿의 `</body>` 앞에 아래 한 줄을 넣어요.

```html
<script src="https://<챗봇 주소>/widget/zipgyeol-widget.js" data-chat-url="https://<챗봇 주소>/" defer></script>
```

무료 서버는 15분 동안 쉬면 잠들어요. 잠든 동안 첫 질문은 느리고, 캐릭터 영상이 오기 전까지는 정지 이미지가 보여요.

## 폴더

| 경로 | 내용 |
|---|---|
| `app.py` | FastAPI 서버 |
| `render.yaml` | Render 배포 설정 |
| `chatbot/knowledge.py` | 문서 조각 나누기, 고정 조각, 응답 가이드 읽기 |
| `chatbot/retriever.py` | BM25 검색 (한글 두 글자 조각) |
| `chatbot/agent.py` | 시스템 프롬프트, OpenAI 호출, 다시 찾기, 출처 번호 처리 |
| `web/` | 채팅 화면 |
| `widget/` | 캐릭터 위젯과 영상 (`widget/README.md`) |
| `docs/` | 지식 문서 |
| `tests/` | 검색, 흐름, 답변 평가 |
