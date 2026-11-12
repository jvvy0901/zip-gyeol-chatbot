---
name: 집결
slug: zipgyeol
category: real-estate
last_updated: 2026-11-11
created_at: 2026-11-11
lang: ko
logo: static/brand/logo-mark.svg
colors:
  ## Brand (brandguide.png COLOR PALETTE — 라이트 단일 테마)
  brand-primary: oklch(0.535 0.259 262.6)         # #0056FF 공식 Primary, 신뢰와 편리함을 주는 집결의 메인 컬러. 1차 버튼 면, 링크, 강조 글자, 로고
  brand-primary-dark: oklch(0.462 0.221 262.4)    # #0046D1 1차 버튼 hover·눌림
  brand-sub: oklch(0.952 0.023 258.4)             # #E6F0FF 공식 Sub. secondary 버튼 면, 썸네일 자리, 포커스 링
  brand-neutral: oklch(0.985 0.007 268.5)         # #F8FAFF 공식 Neutral. 넓은 배경 면, 푸터
  brand-chip: oklch(0.923 0.035 264.4)            # #DAE6FE 키워드 칩 면 (가이드 BRAND KEYWORDS)
  ## Sky (가이드 메인 배너 하늘)
  sky-top: oklch(0.645 0.185 260.2)               # #4589FC 히어로 하늘 위
  sky-bottom: oklch(0.848 0.072 261.4)            # #B3CEFD 히어로 하늘 아래(지평선)
  ## Background / Surface
  bg-base: oklch(1.000 0 0)                       # #FFFFFF 배경 base, 카드
  bg-weak: oklch(0.985 0.007 268.5)               # #F8FAFF 배경 weak (= brand-neutral)
  surface-weak: oklch(0.978 0.007 260.7)          # #F5F8FD 표면 weak, 기능 카드·브랜드 패널·평점 칩
  surface-base: oklch(0.952 0.023 258.4)          # #E6F0FF 표면 base, secondary 버튼 (= brand-sub)
  surface-strong: oklch(0.923 0.035 264.4)        # #DAE6FE 표면 strong, 키워드 칩 (= brand-chip)
  ## Text
  text-primary: oklch(0.224 0.020 271.7)          # #181B25 텍스트 primary, 로고 '집결' 글자색
  text-secondary: oklch(0.376 0.027 268.0)        # #3B4150 텍스트 secondary, 슬로건·메뉴
  text-tertiary: oklch(0.507 0.027 288.1)         # #646374 텍스트 tertiary, 카드 설명·placeholder
  text-weak: oklch(0.533 0.038 277.6)             # #676B83 텍스트 weak, ZIPGYEOL·섹션 라벨
  ## Border
  border-base: oklch(0.943 0.013 266.7)           # #E8ECF5 보더 base, 헤더 하단선·구분선
  ## Function
  success: oklch(0.530 0.124 155.3)               # #13804B 성공 글자 (flash)
  success-bg: oklch(0.963 0.020 159.8)            # #E8F7EE 성공 면
  error: oklch(0.576 0.209 29.5)                  # #D92D20 오류 글자·배지
  star: oklch(0.852 0.146 89.5)                   # #F4C94D 평점 별
  white: oklch(1.000 0 0)                         # #FFFFFF 반전 텍스트 고정 흰색
fonts:
  font-sans: "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, \"Apple SD Gothic Neo\", \"Malgun Gothic\", system-ui, sans-serif"
  font-display: "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, \"Apple SD Gothic Neo\", \"Malgun Gothic\", system-ui, sans-serif"
typography:
  display-40:
    fontSize: 40px
    fontWeight: 800
    lineHeight: 48px
    letterSpacing: -0.3px
  display-28:
    fontSize: 28px
    fontWeight: 700
    lineHeight: 36px
    letterSpacing: -0.3px
  title-22:
    fontSize: 22px
    fontWeight: 700
    lineHeight: 30px
    letterSpacing: -0.3px
  body-15:
    fontSize: 15px
    fontWeight: 500
    lineHeight: 21px
    letterSpacing: -0.3px
  body-14:
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: -0.3px
  label-17:
    fontSize: 17px
    fontWeight: 800
    lineHeight: 21px
    letterSpacing: -0.3px
  label-15:
    fontSize: 15px
    fontWeight: 600
    lineHeight: 19px
    letterSpacing: -0.3px
  label-15-400:
    fontSize: 15px
    fontWeight: 400
    lineHeight: 19px
    letterSpacing: -0.3px
  label-16:
    fontSize: 16px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: -0.3px
  label-14:
    fontSize: 14px
    fontWeight: 600
    lineHeight: 18px
    letterSpacing: -0.3px
  label-13:
    fontSize: 13px
    fontWeight: 600
    lineHeight: 17px
    letterSpacing: -0.3px
  label-12:
    fontSize: 12px
    fontWeight: 700
    lineHeight: 16px
    letterSpacing: -0.3px
