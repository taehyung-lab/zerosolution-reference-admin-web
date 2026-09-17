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

## 공용 단위의 승격

코드 모양이 아니라 **의미와 상태 전이**로 판단한다.

```text
첫 소비자    → 기능 내부에서 가장 단순하게 구현
두 번째      → 공통점과 차이를 비교
반복         → 의미·입력·상태 전이·실패·수명이 같을 때만 승격 검토
```

**쓰는 것과 승격하는 것은 다른 결정이다.** 기존 계약이 그대로 맞으면 그냥 쓰고 이 절을 열지 않는다.
한 곳에서만 필요하면 그 기능 안에 두고 역시 열지 않는다.

승격하려면 넷이 모두 참이어야 한다.

- 비교한 호출자들에서 의미·상호작용 수명·소유·실패 동작이 같다
- 공개 계약에 도메인 타입·서버 DTO·Query·Router·권한·mutation 정책이 없다
- 자원·엔티티 switch, 도메인 mode, schema 주입, callback override 가 필요 없다. 단위가 필드·DTO·
  endpoint·목적지를 배우지 않는 불투명 인자(읽지 않는 schema 타입 인자, `run(values)` callback,
  순수 분류 결과, 완료 callback, `resetKey` 문자열)는 schema 주입이 아니다
- 하나의 구현이 **관측된** 변경 비용이나 결함 위험을 줄인다(반복된 결함, 소비자마다 다시 쓰는 전이,
  한 번 놓친 접근성 불변식)

시각적 유사성, 예상되는 재사용, 기계적인 세 번째 발생은 근거가 아니다.

**승격하지 않을 신호**: 도메인 이름이나 제품 값을 알아야 함 · 경로·권한·캐시를 직접 알아야 함 ·
호출자마다 mode 가 늘어남 · callback 과 설정으로 차이를 계속 흡수함 · 한 소비자 때문에 공개 API 가
넓어짐 · 생김새만 같고 실패·수명이 다름.

맞지 않으면 **중복을 허용한다.** 읽기 쉬운 명시적 조립이 잘못된 추상화보다 낫다.

승격한 단위는 계약을 공개한다: 입력 / 출력 / 소유하는 상태와 수명 / 직접 하는 부작용 / 처리하는
실패의 범위 / **호출자에게 남기는 것** / 좁히거나 되돌릴 조건. 첫 소비자는 소비자이지 소유자가 아니다 —
두 번째 실제 workflow 가 같은 의미·수명·실패를 확인하기 전까지 그 단위는 잠정이다.

### 승격 보고 · 공용 로직 · 수명 · 강등 신호

The completion report answers every admission item, not a verdict word:

| admission item | required evidence |
| --- | --- |
| semantics, lifecycle, ownership, failure behavior match | compared call sites and the matching/differing transitions |
| public API has no domain, DTO, Query, Router, permission, or mutation policy | the smallest domain-free input/output and the feature-owned remainder |
| no resource switch, schema injection, or callback override | the required variation and why an opaque generic does not teach shared a domain fact |
| implementation reduces observed cost or risk | the concrete duplication, change cost, or defect |

If any row is unanswered, keep the code feature-local.

## Shared logic

A focused shared state mechanic owns one domain-neutral algebra: draft preservation while a caller identity is equal, period preset/custom transitions from explicit timezone inputs, pending keyword add/remove/trim, page-scoped row selection, one rejection message, the confirm → run → close lifecycle. The caller owns identity policy, field/enum meaning, defaults, submit/reset destinations, navigation, Query enablement, and API mapping. Navigation ports, query options, resource modes, or schema configs are demotion signals.

A pure utility may compact values, resolve declared defaults, normalize a pair, format primitive values, or map structurally generic options only when it does not broaden keys or invent server semantics. Keep it local when arguments grow to absorb domain differences.

