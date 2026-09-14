# List workflow

Use the applicable sections for list filters, canonical URL search, Query gating, result state, table, sorting, pagination, or row selection. Detail and bulk actions have separate references; a collection hosted outside a list result is classified in [table-composition.md](table-composition.md), which applies this file to kind C child lists.

For search field declarations, defaults, period input, or variants, read the applicable sections of [list-search-contract.md](list-search-contract.md).

## Confirm the feature contract

Identify the endpoint and option sources, canonical URL fields, defaults, request mapper, query key, result states, permission/action policy, and validation command. Design evidence may determine visible structure and copy, but it cannot define enum meaning, payload, permission, Query gating, or failure policy. Stop the affected workflow when product or server facts are missing.

The feature owns fields, enum meaning, option source, defaults, labels, columns, Query/payload identity, permissions, actions, and navigation. Shared code owns only admitted domain-neutral mechanics.

A consuming screen names which existing mechanics it adopts and keeps its search gate, URL discriminator, option values, result copy, selection, actions, and request mapping in the feature. Do not turn an issue's missing adoption of these contracts into a new list controller or workflow abstraction.

## Composition index

Feature-internal decomposition and file placement follow [screen-composition.md](screen-composition.md#feature-internal-decomposition); this applies to every list consumer, including fixture-backed workflows.

Select only the surfaces the current list uses. A surface nested inside a cell, toolbar, or dialog is selected the same way through its own reference.

| Surface | Shared mechanic |
| --- | --- |
| Filter frame | `FilterPanel`, `FilterField`, `PeriodFilterField`, `KeywordFilterField` |
| Multi-select group | `CheckboxTree` |
| Draft commit | `useListFilterDraft`, or individual primitives for a different input lifecycle |
| Result state | `ListResult` + `ListResultData<TRow>` |
| Toolbar/summary | `ResultToolbar`, `ResultSummary` |
| Table | `DataTable` or feature-local `Table` primitives |
| Pagination | `Pagination`, `PageSizeControl` |
| Sorting | `SortControl`, `DataTable` `meta.sort` |

### Filter frame

The feature owns fields, rules, submit/reset policy and destinations, Query gate, criterion/target enums and labels.
Read [filter-fields.md](../../shared-ui-contract/references/filter-fields.md); read lower control references only when changing them.

### Multi-select group

`CheckboxTree` supports flat or nested nodes, leaf values, and `emptyMeansAll`.
The feature owns enum values, labels, option source, default, and whether empty means all.
Read [checkbox-group.md](../../shared-ui-contract/references/checkbox-group.md).

### Draft commit

The feature declares identity policy (filter/view partition and any searched/idle scope), local-only defaults, navigation, and page reset. Matched filter/period/keyword lifecycles use `useListFilterDraft` to calculate one identity, create drafts, collect submit input and coordinate draft reset. Keep schema parsing, keyword DTO mapping, `preventDefault`, and the destination passed to `onSearchChange` in the feature.

Apply this comparison to every existing or new filter host, including detail/form/dialog child lists.
Matching means the inputs preserve/rebuild under one committed identity, submit collects them together
and resets only the period, and discard rebuilds all drafts. Different names, enums, defaults, query
gates or reset destinations do not justify copying that lifecycle into another feature hook.
If the input lifecycle differs, record the differing transition and its owner in the task review and
reuse only the matching primitives. An immediate option search or a single-text search without period
and keyword chips needs no dummy state to consume this composition; keep its smallest state owner.
Report adoption through wrappers as well as direct calls; a five-hook count is not a five-screen limit.
Read [shared-values.md](../../shared-ui-contract/references/shared-values.md) for the algebra and [router.md](router.md) for the URL transition.

### Result state and toolbar

For `ListResult`, the feature owns plain result facts and two domain messages; see [Result ownership](#result-ownership).
For `ResultToolbar` and `ResultSummary`, the feature owns metrics, controls, actions, and permission.

### Table

The feature owns rows, columns, stable ID, sort mapping, and actions.
Read [table-composition.md](table-composition.md) for the fit decision and [data-table.md](../../shared-ui-contract/references/data-table.md) for the shared contract.

### Pagination

The feature owns page math, URL transition, defaults, and recovery.
See [State and URL lifecycle](#state-and-url-lifecycle) and [Result ownership](#result-ownership).

### Sorting

`SortControl` is the field select only. `DataTable` `meta.sort` owns the header button, `aria-sort`, and glyph.
The feature owns one typed source for the exposed sort set that derives select options, URL enum, and each `meta.sort`; server enum, direction policy, and URL transition.
The sort-state mapping gives `direction` to exactly the active sort key and leaves every other sortable header undefined (one `aria-sort` per table).
The active column always has a direction, from the first render: the URL contract declares `sortDirection.defaultValue` (`desc` on every product list, 2026-09-11 user decision) and the resolved search never carries `undefined` there; `contracts:check` fails a list `*search*.ts` whose `sortDirection` default is `undefined`. For product lists `headerSortDirection` (`src/shared/lib/list-sort.ts`) is the only mapping from the resolved `{ sortType, sortDirection }` to a header's `aria-sort` value; its `direction` parameter is required so a missing default fails typecheck, and `contracts:check` requires a list `*-columns` file that declares `onSort` to import it and rejects hand-written aria vocabulary there. A list that must speak a different server sort vocabulary maps it in its own `model/*-sort.ts` and is listed in `SORT_MAPPING_EXCEPTIONS` with its closing condition. The rule exists because lists rendered their active column with no arrow before it (2026-09-11 user measurement; which lists is in [이 저장소의 관찰](#이-저장소의-관찰)).
The user decision covers the default direction only. What happens when another column is clicked stays feature policy and differs between lists today — an open difference, not a rule.
Select/header set equality and single active `aria-sort` are feature tests. Each list carries an initial-render `aria-sort` assertion once its default sort column exists among its columns; which lists have one is an observation, not a rule.
See [State and URL lifecycle](#state-and-url-lifecycle) and [data-table.md](../../shared-ui-contract/references/data-table.md).

## State and URL lifecycle

| State                                                  | Owner                                      |
| ------------------------------------------------------ | ------------------------------------------ |
| fetched data and cache                                 | TanStack Query                             |
| committed filter, sort, page, page size, shareable tab | validated route search                     |
| uncommitted filter or option-search input              | nearest local draft                        |
| row selection                                          | list screen or feature-local table adapter |
| transient interaction                                  | nearest feature component                  |

The feature owns entry/reset policy, and the source sentence decides which one applies: a scenario titled that the list can be viewed loads on entry, while one stating that an entry shows search guidance waits for the search action (2026-09-10 user decision). Read that sentence before choosing; do not infer the gate from whether a frame for the pre-search state was drawn. Explicit-search lists keep `{}` idle and commit `searched: true` plus non-default conditions on submit. Canonicalization validates only that screen's owned fields, normalizes date ranges, and detects valid conditions before omitting defaults. A valid condition (including page/sort) starts a direct-link search even without the marker. Only literal `true` is a marker; `false` or invalid marker values are removed, never a veto over valid conditions. Invalid-only or hidden-only input returns to `{}`. Removing the sole marker returns to idle. Immediate-load lists ignore the marker and pass `searched: true` to Query even for `{}`. The marker is URL metadata, excluded from field defaults/partition, request input and query keys. Committed search inside a dialog (kind E in [table-composition.md](table-composition.md)) stays with its host, not the URL.

If confirmed policy requires immediate entry loading but reset to an idle result, empty filters cannot distinguish those states. That feature may use a single sparse URL discriminator (`searched: false` only after reset, removed on submit). Query enablement and result presentation derive from that same value; do not duplicate it in local state or send it as a server parameter.

```text
route search -> field validation -> canonical sparse search
                                      -> resolved defaults
                                      -> UI + request params + query key
local draft --Apply/Enter/declared debounce--> one route-search update
```

- Invalid optional fields recover without erasing unrelated valid fields. Canonical redirects use history `replace`.
- Use the configured Router serializer. Multi-values are arrays; omit empty arrays. Do not invent CSV, JSON strings, or `all` sentinel values.
- Apply changes committed values and resets `page` in the same navigation. Sort and page-size changes use the declared reset policy.
- Back/forward restores committed URL state. Draft state is preserved only while its caller-defined committed identity is equal.
- Draft identity for a workflow with an idle state includes searched/idle as well as resolved filter values. Default search and idle have identical resolved defaults but must rebuild drafts on history transitions. View-only changes still preserve drafts.
- Shared draft hooks own mechanics only; the feature owns field meaning, defaults, navigation, Query gating, and request mapping.
- Period calendar dates use `displayTimeZone()` for both display and local-day interpretation. Convert that
  day to a `REQUEST_TIMEZONE` UTC instant only at the request boundary; do not derive timezone from locale.

## Query and option lifecycle

The route and screen use one exported query-options definition. Query-key identity and actual request params use the same resolved values; drafts and uncommitted values enter neither.

- Valid defaults with no explicit-search policy load immediately.
- A confirmed explicit-search workflow enables from its committed discriminator.
- Confirmed prerequisites enable only when valid and expose a feature-owned disabled reason.
- `notSearched` and Query enablement derive from the same fact, never a second boolean.
- Option queries remain independent when filters need them before the list query. They declare `inlineProgress` and are warmed raw by the route loader. When server records need `{ value, label }` projection, a feature option hook owns `useQuery` plus `select`; the filter consumes its options/state and does not repeat the request or mapping. A searched entry URL with no usable list data uses `blockingProgress`; once mounted, search, sort, filter, page, and page-size requests use `contentProgress` with `keepPreviousData` and never open the overlay. An explicit-search entry without its discriminator calls no list API and shows no overlay.

Do not create an option-query catalog or move server enum meaning into shared UI.

## Result ownership

The feature maps Query state to plain `ListResultData<TRow>` facts: rows, required `searched`, pending/fetching/error facts, structural trace (an `ApiError` satisfies it structurally), and retry. Totals and page count are feature facts consumed by summary and pagination, not by `ListResult`. `ListResult` receives `ListResultData<TRow>` and alone resolves `notSearched → loading → error → empty → ready`; it does not inspect Query. The caller passes only the two domain messages (`notSearched`, `empty`), footer, and ready content. The pattern owns shared loading/error/retry copy, the live regions, and `ErrorTrace`; the app overlay may cover its loading state only during a blocking screen entry.

- The table surface is chosen in [table-composition.md](table-composition.md); the `DataTable` public contract is owned by [data-table.md](../../shared-ui-contract/references/data-table.md). Neither owns Router, Query, pagination, permission, or server sorting policy.
- Pagination receives calculated values and never owns URL state. Do not present an out-of-range page as current.
- Mounted content transitions and background refetch preserve content when available and expose `aria-busy` on the result surface.
- Keep table and pagination separate. A feature-local result component may compose them without becoming shared.

Do not expose a Table instance or add `useListTable`, `usePagedTable`, `ResourcePage`, or a controller/config wrapper.

## Verification

Cover the transitions changed: canonical URL recovery/history, draft rebuild, Query enablement and key/params identity, result-state reachability, page reset, accessible names, stable row IDs, and paging recovery. Browser evidence names the exact screen, state, viewport, visible fields/columns, interaction, and intentional differences.

## Repeated result and search shapes

Result hooks expose present controls as `pageSize: { value, options, onValueChange }`,
`sort: { value, options, onValueChange }`, and `pagination: { page, totalPages, onPageChange }`.
Columns and selection remain feature-owned; absent selection/actions need no dummy fields.
Use `ResultTotal` for a single result count instead of returning identical summaryGroups from each hook.
Do not build a factory around schema, navigation or header-sort transitions: the consumers differ in
direction defaults and reset/search policies.

## 형태

목록 역할이 있으면 이 절이 N4 시작점이다. `context.json`이 이 파일을 다른 heading으로만 인용하면 인덱스가 실패하고, 런타임은 형태 heading을 보강한다. 표의 행은 제품 이름 없이 쓴다. 제품 화면 이름은 표 아래의 날짜 있는 실측 예시(현재 이탈·대표 소비자)에만 나오고, 그 예시는 규칙이 아니라 이 저장소의 관찰이다.

목록 화면 하나가 갖는 파일 집합과 역할이다. 규칙을 다 지켜도 이 집합이 없으면 화면마다 모양이 갈린다
(2026-09-10 드릴 실측: 검색어 URL 모양·해소 위치·정책 파일·loader 가 형제와 갈렸다). 도메인 이름은 빈칸이다.
표는 두 층이다: **불변**(Query·URL·폼 소유와 전이 의미), **역할이 있을 때 파일**. 대표 소비자와 이탈은 [이 저장소의 관찰](#이-저장소의-관찰)에 있다.
없는 책임을 빈 어댑터로 만들지 않는다. `contracts:check` 는 이름 관례를 따른 목록에서 search·filter·data·policy
파일의 이름·위치와 route 의 e2e 합류만 대조하고 없는 파일은 이 절을 가리킨다. 나머지 행은 리뷰가 본다.

| 파일 | 층 | 역할 |
| --- | --- | --- |
| `<domain>/api/*queries.ts` | 불변 | `queryOptions` 팩토리. `locale` 은 `UiLocale`([i18n](../../shared-ui-contract/references/i18n.md)) |
| `model/*search*.ts` | 불변 | URL 필드 선언·기본값·partition·canonical schema·resolver·요청 mapper. 필드 모양은 [list-search-contract 형태](list-search-contract.md#형태) |
| `model/*-policy.ts` | 불변 | URL 전이 순수 함수: 보기·정렬 변경은 첫 페이지, 페이지 이동은 나머지 보존, 헤더 정렬 방향 전이 |
| `model/use*Filter.ts` | 역할 | `useListFilterDraft` 소비, submit(`preventDefault` → 정책 → `onSearchChange`), reset 목적지 |
| `model/use*Data.ts` | 역할 | query options 소비, `ListResultData` 사실과 total·totalPages 파생 |
| `ui/use*Result.ts` | 역할 | 컬럼 + `pageSize`·`sort`·`pagination` 컨트롤(위 반복 모양). 전이는 policy 를 부른다 |
| `ui/*-columns.ts(x)` | 역할 | 컬럼 정의와 `meta.sort` 매핑 — 방향은 `headerSortDirection`([Sorting](#sorting)) |
| `ui/*Screen.tsx`·`*Filters.tsx`·`*Result.tsx`(·`*Actions.tsx`) | 역할 | 조립만. 상태는 위 소유자에. Actions 는 행 액션이 있을 때만 |

- 같은 도메인의 여러 기록 목록이 한 lifecycle 을 공유하면 `model` 넷은 `mechanics/<name>/model` 로 올라가고 화면은 `ui` 만 갖는다. 검사기는 mechanic 안의 이름을 보지 않는다(현재 mechanic 의 이름 차이는 [이 저장소의 관찰](#이-저장소의-관찰)).
- 해소는 화면 경계에서 한 번(`resolve*Search(search)` 를 Screen 이 호출). route 는 sparse search 를 넘긴다.
- 한 이름 아래 형제 컨트롤은 `FilterField group` 하나이고 자식 라벨은 원문의 낱말이다. 부모 이름과 자식 이름을 이어 붙인 합성 라벨을 만들지 않는다.
- fixture 행은 예시임이 드러나는 이름을 쓰고 `TRANSPLANT_PENDING_<ID>` 를 단다.
- route 는 [router 형태](router.md#형태)를 따른다.
- 테스트는 소유자 옆에 최소 셋 — search(복구·partition·mapper), policy(전이), Screen(진입·검색·초기화·정렬) — 이고, route 는 `tests/e2e/search-contract.spec.ts` 경로 배열에 들어간다. 화면별 smoke 는 그것을 대신하지 못한다.

## 이 저장소의 관찰

규칙이 아니라 이 저장소 목록에서 위 형태를 적용한 기록이다. 신규 프로젝트는 이 절을 비우고 자기 목록으로 다시 채운다.

- 기록 목록 mechanic: 회원 기록 목록이 `mechanics/record-list/model` 로 `model` 넷을 올렸다. 현재 파일 이름은 `member-record-data.ts`·`member-record-view.ts` 로 형태 표와 다르다.
- 형태 절의 현재 이탈(2026-09-10 3차 검토 실측): policy 파일은 회원 목록만 갖는다. 공연 목록은 인라인 전이로 `SHAPE_EXCEPTIONS` 에 등록됐고, 제품 운영자 스택(`useManagerDirectoryResult`)도 인라인인데 같은 디렉터리의 리허설 `manager-list-policy.ts` 때문에 검사기가 구분하지 못한다. 둘 다 policy 파일로 분리하는 것이 해소 조건이다.
- 게시판 드릴(2026-09-10)이 이 형태 절의 계기다: 검색어 URL 모양·해소 위치·정책 파일·loader 가 형제 목록과 갈렸다.
- 정렬(2026-09-11): 서버 어휘 `ASC`/`DESC` 를 `model/manager-sort.ts` 로 매핑하는 리허설 운영자 목록이 `SORT_MAPPING_EXCEPTIONS` 의 유일한 항목이다. 규칙 전에는 게시판·공연 목록이 기본값 `undefined` 로 활성 컬럼을 화살표 없이 렌더했다(사용자 실측). 다른 컬럼 클릭 시 게시판·공연·회원 기록 목록은 오름차순으로 시작하고 회원 목록은 현재 방향을 유지한다. 초기 렌더 `aria-sort` 테스트는 회원·리허설 운영자·게시판 목록에 있고, 회원 기록 목록에는 없으며, 공연 목록은 기본 정렬 컬럼(등록일)이 `performance-columns.tsx` 에 없어 아직 통과할 수 없다.
- 진입 정책별 소비자 표는 [list-search-contract 관찰](list-search-contract.md#이-저장소의-관찰)이 소유한다. 즉시 조회지만 초기화 뒤 대기로 가는 `searched: false` 판별자는 공연 목록이 쓴다.