spacing:
  space-2: 2px
  space-4: 4px
  space-6: 6px
  space-8: 8px
  space-10: 10px
  space-12: 12px
  space-16: 16px
  space-20: 20px
  space-24: 24px
  space-28: 28px
  space-32: 32px
  space-36: 36px
rounded:
  radius-2xs: 2px
  radius-xs: 4px
  radius-sm: 6px
  radius-md: 8px
  radius-lg: 12px
  radius-xl: 16px
  radius-2xl: 20px
  radius-3xl: 24px
  radius-4xl: 32px
  radius-circular: 9999px
elevation:
  shadow-card: 0 4px 4px oklch(0 0 0 / 0.05), 0 4px 4px oklch(0 0 0 / 0.1)   # 라이트 값
  shadow-level-3: 0 3px 9px 3px oklch(0 0 0 / 0.05), 0 3px 3px 0 oklch(0 0 0 / 0.1)   # 라이트 값
  shadow-level-6: 0 6px 18px 6px oklch(0 0 0 / 0.05), 0 6px 6px 0 oklch(0 0 0 / 0.1)   # 라이트 값
  shadow-popover: none   # 라이트 팝오버는 그림자 없이 1px border-base 테두리만 긋는다
components:
  header:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-primary}"
    height: 64px
  nav-item:
    textColor: "{colors.text-secondary}"
    typography: "{typography.label-15}"
    rounded: "{rounded.radius-circular}"
    height: 44px
  search-field:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label-15-400}"
    rounded: "{rounded.radius-circular}"
    height: 52px
    width: 720px
  button-primary:
    backgroundColor: "{colors.brand-primary}"
    textColor: "{colors.white}"
    typography: "{typography.label-16}"
    rounded: "{rounded.radius-circular}"
    height: 48px
  button-primary-dark:
    backgroundColor: "{colors.brand-primary-dark}"
    textColor: "{colors.white}"
    rounded: "{rounded.radius-circular}"
    height: 48px
  button-secondary:
    backgroundColor: "{colors.surface-base}"
    textColor: "{colors.brand-primary}"
    rounded: "{rounded.radius-circular}"
    height: 48px
  button-tertiary:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.radius-circular}"
    height: 48px
  icon-button:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.radius-xl}"
    size: 52px
  badge-3d:
    backgroundColor: "{colors.surface-weak}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label-14}"
    rounded: "{rounded.radius-circular}"
    height: 30px
  badge-deal:
    backgroundColor: "{colors.surface-base}"
    textColor: "{colors.brand-primary}"
    typography: "{typography.label-12}"
    rounded: "{rounded.radius-xs}"
    height: 20px
  keyword-chip:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label-15}"
    rounded: "{rounded.radius-circular}"
    height: 36px
  listing-card:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-primary}"
    titleSize: 17px
    rounded: "{rounded.radius-2xl}"
    padding: 16px
    thumbnailSize: 112px
    thumbnailRounded: 14px
    groupGap: 14px
    innerGap: 4px
  form-input:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.border-base}"
    typography: "{typography.label-15-400}"
    rounded: "{rounded.radius-lg}"
    height: 48px
  tabs:
    textColor: "{colors.text-tertiary}"
    activeColor: "{colors.brand-primary}"
    typography: "{typography.label-15}"
    height: 44px
    indicator: 3px
  modal:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.radius-lg}"
    width: 450px
---

# 집결 — design.md

집결(ZIPGYEOL)은 집 정보를 한곳에 모으고 3D로 집 안을 미리 둘러보게 하는 가상 부동산 서비스로, 흰 화면 위에 신뢰의 파랑 `oklch(0.535 0.259 262.6)`을 또렷하게 얹는 밝고 맑은 시각 언어가 시그니처다.