Before promoting, compare the real callers on input differences, state transitions, failure/recovery, and owner. Merge same-role copies in the nearest feature owner first; only a domain-free mechanic moves to shared. A fixture's search/sort/page calculation imitates the server and disappears with the real API — tidy it inside the mock and do not count it as shared evidence. Responsibilities that survive connection (query outcome judgment, selection lifetime, confirmation value holding) are compared against the existing catalog first. Report the compared consumers and the differences left outside; "no duplication" holds only inside the compared range.

## Lifecycle

A unit stays provisional until a second real workflow validates the same semantics, lifecycle, and failure behavior. The first consumer is a consumer, not the owner.

1. name the evidence and the current consumer
2. state the smallest public contract and the feature-owned remainder
3. implement only the surface the current consumer uses
4. compare the next real consumer
5. confirm, narrow, or demote from observed differences

When the request names a shared unit rather than a screen, the same procedure applies from the other direction: the unit's focused tests are the contract, completeness is those tests plus every existing consumer still passing, and a caller's need never widens the contract on its own — that is step 4 with a new consumer. Implement only inside the unit's ownership; absorbing anything the catalog assigns to the feature is a failure even when a caller asks for it.

Consequential selection (a select whose change needs confirmation before it commits) is not a shared control feature: keep the committed value unchanged, hold one local candidate, open `ConfirmDialog`, commit through the caller on confirm, discard on cancel. Shared controls expose controlled values and never open workflow dialogs themselves.

## Demotion signals

- domain `mode`, resource descriptor, schema injection, or permission branch
- callback overrides added for exceptional callers
- Router, Query, mutation, endpoint, or server DTO knowledge (an injected `run` promise or a domain-free failure vocabulary is not that knowledge)
- a different failure lifecycle hidden behind configuration
- a unit whose only consumer is its own test and for which no consumer is expected

Return the differing workflow to feature code and narrow the shared contract instead of growing an option framework. Delete a unit whose consumers are gone and none is expected; a `Form*Field` adapter with no consumer is the exception the product owner keeps for the declared input set. The reasons behind the current shared set are recorded in [ADR 0014](../../docs/decisions/0014-single-screen-shape.md).

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

## 소유자 경계 — api 훅과 model, lib 와 config

