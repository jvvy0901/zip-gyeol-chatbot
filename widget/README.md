# 겨리 캐릭터 위젯

집결 사이트 오른쪽 아래에 겨리를 띄우고, 누르면 챗봇을 팝업(iframe)으로 열어요.
챗봇 상태에 맞춰 `clips/clips.json` 규칙대로 캐릭터 영상을 바꿔요.

## 사이트에 붙이기

집결 사이트 공통 템플릿의 `</body>` 바로 앞에 한 줄을 넣어요.

```html
<script src="https://<챗봇주소>/widget/zipgyeol-widget.js"
        data-chat-url="https://<챗봇주소>/" defer></script>
```

- 위젯 파일과 `clips/`는 챗봇과 같이 배포해요. 영상 주소는 스크립트 주소를 기준으로 찾아요.
- 챗봇 주소에는 `?embed=1&from=/listings/3`처럼 지금 보고 있는 페이지 경로가 붙어요.

## 챗봇에서 할 일

RAG 단계마다 부모 창에 메시지를 보내요. 실제 구현은 `web/chat.js`의 `setCharacter`예요. API 없이 확인하는 테스트용 화면은 `mock-chat.html`이에요.

| 시점 | 보낼 메시지 |
|---|---|
| 문서 검색 시작 (다시 찾기 포함) | `{ type: "zipgyeol:state", state: "searching" }` |
| LLM 답변 생성 시작 | `{ type: "zipgyeol:state", state: "thinking" }` |
| 답변 완료 · 오류 | `{ type: "zipgyeol:state", state: "default" }` |
| 창 닫기 (Esc 등) | `{ type: "zipgyeol:close" }` |

```js
parent.postMessage({ type: "zipgyeol:state", state: "searching" }, "*");
```

위젯은 `data-chat-url`과 같은 출처(origin)에서 온 메시지만 받아요.

## 전환 규칙 (clips.json)

- `idle` · `wave`는 아무 때나 끊고 100ms 크로스페이드로 바꿔요.
- `*_in`이 끝나면 `*_loop`로 넘어가요. `*_in` 도중에 상태가 바뀌었으면 loop를 건너뛰고 바로 `*_out`으로 가요.
- 상태가 바뀌면 `*_loop`는 이번 바퀴를 끝까지 돈 뒤 `*_out`을 재생해요.
- `*_out` 다음에는 원하는 상태의 `*_in`이나 `idle`로 가요. 예: 검색 → 생각이면 `inspect_out → think_in`.
- 기본 상태에서는 마우스를 올리거나 14~26초마다 `wave`를 재생해요.
- 움직임 줄이기 설정을 켠 사용자에게는 정지 이미지(`clips/poster.png`)만 보여요.

### 깜빡임 없이 바꾸는 방법

`<video>` 두 개를 번갈아 써요.

1. 다음 클립을 쉬고 있는 `<video>`에 미리 올려 둬요.
2. 전환할 때 새 영상을 이전 영상 위에 바로 올려요.
3. 새 영상이 화면에 실제로 그려진 걸 확인한 뒤에야 이전 영상을 숨겨요. 확인에는 `requestVideoFrameCallback`과 두 번의 `requestAnimationFrame`을 써요.

숨겨져 있던 영상은 보이게 바뀐 첫 프레임이 비어 있을 수 있어요. 그래서 두 영상을 같은 순간에 바꾸면 한 프레임 동안 캐릭터가 사라져요.

## 영상 포맷

| 브라우저 | 파일 |
|---|---|
| Chrome · Edge · Firefox | `clips/*.webm` (VP9 알파) |
| Safari · iOS의 모든 브라우저 | `clips/*.mov` (HEVC 알파) |

`.mov`는 `zipgyeol_clips/mov_for_safari`의 ProRes 4444(약 30MB)를 macOS `avconvert`로 변환한 파일이에요.

```sh
avconvert --source in.mov --preset PresetHEVCHighestQualityWithAlpha --output out.mov
```

## 로컬 테스트

```sh
cd widget && python3 -m http.server 8765
# http://localhost:8765/demo.html
```
