"""agent.stream_answer 흐름 검사 (가짜 OpenAI 클라이언트, API 키 필요 없음).

    .venv/bin/python -m tests.test_agent_flow
"""

import asyncio
import copy
import json
from types import SimpleNamespace as NS

from chatbot.agent import CiteParser, Knowledge, stream_answer


class FakeItem(NS):
    def model_dump(self, exclude_none=False):
        return {k: v for k, v in vars(self).items() if not (exclude_none and v is None)}


class FakeStream:
    def __init__(self, events, final):
        self.events, self.final = events, final

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    def __aiter__(self):
        async def gen():
            for e in self.events:
                yield e
        return gen()

    async def get_final_response(self):
        return self.final


class FakeClient:
    """미리 정한 응답을 차례로 돌려주고, 받은 요청을 기록해요."""

    def __init__(self, script):
        self.script, self.calls = list(script), []
        self.responses = NS(stream=self._stream)

    def _stream(self, **kw):
        self.calls.append({**kw, "input": copy.deepcopy(kw["input"])})   # 호출 시점 사본
        events, final = self.script.pop(0)
        return FakeStream(events, final)


def usage():
    return NS(input_tokens=100, output_tokens=20, input_tokens_details=NS(cached_tokens=0))


def delta(text):
    return NS(type="response.output_text.delta", delta=text)


def fn_call(call_id, query):
    # 실제 SDK 항목처럼 입력으로 보내면 안 되는 parsed_arguments 필드도 붙여 둬요.
    return FakeItem(type="function_call", call_id=call_id, name="search_docs",
                    arguments=json.dumps({"query": query}, ensure_ascii=False), id=f"fc_{call_id}", status="completed",
                    parsed_arguments={"query": query})


def reasoning():
    return FakeItem(type="reasoning", id="rs_1", summary=[], encrypted_content="ENC", content=None, status=None)


async def collect(gen):
    return [e async for e in gen]


def test_cite_parser():
    p = CiteParser()
    out = []
    for piece in ["가능해요【", "3】.", " 그리고【문서 4, 5】 끝 【아님】", " 【1"]:
        out += p.feed(piece)
    out += p.flush()
    assert out == [("text", "가능해요"), ("cite", [3]), ("text", "."), ("text", " 그리고"), ("cite", [4, 5]),
                   ("text", " 끝 "), ("text", "【아님】"), ("text", " "), ("text", "【1")], out
    print("ok  【n】 표시 떼어 내기 (조각에 걸친 표시 · 여러 번호 · 표시 아닌 괄호)")


def test_research_then_cite():
    kb = Knowledge()
    tip = "요청 내용 잘 쓰는 팁"
    client = FakeClient([
        # 1회차: 처음 받은 문서로는 부족해서 다시 찾기
        ([NS(type="response.output_item.added", item=NS(type="function_call"))],
         NS(status="completed", usage=usage(), output=[reasoning(), fn_call("c1", "요청 내용 팁")])),
        # 2회차: 새로 찾은 문서 번호를 달아서 답하기 (번호는 아래에서 계산)
        None,
    ])

    # 2회차 응답은 1회차 도구 결과에 실린 문서 번호를 봐야 만들 수 있어서, 스트림을 늦게 만들어요.
    original = client._stream

    def stream(**kw):
        if len(client.calls) == 1:
            out = kw["input"][-1]["output"]
            n = next(int(x.split('"')[1]) for x in out.split("<문서 번호=")[1:] if tip in x.split("\n")[0])
            client.script[0] = ([delta("꼭 필요한 것 1~2개를 먼저 쓰면 좋아요"), delta(f"【{n}"), delta("】."),
                                 delta(" 참고용이에요. 없는 번호【99】")],
                                NS(status="completed", usage=usage(), output=[]))
        return original(**kw)
    client.responses.stream = stream

    events = asyncio.run(collect(stream_answer(kb, client, "요청 내용 어떻게 쓰면 좋아요?", [], "/request")))

    first = client.calls[0]
    assert first["store"] is False and first["include"] == ["reasoning.encrypted_content"]
    first_text = first["input"][-1]["content"]
    assert tip not in first_text                       # 처음 검색엔 팁 조각이 없어야 의미 있는 시나리오
    assert "망원동 투룸 — `/listings/1`" in first_text  # 매물 문서는 항상 들어가요
    assert "(사용자가 지금 보고 있는 집결 페이지: /request)" in first_text and "질문: 요청 내용" in first_text

    second = client.calls[1]["input"]
    assert second[-3] == {"type": "reasoning", "id": "rs_1", "summary": [], "encrypted_content": "ENC"}
    assert second[-2]["type"] == "function_call" and second[-2]["call_id"] == "c1"
    assert "parsed_arguments" not in second[-2]                    # API가 모르는 필드는 빼야 해요(400)
    assert second[-1]["type"] == "function_call_output" and second[-1]["call_id"] == "c1"
    assert tip in second[-1]["output"]

    states = [e["state"] for e in events if e["type"] == "state"]
    assert states == ["searching", "thinking", "searching", "thinking", "default"], states
    assert {"type": "cite", "refs": [1]} in events
    assert sum(e["type"] == "cite" for e in events) == 1          # 없는 번호 【99】는 버려요
    text = "".join(e["text"] for e in events if e["type"] == "text")
    assert text == "꼭 필요한 것 1~2개를 먼저 쓰면 좋아요. 참고용이에요. 없는 번호", text
    src = next(e for e in events if e["type"] == "sources")["items"]
    assert len(src) == 1 and src[0]["n"] == 1 and tip in src[0]["title"]
    print("ok  다시 찾기 → 번호 인용 → 출처 (추론 항목 되돌려 보내기 포함)")


def test_last_round_disables_tools_and_history_is_clean():
    kb = Knowledge()
    script = [([], NS(status="completed", usage=usage(), output=[fn_call(f"c{i}", "없는 내용 검색")]))
              for i in range(3)]
    script.append(([delta("문서에서 그 정보를 찾지 못했어요.")], NS(status="completed", usage=usage(), output=[])))
    client = FakeClient(script)
    history = [
        {"role": "assistant", "content": "환영 인사"},           # 앞에 오는 assistant는 버려요
        {"role": "user", "content": "성수동 원룸 있어요?"},
        {"role": "assistant", "content": "2번 매물이 있어요."},
        {"role": "user", "content": "실패해서 답이 없는 질문"},  # 끝에 남은 user는 버려요
    ]
    events = asyncio.run(collect(stream_answer(kb, client, "관리비는?", history)))
    assert len(client.calls) == 4
    assert [c["tool_choice"] for c in client.calls] == ["auto", "auto", "auto", "none"]
    roles = [m["role"] for m in client.calls[0]["input"]]
    assert roles == ["user", "assistant", "user"], roles
    # 짧은 후속 질문은 직전 질문과 합쳐서 찾아요 → 성수동 원룸(2번) 상세가 들어가야 해요.
    assert "역세권 성수동 원룸 — `/listings/2`" in client.calls[0]["input"][-1]["content"]
    assert not any(e["type"] == "sources" for e in events)
    print("ok  마지막 회차 도구 끔 · 이전 대화 정리 · 후속 질문 검색")


if __name__ == "__main__":
    test_cite_parser()
    test_research_then_cite()
    test_last_round_disables_tools_and_history_is_clean()
