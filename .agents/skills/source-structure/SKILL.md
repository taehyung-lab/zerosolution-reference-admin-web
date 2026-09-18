---
name: source-structure
description: >
  파일을 만들·이동·개명하거나 segment·폴더·import 경계·이름·feature에서 shared로의 승격을 정할 때 사용한다. URL segment는 route-composition, shared 단위의 책임은 shared-ui로 보낸다.
---

# 계약 — 소스 배치와 의존 방향

**답하는 질문**: 새 파일이 어디에 놓이고, 무엇이 무엇을 import 할 수 있으며, 이름을 어떻게 짓는가.

**담지 않는 것**: 한 화면이 어떤 파일을 갖는가 — 그것은 그 역할 계약의 `형태` 절이다. 제품 값 —
그것은 fact 다.

## 구조

```text
src/
  app/                         # provider, router, shell, 앱 경계·metadata
  routes/                      # URL 검증, guard, loader, 도메인 간 조립
  features/
    {domain}/
      api/                     # keys, query options, mutation options, API 전용 훅
      model/                   # 도메인 공통 값·타입·순수 규칙
      fixtures/                # 서버 연결 전 예시 데이터 (예시임이 드러나는 값)
      i18n/locales/{locale}/   # 이 도메인의 번역 namespace
      mechanics/{capability}/  # 같은 도메인의 두 화면이 같은 의미·전이·실패로 쓰는 조각
      screens/{entity}-{role}/ # 화면 하나. ui/ 와 model/ 만 만든다
  shared/                      # 도메인·서버 계약을 모르는 공용 코드
    ui/{family}/               # 렌더 계약
    model/                     # 렌더하지 않고 상태 수명·전이·정책 값을 소유
    lib/                       # 상태도 렌더도 없는 결정적 계산
  api/                         # 공용 transport, 공용 query 투영, 교체 가능한 generated
  test/                        # 테스트 setup, 여러 화면을 조립하는 workflow 테스트
```

`{role}` 은 `list` · `detail` · `form` 이다. 별도 `pages` 레이어는 없다.

## 이름

`{entity}` 는 surface ID 도 route segment 도 model 타입 이름도 아니다 — **그 폴더 이름만 보고
무엇을 다루는 화면인지 읽히는 최소 한정자**이며 singular kebab-case 다.

- 기본 명사만으로 읽히면 그대로 쓴다.
- 그 명사가 **무엇에 속한 것인지 물어야** 읽히면 속한 대상을 앞에 붙여 `{owner}-{noun}-{role}` 로 쓴다.
- 읽히는가의 기준은 상위 폴더 경로가 아니라 **폴더 이름 단독**이다. 상위 폴더가 이미 말해 준다는
  이유로 접두를 생략하지 않고, 도메인의 대표 엔티티라도 마찬가지다.
- model 타입·행 타입과 1:1 이 아니어도 되고, 한 화면 폴더가 여러 URL 변형을 열 수도 있다.
- **한정자는 폴더 이름과 진입 Screen 에만 붙인다** — 폴더 안의 파일은 그 폴더 안에서 읽히므로 짧은
  이름을 쓴다.

**URL segment 는 외부 계약이며 화면 폴더 이름과 일치할 필요가 없다.** resource collection 은 복수형
noun 이 기본, 상태·workflow·고정 view 는 제품 IA 가 준 이름을 따르며(복수형이 아닌 경우가 많다),
**제품이 이미 확정한 URL 이 두 기본값보다 우선한다.** route 파일 모양은 URL 을 그대로 비춘다 — 단일
leaf 는 평면 파일, leaf 가 둘 이상인 segment 는 디렉터리 + `index`.

## 배치 판단

| 책임 | 위치 |
| --- | --- |
| 서버 호출·Query 키·options, mutation options, ID·locale 만 묶는 조회 훅, 선택지 투영 훅 | `domain/api` |
| 도메인 공통 값·데이터 타입·업무 규칙 | `domain/model` |
| 상태·업무 전이를 소유하지 않는 순수 도우미 | 가장 가까운 소유자의 `lib` |
| 도메인을 모르고 렌더하지 않으며 상태 수명·전이를 소유하는 재사용 단위 | `shared/model` |
| URL 선언·검색 초안·조회 사실·액션 정책·폼 schema·기본값·요청 mapper | `screens/{entity}-{role}/model` |
| Screen·Filters·Result·Actions·컬럼·렌더와 결합된 훅 | `screens/{entity}-{role}/ui` |
| 같은 도메인의 **두 화면**이 같은 의미·상태·실패 계약으로 쓰는 기능 | `mechanics/{capability}/{ui,model}` |

확장자로 분류하지 않는다. `use` 접두사도 판정 근거가 아니다 — 렌더 계약을 소유하면 `ui`,
상태 수명·전이나 허용 값을 소유하면 `model`, 둘 다 아니면 `lib` 이다.

**두 화면이 같은 조립을 그린다면 읽기 전용이어도 `mechanics` 다.** 화면이 형제 화면을 import 하는
것은 lint 가 막으므로, 공유가 실제로 필요하면 소유자를 옮기는 것이 유일한 경로다. 다만 소비자가
둘이라는 숫자만으로 올리지 않는다 — 의미·상태·실패가 같은지 먼저 확인하고, 달라지거나 단일
소비자로 좁아지면 되돌린다.

