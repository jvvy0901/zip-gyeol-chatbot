// ③ 매물 상세 — 3D 둘러보기 (가우시안 스플래팅 · PlayCanvas 스트리밍 SOG)
//
// 쓰는 법: <section class="viewer" data-splat-url=".../lod-meta.json"> 안에 템플릿의 요소들을 두면 된다.
// lod-meta.json 옆에 nav.json · nav.png · map.png (tools/build_nav.py가 만든다)가 있으면
// (방 이름은 rooms.json에 사람이 적는다)
// 미니맵과 '걸을 수 있는 바닥' 제한이 켜진다. 없으면 드래그 둘러보기만 된다.
//
// 스플랫 로딩·LOD 설정 기준: PlayCanvas 공식 예제 gaussian-splatting/streamed-sog
import {
    AppBase,
    AppOptions,
    Asset,
    CameraComponentSystem,
    Color,
    Entity,
    FILLMODE_NONE,
    GSPLATDATA_COMPACT,
    GSPLAT_BUDGET_TARGET,
    GSplatComponentSystem,
    GSplatHandler,
    RESOLUTION_AUTO,
    TONEMAP_LINEAR,
    TextureHandler,
    Vec3,
    createGraphicsDevice,
    platform
} from 'playcanvas';

const FOV_NORMAL = 70;   // 기본 시야각(도)
const FOV_WIDE = 95;     // 넓게 보기 — 더 넓히면 가장자리가 늘어나 어지럽다

const root = document.querySelector('.viewer[data-splat-url]');
if (root) start(root);

