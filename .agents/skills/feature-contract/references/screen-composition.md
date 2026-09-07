# Screen composition

Read this file for a new ordinary screen skeleton or app-shell/navigation metadata. List, detail, form, and specialized workflows have their own references.

## Explicit composition

Routes and feature screens compose visible parts explicitly. Repeated JSX is acceptable; do not replace it with `ResourcePage`, a page-controller hook, or a universal config/screen descriptor. A shared pattern owns layout and interaction mechanics only. Fields, columns, copy, permissions, queries, mutations, and workflow decisions stay in the feature.

Member record lists reuse `MemberRecordResult` for their identical toolbar/count/table/pagination assembly;
columns, sort options, search gating and row actions remain explicit caller inputs. This feature-owned
composition has no resource mode, query, endpoint or schema descriptor.

Within one feature, screens with the same workflow may share an explicit screen and a small typed definition for actual field/column differences (active members). If state transitions, selection, actions or query gates differ, keep separate screen/filter/result assembly and reuse the repeated mechanics. Props alone are not a reason to combine hooks; a pure feature-local transition is enough when only the sort/page update repeats.

Inspect only the confirmed product screens and adjacent workflows needed to identify the current screen and genuine shared candidates. Choose one representative workflow; do not implement a catalog. Figma repetition is evidence only when semantics, state transitions, and failure behavior match. Promotion decisions use `shared-ui-contract` and ADR 0009.

- The route mounts one feature screen or an explicit composition of independently owned screens.
- The feature composes only the visible surfaces its selected workflow reference requires.
- Cross-domain navigation and permission-evaluator metadata lives in `app/config`, not `shared` or another feature.

## Feature-internal decomposition

Apply the same ownership test to every sibling workflow, not only the first representative screen. Being feature-local does not justify keeping independent filter, result, action, and data workflows in one Screen file.

- A Screen is the composition entry: it connects named surfaces and their owners. When a list contains filter draft/commit, result selection/paging, and action confirmation workflows, separate those responsibilities into feature-local Filters, Result, and Actions components and focused state/data hooks. Keep the Screen readable as their wiring.
- Columns belong beside the result surface; move a substantial column definition out of the Screen. Pure render-local formatting stays with its renderer. Extract hooks for state or workflow ownership, not to wrap every calculation.
- `Screen → Filters / Result / Actions` with `useData / useResult / useActions` and columns is a responsibility map, not a mandatory seven-file template. Omit absent responsibilities. File length is a review signal, not a pass/fail threshold; a small read-only surface does not need empty adapters.
- Detail screens follow their actual sections, forms, and dialogs rather than the list template. Split independently validated forms and action lifecycles while preserving one owner for each draft.
- Keep action/dialog owners mounted across searched/loading/empty result branches. Only their triggers or result content follow those branches; moving the owner to a route is not the remedy. Cross-feature wiring follows [router.md](router.md).

## Placement and naming

For a workflow whose components, query execution and state rules already need separate owners, use:

```text
features/{domain}/
  api/                     # queryOptions, mutationOptions, keys, server contracts; no hooks
  model/                   # domain values/mappers reused across workflows
  list/
    DomainListScreen.tsx    # composition entry; screen integration tests stay here
    ui/                    # Filters, Result, Actions, columns and their rendering tests
    model/                 # data/filter/result/action hooks, search schema, policies, requests
  detail/                  # organize by its actual sections; not the list template
  form/
```

This is workflow-first placement, inspired by FSD segments; it does not introduce FSD layers or a
`pages` directory. `api/` declares calls; `list/model/use…Data` executes them and projects the result.
A result hook may assemble feature-owned column builders from `ui/`; folder names alone are not
an enforced one-way dependency graph. Keep option/state contracts in `model/`, not exported from a
Filters component merely for a hook to import. Domain `model/` and workflow `list/model/` have different scopes.

Use `ui/` and `model/` for the member, manager and performance list consumers. Do not create empty
segments for a small workflow. Co-locate tests with their owner and update routes, imports, test mocks,
seed paths and linked references when moving files. A sibling workflow must not reach into `list/model/`
for genuinely shared domain logic; move that logic to its nearest feature owner when changing it.

Before authoring a screen, check its current folder and this placement section along with its context
inventory. Unmigrated detail/form/record workflows are not proof that the list convention was abandoned.

Place a screen's implementation in its business/workflow directory. Names and paths identify the consumer scope: a single workflow's `list/` is not a catch-all for helpers used by sibling workflows. Put genuinely reused feature code in a purpose-named sibling directory at their nearest common owner, and leave single-consumer code with its consumer. A `common/` dumping ground or a `shared` promotion does not resolve unclear ownership; domain code remains feature-owned.

Use product responsibility names for production screens and hooks. Example data belongs in explicit `fixtures/`; a reference/demo label does not justify moving domain workflows into `app/`. New directories or abstractions must reduce actual ownership ambiguity, not anticipate hypothetical consumers.

When comparing an existing screen with this contract, distinguish implemented ownership from pending decomposition. Tests passing or a representative screen adopting the pattern does not establish adoption by its siblings.

## 기존 화면을 확장할 때의 대조

새 화면을 조립하기 전에 같은 업무군의 route·Screen·data/filter/result/actions와 내부 팝업의 실제 호출부를 비교한다.
각 책임을 `유지 / 연결부 교체 / mock으로 이동 / 계약 확인 필요`로 구분하고, 기존 공용 계약의 채택과 남길 화면별 차이를 설명한다.
주석은 한글로 역할·상태 소유자·임시 데이터와 교체 조건을 설명하되 코드 자체를 줄마다 반복하지 않는다.
Screen의 props는 조회/URL/업무 연결과 표시 책임을 분리하는 경계다. 테스트를 위해서만 불필요한 전달 계층을 만들지 않는다.

조회·옵션·mock 책임은 [query-cache.md](../../api-contract/references/query-cache.md#서버-연결-전후의-책임),
공용 승격은 [logic-promotion.md](../../shared-ui-contract/references/logic-promotion.md#실제-api에서도-남는-중복인가),
등록·수정·메시지 등 최종 callback의 완료 증거는 [mutation-actions.md](mutation-actions.md#api-연결-전-시나리오-요청)를 따른다.
대표 화면 하나의 적용을 다른 route와 팝업의 적용 완료로 간주하지 않는다.

## Never

- Shared screen shells or schema/config-driven universal pages
- Feature-to-feature imports for permission or navigation catalogs
- Screen-specific copy, permissions, Query, or mutations inside shared UI
