# List, detail, and bulk

Read this file for route search, list, filter, search, table, detail, loading, selection, or bulk work.

## State ownership

| State                                                 | Owner                                      |
| ----------------------------------------------------- | ------------------------------------------ |
| fetched data and cache                                | TanStack Query                             |
| shareable filter, sort, page, page size, tab          | validated route search                     |
| uncommitted list or option-search input               | local draft                                |
| row selection                                         | list screen or feature-local table adapter |
| transient dialog and hover state                      | nearest feature component                  |
| deep-linkable, shareable, or back-button-aware dialog | route path/search                          |

Do not copy server data or committed search values into another store. A list-search draft exists only until Apply, Enter, or the declared debounce commits it to the URL. An option-search draft remains local and only changes the options Query. Applying filters or changing page size resets the page in the same route-search update. For multi-value codec, required-filter gates, selected-label identity, and `notSearched`, read [screen-anatomy.md](screen-anatomy.md) and [field-and-select.md](../../shared-ui-contract/references/field-and-select.md).

## Screen ownership

The feature screen owns use-case composition. When it contains independent workflows that can change or be tested separately, move each workflow to a feature component; do not move them together into a controller hook. Split only a cohesive state/behavior into a hook; do not create `useXxxPage` as a bag of callbacks. Route validation, guards, loaders, and preload are owned by [router.md](router.md).

## Table and detail

- Compose the domain-neutral `DataTable` and `Pagination` explicitly. They are separate patterns because table rendering and server page navigation have different owners and change reasons.
- `DataTable` receives rows, feature-owned columns, a stable `getRowId`, and controlled sort/selection callbacks. Stable means the same server identity survives refetch, sorting, filtering, and page changes; an array index is not an ID. It must not receive a Query response, route object, pagination policy, or feature controller.
- TanStack Table is controlled by canonical route state for server sorting and pagination.
- Column definitions and status cells stay feature-local.
- Row selection uses stable IDs and resets when the canonical list identity changes.
- Initial load uses an area skeleton; background refetch preserves current content and exposes a light fetching state.
- `notSearched`, empty, error, and loading are distinct states.
- Detail data has an ID-based key. Do not treat a partial list row as the authoritative detail response.

The shared `DataTable` creates the TanStack Table v9 instance once. Do not expose the instance to feature screens or add project wrappers such as `useListTable`, `usePagedTable`, or `useResourceTable`; use v9's official API inside the pattern and subscribe only where rendered table state is read. The shared pattern owns the chosen `features`/`TFeatures` infrastructure contract. For a stable app-level feature set or official `createTableHook` binding, follow [react-performance.md](../../shared-ui-contract/references/react-performance.md); feature code still owns columns and controlled values.

## Bulk

Send stable IDs, not row objects. Prefer one server bulk operation. Report row-level partial success only when the response contract provides row-level results; otherwise preserve its binary semantics. Selection resets only after the declared success policy.

Do not invent cross-page selection, optimistic bulk updates, resumable uploads, polling, or client-side batch loops when the server contract does not require them.