## Brand & Style

집결은 "집 정보가 한곳에 모이다, 집의 결을 볼 수 있다."라는 문장으로 자신을 소개하고, "지금, 집결과 함께 온라인으로 임장해보세요."로 행동을 권한다 [src:0]. 브랜드 콘셉트는 **집의 결을 보다** — 수많은 집 정보 속 당신의 집을 찾는 여정을 더 쉽고 더 명확하게 만든다는 뜻이다 [src:0]. 브랜드 키워드는 신뢰, 간편함, 스마트함, 부동산, 정보, 발견 여섯 개이고, 브랜드 무드는 맑은 하늘, 유리 건물, 푸른 그라데이션 세 장으로 정리돼 있다 [src:0].

로고는 지붕과 벽을 한 획으로 꺾은 집 심볼과 '집결' 워드마크, 그 아래 자간을 넓힌 'ZIPGYEOL'로 이뤄진다. 심볼은 벽 아래 끝이 바깥쪽으로 비스듬히 잘리고, 가운데 네모 창이 하나 있다 [src:0]. 벡터 원본은 `static/brand/logo-mark.svg`이고, 앱 아이콘은 파란 면에 흰 심볼(`app-icon.svg`)과 흰 면에 파란 심볼(`app-icon-white.svg`) 두 가지다. 코드에서는 `templates/_logo.html`의 `{{ logo() }}`, 파란 면 위에서는 `{{ logo(white=True) }}`를 쓴다.

테마는 라이트 하나다. 다크 테마는 정의하지 않는다. 흰 캔버스 `{colors.bg-base}`와 Neutral `{colors.brand-neutral}` 위에서 파랑 `{colors.brand-primary}`이 버튼, 링크, 가격 같은 "눌러야 할 것"과 "봐야 할 숫자"만 맡는다. 메인 배너만 예외로, 서울 도시 사진 위에 브랜드 파랑 그늘을 깔고 흰 로고와 흰 글자를 올린다 [src:0]. 사진이 안 뜰 때는 하늘 `{colors.sky-top}` → `{colors.sky-bottom}` 그라데이션이 대신 보인다.

## Colors

브랜드 색은 브랜드 가이드가 세 가지로 정한다 — Primary `{colors.brand-primary}`, Sub `{colors.brand-sub}`, Neutral `{colors.brand-neutral}` [src:0]. Primary는 1차 버튼 면, 링크, 강조 글자, 로고에 쓰고, hover와 눌림은 한 단계 짙은 `{colors.brand-primary-dark}`로 내려간다. Sub는 secondary 버튼 면, 썸네일 빈자리, 입력 포커스 링에 쓴다. Neutral은 넓은 배경과 푸터 면이다.

중립색은 순수 무채색이 아니라 쿨톤이다. 텍스트 `{colors.text-primary}`부터 `{colors.text-weak}`까지 모두 푸른 기가 돌아 Primary와 같은 온도로 묶인다 [src:0]. 면은 `{colors.bg-base}` → `{colors.surface-weak}` → `{colors.surface-base}` → `{colors.surface-strong}`으로 한 칸씩 파래지며 위계를 만든다. 키워드 칩 `{colors.surface-strong}`은 가이드 화면에서 직접 뽑은 값이다 [src:0].

기능색은 성공 `{colors.success}`(면 `{colors.success-bg}`), 오류 `{colors.error}`, 평점 별 `{colors.star}`이다. 경고 색은 아직 정하지 않았다.

| 역할 | 값 |
| --- | --- |
| 배경 base | `{colors.bg-base}` |
| 배경 weak | `{colors.bg-weak}` |
| 표면 base (secondary 버튼) | `{colors.surface-base}` |
| 텍스트 primary | `{colors.text-primary}` |
| 텍스트 tertiary | `{colors.text-tertiary}` |
| 브랜드 면 | `{colors.brand-primary}` |
| 보더 | `{colors.border-base}` |

대비(WCAG): Primary 위 흰 글자 5.56:1, Sub 위 Primary 글자 4.84:1, 흰 바탕 위 `{colors.text-weak}` 5.24:1, `{colors.surface-weak}` 위 `{colors.text-tertiary}` 5.51:1, 흰 바탕 위 `{colors.error}` 4.83:1로 모두 본문 기준 4.5:1을 넘는다.

