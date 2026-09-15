# TanStack Query and cache

Read this file only for query options, loader prefetch, mutations, query keys, cache updates, or invalidation.

## Ownership

Each domain owns its API integration:

```text
features/{domain}/api/
├── keys.ts
├── queries.ts
└── mutations.ts
```

- `keys.ts` is a leaf public cache-address module; it does not import feature UI, model, hooks, queries, or mutations.
- A confirmed cross-domain reference-data operation may expose `reference-queries.ts` as a second leaf public module. Do not create it before a second real consuming domain exists.

## Testing without a server

HTTP mocks replace responses below generated API calls; Query hooks and screens keep the same execution path.
The current test handlers and their supported scope live in [src/api/mocks/README.md](../../../../src/api/mocks/README.md).
When the server contract changes, update generated code, feature mappings and mock responses together.
Keep useful mocks for tests after live integration. An example response does not establish business state transitions.
- Export reusable `queryOptions` so loaders and hooks use one key and raw cache definition. API-only hooks may live in `features/{domain}/api`: they bind locale/explicit inputs to a query and return data, query facts or stable option projections. URL/search gates, selection, form dependencies and post-mutation cache effects remain in workflow model. Placement examples and the decision table are owned by [folder-structure-contract](../../folder-structure-contract/SKILL.md).
- A required single-record query (detail, edit load) runs through `useDetailQuery(options)` from `src/api/required-query.ts`; it owns the `ready | error | notFound` decision and the incident/not-found/cached-data priority so screens never re-derive them. List queries keep their own facts.
- Retry is `createQueryClient`'s `retryOnce` (`src/app/providers/AppProviders.tsx`): a deterministic `ApiError` (`not-found`, `forbidden`, `unauthorized`, `validation`, `business`, `conflict`) is never retried — the answer would not change, the not-found page would arrive a backoff later, and a retried 403 publishes its incident twice; every other failure is retried once. Tests that need the production behaviour use `createQueryClient()` rather than `retry: false`.
- Query progress is explicit: list entry requests spread `blockingProgress`, mounted content transitions spread `contentProgress`, and option/lookup `queryOptions` spread `inlineProgress` (all from `src/api/query-meta.ts`). AppShell does not infer blocking from a missing meta value. Option queries usually use `staleTime: Infinity`; `Register.queryMeta` is typed centrally and features do not add ad-hoc meta keys.
- Add a custom hook only when it adds stable feature policy. A server-backed select is one such boundary when the hook runs the raw `queryOptions` and uses Query `select` to expose feature-owned `{ value, label }` options. Keep the exported query function raw so loaders warm the same cache entry and another consumer can project it differently. Screens and forms consume the hook; they do not repeat `useQuery` plus mapping. Do not add a generic endpoint/config-driven option hook or wrap an already UI-ready query mechanically.
- Query functions call generated operations and return the declared response or an explicitly named feature model.
- Request mapping belongs beside the feature form/model, not in a shared transport layer.

## Keys

Use a hierarchical domain-local factory. A list key contains canonical search params; a detail key contains the stable ID. While the localized response families remain unconfirmed, every API-backed key uses `localizedQueryKey(uiLocale, ...segments)` so the common root is `['api', uiLocale, ...segments]`. ADR 0005 owns the reason and the condition for narrowing this policy; do not implement that disposal condition inside a feature key factory.

Do not rebuild another domain's key from string literals. A confirmed cross-domain cache effect imports only that domain's leaf `api/keys.ts`; it never imports its queries, mutations, model, hooks, or UI. Routes do not own cache consequences.

## Shared reference data

Repeated option data does not justify repeated requests or a global option store. A consuming feature may import another domain's leaf `api/reference-queries.ts` only when all are confirmed:

- the same OpenAPI operation, auth scope, response meaning, Query key, and cache policy serve both domains
- a second real domain consumes the data
- the module returns the declared DTO or feature reference model, never `SelectOption`, translated copy, or UI state
- each consuming feature maps its own labels/options and owns remote-search state

If any condition differs, keep separate feature queries. Never mirror reference data in Zustand.

## Loader and screen

Route loaders and screens use the same exported query options. Router trigger and waiting rules are owned by [router.md](../../feature-contract/references/router.md). Components never call generated operations, assemble raw keys, or copy server data into local state.

Mutation and invalidation rules are owned by [mutations.md](mutations.md).

## 서버 연결 전후의 책임

- 첫 조회 구현자는 먼저 기존 feature `model/`, `api/{keys,queries}`, `fixtures/`의 동일 데이터 owner를 찾고 확장한다. 없으면 요청과 직접 연결된 조회·수정의 원문에서 소비 필드를 확인해 그 위치에 만든다. 코디네이터가 제품 값을 대신 채우지 않는다.
- 같은 key는 같은 raw 응답 타입·query options·응답 공급 함수를 공유한다. 표시·입력 schema/defaults/mapper는 각 workflow에 둔다. 다른 실제 응답 계약은 다른 key이며 화면 이름만으로 캐시를 나누지 않는다.
- raw 타입은 내부 필드 철자·enum 선언·date/instant 구분·값 유무·ID·이력/비표시 소비 필드를 포함한다. 제품 필수 검증과 응답 필드 존재는 별개다. 값의 제품 근거와 실제 wire 미확인은 선언 옆에 연결한다.
- fixture는 한 ID의 원본에서 query별 응답을 파생하고 선언 타입으로 확인한다. 화면 projection을 raw cache에 쓰거나 화면마다 같은 key의 queryFn·fixture를 만들지 않는다. 실 계약이 있으면 HTTP mock은 generated 호출 아래를 대체하고 없으면 임시 응답 함수도 Query로 소비한다.
- 동일 feature를 나눈 작업은 이 owner가 들어간 같은 revision을 이어받는다. 독립 baseline 결과는 그대로 합치지 않고 한 owner에 조립한다. 새 registry·계약 manifest·generic 조회 controller는 만들지 않는다.
- 목록은 `useListQuery`, 필수 단건은 `useDetailQuery`의 실제 상태를 쓴다. 옵션 query는 수명·선행 조건·key가 다르면 독립이며 옵션 투영은 해당 소비 hook이 소유한다. 고정 배열은 함수·상수로 충분하다.
- fixture 필터·정렬·slice·total은 응답 공급 책임, 검색 매핑·gate·화면 projection은 feature 책임이다. mock 선택은 개발/테스트 공급 경계에 두고 Screen·workflow를 둘로 나누지 않는다. mutation 이후 cache·Form·선택은 업무가 소유하며 범용 mutation wrapper를 만들지 않는다.
- 실제 공유 QueryClient에서 같은 ID를 조회→수정과 수정→조회 순서로 warm하여 모든 소비 필드·enum·날짜·이력이 유지되고 mapper/schema가 수용하는지 검증한다. route loader도 같은 options를 쓴다. 선언 개수·파일 존재는 이 결과를 증명하지 않는다.
