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
Select/header set equality and single active `aria-sort` are feature tests.
See [State and URL lifecycle](#state-and-url-lifecycle) and [data-table.md](../../shared-ui-contract/references/data-table.md).

## State and URL lifecycle

| State                                                  | Owner                                      |
| ------------------------------------------------------ | ------------------------------------------ |
| fetched data and cache                                 | TanStack Query                             |
| committed filter, sort, page, page size, shareable tab | validated route search                     |
| uncommitted filter or option-search input              | nearest local draft                        |
| row selection                                          | list screen or feature-local table adapter |
| transient interaction                                  | nearest feature component                  |

The feature owns entry/reset policy, and the source sentence decides which one applies: a scenario titled that the list can be viewed loads on entry, while one stating that an entry shows search guidance waits for the search action (2026-09-10 user decision). Read that sentence before choosing; do not infer the gate from whether a frame for the pre-search state was drawn. Explicit-search member/manager lists (including the rehearsal consumer) keep `{}` idle and commit `searched: true` plus non-default conditions on submit. Canonicalization validates only that screen's owned fields, normalizes date ranges, and detects valid conditions before omitting defaults. A valid condition (including page/sort) starts a direct-link search even without the marker. Only literal `true` is a marker; `false` or invalid marker values are removed, never a veto over valid conditions. Invalid-only or hidden-only input returns to `{}`. Removing the sole marker returns to idle. Immediate member lists ignore the marker and pass `searched: true` to Query even for `{}`. The marker is URL metadata, excluded from field defaults/partition, request input and query keys. Committed search inside a dialog (kind E in [table-composition.md](table-composition.md)) stays with its host, not the URL.

If confirmed policy requires immediate entry loading but reset to an idle result (performance list), empty filters cannot distinguish those states. That feature may use a single sparse URL discriminator (`searched: false` only after reset, removed on submit). Query enablement and result presentation derive from that same value; do not duplicate it in local state or send it as a server parameter.

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
Do not build a factory around schema, navigation or header-sort transitions: member, manager and
performance consumers have different direction defaults and reset/search policies.
