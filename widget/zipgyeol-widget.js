/*!
 * 집결 캐릭터 위젯 (겨리)
 * - 사이트 오른쪽 아래에 캐릭터를 띄우고, 누르면 챗봇을 팝업(iframe)으로 열어요.
 * - 챗봇이 postMessage로 보내는 상태(default / searching / thinking)에 맞춰
 *   clips/clips.json 규칙대로 영상을 전환해요.
 *
 * 사용법 (집결 사이트 템플릿의 </body> 앞):
 *   <script src="https://챗봇주소/widget/zipgyeol-widget.js"
 *           data-chat-url="https://챗봇주소/" defer></script>
 *
 * 챗봇 → 위젯 메시지:
 *   window.parent.postMessage({ type: "zipgyeol:state", state: "searching" }, "*")
 *   window.parent.postMessage({ type: "zipgyeol:close" }, "*")
 */
(function () {
  "use strict";
  if (window.ZipgyeolWidget) return;

  const script = document.currentScript;
  const scriptSrc = (script && script.src) || location.href;
  const CHAT_URL = new URL((script && script.dataset.chatUrl) || "./", scriptSrc).href;
  const CLIPS_BASE = new URL((script && script.dataset.clipsBase) || "clips/", scriptSrc).href;
  const CHAT_ORIGIN = new URL(CHAT_URL).origin;

  // Safari·iOS는 VP9 알파(webm)를 못 그려서 HEVC 알파(mov)를 써요.
  const ua = navigator.userAgent;
  const isWebKitOnly =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\/|Firefox\/|OPR\//.test(ua));
  const EXT = isWebKitOnly ? ".mov" : ".webm";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ---------- 스타일 (Shadow DOM 안이라 사이트 CSS와 섞이지 않아요) ----------
  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .root {
      --blue: #0056FF;
      --blue-deep: #0040C2;
      --ink: #14213D;
      --paper: #FFFFFF;
      --size: 104px;
      position: fixed; right: 16px; bottom: 16px; z-index: 2147483000;
      font-family: "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif;
    }
    .launcher {
      position: relative; display: block;
      width: var(--size); height: var(--size); padding: 0; margin: 0;
      border: 0; background: transparent; cursor: grab;
      border-radius: 28px; -webkit-tap-highlight-color: transparent;
      touch-action: none;          /* 손가락으로 끌 때 페이지가 같이 스크롤되지 않게 */
      user-select: none; -webkit-user-select: none;
    }
    .root.dragging .launcher { cursor: grabbing; }
    .launcher:focus-visible { outline: 3px solid var(--blue); outline-offset: 2px; }
    .stage { position: absolute; inset: 0; pointer-events: none; }
    .stage video, .stage img {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: contain; opacity: 0; z-index: 0;
    }
    .stage .on { opacity: 1; z-index: 1; }
    .stage .incoming { z-index: 2; }
    .stage .fade { transition: opacity 100ms linear; }

    /* 말풍선: 기본 상태에서 항상 떠 있어요. 누르면 채팅이 열려요(버튼 안이라 클릭이 같이 가요). */
    /* 말풍선(미니멀): 꼬리·진한 그림자 없이 얇은 테두리 알약 하나. 캐릭터 옆에 붙어 있어 겨리의 말로 읽혀요. */
    .label {
      /* 캐릭터 왼쪽 위 대각선. 영상의 투명 여백(위·옆 약 18%)만큼 겹쳐서 지붕 모서리에 붙여요. */
      position: absolute; right: calc(100% - var(--size) * .22); bottom: calc(100% - var(--size) * .2);
      white-space: nowrap; cursor: pointer;
      background: var(--paper); color: var(--ink);
      font-size: 13px; font-weight: 500; line-height: 1; letter-spacing: -0.2px;
      padding: 9px 12px; border-radius: 16px 16px 4px 16px;   /* 캐릭터 쪽(오른쪽 아래) 모서리만 덜 둥글게 → 겨리가 하는 말 */
      border: 1px solid #E8ECF5;
      box-shadow: 0 1px 2px rgba(20, 33, 61, .06);   /* 사진 위에서도 떠 보이게 한 겹만 */
      transition: color .15s ease, border-color .15s ease;
      animation: bubble-in .25s ease-out .6s both;
    }
    .launcher:hover .label, .launcher:focus-visible .label { color: var(--blue); border-color: #C9D9FB; }
    .root.open .label, .root.dragging .label { display: none; }
    /* 화면 왼쪽에 두면 오른쪽 위 대각선으로, 위쪽에 두면 아래 대각선으로 (화면 밖으로 잘리지 않게) */
    .root.left-side .label { right: auto; left: calc(100% - var(--size) * .22); border-radius: 16px 16px 16px 4px; }
    .root.top-side .label { bottom: auto; top: calc(100% - var(--size) * .2); border-radius: 16px 4px 16px 16px; }
    .root.top-side.left-side .label { border-radius: 4px 16px 16px 16px; }
    @keyframes bubble-in { from { opacity: 0; } to { opacity: 1; } }

    .panel {
      position: absolute; right: 0; bottom: calc(var(--size) + 8px);
      width: 380px; height: min(600px, var(--avail, calc(100vh - var(--size) - 48px)));
      display: flex; flex-direction: column;
      background: var(--paper); border-radius: 20px; overflow: hidden;
      box-shadow: 0 16px 48px rgba(0, 40, 120, .24), 0 0 0 1px rgba(0, 64, 194, .08);
      transform-origin: bottom right;
      transition: opacity .18s ease, transform .18s ease;
    }
    .panel[hidden] { display: none; }
    .panel.closing { opacity: 0; transform: translateY(8px) scale(.98); }
    .head {
      display: flex; align-items: center; gap: 8px;
      padding: 0 4px 0 16px; height: 52px; flex: none;
      background: var(--blue); color: #fff;
    }
    .head h2 { margin: 0; font-size: 16px; font-weight: 700; flex: 1; }
    .head h2 span { font-weight: 500; opacity: .8; font-size: 13px; margin-left: 6px; }
    .close {
      width: 44px; height: 44px; border: 0; border-radius: 12px;
      background: transparent; color: #fff; cursor: pointer;
      display: grid; place-items: center;
    }
    .close:hover { background: var(--blue-deep); }
    .close:focus-visible { outline: 3px solid #fff; outline-offset: -4px; }
    iframe { flex: 1; width: 100%; border: 0; background: var(--paper); }

    /* 캐릭터 위치에 따라 팝업을 공간이 있는 쪽으로 열어요 */
    @media (min-width: 481px) {
      .root.left-side .panel { right: auto; left: 0; transform-origin: bottom left; }
      .root.top-side .panel { bottom: auto; top: calc(var(--size) + 8px); transform-origin: top right; }
      .root.top-side.left-side .panel { transform-origin: top left; }
      .root.top-side .panel.closing { transform: translateY(-8px) scale(.98); }
    }

    @media (max-width: 480px) {
      .root { --size: 84px; right: 12px; bottom: 12px; }
      .panel {
        position: fixed; left: 12px; right: 12px; top: 12px; width: auto; height: auto;
        bottom: calc(var(--size) + 20px);
      }
      /* 캐릭터를 위쪽에 두면 팝업은 그 아래를 채워요 */
      .root.top-side .panel { top: calc(var(--y, 12px) + var(--size) + 8px); bottom: 12px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .panel, .label, .stage .fade { transition: none !important; }
      .label { animation: none !important; }
    }
  `;

  // ---------- DOM ----------
  const host = document.createElement("div");
  host.id = "zipgyeol-widget";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>${CSS}</style>
    <div class="root">
      <section class="panel" id="zg-panel" role="dialog" aria-label="집결 도우미 겨리와의 대화" hidden>
        <div class="head">
          <h2>겨리<span>집결 도우미</span></h2>
          <button class="close" type="button" aria-label="대화창 닫기">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </section>
      <button class="launcher" type="button" aria-controls="zg-panel" aria-expanded="false">
        <span class="stage" aria-hidden="true">
          <img class="poster on" alt="" src="${CLIPS_BASE}poster.png">
        </span>
        <span class="label" aria-hidden="true">궁금한 점 있으세요?</span>
      </button>
    </div>`;

  const root = shadow.querySelector(".root");
  const panel = shadow.querySelector(".panel");
  const launcher = shadow.querySelector(".launcher");
  const closeBtn = shadow.querySelector(".close");
  const stage = shadow.querySelector(".stage");
  const poster = shadow.querySelector(".poster");
  launcher.setAttribute("aria-label", "겨리에게 물어보기");

  // ---------- 캐릭터 상태 머신 ----------
  const player = createPlayer();

  function createPlayer() {
    let config = null;
    const urls = {};           // clip 이름 → blob URL
    const role = {};           // clip 이름 → { state, kind: enter|loop|exit }
    let desired = "default";
    let current = null;        // 지금 보이는 clip 이름
    let active = null;         // 지금 보이는 <video>
    let pending = null;        // 아직 마무리되지 않은 전환 { el, prev }
    let ready = false;
    let waveTimer = 0;
    let hovered = false;
    const FADE_MS = 100;

    const vids = [0, 1].map(() => {
      const v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.preload = "auto";
      v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
      v.addEventListener("ended", () => { if (v === active) onClipEnd(v.dataset.clip); });
      stage.appendChild(v);
      return v;
    });
    const spare = () => (active === vids[0] ? vids[1] : vids[0]);
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    async function init() {
      if (reducedMotion.matches) return; // 움직임 줄이기: 정지 이미지만 보여요
      try {
        const res = await fetch(CLIPS_BASE + "clips.json");
        config = await res.json();
        for (const [state, s] of Object.entries(config.states)) {
          if (s.enter) role[s.enter] = { state, kind: "enter" };
          if (s.loop) role[s.loop] = { state, kind: "loop" };
          if (s.exit) role[s.exit] = { state, kind: "exit" };
        }
        // idle을 먼저 받아서 바로 보여 주고, 나머지는 뒤에서 받아요.
        await load("idle");
        ready = true;
        show("idle", { fade: true });   // 정지 이미지 위로 겹쳐 올라와요
        await Promise.all(Object.keys(config.clips).filter((n) => n !== "idle").map(load));
        apply();
        scheduleWave();
      } catch (e) {
        console.warn("[zipgyeol-widget] 캐릭터 영상을 불러오지 못해 정지 이미지로 보여요.", e);
      }
    }

    async function load(name) {
      if (urls[name]) return urls[name];
      const file = config.clips[name].file.replace(/\.webm$/, EXT);
      const blob = await (await fetch(CLIPS_BASE + file)).blob();
      return (urls[name] = URL.createObjectURL(blob));
    }

    // 쉬고 있는 <video>에 클립을 올리고 첫 프레임에 맞춰 둬요.
    function cue(el, name) {
      if (el.dataset.clip !== name) { el.src = urls[name]; el.dataset.clip = name; }
      else if (el.currentTime !== 0) el.currentTime = 0;
    }

    // *_loop는 지금 원하는 상태일 때만 반복해요. 아니면 한 바퀴 돌고 ended → *_out.
    function wantsLoop(name) {
      const r = role[name];
      return !!config.clips[name].loop && (!r || r.kind !== "loop" || r.state === desired);
    }

    // name 클립이 끝나면 다음에 무엇을 틀지 정해요. null이면 끝나지 않는 클립(idle)이에요.
    function nextAfter(name) {
      const r = role[name];
      const goal = config.states[desired];
      const goalStart = goal.enter || goal.loop;
      if (r && r.kind === "enter") {
        // *_in 도중에 상태가 바뀌었으면 loop를 건너뛰고 바로 *_out (in 끝 = out 시작 자세)
        return r.state === desired ? config.states[r.state].loop : config.states[r.state].exit;
      }
      if (r && r.kind === "loop") return r.state === desired ? name : config.states[r.state].exit;
      if (name === "idle") return desired === "default" ? null : goalStart;
      return desired === "default" ? "idle" : goalStart;   // *_out, wave: 중립 자세로 끝나요
    }

    // el이 "보이는 상태로" 새 프레임을 실제로 그린 뒤에 resolve해요.
    function painted(el) {
      return new Promise((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        };
        if (el.requestVideoFrameCallback) el.requestVideoFrameCallback(finish);
        else el.addEventListener("timeupdate", finish, { once: true });
        setTimeout(finish, 400); // 재생이 막힌 경우를 위한 안전장치
      });
    }

    // 진행 중인 전환을 마무리해요: 아래에 깔아 둔 이전 영상을 이제 숨겨요.
    function settle() {
      if (!pending) return;
      const { el, prev } = pending;
      pending = null;
      prev.classList.remove("on");
      el.classList.remove("incoming", "fade");
    }

    // 다음 클립을 쉬고 있는 <video>에 미리 올려 둬요. 전환할 때 로딩 지연이 없어져요.
    function prearm() {
      if (pending || !current) return;
      const next = nextAfter(current) || (current === "idle" ? config.states.default.on_hover : null);
      if (next && next !== current && urls[next]) cue(spare(), next);
    }

    // 클립을 바꿔요.
    // 새 영상을 이전 영상 "위에" 바로 올리고, 새 영상이 화면에 실제로 그려진 걸 확인한 뒤에야
    // 이전 영상을 숨겨요. 두 클립은 같은 중립 자세에서 이어지니 겹쳐 있는 동안은 티가 안 나고,
    // 디코딩이 늦어도 빈 프레임(깜빡임)이 생기지 않아요.
    function show(name, { fade = false } = {}) {
      if (!urls[name]) { load(name).then(() => show(name, { fade })); return; }
      settle();
      const prev = active || poster;
      const el = spare();
      cue(el, name);
      el.loop = wantsLoop(name);
      current = name;
      active = el;

      el.classList.toggle("fade", fade);
      el.classList.add("incoming", "on");
      if (prev.pause) prev.pause();
      const job = (pending = { el, prev });
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
      Promise.all([painted(el), fade ? wait(FADE_MS + 20) : null]).then(() => {
        if (pending !== job) return; // 그사이 다른 전환이 시작됐어요
        settle();
        prearm();
      });
    }

    // 클립이 끝났을 때 다음 클립으로 넘어가요.
    function onClipEnd(name) {
      const next = nextAfter(name);
      if (next) show(next);
    }

    // 원하는 상태가 바뀌었을 때, 지금 클립을 끊어도 되는지 판단해요.
    function apply() {
      if (!ready || !current) return;
      const r = role[current];
      if ((current === "idle" || current === "wave") && desired !== "default") {
        // idle·wave는 아무 프레임에서나 끊어도 돼요 (100ms 크로스페이드).
        const goal = config.states[desired];
        show(goal.enter || goal.loop, { fade: true });
        return;
      }
      // 다른 상태로 가려면 *_loop는 이번 바퀴를 끝까지 돌고 *_out으로 나가요.
      if (r && r.kind === "loop") active.loop = r.state === desired;
      // *_in · *_out은 끝날 때 onClipEnd가 처리해요. 다음 클립만 미리 바꿔 올려 둬요.
      prearm();
    }

    function setState(state) {
      const known = config ? config.states : { default: 1, searching: 1, thinking: 1 };
      if (!Object.prototype.hasOwnProperty.call(known, state)) return;
      desired = state;
      apply();
    }

    function wave() {
      if (ready && !pending && desired === "default" && current === "idle" && urls.wave) show("wave", { fade: true });
    }

    function scheduleWave() {
      clearTimeout(waveTimer);
      waveTimer = setTimeout(() => {
        if (!document.hidden && !hovered) wave();
        scheduleWave();
      }, 14000 + Math.random() * 12000);
    }

    function hover(on) {
      hovered = on;
      if (on && config && config.states.default.on_hover) wave();
    }

    // 탭을 다시 보면 멈춰 있던 영상을 이어서 재생해요.
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && active && active.paused) active.play().catch(() => {});
    });

    return { init, setState, hover, get state() { return desired; } };
  }

  // ---------- 팝업 ----------
  let iframe = null;

  function chatSrc() {
    const u = new URL(CHAT_URL);
    u.searchParams.set("embed", "1");
    u.searchParams.set("from", location.pathname); // 예: /listings/3 → 챗봇이 맥락으로 써요
    return u.href;
  }

  function open() {
    if (!panel.hidden) return;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.title = "집결 도우미 겨리 채팅";
      iframe.src = chatSrc();
      iframe.allow = "clipboard-write";
      panel.appendChild(iframe);
    }
    panel.hidden = false;
    panel.classList.add("closing");
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.remove("closing")));
    root.classList.add("open");
    launcher.setAttribute("aria-expanded", "true");
    iframe.focus();
  }

  function close() {
    if (panel.hidden) return;
    root.classList.remove("open");
    launcher.setAttribute("aria-expanded", "false");
    player.setState("default");
    const done = () => { panel.hidden = true; };
    if (reducedMotion.matches) done();
    else { panel.classList.add("closing"); setTimeout(() => { panel.classList.remove("closing"); done(); }, 180); }
    launcher.focus();
  }

  // ---------- 끌어서 옮기기 ----------
  // 6px 넘게 움직이면 끌기, 아니면 클릭(팝업 열기)이에요. 옮긴 자리는 이 브라우저에 기억해요.
  const POS_KEY = "zipgyeol-widget-pos";
  const MARGIN = 8;
  let drag = null;
  let justDragged = false;
  let pos = null;   // {x, y}: 화면 왼쪽 위 기준 px. null이면 기본 자리(오른쪽 아래)

  function clampPos(x, y) {
    const s = launcher.offsetWidth || 104;
    return {
      x: Math.min(Math.max(MARGIN, x), window.innerWidth - s - MARGIN),
      y: Math.min(Math.max(MARGIN, y), window.innerHeight - s - MARGIN),
    };
  }

  function applyPos() {
    if (pos) {
      pos = clampPos(pos.x, pos.y);
      Object.assign(root.style, { left: pos.x + "px", top: pos.y + "px", right: "auto", bottom: "auto" });
      root.style.setProperty("--y", pos.y + "px");
    }
    // 팝업을 열 방향과 쓸 수 있는 높이
    const r = launcher.getBoundingClientRect();
    const leftSide = r.left + r.width / 2 < window.innerWidth / 2;
    const topSide = r.top + r.height / 2 < window.innerHeight / 2;
    root.classList.toggle("left-side", leftSide);
    root.classList.toggle("top-side", topSide);
    const avail = topSide ? window.innerHeight - r.bottom - 8 - 16 : r.top - 8 - 16;
    root.style.setProperty("--avail", Math.max(240, avail) + "px");
  }

  function savePos() {
    try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch { /* 기억 못 해도 동작해요 */ }
  }
  try {
    const saved = JSON.parse(localStorage.getItem(POS_KEY) || "null");
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) pos = saved;
  } catch { /* 기본 자리 */ }

  launcher.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const r = launcher.getBoundingClientRect();
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, moved: false };
    launcher.setPointerCapture(e.pointerId);
  });
  launcher.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) { drag.moved = true; root.classList.add("dragging"); }
    pos = { x: drag.ox + dx, y: drag.oy + dy };
    applyPos();
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.moved) {
      justDragged = true;              // 끌기가 끝난 직후의 click은 무시해요
      root.classList.remove("dragging");
      savePos();
    }
    drag = null;
  }
  launcher.addEventListener("pointerup", endDrag);
  launcher.addEventListener("pointercancel", endDrag);
  window.addEventListener("resize", applyPos);

  launcher.addEventListener("click", () => {
    if (justDragged) { justDragged = false; return; }
    panel.hidden ? open() : close();
  });
  launcher.addEventListener("pointerenter", () => player.hover(true));
  launcher.addEventListener("pointerleave", () => player.hover(false));
  launcher.addEventListener("focus", () => player.hover(true));
  launcher.addEventListener("blur", () => player.hover(false));
  closeBtn.addEventListener("click", close);
  shadow.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  // 챗봇(iframe)에서 오는 메시지만 받아요.
  window.addEventListener("message", (e) => {
    if (e.origin !== CHAT_ORIGIN || !iframe || e.source !== iframe.contentWindow) return;
    const d = e.data;
    if (!d || typeof d !== "object") return;
    if (d.type === "zipgyeol:state" && typeof d.state === "string") player.setState(d.state);
    else if (d.type === "zipgyeol:close") close();
  });

  function mount() {
    document.body.appendChild(host);
    applyPos();
    player.init();
  }
  document.body ? mount() : document.addEventListener("DOMContentLoaded", mount);

  window.ZipgyeolWidget = {
    open, close,
    setState: (s) => player.setState(s),
    get state() { return player.state; },
  };
})();
