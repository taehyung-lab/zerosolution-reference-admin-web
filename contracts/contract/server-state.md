# 계약 — 서버 상태 (조회와 쓰기)

**답하는 질문**: 무엇을 어떤 키로 조회하고, 쓰기가 성공하면 무엇이 낡으며, 서버가 아직 없을 때
어디까지 가는가.

**담지 않는 것**: 요청·응답의 모양과 실패 어휘 — `contracts/contract/api-wire.md` 다.
화면이 그 결과를 어떻게 그리는가 — `contracts/direct/list.md`·`detail.md`·`form.md` 다.

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
The current test handlers and their supported scope live in [src/api/mocks/README.md](../../src/api/mocks/README.md).
When the server contract changes, update generated code, feature mappings and mock responses together.
Keep useful mocks for tests after live integration. An example response does not establish business state transitions.
- Export reusable `queryOptions` so loaders and hooks use one key and raw cache definition. API-only hooks may live in `features/{domain}/api`: they bind locale/explicit inputs to a query and return data, query facts or stable option projections. URL/search gates, selection and form dependencies remain in the screen `model/`; a mutation declares its cache consequence in `meta.invalidates` ([`api-wire.md`](api-wire.md)). Placement examples and the decision table are owned by [`source-structure.md`](source-structure.md).
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

Route loaders and screens use the same exported query options. Router trigger and waiting rules are owned by [router.md](../direct/route-composition.md). Components never call generated operations, assemble raw keys, or copy server data into local state.

Mutation and invalidation rules are owned by [mutations.md](api-wire.md).

## 서버 연결 전후의 책임

- 첫 조회 구현자는 먼저 기존 feature `model/`, `api/{keys,queries}`, `fixtures/`의 동일 데이터 owner를 찾고 확장한다. 없으면 요청과 직접 연결된 조회·수정의 원문에서 소비 필드를 확인해 그 위치에 만든다. 코디네이터가 제품 값을 대신 채우지 않는다.
- 같은 key는 같은 raw 응답 타입·query options·응답 공급 함수를 공유한다. 표시·입력 schema/defaults/mapper는 각 workflow에 둔다. 다른 실제 응답 계약은 다른 key이며 화면 이름만으로 캐시를 나누지 않는다.
- raw 타입은 내부 필드 철자·enum 선언·date/instant 구분·값 유무·ID·이력/비표시 소비 필드를 포함한다. 제품 필수 검증과 응답 필드 존재는 별개다. 값의 제품 근거와 실제 wire 미확인은 선언 옆에 연결한다.
- fixture는 한 ID의 원본에서 query별 응답을 파생하고 선언 타입으로 확인한다. 화면 projection을 raw cache에 쓰거나 화면마다 같은 key의 queryFn·fixture를 만들지 않는다. 실 계약이 있으면 HTTP mock은 generated 호출 아래를 대체하고 없으면 임시 응답 함수도 Query로 소비한다.
- 동일 feature를 나눈 작업은 이 owner가 들어간 같은 revision을 이어받는다. 독립 baseline 결과는 그대로 합치지 않고 한 owner에 조립한다. 새 registry·계약 manifest·generic 조회 controller는 만들지 않는다.
- 목록은 `useListQuery`, 필수 단건은 `useDetailQuery`의 실제 상태를 쓴다. 옵션 query는 수명·선행 조건·key가 다르면 독립이며 옵션 투영은 해당 소비 hook이 소유한다. 고정 배열은 함수·상수로 충분하다.
- fixture 필터·정렬·slice·total은 응답 공급 책임, 검색 매핑·gate·화면 projection은 feature 책임이다. mock 선택은 개발/테스트 공급 경계에 두고 Screen·workflow를 둘로 나누지 않는다. mutation 이후 cache 는 `meta.invalidates`, Form 기준선·선택 해제는 업무가 소유하며 범용 mutation wrapper 를 만들지 않는다.
- 실제 공유 QueryClient에서 같은 ID를 조회→수정과 수정→조회 순서로 warm하여 모든 소비 필드·enum·날짜·이력이 유지되고 mapper/schema가 수용하는지 검증한다. route loader도 같은 options를 쓴다. 선언 개수·파일 존재는 이 결과를 증명하지 않는다.

Read this file only for mutation payloads, invalidation, exact cache updates, optimistic behavior, retry, field-error handoff, or a write whose server contract does not exist yet.

## Declaration

`features/{domain}/api/mutations.ts` exports one `mutationOptions` factory per write. The factory takes `locale` only; everything the request needs — the target id, the settings, the selected ids — travels in the mutation **input**, so one factory serves every screen that performs that write.

```ts
export function update{Entity}Mutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: ({ id, settings }: { id: string; settings: {Entity}Settings }) => …,
    meta: { invalidates: [{entity}QueryKeys.{entity}s(locale)] },
  })
}
```

- The screen runs it with `useMutation(update{Entity}Mutation(locale))` and calls `mutateAsync(input)` from `useSaveForm.save.run`, `useConfirmation.run`, or an action form. No workflow mutation hook sits between the screen and the factory.
- Request mapping (`to{Entity}Settings(values)`) stays beside the form/model that produced the values.
- `retry: false` is the client default for mutations; do not retry automatically.
- Generated operations may be called only from `features/*/api` and `src/api` (ESLint).

