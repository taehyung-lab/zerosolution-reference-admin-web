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
- Export reusable `queryOptions` so routes and screens share one definition. `features/{domain}/api/**` declares options, keys, and contract types only; it imports no TanStack execution hook (`useQuery`, `useMutation`, `useQueryClient`, … — `no-restricted-imports`, ADR 0011). The hook that runs an option lives beside the workflow that consumes it (`list/use{Domain}ListData`, `detail/use{Domain}Detail`, `form/use{Domain}EditDetail`).
- A required single-record query (detail, edit load) runs through `useDetailQuery(options)` from `src/api/required-query.ts`; it owns the `ready | error | notFound` decision and the incident/not-found/cached-data priority so screens never re-derive them. List queries keep their own facts.
- Query progress is explicit: screen-entry primary requests spread `blockingProgress`, mounted content transitions spread `contentProgress`, and option/lookup `queryOptions` spread `inlineProgress` (all from `src/api/query-meta.ts`). AppShell does not infer blocking from a missing meta value. Option queries usually use `staleTime: Infinity`; `Register.queryMeta` is typed centrally and features do not add ad-hoc meta keys.
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

- 목록·상세의 feature 훅은 query options를 실행하고 화면 모델로 변환한다. 목록은 `useListQuery`, 필수 단건은 `useDetailQuery`의 상태 판정을 재사용한다. 화면에서 `isPending: false`·`isError: false`·빈 retry로 Query 사실을 대신 만들지 않는다.
- 계약이 아직 없으면 임시 응답 함수의 반환값도 Query를 통해 소비한다. 해당 함수에 한글로 임시 데이터의 목적과 계약 확인 후 교체 지점을 적고, endpoint·DTO·enum을 확정 계약으로 표현하지 않는다. 계약이 있는 호출의 HTTP mock은 위 Testing without a server 경계를 따른다.
- 서버 페이지 목록을 흉내 내는 fixture 필터링·정렬·slice·전체 건수 계산은 mock 책임이다. 실제 API 연결 후 남을 feature 책임은 검색 입력 매핑·검색 게이트·응답 projection이다. 서버 흉내의 중복을 제품용 공용 조회 프레임워크로 승격하지 않는다.
- 필터 옵션은 목록 행과 수명·캐시 키·선행 조건이 다르면 독립 query로 둔다. query 실행과 옵션 변환을 맡는 훅은 유효하지만, 고정 배열을 반환하는 것뿐이면 함수나 상수로 충분하다.
- 생성된 mutation options는 feature workflow에서 직접 실행한다. 목록·상세의 공용 상태 판정과 모양을 맞추기 위해 범용 mutation wrapper를 추가하지 않는다. 응답 후 cache·폼·선택 상태 처리는 해당 업무가 소유한다.
- mock 선택은 테스트/개발 진입점의 응답 공급 경계에서 처리한다. 새 화면에 reference env로 Screen·검색 모델·업무 흐름을 둘로 나누지 않는다. 기존 분기를 제거할 때는 양쪽의 제품 필드·액션·검색 계약 차이를 먼저 대조한다.

이 기준은 신규 구현과 전환의 목표다. 현재 members/managers의 적용 여부와 남은 차이는
[분석 원장 §5](../../../../docs/reference/zero-sol-figma-analysis.md#5-미확인--답이-구현을-바꾸는-질문)에 기록한다.
