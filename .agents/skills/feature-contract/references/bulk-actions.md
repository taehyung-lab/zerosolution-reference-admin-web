# Bulk actions

Read this file only for multi-row selection followed by a bulk operation.

- Selection belongs to the list screen or a feature-local table adapter; do not put it in shared Table or Zustand.
- Unless the product explicitly declares cross-page selection, the header checkbox selects every selectable row in the currently visible page, not every row matching the search. Page, page-size, sort, committed-search, or list-identity changes clear selection; editing an uncommitted draft does not.
- A refetch of the same committed page preserves only selected IDs that remain present and selectable. A failed bulk operation preserves selection for retry; a successful operation clears it after the declared cache consequence succeeds.
- Send stable IDs, not row objects.
- Prefer one server bulk operation. Do not invent client-side batching, polling, resumable jobs, or cross-page selection. If the product later requires search-wide selection, stop and confirm the server's condition-based payload and selection lifecycle instead of stretching the current-page ID contract.
- Permission, confirmation copy, success reset, partial-result behavior, retry, and navigation require confirmed product and server contracts.
- Report row-level partial success only when the response contract exposes row-level results.
- Reset selection only under the lifecycle above and the declared success policy.

Read [mutation-actions.md](mutation-actions.md) for confirmation and mutation presentation. Read the API mutation reference when changing payload, invalidation, or optimistic behavior. Test stable-ID payloads, pending duplicate prevention, confirmed success/reset semantics, and any declared partial result.
