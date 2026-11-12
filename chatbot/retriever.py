"""BM25 검색기. 외부 서비스·모델 없이 돌아가요.

한국어는 조사가 단어에 붙어서("마포구에", "전세는") 단어 그대로 비교하면 잘 안 맞아요.
그래서 한글 단어는 두 글자씩 겹쳐 자른 조각(바이그램)으로 비교해요.
  "마포구에" → 마포 · 포구 · 구에
영문·숫자는 단어 그대로 써요. (3d, 20000, wishlist)

검색어 표현이 문서와 다를 때(강아지 ↔ 소형견·반려동물)는
모델이 search_docs 도구로 다른 표현을 넣어 다시 찾아요. (agent.py)
"""

from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass

from .knowledge import Chunk

_WORD = re.compile(r"[가-힣]+|[a-z0-9]+(?:\.[0-9]+)?")

# 질문 어미·군더더기 조각. "전세가 뭐예요?"가 "3D가 뭐예요?" 제목에 끌려가지 않게 빼요.
# (tests/test_retrieval.py 기준 recall@6: 92% → 95%)
_STOP = set(
    "뭐예 예요 어요 해요 세요 나요 까요 있어 어떻 떻게 무슨 알려 려줘 주세 줘요 가요 "
    "는데 데요 되나 돼요 할까 에요 이에 인가 하나 하면 할수 수있 있나 싶어 어떤 려주".split()
)


def tokenize(text: str) -> list[str]:
    tokens: list[str] = []
    for w in _WORD.findall(text.lower()):
        if "가" <= w[0] <= "힣":
            if len(w) == 1:
                tokens.append(w)                  # 집, 방, 층 같은 한 글자 단어
            else:
                tokens.extend(t for t in (w[i:i + 2] for i in range(len(w) - 1)) if t not in _STOP)
        else:
            tokens.append(w)
    return tokens


@dataclass
class Hit:
    chunk: Chunk
    score: float


class BM25:
    def __init__(self, chunks: list[Chunk], k1: float = 1.2, b: float = 0.75):
        self.chunks = chunks
        self.k1, self.b = k1, b
        # 제목은 두 번 넣어서 본문보다 무겁게 봐요.
        self.docs = [Counter(tokenize(f"{c.title}\n{c.title}\n{c.text}")) for c in chunks]
        self.lens = [sum(d.values()) for d in self.docs]
        self.avg = sum(self.lens) / len(self.lens)
        df = Counter(t for d in self.docs for t in d)
        n = len(chunks)
        self.idf = {t: math.log(1 + (n - f + 0.5) / (f + 0.5)) for t, f in df.items()}

    def score(self, query_tokens: list[str], i: int) -> float:
        d, length = self.docs[i], self.lens[i]
        s = 0.0
        for t in set(query_tokens):
            f = d.get(t)
            if not f:
                continue
            s += self.idf[t] * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * length / self.avg))
        return s

    def search(self, query: str, k: int = 6, exclude: set[str] | None = None,
               min_ratio: float = 0.25) -> list[Hit]:
        """점수 상위 k개. 1등 점수의 min_ratio 미만은 관련 없는 조각으로 보고 빼요."""
        q = tokenize(query)
        if not q:
            return []
        exclude = exclude or set()
        scored = [Hit(c, self.score(q, i)) for i, c in enumerate(self.chunks) if c.id not in exclude]
        scored = [h for h in scored if h.score > 0]
        scored.sort(key=lambda h: h.score, reverse=True)
        if not scored:
            return []
        floor = scored[0].score * min_ratio
        return [h for h in scored[:k] if h.score >= floor]
