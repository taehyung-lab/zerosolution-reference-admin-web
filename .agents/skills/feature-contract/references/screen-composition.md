# Screen composition

Read this file for a new ordinary screen skeleton or app-shell/navigation metadata. List, detail, form, and specialized workflows have their own references.

## Explicit composition

Routes and feature screens compose visible parts explicitly. Repeated JSX is acceptable; do not replace it with `ResourcePage`, a page-controller hook, config union, or screen descriptor. A shared pattern owns layout and interaction mechanics only. Fields, columns, copy, permissions, queries, mutations, and workflow decisions stay in the feature.

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

Place a screen's implementation in its business/workflow directory. Names and paths identify the consumer scope: a single workflow's `list/` is not a catch-all for helpers used by sibling workflows. Put genuinely reused feature code in a purpose-named sibling directory at their nearest common owner, and leave single-consumer code with its consumer. A `common/` dumping ground or a `shared` promotion does not resolve unclear ownership; domain code remains feature-owned.

Use product responsibility names for production screens and hooks. Example data belongs in explicit `fixtures/`; a reference/demo label does not justify moving domain workflows into `app/`. New directories or abstractions must reduce actual ownership ambiguity, not anticipate hypothetical consumers.

When comparing an existing screen with this contract, distinguish implemented ownership from pending decomposition. Tests passing or a representative screen adopting the pattern does not establish adoption by its siblings.

## Never

- Shared screen shells or schema/config-driven universal pages
- Feature-to-feature imports for permission or navigation catalogs
- Screen-specific copy, permissions, Query, or mutations inside shared UI