async function start(root) {
    const splatUrl = root.dataset.splatUrl;
    const baseUrl = splatUrl.slice(0, splatUrl.lastIndexOf('/') + 1);
    const el = (name) => root.querySelector(`[data-el="${name}"]`);
    const canvas = el('canvas');
    const loading = el('loading');
    const fade = el('fade');
    const ring = el('ring');
    const hint = el('hint');
    const minimap = el('minimap');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const fail = (message) => {
        loading.classList.add('is-error');
        loading.querySelector('p').textContent = message;
    };

    // ── 장면 정보(바닥 지도) ─────────────────────────────────
    const nav = await loadNav(baseUrl);
    showCredit(baseUrl, el('credit'));

    // ── 엔진 ────────────────────────────────────────────────
    let device;
    try {
        // 가우시안 스플랫은 안티앨리어싱 이득이 없고 비용만 크다
        device = await createGraphicsDevice(canvas, { deviceTypes: ['webgpu', 'webgl2'], antialias: false });
    } catch (e) {
        fail('이 브라우저에서는 3D를 볼 수 없어요. 최신 Chrome · Safari · Edge에서 열어 주세요.');
        throw e;
    }

    const options = new AppOptions();
    options.graphicsDevice = device;
    options.componentSystems = [CameraComponentSystem, GSplatComponentSystem];
    options.resourceHandlers = [TextureHandler, GSplatHandler];

    const app = new AppBase(canvas);
    app.init(options);
    app.setCanvasFillMode(FILLMODE_NONE);
    app.setCanvasResolution(RESOLUTION_AUTO);

    // 해상도: 기기 해상도 그대로(최대 2배, 휴대폰은 1.5배) 그린다.
    // 실제로 느릴 때만 renderScale을 낮춘다(아래 '매 프레임' 참고).
    let renderScale = 1;
    const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        device.maxPixelRatio = Math.min(dpr, platform.mobile ? 1.5 : 2) * renderScale;
        app.resizeCanvas();
    };
    new ResizeObserver(resize).observe(root);
    resize();
    app.start();

    const gs = app.scene.gsplat;
    gs.lodUpdateAngle = 90;
    gs.lodBehindPenalty = 3;
    gs.radialSorting = true;
    gs.lodUpdateDistance = 0.5;
    gs.lodUnderfillLimit = 5;
    gs.minPixelSize = 2;
    gs.dataFormat = GSPLATDATA_COMPACT;
    gs.splatBudgetMode = GSPLAT_BUDGET_TARGET;
    gs.splatBudget = platform.mobile ? 1_000_000 : 3_000_000;

    // ── 카메라: 눈높이 고정, 좌우·위아래로만 돈다(기울어지지 않음) ──
    const camera = new Entity('camera');
    camera.addComponent('camera', {
        clearColor: new Color(0.97, 0.98, 1),   // 브랜드 Neutral #F8FAFF
        fov: FOV_NORMAL,
        nearClip: 0.05,
        farClip: 1000,
        toneMapping: TONEMAP_LINEAR
    });
    app.root.addChild(camera);

    const eyeY = nav ? nav.floorY + nav.eyeHeight : 0;
    const view = {
        pos: new Vec3(nav ? nav.start[0] : 0, eyeY, nav ? nav.start[2] : 0),
        yaw: nav ? nav.startYaw : 0, pitch: 0,       // 지금 값
        yawTo: nav ? nav.startYaw : 0, pitchTo: 0,   // 가려는 값 (부드럽게 따라감)
        fov: FOV_NORMAL, fovTo: FOV_NORMAL,
        move: null                                    // 이동 중이면 { from, to, t, duration }
    };
    const home = { pos: view.pos.clone(), yaw: view.yaw };
    const applyView = () => {
        camera.setPosition(view.pos);
        camera.setEulerAngles(view.pitch, view.yaw, 0);
    };
    applyView();

    // ── 스플랫 불러오기 ──────────────────────────────────────
    const asset = new Asset('gsplat', 'gsplat', { url: splatUrl });
    app.assets.add(asset);
    try {
        await new Promise((resolve, reject) => {
            asset.once('load', resolve);
            asset.once('error', reject);
            app.assets.load(asset);
        });
    } catch (e) {
        fail('3D 공간을 불러오지 못했어요. 잠시 후 새로고침해 주세요.');
        throw e;
    }

    const splat = new Entity('splat');
    splat.addComponent('gsplat', { asset });
    splat.setLocalEulerAngles(...(nav ? nav.rotation : [180, 0, 0]));
    app.root.addChild(splat);

    // 처음엔 가장 거친 단계로 빨리 보여 주고, 다 받으면 세밀한 단계까지 연다
    const comp = splat.gsplat;
    comp.lodBaseDistance = 5;
    comp.lodMultiplier = 3;
    const finest = platform.mobile ? 2 : 0;
    const levels = comp.resource?.octree?.lodLevels;
    if (levels) {
        comp.lodRangeMin = levels - 1;
        comp.lodRangeMax = levels - 1;
    }
    let shown = false;
    const onFrameReady = (cam, layer, ready, loadingCount) => {
        if (!shown) {
            shown = true;
            loading.classList.add('is-done');
            root.classList.add('is-ready');
        }
        if (ready && loadingCount === 0) {
            app.systems.gsplat.off('frame:ready', onFrameReady);
            comp.lodRangeMin = Math.min(finest, (levels || 1) - 1);
            comp.lodRangeMax = 20;
        }
    };
    app.systems.gsplat.on('frame:ready', onFrameReady);

    // ── 이동: 부드럽게 미끄러지거나, 벽 너머면 짧게 어두워졌다가 도착 ──
    const goTo = (x, z) => {
        const to = new Vec3(x, eyeY, z);
        const distance = to.distance(view.pos);
        if (distance < 0.05) return;
        dismissHint();
        if (reducedMotion || (nav && !nav.lineClear(view.pos.x, view.pos.z, x, z))) {
            view.move = null;
            fade.classList.add('is-on');
            setTimeout(() => {
                view.pos.copy(to);
                fade.classList.remove('is-on');
            }, 180);
            return;
        }
        view.move = { from: view.pos.clone(), to, t: 0, duration: Math.min(1.6, Math.max(0.45, distance / 2.2)) };
    };

    // 화면의 한 점이 바닥 어디를 가리키는지 (걸을 수 있는 곳으로 맞춰서)
    const far = new Vec3();
    const floorPoint = (sx, sy) => {
        if (!nav) return null;
        camera.camera.screenToWorld(sx, sy, 10, far);
        const dy = far.y - view.pos.y;
        if (dy > -0.3) return null;                       // 바닥을 향하지 않음
        const t = (nav.floorY - view.pos.y) / dy;
        const x = view.pos.x + (far.x - view.pos.x) * t;
        const z = view.pos.z + (far.z - view.pos.z) * t;
        if (Math.hypot(x - view.pos.x, z - view.pos.z) > 8) return null;
        return nav.nearestWalkable(x, z, 0.6);
    };

    // 바닥 위 이동 표시(고리)
    const p0 = new Vec3();
    const p1 = new Vec3();
    const showRing = (point) => {
        if (!point) {
            ring.hidden = true;
            return;
        }
        camera.camera.worldToScreen(p0.set(point.x, nav.floorY, point.z), p0);
        camera.camera.worldToScreen(p1.copy(camera.right).mulScalar(0.25).add(new Vec3(point.x, nav.floorY, point.z)), p1);
        const radius = Math.max(8, Math.hypot(p1.x - p0.x, p1.y - p0.y));
        const dist = Math.hypot(point.x - view.pos.x, point.z - view.pos.z);
        const squash = Math.min(1, Math.max(0.18, nav.eyeHeight / Math.hypot(dist, nav.eyeHeight)));
        ring.hidden = false;
        ring.style.transform = `translate(${p0.x}px, ${p0.y}px) translate(-50%, -50%) scale(1, ${squash})`;
        ring.style.width = ring.style.height = `${radius * 2}px`;
    };

    // ── 입력: 드래그 = 둘러보기, 짧게 누르기 = 그 바닥으로 이동 ──
    let drag = null;
    const local = (e) => {
        const r = canvas.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
    };
    canvas.addEventListener('pointerdown', (e) => {
        canvas.setPointerCapture(e.pointerId);
        canvas.focus({ preventScroll: true });
        drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, time: performance.now(), moved: false };
        ring.hidden = true;
    });
    canvas.addEventListener('pointermove', (e) => {
        if (!drag) {
            if (e.pointerType === 'mouse') showRing(floorPoint(...local(e)));
            return;
        }
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        drag.x = e.clientX;
        drag.y = e.clientY;
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
        if (!drag.moved) return;
        root.classList.add('is-dragging');
        // 잡고 끄는 느낌: 화면을 오른쪽으로 끌면 풍경이 따라오고 시선은 왼쪽으로
        const k = 0.22 * (view.fov / FOV_NORMAL);   // 넓게 볼 때도 끄는 거리와 풍경 이동이 맞게
        view.yawTo += dx * k;
        view.pitchTo = Math.min(60, Math.max(-60, view.pitchTo + dy * k));
        dismissHint();
    });
    const endDrag = (e) => {
        if (!drag) return;
        const tap = !drag.moved && performance.now() - drag.time < 400;
        drag = null;
        root.classList.remove('is-dragging');
        if (tap && e.type === 'pointerup') {
            const point = floorPoint(...local(e));
            if (point) goTo(point.x, point.z);
        }
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('pointerleave', () => {
        if (!drag) ring.hidden = true;
    });

    // 키보드(뷰어를 누른 뒤): ↑↓ · W S 걷기, ← → 돌기, A D 옆걸음
    const keys = new Set();
    const KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
    canvas.addEventListener('keydown', (e) => {
        if (!KEYS.includes(e.code)) return;
        e.preventDefault();
        keys.add(e.code);
        dismissHint();
    });
    canvas.addEventListener('keyup', (e) => keys.delete(e.code));
    canvas.addEventListener('blur', () => keys.clear());

    // ── 미니맵 ──────────────────────────────────────────────
    let mm = null;
    if (nav && minimap) {
        const img = minimap.querySelector('img');
        img.src = `${baseUrl}map.png`;
        // map.png가 덮는 범위 (없으면 바닥 지도 전체)
        const area = nav.map || { minX: nav.minX, minZ: nav.minZ, sizeX: nav.width * nav.cell, sizeZ: nav.depth * nav.cell };
        minimap.style.aspectRatio = `${area.sizeX} / ${area.sizeZ}`;
        minimap.hidden = false;
        mm = { me: el('me'), ghost: el('ghost') };
        const toWorld = (e) => {
            const r = img.getBoundingClientRect();   // 테두리를 뺀 그림 영역 기준
            const x = area.minX + ((e.clientX - r.left) / r.width) * area.sizeX;
            const z = area.minZ + ((e.clientY - r.top) / r.height) * area.sizeZ;
            return nav.nearestWalkable(x, z, 3);
        };
        const place = (node, x, z) => {
            node.style.left = `${((x - area.minX) / area.sizeX) * 100}%`;
            node.style.top = `${((z - area.minZ) / area.sizeZ) * 100}%`;
        };
        mm.place = place;
        // 방 이름: 장면 폴더의 rooms.json([{ name, x, z }])이 있으면 미니맵에 적는다 (사람이 적는 파일)
        fetch(`${baseUrl}rooms.json`).then((r) => (r.ok ? r.json() : [])).then((rooms) => {
            const plan = document.querySelector('[data-plan]');   // 평면도 탭의 큰 그림에도 같은 이름을 적는다
            for (const room of rooms) {
                const label = document.createElement('span');
                label.className = 'mm-room';
                label.textContent = room.name;
                place(label, room.x, room.z);
                minimap.insertBefore(label, mm.ghost);
                if (plan) plan.append(label.cloneNode(true));
            }
        }).catch(() => {});

        minimap.addEventListener('pointermove', (e) => {
            const point = toWorld(e);
            mm.ghost.hidden = !point;
            if (point) place(mm.ghost, point.x, point.z);
        });
        minimap.addEventListener('pointerleave', () => {
            mm.ghost.hidden = true;
        });
        minimap.addEventListener('click', (e) => {
            const point = toWorld(e);
            if (point) goTo(point.x, point.z);
        });
    }

    // ── 버튼 ────────────────────────────────────────────────
    el('reset')?.addEventListener('click', () => {
        view.yawTo = home.yaw + Math.round((view.yaw - home.yaw) / 360) * 360;   // 가까운 쪽으로 돈다
        view.pitchTo = 0;
        goTo(home.pos.x, home.pos.z);
    });
    const wide = el('wide');
    wide?.addEventListener('click', () => {
        const on = view.fovTo === FOV_NORMAL;
        view.fovTo = on ? FOV_WIDE : FOV_NORMAL;
        wide.setAttribute('aria-pressed', String(on));
    });
    const expand = el('expand');
    const setExpanded = (on) => {
        root.classList.toggle('is-expanded', on);
        document.documentElement.classList.toggle('viewer-expanded', on);
        expand.setAttribute('aria-pressed', String(on));
        expand.textContent = on ? '닫기' : '크게 보기';
    };
    expand?.addEventListener('click', () => setExpanded(!root.classList.contains('is-expanded')));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && root.classList.contains('is-expanded')) setExpanded(false);
    });

    let hintGone = false;
    function dismissHint() {
        if (hintGone) return;
        hintGone = true;
        hint?.classList.add('is-gone');
    }

    // ── 매 프레임 ────────────────────────────────────────────
    const fwd = new Vec3();
    const pace = { frames: 0, time: 0, slow: 0, last: performance.now() };
    app.on('update', (dt) => {
        // 느린 기기 보호: 2초 평균이 27fps 아래로 두 번 연속 떨어지면 해상도를 한 단계 낮춘다 (최저 절반).
        // 프레임 간격이 0.25초를 넘으면 기기가 느린 게 아니라 브라우저가 탭을 쉬게 하는 것이므로 세지 않는다.
        const now = performance.now();
        const gap = (now - pace.last) / 1000;
        pace.last = now;
        if (gap > 0.25 || document.hidden) {
            pace.frames = pace.time = pace.slow = 0;
        } else if (shown && renderScale > 0.5) {
            pace.frames++;
            pace.time += gap;
            if (pace.time >= 2) {
                pace.slow = pace.frames / pace.time < 27 ? pace.slow + 1 : 0;
                pace.frames = pace.time = 0;
                if (pace.slow >= 2) {
                    pace.slow = 0;
                    renderScale = Math.max(0.5, renderScale - 0.25);
                    resize();
                }
            }
        }

        // 시선: 목표 각도를 부드럽게 따라간다 (튀지 않게)
        const follow = 1 - Math.exp(-dt * 16);
        view.yaw += (view.yawTo - view.yaw) * follow;
        view.pitch += (view.pitchTo - view.pitch) * follow;
        if (Math.abs(view.fovTo - view.fov) > 0.01) {
            view.fov += (view.fovTo - view.fov) * (1 - Math.exp(-dt * 8));
            camera.camera.fov = view.fov;
        }

        // 키보드
        if (keys.size) {
            if (keys.has('ArrowLeft')) view.yawTo += 70 * dt;
            if (keys.has('ArrowRight')) view.yawTo -= 70 * dt;
            const ahead = (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0) - (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0);
            const side = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
            if (ahead || side) {
                view.move = null;
                const rad = view.yaw * Math.PI / 180;
                fwd.set(-Math.sin(rad) * ahead + Math.cos(rad) * side, 0, -Math.cos(rad) * ahead - Math.sin(rad) * side);
                fwd.normalize().mulScalar(1.5 * dt);
                const nx = view.pos.x + fwd.x;
                const nz = view.pos.z + fwd.z;
                if (!nav || nav.walkable(nx, nz)) view.pos.set(nx, eyeY, nz);
                else if (nav.walkable(nx, view.pos.z)) view.pos.x = nx;      // 벽에 닿으면 미끄러진다
                else if (nav.walkable(view.pos.x, nz)) view.pos.z = nz;
            }
        }

        // 이동 애니메이션 (천천히 출발해서 천천히 멈춤)
        const m = view.move;
        if (m) {
            m.t = Math.min(1, m.t + dt / m.duration);
            const k = m.t < 0.5 ? 4 * m.t ** 3 : 1 - (-2 * m.t + 2) ** 3 / 2;
            view.pos.lerp(m.from, m.to, k);
            if (m.t >= 1) view.move = null;
        }

        applyView();

        if (mm) {
            mm.place(mm.me, view.pos.x, view.pos.z);
            mm.me.style.setProperty('--turn', `${-view.yaw}deg`);
        }
    });

    window.__jibViewer = { app, camera, view, nav, goTo, get renderScale() { return renderScale; } };   // 확인·디버깅용
}

