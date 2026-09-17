# primitive 내부와 렌더 성능

Radix·Tailwind primitive 의 내부, focus·키보드, 토큰, 선택 control 의 선택,
React Compiler 경계를 실제로 만졌을 때만 읽는다.

## Primitive 내부와 렌더 성능

Read this file only for a shadcn-style copied component, Radix primitive, Tailwind token/variant, focus, keyboard behavior, primitive accessibility, or React rendering/compiler questions. The public contract of each primitive is a row in [catalog.md](../../shared-ui/references/catalog.md#primitives).

- `shared/ui/primitives` owns Radix/native wiring, focus, keyboard, ARIA semantics, Tailwind tokens, and visual variants.
- Only primitives import Radix directly. A shadcn-style copied component is source-owned project code, not an external black box. Implementation choices per primitive are recorded in [ADR 0008](../../../../docs/decisions/0008-primitive-implementation-selection.md); the public contract does not change when the implementation does.
- Add only the primitive and variants the current screen uses; do not install or prebuild a component catalog. An accessibility or design-token invariant justifies a source-owned primitive at first real use; it does not justify a shared workflow or page pattern.
- A primitive receives visible content, controlled values, and callbacks. It knows no feature, server DTO, Query, Router, permission, or mutation. Copy arrives as props; `Calendar` alone reads the `shared` namespace for its navigation labels and locale.
- Keep the public contract domain-neutral and preserve native semantics instead of recreating them with generic elements.
- React 19: a primitive receives `ref` as an ordinary prop; do not add `forwardRef` wrappers.

## Native passthrough primitives

`Button`, `Input`, `Checkbox`, and `Table`/`TableHead`/`TableCell` forward native props and add tokens only. They interpret no value: `Button` defaults to `type="button"`; `Input` has no value/default/empty policy; `Checkbox` is a native checkbox plus an `indeterminate` prop that renders `aria-checked="mixed"`; the table primitives provide `table`/`th`/`td` styling while the caller writes `thead`/`tbody`/`tr`. Name a native control with `<label htmlFor>` or `aria-label`, not both.

`Popover` takes `trigger` (a button element that accepts a ref), `children`, and `contentLabel`; it owns outside-click dismissal and focus return to the trigger. Open state is uncontrolled by default; a consumer that must render the same state elsewhere (`Combobox` and its trigger `aria-expanded`) passes `open`/`onOpenChange` so there is exactly one owner. `Combobox` and the `PeriodField` calendar consume it; a feature does not compose `Popover` directly for a new surface.

Which primitive a feature may use directly: `Button`, `Input`, `Checkbox`, `Badge`, `Table*`, `Select`, `Combobox`, `InlineSearchSelect`, `MultiSelect`, `RadioGroup`, `Calendar`, `FileInput`, `Dialog`, `Tabs*`, `Tooltip`. Consumed only through a pattern: `Accordion` (→ `SectionCard`), `Popover` (→ `Combobox`, `PeriodField`), `BlockingProgress` and `ModalCover` (→ app shell and incident boundary).

## Selection controls — which one

- Few options, all visible, inline with a leading "전체": `CheckboxTree`.
- Many options, searched, or shown as removable tokens: `MultiSelect`.
- Mutually exclusive choices all visible (period presets, a recipient-type choice): `RadioGroup`. More than a handful, or a dropdown in the design: `Select`.
- Searchable single selection over a reference entity: `Combobox` (local options) or `InlineSearchSelect` (inline candidates). Remote search with pending/error, an unresolved selected label, and custom entry are unimplemented candidates that the first such consumer defines rather than widening these contracts silently.
- Rows × function columns with per-column select-all: a feature composition of `Table` + `Checkbox`; `CheckboxTree` supplies only the row-hierarchy algebra.

Unconfirmed until a consumer asks: partial selection rendered as `aria-checked="mixed"`, the closed-section disclosure glyph, a sibling-trigger arrow order across several `Accordion` items.

## Controlled tabs

`Tabs`, `TabsList`, `TabsTrigger(value)`, `TabsContent(value)` wrap Radix Tabs: Radix owns tab/tabpanel linkage and roving keyboard focus; the wrappers add tokens. The feature owns the selected value, labels, initial value and whether it belongs in local state or URL; a locale tab is not a UI-locale switch. Inactive content unmounts by default; a caller requiring retained panels passes `forceMount` and the panel stays hidden. Tests that click a tab use `mouseDown` (Radix activates on pointer down).

## React Compiler and rendering

React Compiler is on for the React 19 app and the official hooks/compiler lint rules stay active. Do not add `memo`, `useMemo`, or `useCallback` by habit. Manual identity stabilization is justified only when the compiler skips the component or file, an external API requires a stable reference, code must run outside the compiled boundary, or profiling demonstrates a material regression. Keep exhaustive dependencies correct for every remaining hook; the compiler does not repair stale dependency arrays.

TanStack Table v9 names: `useTable` (v8 `useReactTable`), `tableFeatures` for feature slots, `table.FlexRender`. The shared `DataTable` calls `useTable` internally and owns the `features`/`TFeatures` contract; do not wrap it in project hooks such as `useListTable` or return the Table instance to feature code. A nested component that reads changing table state adds the narrowest `Subscribe` boundary or receives the value as a prop; do not subscribe every row. Virtualization is opt-in after row volume and profiling justify it.

Derive values during render; use effects only for external synchronization. Subscribe to the smallest Query/store/Table state the rendered output needs. Import modules directly instead of broad barrels. Lazy-load heavy editors or charts only with bundle evidence. Next.js, RSC, and Server Actions are not part of this Vite SPA. A profiling-based exception records the interaction, before/after trace, and retained identity requirement in the change report.

Test the interaction actually changed: accessible name/description, keyboard operation, focus entry/restoration, disabled state, controlled value, and relevant visual variants.
