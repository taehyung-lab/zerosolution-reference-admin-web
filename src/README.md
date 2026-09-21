# src 지도

처음 온 사람이 **어디에 무엇이 있나**를 찾는 표다. 규칙은 여기 없다 — 의존 방향은 `eslint.config.js`,
배치 판단은 [`source-structure`](../.agents/skills/source-structure/SKILL.md) 가 소유한다. 아래 트리의 폴더
이름은 `pnpm contracts:check` 가 실제 디렉터리와 대조하므로 폴더를 만들거나 지우면 이 표도 같이 고친다.

```text
src/
  app/        앱 경계. provider·router 생성·shell·i18n 부트스트랩·오류 경계
  routes/     TanStack 파일 라우트. URL 검증·guard·loader·navigate 주입만 한다. 화면 로직은 없고 features 의 Screen 을 조립한다
  features/   도메인 우선. 한 도메인의 모든 것이 한 폴더에 있다
    {domain}/
      api/       query·mutation options, 키, 선택지 훅 — 서버 endpoint 를 아는 곳
      model/     도메인 값·타입·순수 규칙
      fixtures/  서버 연결 전 예시 응답
      i18n/      이 도메인의 번역 namespace (ko·en·ja)
      lib/       도메인 순수 도우미 (있을 때만)
      shared/    이 도메인의 두 화면 이상이 나눠 쓰는 조각. 도메인을 안다
      screens/   화면 하나 = 폴더 하나. `{entity}-{list|detail|form}/{ui,model}`
  shared/     도메인·서버 계약을 모르는 공용 코드
    ui/         렌더 단위 (primitives · filter · list · detail · form · dialog · feedback · layout)
    hooks/      상태 수명·전이를 소유하는 훅
    lib/        순수 계산과 정책 상수
    i18n/       shared namespace 와 locale provider
  api/        전송 층. HTTP·오류 정규화·list/detail query 투영·OpenAPI 생성물. shared 위에 있어 shared 는 이곳을 모른다
  test/       테스트 setup, 여러 화면을 조립하는 workflow 테스트
```

## FSD 를 알면

| FSD 층 | 여기서는 |
| --- | --- |
| entities | `features/{domain}/{api,model,fixtures}` |
| features · widgets | `features/{domain}/shared` |
| pages | `features/{domain}/screens/*` |
| 층 간 조립 | `routes/` |
| shared | `shared/` (+ `api/` 는 shared 위의 전송 층) |

층을 접은 이유는 화면 하나를 고칠 때 한 도메인 폴더 안에서 끝나게 하려는 것이다. 대신 규칙 둘이 남는다:
feature 는 다른 feature 를 import 하지 않고(route 가 조립한다), 화면은 형제 화면을 import 하지 않는다(나눠 쓰는
것은 도메인 `shared` 로 올린다). 둘 다 lint 가 잡는다.

## 자주 묻는 것

- `src/api` 와 `features/*/api` 가 둘 다 api — 앞은 "어떻게 부르나"(transport·오류·query 투영), 뒤는 "무엇을 부르나"(도메인 endpoint).
- `ui/` 와 `model/` — 화면에 그려지는 것과 그리는 데 붙은 훅은 `ui`, URL·조회·폼 schema·요청 mapper 는 `model`. `.ts` 훅이 `ui` 에 있을 수 있다.
- 도메인 `shared` 와 전역 `shared` — 같은 뜻, 다른 범위. 전역은 도메인을 모르고, 도메인 shared 는 다른 도메인을 모른다.