// nav.json + nav.png → 걸을 수 있는 바닥을 묻는 함수들. 파일이 없으면 null.
async function loadNav(baseUrl) {
    try {
        const meta = await fetch(`${baseUrl}nav.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error('no nav'))));
        const img = new Image();
        img.src = `${baseUrl}nav.png`;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = meta.width;
        c.height = meta.depth;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const px = ctx.getImageData(0, 0, meta.width, meta.depth).data;

        const cellOk = (ix, iz) => ix >= 0 && iz >= 0 && ix < meta.width && iz < meta.depth && px[(iz * meta.width + ix) * 4] > 127;
        const ix = (x) => Math.floor((x - meta.minX) / meta.cell);
        const iz = (z) => Math.floor((z - meta.minZ) / meta.cell);
        const walkable = (x, z) => cellOk(ix(x), iz(z));

        return {
            ...meta,
            walkable,
            // (x, z)에서 가장 가까운 걸을 수 있는 지점. maxDist(m) 안에 없으면 null.
            nearestWalkable(x, z, maxDist) {
                if (walkable(x, z)) return { x, z };
                const cx = ix(x);
                const cz = iz(z);
                const reach = Math.ceil(maxDist / meta.cell);
                let best = null;
                let bestD = Infinity;
                for (let r = 1; r <= reach && r <= Math.sqrt(bestD) + 1; r++) {
                    for (let i = -r; i <= r; i++) {
                        for (const [dx, dz] of [[i, -r], [i, r], [-r, i], [r, i]]) {
                            const d = dx * dx + dz * dz;
                            if (d < bestD && cellOk(cx + dx, cz + dz)) {
                                bestD = d;
                                best = [cx + dx, cz + dz];
                            }
                        }
                    }
                }
                if (!best || Math.sqrt(bestD) > reach) return null;
                return { x: meta.minX + (best[0] + 0.5) * meta.cell, z: meta.minZ + (best[1] + 0.5) * meta.cell };
            },
            // 두 지점 사이를 벽·가구에 걸리지 않고 곧장 갈 수 있나
            lineClear(x0, z0, x1, z1) {
                const steps = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / (meta.cell / 2));
                for (let i = 1; i < steps; i++) {
                    const t = i / steps;
                    if (!walkable(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t)) return false;
                }
                return true;
            }
        };
    } catch (e) {
        return null;
    }
}

// 3D 스캔 저작자 표시 (CC BY) — 장면 폴더의 license.txt를 읽어 보여 준다
async function showCredit(baseUrl, node) {
    if (!node) return;
    try {
        const res = await fetch(`${baseUrl}license.txt`);
        if (!res.ok) return;
        const text = await res.text();
        const field = (name) => (text.match(new RegExp(`^${name}:\\s*(.+)$`, 'm')) || [])[1]?.trim();
        const link = (label, url) => {
            if (!url || !/^https?:\/\//.test(url)) return document.createTextNode(label);
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = label;
            return a;
        };
        const author = field('Author');
        if (!author) return;
        const [, name, url] = author.match(/^(.*?)\s*\((https?:[^)]+)\)$/) || [null, author, null];
        node.append('3D 스캔 ', link(name, url));
        if (field('Source')) node.append(' · ', link('원본', field('Source')));
        if (field('License')) node.append(' · ', link(field('License').replace(/\s*\(.*\)$/, ''), field('License URL')));
    } catch (e) { /* 표시 실패는 조용히 넘어간다 */ }
}
