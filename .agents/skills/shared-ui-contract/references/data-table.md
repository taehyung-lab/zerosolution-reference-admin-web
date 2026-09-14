# DataTable

Read this file only for the shared `DataTable` public contract, rendering, headers, rows, stable identity, or table accessibility. Whether a given collection should consume `DataTable` at all is decided by [feature-contract table-composition](../../feature-contract/references/table-composition.md).

## Selection column

`selectionColumn({ selection, pageLabel, rowLabel, isSelectable? })` builds only the header/row checkboxes.
It consumes `PageRowSelection`; labels and eligibility come from the feature. It adds no state or DataTable prop.
Lists with row selection share this rendering; columns and sort/URL policy remain with their callers.

## Public contract

- Input: `rows`, TanStack `ColumnDef` columns, and a stable `getRowId`. A column may declare `meta.sort` (`direction?: 'ascending' | 'descending'`, `onSort: () => void`) to make its header a controlled sort trigger. Nothing else is accepted.
- Output: native table semantics through the `Table` primitives. For a column with `meta.sort`, DataTable renders the header content inside one `<button>` and calls `onSort` on activation. When `direction` is set, it sets `<th aria-sort>` and draws the direction glyph (▲▼ pair with the active arrow emphasized) from that same value; when `direction` is undefined, the header is still a button but has no `aria-sort` and no glyph. Sortable header content must be non-interactive because it sits inside that button.
- One `aria-sort` per table: WAI-ARIA 1.2 applies `aria-sort` to only one header at a time and the APG sortable-table example sets it only on the currently sorted column, so the caller sets `direction` on exactly the active column and leaves it undefined elsewhere. The ARIA value `none` is not modeled as a direction.
- It owns no sort policy: which columns are sortable, the current direction, what activation changes (field, direction, page), server enum, and URL transition stay with the caller. `direction` uses only the standard `aria-sort` vocabulary; lists derive it with `headerSortDirection` (`src/shared/lib/list-sort.ts`) from the resolved URL sort, whose direction is never undefined ([list-workflow Sorting](../../feature-contract/references/list-workflow.md#sorting)).
- Not covered: row selection, editable cells, row expansion, pagination, sorting policy, server enum, Router, Query, permission, and empty or error copy. Those stay in the feature or in separate shared surfaces.
- It does not expose a Table instance or create a resource or list controller.

`meta.sort` is provisional shared from the first consumer because `aria-sort`, the button name, and the glyph form one accessibility invariant repeated on every sorted table in the inventory (ADR 0009). Confirm or narrow it at the second list. Do not add a prop, mode, or callback so that one collection fits; compose the `Table` primitives feature-locally instead. Widening or narrowing this contract follows [promotion.md](promotion.md) with a second real consumer.

Read [react-performance.md](react-performance.md) only for Table subscriptions, compiler identity, memoization, or virtualization. Test stable IDs, header semantics, accessible sort state, `onSort` activation, and controlled inputs actually changed.