값은 frontmatter `colors:` 맵이 유일한 정본이다. `static/style.css`의 `--color-*` 변수가 이 값과 같아야 한다.

## Typography

브랜드 서체는 Pretendard 하나다 [src:0]. 본문과 장식(제목, 버튼) 모두 Pretendard를 쓰고, jsDelivr의 가변 서브셋 CSS로 로드한다 [src:7]. 로고 '집결' 워드마크만 Pretendard 가장 굵은 단계(900)에 자간 -0.04em이다.

스케일은 합성 타이포 토큰 기준으로 label 12~17px, body 14~15px, title 22px, display 28~40px 네 그룹이다. 굵기 400~800 다섯 단계에 자간 `-0.3px`이다 [src:9]. 메인 배너 제목은 28~44px 700, 섹션 제목은 22~28px 700, 매물 카드 이름은 19px 700, 버튼은 16px 600(`{typography.label-16}`), 메뉴·탭은 15px 600(`{typography.label-15}`), 거래 배지는 12px 700(`{typography.label-12}`)이다. 본문은 16px, 줄 높이 1.6이다. 한글은 `word-break: keep-all`로 단어 중간에서 줄을 바꾸지 않는다.

## Spacing

기준 단위는 2px 증분이다. `--sem-layout-spacing`은 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36px 열두 단계이고, 원시 스케일은 40, 48, 56, 64, 72px까지 이어진다 [src:9]. TV용 `--sem-layout-tv-spacing`이 같은 값으로 따로 선언돼 있어 큰 화면 레이아웃이 별도 계통임을 알 수 있다 [src:9]. 헤더 높이는 약 64px, 본문 최대 폭은 1120px, 좌우 여백은 20px이다.

## Rounded

radius는 2px부터 32px까지 아홉 단계와 `circular`(9999px)다 [src:9]. 쓰임새는 뚜렷이 갈린다 — 거래 배지는 4px, 입력칸·모달은 12px, 아이콘 버튼은 16px, 카드·기능 카드는 20px, 메인 배너는 24px이고, 버튼(48px)·검색창(52px)·메뉴·칩은 `circular`로 완전한 알약이다. 가이드의 앱 화면과 "지금 시작하기 →" 버튼이 모두 알약이다 [src:0].

## Elevation & Depth

그림자는 이중 레이어다. `--sem-elevation-style-N`은 `0 N 3N N base, 0 N N 0 strong`(N=1~7)으로 퍼지는 그림자와 맺히는 그림자를 한 쌍으로 쓴다 [src:9]. 라이트 테마만 쓰므로 base는 검정 5%, strong은 검정 10%다 [src:9]. 실제 화면의 카드 그림자는 남색 기운이 도는 `0 6px 24px rgba(24,27,37,.07)` 한 겹이고, 떠 있는 요소(메인 배너, hover한 매물 카드)는 `0 14px 40px rgba(24,27,37,.12)`로 한 단계 짙다. 기능 카드·브랜드 패널은 그림자 없이 `{colors.surface-weak}` 면으로만 구분한다 — 그림자와 면의 명도 차를 함께 쓴다. 팝오버는 그림자 없이 1px `{colors.border-base}` 테두리로 구분한다 [src:2].

## Shapes

집결 심볼은 지붕과 벽을 한 획으로 꺾은 집 모양이고, 앱 아이콘은 둥근 사각(모서리 약 23%) 안에 놓인다 [src:0]. UI는 직각 대신 알약(텍스트 버튼, 검색, 칩)과 12~20px 둥근 사각(입력, 카드, 모달)을 섞고, 거래 배지는 4px, 아이콘 전용 버튼은 16px이다. stroke는 `0.5·1·1.5·2px` 네 단계다 [src:9].

## Components

다음 값은 `static/style.css`에 실제로 구현된 값이다. 클래스 이름을 괄호에 적었다. 테마는 라이트 하나다.

### header

높이 약 64px, 배경 흰색 94% + 블러, 하단 1px `{colors.border-base}`, 스크롤해도 위에 붙어 있다(sticky). 왼쪽에 로고 `{{ logo() }}`, 오른쪽에 메뉴 (`.nav`).

### nav-item

