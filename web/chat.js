/* 겨리 채팅 화면
 * - /api/chat 에서 답변을 스트리밍(SSE)으로 받아 그려요.
 * - 상태(searching / thinking / default)를 부모 창(집결 사이트의 위젯)에 postMessage로 알려요.
 * - 답변 속 /listings/1 같은 링크는 집결 사이트 주소로 바꿔요.
 */
(function () {
  "use strict";

  const CONFIG = Object.assign({ websiteUrl: "" }, window.ZG_CONFIG || {});
  const params = new URLSearchParams(location.search);
  const EMBED = params.get("embed") === "1" && window.parent !== window;
  const PAGE = params.get("from") || null;
  const LINK_TARGET = EMBED ? "_top" : "_blank";   // 위젯 안이면 사이트 페이지를 그 자리에서 열어요
  const STORE_KEY = "zg-chat-v1";
  const CITE = "⁣";                              // 인용 번호 표시용 보이지 않는 구분자

  const log = document.getElementById("log");
  const form = document.getElementById("form");
  const input = document.getElementById("q");
  const sendBtn = document.getElementById("send");
  if (EMBED) document.body.classList.add("embed");

  /** @type {{role:"user"|"assistant", raw:string, sources?:any[]}[]} */
  let messages = load();
  let busy = false;
  let seq = 0;

  // ---------- 부모 창(위젯)과 통신 ----------
  function setCharacter(state) {
    if (EMBED) window.parent.postMessage({ type: "zipgyeol:state", state }, "*");
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && EMBED) window.parent.postMessage({ type: "zipgyeol:close" }, "*");
  });

  // ---------- 저장 (패널을 닫았다 열거나 사이트 안에서 페이지를 옮겨도 대화가 남아요) ----------
  function load() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || "[]"); } catch { return []; }
  }
  function save() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-30))); } catch { /* 저장 못 해도 동작해요 */ }
  }

  // ---------- 안전한 마크다운 (굵게 · 목록 · 링크 · 코드 · 인용 번호만) ----------
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function siteHref(path) {
    if (/^\/(?!\/)\S*$/.test(path)) return CONFIG.websiteUrl + path;   // /listings/1 → 사이트 주소
    try {
      const u = new URL(path);
      if (CONFIG.websiteUrl && u.origin === new URL(CONFIG.websiteUrl).origin) return u.href;
    } catch { /* 주소가 아니에요 */ }
    return null;                                                           // 그 밖의 외부 주소는 링크로 만들지 않아요
  }
  const link = (href, inner) => `<a href="${esc(href)}" target="${LINK_TARGET}" rel="noopener">${inner}</a>`;

  function inline(s, mid) {
    const re = new RegExp(String.raw`\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|` + "`([^`\\n]+)`|" + CITE + "([\\d,]+)" + CITE, "g");
    let out = "", i = 0, m;
    while ((m = re.exec(s))) {
      out += esc(s.slice(i, m.index));
      i = re.lastIndex;
      if (m[1] !== undefined) {
        const href = siteHref(m[2]);
        out += href ? link(href, inline(m[1], mid)) : inline(m[1], mid);
      } else if (m[3] !== undefined) {
        out += `<strong>${inline(m[3], mid)}</strong>`;
      } else if (m[4] !== undefined) {
        const href = /^\/[a-z]/.test(m[4]) ? siteHref(m[4]) : null;       // `/listings/1` 처럼 쓴 주소도 링크로
        out += href ? link(href, `<code>${esc(m[4])}</code>`) : `<code>${esc(m[4])}</code>`;
      } else {
        // 단어 결합 문자(U+2060)로 번호가 앞 글자와 떨어져 다음 줄로 넘어가지 않게 해요.
        out += "⁠" + m[5].split(",").map((n) =>
          `<a class="num ref" href="#src-${mid}-${n}" data-ref="${n}" aria-label="출처 ${n}">${n}</a>`).join("");
      }
    }
    return out + esc(s.slice(i));
  }

  function render(md, mid) {
    let html = "", para = [], list = null;
    const flushPara = () => { if (para.length) html += `<p>${para.map((l) => inline(l, mid)).join("<br>")}</p>`; para = []; };
    const flushList = () => { if (list) html += `<${list.tag}>${list.items.map((x) => `<li>${inline(x, mid)}</li>`).join("")}</${list.tag}>`; list = null; };
    for (const line of md.split("\n")) {
      const ul = line.match(/^\s*[-*]\s+(.*)$/);
      const ol = line.match(/^\s*\d+\.\s+(.*)$/);
      if (ul || ol) {
        flushPara();
        const tag = ul ? "ul" : "ol";
        if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
        list.items.push((ul || ol)[1]);
      } else if (!line.trim()) {
        flushPara(); flushList();
      } else if (list && /^\s+/.test(line)) {
        list.items[list.items.length - 1] += " " + line.trim();
      } else {
        flushList();
        para.push(line.replace(/^#+\s*/, ""));
      }
    }
    flushPara(); flushList();
    return html;
  }

  const plain = (raw) => raw.replace(new RegExp(CITE + "[\\d,]+" + CITE, "g"), "").trim();
  const cleanTitle = (t) => t.replace(/\s*—\s*`?\/\S*`?/g, "").replace(/[✅🧪`]/g, "").replace(/\s+/g, " ").replace(/\s*>\s*/g, " › ").trim();
  const cleanQuote = (t) => t.replace(/[✅🧪]|\*\*/g, "").replace(/^\s*[-*]\s+/gm, "").replace(/\|/g, " ").replace(/[ \t]+/g, " ").trim();

  // ---------- 화면 그리기 ----------
  function scrollToEnd(force) {
    const near = log.scrollHeight - log.scrollTop - log.clientHeight < 120;
    if (force || near) log.scrollTop = log.scrollHeight;
  }

  function addUser(text) {
    const turn = document.createElement("div");
    turn.className = "turn me";
    const b = document.createElement("div");
    b.className = "bubble-me";
    b.textContent = text;
    turn.appendChild(b);
    log.appendChild(turn);
    scrollToEnd(true);
  }

  // 겨리의 한 턴: 카드(본문 · 진행 상태 · 출처) + 딸린 행동(칩·다시 보내기)
  function botTurn() {
    const turn = document.createElement("div");
    turn.className = "turn bot";
    turn.innerHTML = `<div class="stack"><div class="card"></div></div>`;
    log.appendChild(turn);
    return { turn, stack: turn.querySelector(".stack"), card: turn.querySelector(".card") };
  }

  function addBot() {
    const mid = ++seq;
    const { turn, stack, card } = botTurn();
    card.innerHTML = `<div class="answer" aria-busy="true" hidden></div>
      <div class="status" hidden><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="status-text"></span></div>`;
    const answer = card.querySelector(".answer");
    const status = card.querySelector(".status");
    return {
      mid, wrap: turn, stack, card,
      setStatus(text) {
        status.hidden = !text;
        card.querySelector(".status-text").textContent = text || "";
        scrollToEnd();
      },
      draw(raw) {
        answer.hidden = !raw;
        answer.innerHTML = render(raw, mid);
        scrollToEnd();
      },
      done() { answer.setAttribute("aria-busy", "false"); },
    };
  }

  function addSources(view, items) {
    if (!items || !items.length) return;
    const d = document.createElement("details");
    d.className = "sources";
    d.innerHTML = `<summary>참고한 문서 ${items.length}개</summary><ol>${items.map((s) =>
      `<li id="src-${view.mid}-${s.n}"><span class="num" aria-hidden="true">${s.n}</span><div>` +
      `<span class="src-title"><span class="sr-only">출처 ${s.n}: </span>${esc(cleanTitle(s.title))}</span>` +
      (s.quote ? `<p class="src-quote">${esc(cleanQuote(s.quote))}</p>` : "") + `</div></li>`).join("")}</ol>`;
    view.card.appendChild(d);
  }

  // 인용 번호를 누르면 출처를 펼쳐서 보여 줘요.
  log.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-ref]");
    if (!a) return;
    e.preventDefault();
    const li = document.getElementById(a.getAttribute("href").slice(1));
    if (!li) return;
    li.closest("details").open = true;
    li.classList.add("flash");
    setTimeout(() => li.classList.remove("flash"), 1200);
    li.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });

  function addError(text, retryQuestion) {
    const { turn, stack, card } = botTurn();
    card.classList.add("error");
    card.innerHTML = `<div class="answer" role="alert"></div>`;
    card.firstChild.textContent = text;
    if (retryQuestion) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "retry"; b.textContent = "질문 다시 보내기";
      b.addEventListener("click", () => { turn.remove(); ask(retryQuestion, { retry: true }); });
      stack.appendChild(b);
    }
    scrollToEnd(true);
  }

  const STARTERS = ["2억 이하 전세 있어요?", "고양이 키울 수 있는 집 있어요?", "3D는 어떻게 움직여요?", "의뢰서 쓰면 언제 연락 와요?"];

  function addWelcome() {
    const v = addBot();
    v.draw("안녕하세요, 집결 도우미 **겨리**예요. 매물, 3D 둘러보기, 찜, 의뢰서처럼 집결 이용에 관한 걸 물어보세요.");
    v.done();
    if (messages.length) return;
    const chips = document.createElement("div");
    chips.className = "chips";
    for (const q of STARTERS) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = q;
      b.addEventListener("click", () => { chips.remove(); ask(q); });
      chips.appendChild(b);
    }
    v.stack.appendChild(chips);
  }

  function restore() {
    addWelcome();
    for (const m of messages) {
      if (m.role === "user") addUser(plain(m.raw));
      else { const v = addBot(); v.draw(m.raw); v.done(); addSources(v, m.sources); }
    }
    scrollToEnd(true);
  }

  // ---------- 질문 보내기 ----------
  async function ask(question, { retry = false } = {}) {
    if (busy) return;
    busy = true;
    sendBtn.disabled = true;
    document.querySelectorAll(".chips").forEach((c) => c.remove());

    const history = messages.map((m) => ({ role: m.role, content: plain(m.raw) })).filter((m) => m.content);
    if (!retry) { addUser(question); }
    const view = addBot();
    view.setStatus("문서에서 찾는 중이에요…");
    let raw = "", sources = null, failed = null, frame = 0;
    const redraw = () => { frame = 0; view.draw(raw); };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history, page: PAGE }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "답변을 가져오지 못했어요. 잠시 뒤 다시 보내 주세요.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let cut;
        while ((cut = buf.indexOf("\n\n")) >= 0) {
          const chunk = buf.slice(0, cut); buf = buf.slice(cut + 2);
          const line = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const ev = JSON.parse(line.slice(6));
          if (ev.type === "state") {
            setCharacter(ev.state);
            if (!raw) view.setStatus(ev.state === "searching" ? "문서에서 찾는 중이에요…" : ev.state === "thinking" ? "답변을 정리하는 중이에요…" : "");
          } else if (ev.type === "text") {
            if (!raw) view.setStatus("");
            raw += ev.text;
            if (!frame) frame = requestAnimationFrame(redraw);
          } else if (ev.type === "cite") {
            raw += CITE + ev.refs.join(",") + CITE;
          } else if (ev.type === "sources") {
            sources = ev.items;
          } else if (ev.type === "error") {
            failed = ev.message;
          }
        }
      }
    } catch (err) {
      failed = err && err.message ? err.message : "답변을 가져오지 못했어요. 잠시 뒤 다시 보내 주세요.";
      if (err instanceof TypeError) failed = "인터넷 연결을 확인하고 다시 보내 주세요.";
    }

    if (frame) cancelAnimationFrame(frame);
    setCharacter("default");
    view.setStatus("");
    if (raw) {
      view.draw(raw);
      view.done();
      addSources(view, sources);
      if (!retry || messages[messages.length - 1]?.role !== "user") messages.push({ role: "user", raw: question });
      messages.push({ role: "assistant", raw, sources });
      save();
    } else {
      view.wrap.remove();
    }
    if (failed) {
      if (raw) addError(failed);           // 답변 일부를 받은 뒤 끊긴 경우
      else {
        if (!retry) { messages.push({ role: "user", raw: question }); save(); }
        addError(failed, question);
      }
    }
    busy = false;
    sendBtn.disabled = false;
    if (!EMBED || document.hasFocus()) input.focus();
  }

  // ---------- 입력 ----------
  function grow() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  }
  input.addEventListener("input", grow);
  input.addEventListener("keydown", (e) => {
    // 한글 조합 중 Enter는 글자 확정이라 보내지 않아요.
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q || busy) return;
    input.value = "";
    grow();
    ask(q);
  });
  restore();
})();
