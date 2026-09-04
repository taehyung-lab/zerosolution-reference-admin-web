# Table and collection composition

Read this file whenever a screen renders rows of items anywhere: a list result, a detail section, a form section with repeating rows, or a search/selection dialog. Classify the collection by who owns its data, then select the hosting workflow and only the shared surfaces whose contract fits. The section a table sits in and the presence of a stable row ID decide nothing by themselves.

## Classify by data owner

Ask in order: where do the rows come from, what changes them, and which state must survive navigation? One screen may host several collections of different kinds; classify each separately.

| Kind | Rows come from | Single state owners | Read next |
| --- | --- | --- | --- |
| A. Parent DTO display | an array inside the parent detail response | Query: the parent ID query only, no second key. Router, Form, selection: none | [detail-workflow.md](detail-workflow.md) |
| B. Independent child query | a child endpoint keyed by the parent ID, without user-driven params | Query: child query options with their own key. Router, Form, selection: none | [query-cache.md](../../api-contract/references/query-cache.md) for the key |
| C. Filtered, sorted, or paged child list | a child list endpoint that takes params | Query: child key from parent ID plus resolved params. Router: committed params only when sharing or restoring them is confirmed, otherwise the nearest hosting component. Form: none. Selection: the hosting component | [list-workflow.md](list-workflow.md) applied to this surface |
| D. Form-owned editable rows | a TanStack Form array field | Form: values, dirty state, and per-row-path errors. Query: option sources only. Router, selection: none | [form-workflow.md](form-workflow.md), then [date-file-fields.md](../../shared-ui-contract/references/date-file-fields.md) for the repeating field |
| E. Server-backed search and selection | a search endpoint driven by local search input, often inside a dialog | Query: search key from the committed search params. Selection: one candidate in the dialog or host until confirm. Form: receives the confirmed value through `setFieldValue` when the target is a form value. Router: none | [query-cache.md](../../api-contract/references/query-cache.md) for the search key, [dialogs.md](../../shared-ui-contract/references/dialogs.md) when a dialog hosts it, and the hosting workflow reference ([form-workflow.md](form-workflow.md) when the confirmed value is a form field). Read [selection-confirmation.md](../../shared-ui-contract/references/selection-confirmation.md) only when the product declares the selection consequential, and [mutation-actions.md](mutation-actions.md) only when the dialog itself runs a mutation |

A top-level list result is kind C without a parent: [list-workflow.md](list-workflow.md) owns its whole lifecycle and this file only decides its rendering surface. Kind A is confirmed by the parent DTO alone. Kinds B, C, and E require the child endpoint, its params, and its failure semantics from the server contract; kind C also needs the product to say whether its state is shared or restored. Stop that surface when those facts are missing instead of guessing a child endpoint or a URL prefix.

## Rules for every kind

- A child failure never rewrites the parent. Kinds B and C keep pending, error, and retry inside their section; the parent `DetailStateBoundary` stays `ready`, and a child not-found is not the parent's `notFound`. First fetch of an observed query is covered by app-wide progress like any other query.
- Kinds C and E follow the list workflow's Query lifecycle for the params they own: key identity and request params use the same resolved values, and drafts enter neither. Its URL lifecycle applies only to kind C params confirmed as shared or restored; unconfirmed kind C params and every kind E param stay in the nearest hosting component and never enter the URL.
- Server rows for kinds A, B, C, and E live only in the Query cache: kind A rows are owned by the parent query response, and kinds B, C, and E rows are owned by their own query response. Do not copy them into component state, Zustand, or a form value. Transient draft search text, a candidate selection, and form arrays are never stored as cached server data or copied into Zustand, and a form array is not mirrored in component state. Committed search params may still identify the query key, as the list workflow and kind E define.
- Empty, not-found, and unavailable copy carries workflow meaning and stays feature-owned.
- Row identity for kinds A, B, C, and E uses a stable identifier confirmed from the server contract; do not assume every DTO carries an `id`, and never use the array index. `DataTable` requires a stable `getRowId`, so a collection whose contract names no stable identifier cannot consume it until the identifier is confirmed. Form rows need a render key that survives insert and remove; the array index alone is not one.
- Columns, cell formatting, row actions, and permission-gated actions stay in the feature for every kind.

## Choose the rendering surface

Decide per collection after classification, in this order:

1. **Fit.** Compare what the surface needs with the shared mechanic's public contract: [data-table.md](../../shared-ui-contract/references/data-table.md) for `DataTable`, [list-result.md](../../shared-ui-contract/references/list-result.md) for `ListResult`, [pagination.md](../../shared-ui-contract/references/pagination.md) for paging controls, [combobox.md](../../shared-ui-contract/references/combobox.md) or [multiselect.md](../../shared-ui-contract/references/multiselect.md) when selection needs no table. Consume unchanged when semantics, interaction lifecycle, failure behavior, and public API all match.
2. **Misfit.** Compose the surface feature-locally from primitives such as `shared/ui/primitives/Table`, `Dialog`, and `Input`. Do not add a prop, mode, or callback to a shared mechanic so that one caller fits.
3. **Change or promotion.** Only when the shared contract itself must change, or a feature-local composition has a second real consumer, follow [promotion.md](../../shared-ui-contract/references/promotion.md). A first consumer does not widen a provisional contract and then call that confirmation.

`DataTable` covers read-only rows, feature columns, a stable `getRowId`, and forwarded `aria-sort`. It does not cover selection, editable cells, row expansion, pagination, sorting policy, or empty and error copy. A display-only DTO array (kind A) may use `DataTable` or the `Table` primitives; the deciding fact is whether the column and `aria-sort` contract is needed, not that the rows live in a detail section. Editable rows (kind D) keep focus and identity in the form, so compose the `Table` primitives unless the `DataTable` contract already covers the interaction. A selection table (kind E) adds candidate state that `DataTable` does not own; hold it in the dialog or host and render rows through whichever surface fits.

Do not build a collection section, embedded table hook, or selection dialog that accepts an endpoint, resource name, or mode to cover several kinds at once. Each kind is an explicit feature composition.

## Verification

Cover the owner transitions actually changed: child error isolation from the parent state (B, C), key and params identity and page reset on the child surface (C), row add and remove with per-row errors and dirty state (D), candidate commit and cancel (E) plus close policy while a mutation is pending only when the dialog runs one, and stable row identity for every kind. Browser evidence names the hosting screen, the collection kind, and the state exercised.