높이 44px 알약, 글자 15px 600, 색 `{colors.text-secondary}`. hover 배경은 `{colors.brand-sub}`, 글자는 `{colors.brand-primary}`로 바뀐다 (`.nav nav a`).

### nav-badge

메뉴 옆 개수 배지(찜 개수). `{colors.brand-primary}` 원형에 흰 숫자, 높이 20px·최소 폭 20px, 12px 700, 숫자 폭 고정(`tabular-nums`). 1개 이상일 때만 보이고 100개부터는 `99+`. 화면 읽기 프로그램에는 링크의 `aria-label`로 "찜 N개"를 읽힌다 (`.nav-badge`).

```html
<a class="nav-wish" href="/wishlist" aria-label="찜 3개">찜<span class="nav-badge" aria-hidden="true">3</span></a>
```

### search-field

가이드 앱 화면의 검색창이다 [src:0]. 높이 52px 흰 알약에 그림자 `{elevation.shadow-card}`, 테두리 없음, 왼쪽에 20px 돋보기. placeholder는 "지역, 아파트, 지하철역을 검색해보세요"이고 색은 `{colors.text-tertiary}`다. 포커스 시 3px `{colors.brand-primary}` 링을 두른다. 오른쪽에 `icon-button`(필터)을 붙인다 (`.search-bar` · `.search-field`).

```html
<form class="search-bar" action="/listings" method="get" role="search">
  <div class="search-field">
    <svg ...돋보기...></svg>
    <input name="region" placeholder="지역, 아파트, 지하철역을 검색해보세요" aria-label="검색">
  </div>
  <a class="icon-btn" href="/request" aria-label="조건으로 찾기"><svg ...필터...></svg></a>
</form>
```

### button-primary

1차 버튼. `{colors.brand-primary}` 배경에 흰 글자, 높이 48px, 좌우 24px, 글자 16px 600(`{typography.label-16}`), 알약이다. 누르면 98%로 살짝 줄어든다 (`.btn`). `<button>`은 클래스 없이도 이 모양이 된다.

```html
<a class="btn" href="...">매물 보기</a>
```

### button-primary-dark

1차 버튼의 hover·눌림 상태다. `{colors.brand-primary-dark}` 배경에 흰 글자, 나머지는 `button-primary`와 같다.

### button-secondary

배경 `{colors.surface-base}`, 글자 `{colors.brand-primary}`, 48px 알약. hover는 `{colors.surface-strong}`이다 (`.btn .btn-sub`).

### button-tertiary

흰 알약 버튼. 배경 `{colors.bg-base}`, 글자 `{colors.text-primary}`, 그림자 `{elevation.shadow-card}`, 48px. 파란 배너 위의 "지금 시작하기 →"가 이 버튼이다 [src:0] (`.btn .btn-white`).

### icon-button

52px 정사각에 radius 16px, 흰 면, 그림자. 아이콘 22px. 가이드 앱 화면의 필터·뒤로가기 버튼이다 [src:0]. 둥글게는 `.round`를 붙인다. 글자가 없으니 `aria-label`을 꼭 단다 (`.icon-btn`).

### badge-3d

3D(가우시안 스플래팅)로 둘러볼 수 있는 매물 표시. `{colors.surface-weak}` 면에 `{colors.text-primary}` 글자, 14px 600, 알약. 가이드 앱 화면의 평점 칩(★ 4.7) 모양을 따른다 [src:0] (`.chip .chip-soft`).

```html
<span class="chip chip-soft">360° 3D</span>
```

### badge-deal

거래 유형(전세·월세·매매) 표시. `{colors.surface-base}` 면에 `{colors.brand-primary}` 글자, 12px 700, 높이 20px, radius 4px (`.badge`).

```html
<span class="badge">전세</span>
```

### page-head · empty-state

페이지 제목 줄(`.page-head`: 왼쪽 제목 + 한 줄 설명, 오른쪽 개수 칩)과 빈 상태(`.card .empty-state`: 옅은 로고 → 제목 → 설명 → 버튼)는 목록 · 의뢰서 · 찜이 같은 모양을 쓴다 (`style.css`).

### keyword-chip

`{colors.surface-strong}` 면에 `{colors.text-primary}` 글자, 15px 600, 알약. 가이드 BRAND KEYWORDS 칩 모양이다 [src:0]. 지역·조건 태그에 쓴다 (`.chip`).