`mechanics` 는 소유자가 애매한 파일을 넣는 곳이 아니다. 도메인에 종속된 재사용 기능은 `shared` 로
올리지 않는다.

## 의존 방향

- `routes/` 는 여러 feature 를 조립할 수 있다. feature 는 다른 feature 의 UI·model·훅을 import 하지
  않는다.
- 화면은 형제 화면을 import 하지 않는다.
- `shared/lib` 은 React 를 import 하지 않고 훅을 export 하지 않는다. `shared/model` 은 JSX 를 갖지
  않는다.
- component 는 generated operation 을 직접 부르지 않고 query key 를 다시 만들지 않는다.
- 훅 하나는 상태·동작 소유자 하나를 갖는다. query·mutation·form·dialog·toast·navigation·permission 을
  한 page controller 훅에 묶지 않는다.
- 업무 차이를 흡수하는 범용 CRUD 훅·resource 서술자·resource framework 를 만들지 않는다.
  `useCrud`·`ResourcePage`·`useListTable`·`usePagedTable` 같은 이름이 그 신호다 — 자원 종류를
  인자로 받아 화면을 만들어 내는 단위는 업무 차이를 설정으로 숨기고, 그러면 어느 화면이 무엇을
  하는지 코드에서 읽히지 않는다. 화면마다 필요한 조각을 명시적으로 조립하고, 반복되는 JSX 는
  허용한다. `eslint.config.js` 가 이 이름들의 선언·import 를 막고, 이 문단을 근거로 지목한다.

위 경계 중 기계가 보는 것은 `eslint.config.js` 와 `scripts/` 의 검사다. 문서는 이유와 예외 경로만
설명한다.

## Boundaries

- `features/{domain}` owns domain workflows. `api/` owns query/mutation options, keys and API-only hooks; `model/` owns domain values, types and pure rules; `screens/{entity}-{role}/` owns one screen; `mechanics/` owns pieces two screens of the domain share.
- There is no `pages` layer. Features do not import another feature's UI, model, or hooks; a route composes multiple screens. Cross-feature API leaf exceptions are limited to the cases defined by [`server-state.md`](../server-state/SKILL.md).
- 제품 enum 의 집합·의미·필수·기본값은 원장, 내부 철자는 feature `model/` 의 한 선언이 소유한다. 화면은 재선언하지 않는다. 서버가 미확정이어도 내부 선언은 확정할 수 있다. raw shape·fixture 공유는 [query-cache](../server-state/SKILL.md#서버-연결-전후의-책임), 실제 wire 대응은 확인된 서버 계약이 소유한다.
- Components do not call generated operations or reconstruct query keys.
- Hooks have one state or behavior owner. Do not bundle query, mutation, form, dialog, toast, navigation, and permission into a page controller hook.
- Separate UI from business rules by ownership, not by forcing every calculation into a hook. Render-local formatting and columns stay near the result UI; URL transitions, Query enablement, payload/cache identity, permission, and workflow decisions stay in `model/` hooks.
- Do not build `useCrud`, `ResourcePage`, universal list/form descriptors, or a resource framework around feature workflows.
- 테스트는 **검증하는 소유자 옆에** 둔다. 여러 화면을 조립하는 통합 테스트만 `src/test/workflows` 에
  둔다. 테스트 편의를 이유로 production import 경계를 완화하지 않는다.
- **같은 feature 는 한 요청, 한 소유자다.** 한 feature 를 화면 단위로 병렬 분할하면 `model/`·`api/`
  의 데이터 계약이 작업마다 갈린다. 데이터 계약(model 타입·query options·mutation 입력)을 먼저 한
  곳에서 확정하고 그 위에서 화면을 잇는다. 병렬로 나눌 수 있는 것은 서로 다른 feature 다.

권한·status 의미·bulk·업로드 제한·실 저장 성공 후 이동은 추측하지 않는다. 원장·원문에도 답이 없는 영향 부분만 보류한다. 목적지 파일 부재와 API 미연결은 제품 부재가 아니다. 연결 범위는 [도달 가능한 진입점](../route-composition/SKILL.md#도달-가능한-진입점), 미연결 종착점은 [mutations](../server-state/SKILL.md#시나리오-요청)가 소유한다.

## Common mistakes

- Mirroring URL filters in persistent component state
- Adding feature-local whole-screen blocking for a mutation without a confirmed product-wide progress contract
- Hiding business workflow inside a generic list, form, dialog, or upload hook
- Rendering a dialog owner inside a `searched` or `ready` branch

## 이 계약의 검증 대상

| 축 | 무엇을 확인하나 |
| --- | --- |
| import | 금지된 방향이 실제로 lint 에서 걸리는가 |
| 조립 | 새 파일이 실제 소비자에서 조립되어 앱에서 도달 가능한가 |
| 빌드 | `build` 가 통과하는가 |
| 이동 | 이동한 파일을 가리키던 import·테스트·검사 fixture·문서 링크가 모두 따라왔는가 |

이동표만으로 완료를 주장하지 않는다. UI·URL·권한·번역·payload·Query 키는 폴더 이동을 이유로
바꾸지 않는다.
