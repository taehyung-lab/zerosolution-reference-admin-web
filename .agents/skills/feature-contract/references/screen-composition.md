# Screen composition

Read this file for a new ordinary screen skeleton or app-shell/navigation metadata. List, detail, form, and specialized workflows have their own references.

## Explicit composition

Routes and feature screens compose visible parts explicitly. Repeated JSX is acceptable; do not replace it with `ResourcePage`, a page-controller hook, config union, or screen descriptor. A shared pattern owns layout and interaction mechanics only. Fields, columns, copy, permissions, queries, mutations, and workflow decisions stay in the feature.

Inspect only the confirmed product screens and adjacent workflows needed to identify the current screen and genuine shared candidates. Choose one representative workflow; do not implement a catalog. Figma repetition is evidence only when semantics, state transitions, and failure behavior match. Promotion decisions use `shared-ui-contract` and ADR 0009.

- The route mounts one feature screen or an explicit composition of independently owned screens.
- The feature composes only the visible surfaces its selected workflow reference requires.
- Cross-domain navigation and permission-evaluator metadata lives in `app/config`, not `shared` or another feature.

## Never

- Shared screen shells or schema/config-driven universal pages
- Feature-to-feature imports for permission or navigation catalogs
- Screen-specific copy, permissions, Query, or mutations inside shared UI
