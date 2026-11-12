"""실제 모델로 답변 품질을 확인해요. (OPENAI_API_KEY 필요. gpt-6-luna 기준 16문항에 약 $0.02~0.05)

    .venv/bin/python -m tests.eval_answers            # 전체
    .venv/bin/python -m tests.eval_answers 9 10       # 번호만

확인하는 것
  - 문서에 있는 질문: 정답 낱말이 들어 있는지
  - 문서에 없는 질문: "찾지 못했"라고 솔직하게 말하는지 (지어내지 않는지)
  - 일부만 있는 질문: 있는 건 답하고, 없는 건 찾지 못했다고 하는지
  - 집결과 무관한 질문: 정중히 돌려보내는지
"""

import asyncio
import sys
import time

import openai
from dotenv import load_dotenv

load_dotenv()

from chatbot.agent import Knowledge, stream_answer  # noqa: E402

NOT_FOUND = ("찾지 못했", "찾을 수 없", "나와 있지 않", "없어서 알려 드리기 어려")
OFF_TOPIC = ("집결 이용에 관한 것만",)

# (질문, 반드시 들어갈 낱말 그룹들 — 그룹마다 하나 이상, 들어가면 안 되는 낱말)
CASES = [
    # 문서에 있는 것
    ("망원동 투룸 관리비 얼마예요?", [("7만",)], []),
    ("2억 이하 전세 있어요?", [("신림",)], []),
    ("강아지 키울 수 있는 집 있어요?", [("망원",), ("연남",), ("대치",)], []),   # 소형견·반려동물 가능 3곳 모두
    ("의뢰서 예산에 2억은 어떻게 써요?", [("20000",)], []),
    ("찜한 집은 한 번에 몇 개까지 비교할 수 있어요?", [("3개",)], []),
    ("3D로 볼 수 있는 매물은 어디예요?", [("망원",)], []),
    ("코디 상담은 몇 시까지 해요?", [("19:00", "19시", "저녁 7시", "오후 7시")], []),
    ("엘리베이터 있는 원룸 알려줘", [("성수",), ("합정",), ("강남역",), ("샤로수길",)], []),   # 원룸 6곳 중 4곳
    # 문서에 없는 것 (지어내면 실패)
    ("망원동 투룸 화장실은 몇 개예요?", [NOT_FOUND], []),
    ("강남역 직장인 원룸 근처에 헬스장 있어요?", [NOT_FOUND], []),
    ("집결 대표 이름이 뭐예요?", [NOT_FOUND], []),
    ("성수동 원룸 층간소음은 어때요?", [NOT_FOUND], []),
    ("전세 대출 금리는 지금 몇 퍼센트예요?", [NOT_FOUND], ["%"]),
    # 일부만 있는 것
    ("압구정 한강뷰 전세 관리비랑 인터넷 속도 알려줘", [("40만",), NOT_FOUND], []),
    # 집결과 무관한 것
    ("오늘 서울 날씨 어때?", [OFF_TOPIC], []),
    ("파이썬으로 리스트 정렬하는 코드 짜줘", [OFF_TOPIC], ["sorted", "def "]),
    # 인사
    ("안녕하세요!", [], list(NOT_FOUND)),
]


async def ask(kb, client, q):
    t0 = time.perf_counter()
    text, sources, searches = "", [], 0
    async for ev in stream_answer(kb, client, q, []):
        if ev["type"] == "text":
            text += ev["text"]
        elif ev["type"] == "sources":
            sources = ev["items"]
        elif ev["type"] == "state" and ev["state"] == "searching":
            searches += 1
    return text, sources, searches - 1, time.perf_counter() - t0


async def main(only):
    kb, client = Knowledge(), openai.AsyncOpenAI()
    passed = 0
    chosen = [(i, c) for i, c in enumerate(CASES, 1) if not only or i in only]
    for i, (q, must, must_not) in chosen:
        text, sources, research, secs = await ask(kb, client, q)
        ok = all(any(w in text for w in group) for group in must) and not any(w in text for w in must_not)
        passed += ok
        print(f"\n[{'PASS' if ok else 'FAIL'}] #{i} {q}   ({secs:.1f}초, 다시 찾기 {research}번, 출처 {len(sources)}개)")
        print("  " + text.strip().replace("\n", "\n  "))
        for s in sources:
            print(f"    [{s['n']}] {s['title']}")
    print(f"\n결과: {passed}/{len(chosen)} 통과")


if __name__ == "__main__":
    asyncio.run(main({int(a) for a in sys.argv[1:]}))
