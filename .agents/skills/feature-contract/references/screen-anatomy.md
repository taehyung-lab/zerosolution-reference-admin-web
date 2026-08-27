# Admin screen anatomy

Read this file when creating or changing a list, detail, form, analytics, permission-matrix, or notification screen skeleton.

## Shared mechanics, explicit feature composition

Routes and feature screens compose visible parts explicitly. Repeated JSX is acceptable; do not replace it with `ResourcePage`, a page-controller hook, a filter config union, or a screen descriptor. A shared pattern owns layout and interaction mechanics only. Fields, columns, copy, permissions, queries, mutations, and workflow decisions stay in the feature.

Before the first vertical slice, inspect the confirmed product screens, workflows, and API surfaces to separate repeated candidates from exceptional screens. Choose one representative workflow; do not implement the whole catalog. The pattern names below are approved candidates, not a preload list. Create only what the current workflow needs. A domain-neutral bootstrap pattern may start in `shared` under the [promotion contract](../../shared-ui-contract/references/promotion.md); otherwise keep the first implementation feature-local and validate candidates against a second real workflow.

Figma repetition is design evidence only when semantics, state transitions, and failure behavior are legible and match. It can establish a documented interaction contract before three code uses; the contract is not automatically a component. Accessibility/token primitives follow `shared-ui-contract`. Do not prebuild a catalog.

## List and filter

Compose the currently needed `PageHeader`, `FilterPanel`, `ResultToolbar`, `DataTable`, and `Pagination` explicitly. Omit surfaces that the confirmed workflow does not use.

- `FilterPanel` owns the collapsible frame and search/reset action row. The feature owns its fields and required rules.
- `FilterPanel` receives field JSX through children or slots; do not replace explicit fields with a `type: input | select | ...` config renderer.
- Draft input commits the validated route-search object on Search, Enter, or an explicitly declared debounce. Reset clears draft and canonical search together.
- Use TanStack Router's configured search serializer as the only URL codec. Multi-values are Zod arrays; omit an empty array and do not invent CSV, JSON strings, or an `all` sentinel per feature.
- A filter identity or page-size change sets `page` to its schema default in the same navigation update.
- Required filters drive three things together: required mark, disabled reason, and `query.enabled = false`. Do not request the list until they are valid.
- `notSearched`, initial loading, empty result, error, and background fetching are distinct states. `notSearched` is derived from declared canonical search, not from whether data happens to be empty.
- Summary counts come from the response contract. The result toolbar has left view/sort slots and right feature-action slots.
- Keep `DataTable` and `Pagination` separate. A cohesive feature-local `{domain}-result.tsx` may compose toolbar, table, and pagination when that result area changes or tests independently; this extraction does not require a reuse count and is not shared UI.
- Bulk confirmation is rendered in the caller's JSX. Send stable IDs and preserve the server's binary or partial-result semantics.

## Detail and form

- Detail uses an ID-based query key. Sections and embedded sub-tables are feature-local; a list row is not authoritative detail data.
- Forms compose section and field patterns explicitly. Zod schema, defaults, conditional fields, normalization, and request mapping remain feature-owned.
- If leaving would discard dirty input, the feature uses the Router blocker and a declarative confirm dialog. The pending destination is not copied into a global store.
- A completion that the product explicitly requires the user to acknowledge uses Alert. Incidental or non-blocking feedback uses toast. Do not infer one channel from the word "success" alone.

## Analytics, matrix, and notifications

- Analytics composes period filters, interval selection, `ChartCard`, a transposed accessible table, and per-card download. The feature owns series, labels, download mutation, and request-boundary policy.
- Read the confirmed IANA timezone from the app timezone provider. Pure conversion uses `shared/lib/datetime`; the feature chooses request boundaries. Do not append `Z` to local text or use browser timezone implicitly.
- Do not choose a chart library at bootstrap. The first confirmed analytics screen records a decision from required chart types, interaction, accessibility, export, and bundle constraints; until then do not implement a generic Chart wrapper. `ChartCard` is a `shared/ui/patterns` layout only after that current screen needs it.
- A permission matrix is feature UI: rows, function columns, required nodes, propagation, and payload come from the confirmed permission contract. A domain-neutral matrix renderer may own grid and checkbox mechanics only.
- Cross-domain app metadata such as navigation and permission-evaluator descriptors lives in `app/config`, not `shared` or another feature. Matrix axes returned by the server remain in the owning feature Query.
- `features/notifications` owns delivery Query/subscription, read/delete mutations, retention contract, and code-to-copy mapping. `app/shell` may mount its public panel entry; it does not import notification API/model internals. Shared UI provides toast and panel surfaces with slots.

## Never

- Screen shells disguised as shared patterns
- Schema/config-driven universal filters, forms, tables, or analytics pages
- Feature-to-feature imports to assemble permission or navigation catalogs
- Screen-specific empty copy, permissions, queries, or mutations inside shared UI