### listing-card

가이드 앱 화면의 매물 카드다 [src:0]. 흰 카드(radius 20px, 안쪽 여백 16px, 그림자) 안에 왼쪽 사진, 오른쪽 글 두 묶음이다. 간격은 게슈탈트 원리로 정한다 (`.card .listing-card`).

| 원리 | 규칙 |
| --- | --- |
| 근접성 | 같은 묶음 안은 4~8px(이름↔위치, 배지↔가격), 묶음 사이는 14px — 안쪽 간격의 약 3배라 "어떤 집"과 "얼마"가 나뉘어 읽힌다 |
| 공통 영역 | 카드 안쪽 여백 16px ≥ 묶음 간격 14px, 카드끼리 20px — 카드 한 장이 한 덩어리로 보인다. "360° 3D"는 사진에 관한 정보라 사진 왼쪽 아래 위에 얹는다 |
| 유사성 | 사진은 모든 카드에서 112×112px, radius 14px. 거래 유형은 늘 `badge-deal`, 가격은 늘 17px 700 `{colors.brand-primary}` |
| 정렬 | 사진과 글을 세로 가운데로 맞추고, 같은 줄의 카드는 높이를 같게 한다. 이름은 17px 700, 최대 2줄 |

- 묶음 1 (어떤 집): 이름 → 4px → 동네 · 방 · 면적(14px `{colors.text-tertiary}`)
- 묶음 2 (얼마): `badge-deal` → 8px → 가격
- 사진이 없으면 `{colors.brand-sub}` 면에 로고 심볼을 옅게 둔다. hover하면 3px 떠오르고 그림자가 짙어진다.

### listing-tile

매물 목록용 세로 카드다 — 위에 사진(4:3), 아래에 `listing-card`와 같은 두 묶음(이름·위치 / 거래 배지·가격). 흰 카드 radius 20px, 그림자, 정보 영역 안쪽 여백 16~18px, 카드 사이 24px. 가격 줄은 늘 카드 맨 아래에 붙여 같은 줄의 카드끼리 가격 위치가 맞는다. "360° 3D"는 사진 왼쪽 아래 위에 얹는다. hover하면 3px 떠오르고 사진이 3% 커진다 (`templates/listings.html` · `static/listings.css`).

필터는 `{colors.surface-weak}` 패널 하나에 칸 4개(높이 48px로 통일) + 버튼을 한 줄로 두고, 960px 이하 2열 · 480px 이하 1열로 접는다. 라벨↔칸 6px < 칸↔칸 16px. 결과 개수는 목록 바로 위 16px(목록에 속함), 필터 패널과는 32px 띄운다.

### detail-summary

매물 상세(`templates/detail.html` · `static/viewer/viewer.css`)는 위에 3D 뷰어(없으면 매물 사진 + "3D 둘러보기 준비 중" 표시, 같은 크기 규칙: 폭 100% · 16:10 · 최대 72vh), 아래는 왼쪽 본문(탭 · 정보칸 · 집 소개)과 오른쪽 요약 카드(360px, 화면을 내려도 따라옴) 두 열이다. 요약 카드 = 이름 · 위치 → 4px / 가격 줄(`badge-deal` + 가격 26px) → 구분선 / 찜 · 의뢰 버튼 두 개를 같은 너비로. 900px 이하에서는 요약 카드가 본문 위로 올라온다. 정보칸 아이콘은 홈 기능 아이콘과 같은 파란 1.5px 선.

### heart-btn

사진 위 동그란 찜 버튼(`.heart-btn`, `style.css`). 지름 40px 흰 원(94%) + 그림자, 누르는 범위 44px. 찜 전 = 빈 하트 `{colors.text-primary}`, 찜 후 = 채운 하트 `{colors.brand-primary}`(`aria-pressed="true"`). `aria-label`은 "매물 이름 찜하기 / 찜 취소"로 바뀐다. 매물 목록 카드에서는 사진 오른쪽 위(3D 표시는 왼쪽 아래)에 두고, 카드 링크 **밖**에 폼으로 둔다(링크 안에 버튼을 넣지 않음). 누르면 페이지를 새로 불러오지 않고 하트 · 상단 찜 배지 · 토스트(`.toast`)만 바뀐다 — 스크립트가 꺼져 있으면 보통 폼으로 동작.

