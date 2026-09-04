# Bulk actions

Read this file only for multi-row selection followed by a bulk operation.

- Selection belongs to the list screen or a feature-local table adapter; do not put it in shared Table or Zustand.
- Send stable IDs, not row objects.
- Prefer one server bulk operation. Do not invent client-side batching, polling, resumable jobs, or cross-page selection.
- Permission, confirmation copy, success reset, partial-result behavior, retry, and navigation require confirmed product and server contracts.
- Report row-level partial success only when the response contract exposes row-level results.
- Reset selection only under the declared success policy.

Read [mutation-actions.md](mutation-actions.md) for confirmation and mutation presentation. Read the API mutation reference when changing payload, invalidation, or optimistic behavior. Test stable-ID payloads, pending duplicate prevention, confirmed success/reset semantics, and any declared partial result.