한 파일이 `api`인지 `model`인지, 상수가 `config`인지 `model`인지, 도우미가 `lib`인지 갈릴 때만 읽는다. 배치 표는 [SKILL.md 배치 판단](#배치-판단)이 소유한다.

## API 훅과 model을 구분하는 기준

`use` 접두사나 API 호출 유무가 아니라 **입력과 결과, 소유하는 결정**을 본다.

- `api`: ID·locale·명시적인 조회 조건을 받아 요청하고 데이터·pending/error/retry 또는 안정된 옵션 값을 반환한다
  (`use<Entity>Detail`, `use<Entity>Options` 꼴). 조회 조건의 선택은 caller가 소유한다. loader용 원본 queryOptions와 키를 그대로 공유한다.
- `model`: URL 정규화·검색 시작 여부·페이지 수·선택 대상·폼 종속 필드·mutation 후 캐시를 결정한다
  (`use<Entity>ListData`, `use<Entity>FormOptions`, `useUpdate<Entity>Mutation` 꼴).
- API-only mutation 훅도 가능하다(로그인처럼 후속 처리가 caller 에 있는 요청). 성공 후 session·navigation 등은
  호출 workflow가 처리한다. 캐시·폼·화면 동작을 옵션 팩토리나 API 훅에 감추지 않는다.
- 기존 API 훅은 이 기준으로 옮기되, 새 훅은 안정된 연결 책임이 있을 때만 만든다.
  함수 호출 한 줄을 감싸는 훅을 의무적으로 추가하지 않는다.

한 도메인의 참조 데이터 조회가 그 도메인 안에서 재사용될 수 있어도 `shared` 데이터는 아니다. 다른 도메인의
실제 소비자가 생기면 [공용 reference data 조건](../contract/server-state.md#shared-reference-data)을
대조한다. 미래 사용 가능성만으로 cross-feature import를 허용하거나 entities를 만들지 않는다.

## lib/config를 과하게 나누지 않는 기준

`model`은 모든 .ts 파일의 수납장이 아니며, `lib`도 나머지를 버리는 폴더가 아니다.
도메인의 날짜 formatter와 오류 번역 키 변환은 domain/lib, 목록의 노출 정의는
screens/list/config에 둔다. 도메인 공통 타입은 domain/model, 한 화면의 schema/defaults는 그 화면의 model,
dialog props는 그 화면의 ui, 표시 전용 문자열 함수는 그 화면의 lib가 소유한다.

상수라고 모두 config로 빼지 않는다. 검색 schema의 기본값, 정렬 허용 목록과 전이,
이력의 개인정보 비노출 정책은 이를 해석하는 model과 함께 둔다. 순수 함수여도 업무 판단을
소유하면 model이다. 특정 화면만 사용하는 행 mapper는 그 화면 model에 둔다.

같은 엔티티가 두 서버 계약(제품 계약과 격리 계약)을 갖는 동안 두 구현은 같은 list/detail/form 업무군 안에서
구분하고 서로의 서버 의미를 합치지 않는다.

## 의존 방향의 이유

파일을 만들거나 옮기면서 import 경계를 새로 긋거나 넘을 때만 읽는다. 배치 위치 자체는 [SKILL.md 배치 판단](#배치-판단)이 정한다. 기계 검사는 `eslint.config.js`의 import 경계 규칙이 소유하며, 여기 문장은 그 규칙이 왜 그렇게 그어졌는가다.

```text
app / routes → features → shared / api
screens → mechanics → domain api / model / lib / config
screens → domain api / model / lib / config
ui → 해당 소유자의 model / lib / config
```

- domain api/model/lib/config/fixtures는 screens나 mechanics 내부를 역참조하지 않는다.
- mechanics는 screens를 참조하지 않는다. 서로 다른 screens의 내부 파일을 import하지 않는다.
- model/lib/config는 feature ui를 역참조하지 않는다. UI가 정의한 데이터 타입을 API/model도 쓰면 그 타입의
  의미에 맞는 model 또는 API 계약으로 옮긴다. 렌더 전용 props까지 옮기지는 않는다.
- domain model은 React와 실행 훅을 모른다. screens/mechanics model은 React·Query를 사용할 수 있다.
- domain api는 옵션 선언과 API-only 훅을 소유한다. URL·폼·선택·확인·navigation·mutation 뒤 캐시
  후속 처리는 workflow가 소유한다. lib/config는 React·Query 실행 훅을 소유하지 않는다.
- fixture는 예시 데이터의 소유자다. 화면의 URL schema나 UI 타입에 기대지 않고 공통 입력·값을 소비한다.
- 기존 feature 간 import와 generated 접근 제한은 유지한다. API leaf 예외의 적용 조건은
  [API 계약](../contract/server-state.md)이 소유한다.

API 입력 타입과 URL 정규화는 소유가 다르다. 공통 입력 타입은 api/model에 두고 URL schema는
소비 화면 또는 실제 공유 mechanic의 model에 둔다. 타입을 옮기면서 미확정 서버 DTO를 새로 정의하거나 캐시 identity를 바꾸지 않는다.

## feature 경계와 흔한 실수

## Boundaries

- `features/{domain}` owns domain workflows. `api/` owns query/mutation options, keys and API-only hooks; `model/` owns domain values, types and pure rules; `screens/{entity}-{role}/` owns one screen; `mechanics/` owns pieces two screens of the domain share.
- There is no `pages` layer. Features do not import another feature's UI, model, or hooks; a route composes multiple screens. Cross-feature API leaf exceptions are limited to the cases defined by [`server-state.md`](server-state.md).
- 제품 enum 의 집합·의미·필수·기본값은 원장, 내부 철자는 feature `model/` 의 한 선언이 소유한다. 화면은 재선언하지 않는다. 서버가 미확정이어도 내부 선언은 확정할 수 있다. raw shape·fixture 공유는 [query-cache](server-state.md#서버-연결-전후의-책임), 실제 wire 대응은 확인된 서버 계약이 소유한다.
- Components do not call generated operations or reconstruct query keys.
- Hooks have one state or behavior owner. Do not bundle query, mutation, form, dialog, toast, navigation, and permission into a page controller hook.
- Separate UI from business rules by ownership, not by forcing every calculation into a hook. Render-local formatting and columns stay near the result UI; URL transitions, Query enablement, payload/cache identity, permission, and workflow decisions stay in `model/` hooks.
- Do not build `useCrud`, `ResourcePage`, universal list/form descriptors, or a resource framework around feature workflows.
- 테스트는 **검증하는 소유자 옆에** 둔다. 여러 화면을 조립하는 통합 테스트만 `src/test/workflows` 에
  둔다. 테스트 편의를 이유로 production import 경계를 완화하지 않는다.
- **같은 feature 는 한 요청, 한 소유자다.** 한 feature 를 화면 단위로 병렬 분할하면 `model/`·`api/`
  의 데이터 계약이 작업마다 갈린다. 데이터 계약(model 타입·query options·mutation 입력)을 먼저 한
  곳에서 확정하고 그 위에서 화면을 잇는다. 병렬로 나눌 수 있는 것은 서로 다른 feature 다.

권한·status 의미·bulk·업로드 제한·실 저장 성공 후 이동은 추측하지 않는다. 원장·원문에도 답이 없는 영향 부분만 보류한다. 목적지 파일 부재와 API 미연결은 제품 부재가 아니다. 연결 범위는 [도달 가능한 진입점](../direct/route-composition.md#도달-가능한-진입점), 미연결 종착점은 [mutations](server-state.md#시나리오-요청)가 소유한다.

## Common mistakes

- Mirroring URL filters in persistent component state
- Adding feature-local whole-screen blocking for a mutation without a confirmed product-wide progress contract
- Hiding business workflow inside a generic list, form, dialog, or upload hook
- Rendering a dialog owner inside a `searched` or `ready` branch

## 설계 참고와 채택 범위

[카카오페이 FSD 적용기](https://tech.kakaopay.com/post/fsd/)의 목적별 segment, 재사용 범위에 따른
소유권, import 방향을 참고했다. 그 구조를 그대로 복제한 것은 아니다.

- **채택:** 업무 응집, 목적별 분리, 실제 재사용 확인 뒤 공통 소유자로 이동, 의존성 검사.
- **수정:** pages/features/entities 대신 현재 domain/screens/mechanics를 유지한다. API 계약은
  domain/api 한 위치에서 찾고 workflow별 상태는 screens/model에 둔다.
- **제외:** 전체 FSD 레이어 도입, 모든 폴더의 사전 생성, 단순 함수까지 lib로 분산하는 규칙.

자동 검사는 import 경계·React 실행 의존·API의 Router/Form/캐시 클라이언트 접근을 확인한다.
훅이 업무 정책을 숨겼는지와 helper/config의 의미는 실제 소비자와 코드 리뷰로 확인한다.

## 이 계약의 검증 대상

| 축 | 무엇을 확인하나 |
| --- | --- |
| import | 금지된 방향이 실제로 lint 에서 걸리는가 |
| 조립 | 새 파일이 실제 소비자에서 조립되어 앱에서 도달 가능한가 |
| 빌드 | `build` 가 통과하는가 |
| 이동 | 이동한 파일을 가리키던 import·테스트·검사 fixture·문서 링크가 모두 따라왔는가 |

이동표만으로 완료를 주장하지 않는다. UI·URL·권한·번역·payload·Query 키는 폴더 이동을 이유로
바꾸지 않는다.