### compare-table

찜 · 비교 표 (`templates/wishlist.html` · `static/wishlist.css`). 흰 카드 하나에 표를 담고, 항목 이름 칸(132px)은 `{colors.brand-neutral}` 면으로 한 줄기를 만든다. 매물 칸은 `table-layout: fixed`로 **너비를 똑같이** 나눠서 사진(4:3, radius 14px)이 모든 칸에서 같은 크기 · 같은 높이에서 시작한다. 이름은 최대 2줄, 거래 유형은 `badge-deal`, 3D는 사진 왼쪽 아래 `badge-3d`("360° 3D"), **찜 취소는 사진 오른쪽 위 안쪽**의 흰 알약 버튼(채운 하트 + "찜 취소", 보이는 높이 36px · 누르는 범위 44px) — 이 매물에 대한 표시와 행동은 이 사진 안에 모은다. 더 나은 값은 `{colors.brand-sub}` 면 + `{colors.brand-primary}` 글자 + "★ 가장 넓어요" 글자를 함께 쓴다(색만으로 구분하지 않음). 640px 이하에서는 표만 옆으로 밀리고 항목 이름 칸은 왼쪽에 고정된다.

### form-input

흰 면, 1px `{colors.border-base}`, radius 12px, 높이 48px(여러 줄은 120px부터). 라벨은 입력칸 위에 15px 600으로 항상 보인다 — placeholder만으로 라벨을 대신하지 않는다. 포커스 시 테두리 `{colors.brand-primary}`와 4px `{colors.brand-sub}` 링, 오류는 칸 바로 아래 `{colors.error}` 14px (`input` · `select` · `textarea` · `.error`). 클래스 없이 자동 적용된다.

### tabs

가이드 상세 화면의 "정보 · 평면도 · 최근 실거래가" 탭이다 [src:0]. 글자 `{colors.text-tertiary}` 600, 높이 44px, 현재 탭은 `{colors.brand-primary}` 글자에 3px 밑줄. 현재 탭에 `aria-current="page"` 또는 `aria-selected="true"`를 붙인다 (`.tabs`).

```html
<nav class="tabs">
  <a href="#info" aria-current="page">정보</a>
  <a href="#plan">평면도</a>
  <a href="#price">최근 실거래가</a>
</nav>
```

가이드 상세 화면의 "세대수 2,990세대 · 준공연도 2019년" 정보칸은 `.stats` 안에 `.stat`(아이콘 · `.stat-label` · `.stat-value`)으로 쓴다 [src:0].

### modal

배경 `{colors.bg-base}`, radius 12px, 폭 450px, 안쪽 확인 버튼은 `button-primary`다. 그림자는 `{elevation.shadow-level-6}`이다. 아직 쓰는 화면이 없다.

## Do's and Don'ts

**Do** Primary `{colors.brand-primary}`은 1차 버튼 면, 링크, 가격 같은 짧은 강조 글자, 로고에만 쓰고, 넓은 면에는 쓰지 않는다. 넓은 면은 Neutral `{colors.brand-neutral}`, `{colors.surface-weak}`, Sub `{colors.brand-sub}`로 깐다. 예외는 메인 배너의 하늘 그라데이션 하나다 [src:0].

**Do** 상태는 반투명 오버레이(hover 5%, selected 12%)로 표현하되, 밝은 면에는 darken, 어두운 면에는 lighten 쪽을 쓴다. 단 1차 버튼 hover는 `{colors.brand-primary-dark}`로 면 색 자체를 바꾼다 [src:2][src:9].

**Do** 텍스트 버튼, 검색, 칩은 알약(`circular`), 입력은 12px, 카드는 20px 둥근 사각으로 나눠 쓴다. 단 거래 배지는 4px, 아이콘 전용 버튼은 16px이다.

**Do** 누르는 것(버튼, 메뉴, 아이콘 버튼, 탭)은 높이 44px 이상으로 만든다. 손가락으로 누르기 쉬운 최소 크기다.

**Do** 색은 코드에 `#0056FF`처럼 직접 쓰지 말고 `var(--color-primary)` 같은 변수로 쓴다.

**Don't** 파란 면 `{colors.brand-primary}` 위에 회색 글자를 쓰지 않는다 — 파란 면 위 글자는 흰색 `{colors.white}`만 쓴다.