## Cache consequence

The mutation declares what its success makes stale in `meta.invalidates: QueryKey[]`; the app `MutationCache.onSuccess` invalidates those keys. A screen never wires `onSuccess` invalidation by hand, so a forgotten invalidation cannot leave a list showing a record the user just changed.

- Enumerate the affected families. A domain records prefix (list + detail, not options) is the usual key; a root key is allowed only when it is the confirmed aggregate family and narrower membership is unknowable. Record the reason on the key factory.
- Prefer invalidation over an exact cache write. An exact update or optimistic write requires a material UX benefit, a rollback test, and the real server response shape.
- The calling screen owns navigation, dialog closure, acknowledgement copy, and focus after success ([form](../direct/form.md#저장-lifecycle), [detail Actions](../direct/detail.md#actions), [list Selection and actions](../direct/list.md#selection-and-actions)).
- Field errors are normalized by transport into `ApiError.fieldErrors` and classified for the form by `classifyFormError`; transport does not know the form.

## 시나리오 요청

서버 계약이 아직 없는 쓰기는 `mutationFn: scenarioRequest<TInput>('업무 이름')`(`src/api/scenario.ts`)이다. 이 함수는 `[시나리오] <업무 이름>: 요청 입력 확인 → API 연결 대기` 한 줄을 `console.log` 하고 resolve 한다. 그래서 화면은 실서버와 **같은 성공 경로**를 끝까지 돈다 — 저장 완료 alert, `meta.invalidates` 무효화, `onDone` 이동. API 가 생기면 그 factory 의 `mutationFn` 본문만 교체하고 화면·확인 흐름·테스트는 바뀌지 않는다.

- 업무 이름은 한글 고정 문자열이다. 대상 ID·입력 객체·비밀번호·연락처·사유를 로그에 싣지 않는다. 종류가 여러 개인 액션 mutation 은 종류 → 이름 map 하나를 두고 `scenarioRequest(labels[input.type])(input)` 로 부른다.
- 폼·선택·확인을 통과한 입력만 이 함수에 닿는다. 검증 실패·미선택·확인 취소에서는 로그가 없고, 최종 확인에서 한 번 기록된다. 중간 전달 함수나 공용 Confirm 에 중복 로그를 두지 않는다.
- callback 생략·빈 함수·`reject` 로 미연결을 표현하지 않는다. 조회 전용 surface 처럼 액션이 없는 경우와는 타입으로 구분한다.
- 테스트는 `vi.spyOn(console, 'log')` 로 그 한 줄을 단언하고 입력 값이 로그에 없음을 함께 단언한다.

### 시나리오 상태와 관찰 범위

상태 어휘와 정의는 [도달 상태](../../AGENTS.md#도달-상태)가 소유한다. 여기는 각 상태를 주장하려면 어디까지 관찰해야 하는가만 적는다.

- **시나리오 확정됨** — 검색은 조건 조립·URL 커밋·요청 전 검증까지, 저장은 폼 검증·확인 alert·검증된 업무 입력 조립과 요청 함수 호출까지. 상세는 그 화면의 모든 최종 액션(행 액션, 다이얼로그 열기/선택/반환, 탭 이동, 인라인 저장, 선택 삭제)을 빠짐없이 포함한다.
- **시나리오 구현 완료** — 미연결 액션을 브라우저에서 최종 확인까지 눌러 요청 함수의 `console.log` 한 줄과 그 뒤 전이(완료 alert·이동)를 관찰한다. 검색·이동·다이얼로그 선택 같은 내부 전이는 실제 URL 과 화면 상태로 확인한다. 목록·상세 fixture 응답의 성공은 등록·수정의 성공 증거가 아니다.
- 실서버 이후 동작(권한·enum 의미·실패 코드)은 별도 미확인으로 남긴다. 신규 API 연결 시 `mutationFn` 을 교체하고 이관 sentinel 을 해소한다.

Read [query-cache.md](api-wire.md) only when defining or changing key families or query identity; consuming an already exported key does not require the whole query reference.

## Locale and cache identity

Read this file only when responses may vary by UI locale, `Accept-Language` changes, or locale changes can reuse stale cache. ADR 0005 owns the current conservative decision.

- The transport sends the confirmed UI locale through `Accept-Language`.
- Decide which response families are localized from the server contract, not translated UI labels.
- Encode locale policy once in query-option/key construction so language changes cannot reuse stale localized data.
- While localized response families remain unconfirmed, use `localizedQueryKey(uiLocale, ...segments)` for every API-backed key, rooted at `['api', uiLocale, ...segments]`.
- Narrow the conservative policy only when ADR 0005's disposal condition is met; do not make each feature decide independently.

## 이 계약의 검증 대상

| 축 | 무엇을 확인하나 |
| --- | --- |
| 키 | 같은 입력이 같은 키를 만들고 다른 입력이 다른 키를 만드는가 |
| enabled | 조회가 도는 조건과 돌지 않는 조건 |
| 무효화 | 쓰기 성공 뒤 실제로 낡은 목록·상세가 다시 그려지는가 |
| 미연결 | 이름 붙은 요청 함수까지 도달했는가(그 너머는 미확인) |
