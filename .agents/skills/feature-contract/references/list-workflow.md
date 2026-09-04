# List workflow

Read this file for list filters, canonical URL search, Query gating, result state, table, sorting, pagination, or row selection. Detail and bulk actions have separate references; a collection hosted outside a list result is classified in [table-composition.md](table-composition.md), which applies this file to kind C child lists.

## Confirm the feature contract

Identify the endpoint and option sources, canonical URL fields, defaults, request mapper, query key, result states, permission/action policy, and validation command. Design evidence may determine visible structure and copy, but it cannot define enum meaning, payload, permission, Query gating, or failure policy. Stop the affected workflow when product or server facts are missing.

The feature owns fields, enum meaning, option source, defaults, labels, columns, Query/payload identity, permissions, actions, and navigation. Shared code owns only admitted domain-neutral mechanics.

A consuming screen names which existing mechanics it adopts and keeps its search gate, URL discriminator, option values, result copy, selection, actions, and request mapping in the feature. Do not turn an issue's missing adoption of these contracts into a new list controller or workflow abstraction.

## Composition index

Select only the surfaces the current list uses. A surface nested inside a cell, toolbar, or dialog is selected the same way through its own reference.

| Surface            | Shared mechanic                                                                                | Feature owns                                                                                                                                                                                                                                                                                                                                                                           | Read next only when changing it                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filter frame       | `FilterPanel`, `FilterField`, `PeriodFilterField`, `KeywordFilterField`                        | fields, rules, submit/reset, Query gate, criterion/target enums and labels                                                                                                                                                                                                                                                                                                             | [filter-fields.md](../../shared-ui-contract/references/filter-fields.md); lower control references only when changing them                                    |
| Multi-select group | `CheckboxTree` (flat or nested nodes, leaf values, `emptyMeansAll`)                            | enum values, labels, option source, default, whether empty means all                                                                                                                                                                                                                                                                                                                   | [checkbox-group.md](../../shared-ui-contract/references/checkbox-group.md)                                                                                    |
| Draft commit       | `useDraftCommit`                                                                               | identity (which fields are filter vs view), draft factory, navigation, page reset                                                                                                                                                                                                                                                                                                      | [shared-values.md](../../shared-ui-contract/references/shared-values.md) for the algebra, [router.md](router.md) for the URL transition                       |
| Result state       | `ListResult` + `ListResultData<TRow>`                                                          | plain result facts, two domain messages                                                                                                                                                                                                                                                                                                                                                | this file                                                                                                                                                     |
| Toolbar/summary    | `ResultToolbar`, `ResultSummary`                                                               | metrics, controls, actions, permission                                                                                                                                                                                                                                                                                                                                                 | this file                                                                                                                                                     |
| Table              | `DataTable` or feature-local `Table` primitives                                                | rows, columns, stable ID, sort mapping, actions                                                                                                                                                                                                                                                                                                                                        | [table-composition.md](table-composition.md) for the fit decision; [data-table.md](../../shared-ui-contract/references/data-table.md) for the shared contract |
| Pagination         | `Pagination`, `PageSizeControl`                                                                | page math, URL transition, defaults, recovery                                                                                                                                                                                                                                                                                                                                          | this file                                                                                                                                                     |
| Sorting            | `SortControl` (field select only), `DataTable` `meta.sort` (header button, `aria-sort`, glyph) | one typed source for the exposed sort set that derives select options, URL enum, and each `meta.sort`; server enum, direction policy, URL transition. The sort-state mapping gives `direction` to exactly the active sort key and leaves every other sortable header undefined (one `aria-sort` per table). Select/header set equality and single active `aria-sort` are feature tests | this file; [data-table.md](../../shared-ui-contract/references/data-table.md)                                                                                 |

## State and URL lifecycle

| State                                                  | Owner                                      |
| ------------------------------------------------------ | ------------------------------------------ |
| fetched data and cache                                 | TanStack Query                             |
| committed filter, sort, page, page size, shareable tab | validated route search                     |
| uncommitted filter or option-search input              | nearest local draft                        |
| row selection                                          | list screen or feature-local table adapter |
| transient interaction                                  | nearest feature component                  |

For a confirmed explicit-search list, model committed search as `{}` before search and the declared discriminator plus non-default values after search. Do not add a duplicate `searched` marker or a shared helper that derives it; the discriminator differs per screen. A list without a search gate passes `searched: true` so the policy is visible in code. A feature-owned resolver applies UI/request defaults without injecting them into the URL. Committed search inside a dialog (kind E in [table-composition.md](table-composition.md)) is owned by the dialog host, not the URL; the same shared mechanics apply because none of them read the Router.

```text
route search -> field validation -> canonical sparse search
                                      -> resolved defaults
                                      -> UI + request params + query key
local draft --Apply/Enter/declared debounce--> one route-search update
```

- Invalid optional fields recover without erasing unrelated valid fields. Canonical redirects use history `replace`.
- Use the configured Router serializer. Multi-values are arrays; omit empty arrays. Do not invent CSV, JSON strings, `all`, or applied markers.
- Apply changes committed values and resets `page` in the same navigation. Sort and page-size changes use the declared reset policy.
- Back/forward restores committed URL state. Draft state is preserved only while its caller-defined committed identity is equal.
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