**Don't** 로고를 임의로 변형·재색칠하지 않는다. 심볼은 파랑 또는 흰색 두 가지로만 쓰고, 비율을 늘이거나 획 두께를 바꾸지 않는다 [src:0].

**Don't** 이모지를 아이콘으로 쓰지 않는다. 아이콘은 미니멀 선 아이콘 하나의 규칙만 쓴다 — 24×24 칸, 선 1.5px, 둥근 끝·둥근 꺾임(`stroke-linecap/linejoin: round`), 채우기 없음, 색은 `{colors.brand-primary}` 또는 `currentColor`. 선 아이콘과 꽉 찬(fill) 아이콘을 한 화면에 섞지 않는다. 홈 기능 카드 아이콘(`.feature-icon`)이 기준이다.

## Responsive Behavior

공개된 브레이크포인트 체계는 없다(no published breakpoint system surfaced). 토큰 층 CSS에는 TV 레이아웃용 `--sem-layout-tv-spacing`, `--sem-radius-tv-*` 토큰이 따로 있어 큰 화면은 별도 계통이다 [src:9]. 핀치 줌은 막지 않는다. 640px 이하에서는 메뉴가 로고 아래로 내려가고, 매물 카드는 한 줄에 하나, 메인 배너는 사진이 아래 40%로 줄어든다. 860px 이하에서는 브랜드 패널이 세로로 쌓인다.

## Known Gaps

- 브랜드 가이드는 이미지 한 장(`brandguide.png`)이다 [src:0]. 색과 글자색은 이미지에서 뽑았고, 공식 Primary·Sub·Neutral 세 값 외의 색(`brand-chip`, `surface-weak`, 텍스트 네 단계)은 화면 픽셀에서 읽은 값이라 원본 디자인 파일과 조금 다를 수 있다.
- 로고 벡터(`logo-mark.svg`)는 가이드 이미지를 측정해 다시 그렸다. 원본에서 좌우 벽 아래 끝 높이가 조금 달랐는데, 좌우 대칭으로 맞췄다.
- 메인 배너 사진은 남산타워와 서울 전경(원본 `static/brand/seoul.png`, 1672×941)이다. 화면용으로 JPG 세 장을 만들어 쓴다 — PC `hero-seoul-1672.jpg`·`hero-seoul-1000.jpg`(화면 폭에 맞는 것만 내려받음), 모바일 `hero-seoul-mobile.jpg`(남산타워 중심 세로 자르기). 원본보다 크게 늘리지 않는다. 배너 전체를 `object-fit: cover`로 채우고, 글자 쪽(PC 왼쪽, 모바일 위쪽)에 브랜드 파랑 그늘을 깐다. 사진을 바꿀 땐 가로 1600px 이상 사진을 쓴다.
- 경고(warning) 색과 다크 테마는 정하지 않았다.
- 매물 목록, 상세+3D, 의뢰서, 찜 화면은 각 담당자가 만들면서 이 문서의 컴포넌트를 쓴다. 새 컴포넌트가 필요하면 원님에게 말해 이 문서와 `style.css`에 함께 추가한다.
- 키보드 포커스는 `:focus-visible`에 3px `{colors.brand-primary}` 외곽선으로 표시한다. outline을 끄지 않는다.

## References

0. brandguide.png — 집결 브랜드 아이덴티티 가이드. 로고, 앱 아이콘, 컬러 팔레트(Primary·Sub·Neutral), 타이포그래피(Pretendard), 메인 배너, 앱 화면, 브랜드 키워드·콘셉트·무드.
1. https://chzzk.naver.com/ — 치수 참고: 렌더된 화면의 계산 스타일과 마크업·메타 확인.
2. https://ssl.pstatic.net/static/nng/glive/resource/p/static/css/index-DtFlhVVI.css — 치수 참고: 컴포넌트 클래스 CSS. 해시 경로라 바뀔 수 있다.
7. https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css — Pretendard 가변 서브셋 로드 경로.
9. https://ssl.pstatic.net/static/nng/glive/resource/p/static/css/vendor-JDVjTL6M.css — 치수 참고: 토큰 층 CSS(spacing, radius, elevation, typography 스케일). 해시 경로라 바뀔 수 있다.
