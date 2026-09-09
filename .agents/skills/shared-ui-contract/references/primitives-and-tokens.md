# Source-owned primitives and tokens

Read this file only for a shadcn-style copied component, Radix primitive, Tailwind token/variant, focus, keyboard behavior, or primitive accessibility.

- `shared/ui/primitives` owns Radix/native wiring, focus, keyboard, ARIA semantics, Tailwind tokens, and visual variants.
- Only primitives import Radix directly. A shadcn-style copied component is source-owned project code, not an external black box.
- Add only the primitive and variants the current screen uses; do not install or prebuild a component catalog.
- A primitive receives visible content, controlled values, and callbacks. It knows no feature, server DTO, Query, Router, permission, or mutation. Copy arrives as props; `Calendar` alone reads the `shared` namespace for its navigation labels and locale.
- Accessibility or design-token invariants justify a source-owned primitive at first real use; they do not justify a shared workflow or page pattern.
- Keep the public contract domain-neutral and preserve native semantics instead of recreating them with generic elements.
- React 19: a primitive receives `ref` as an ordinary prop; do not add `forwardRef` wrappers.

## Native passthrough primitives

`Button`, `Input`, `Checkbox`, and `Table`/`TableHead`/`TableCell` forward native props and add tokens only. They interpret no value: `Button` defaults to `type="button"`; `Input` has no value/default/empty policy; `Checkbox` is a native checkbox plus an `indeterminate` prop that renders `aria-checked="mixed"`; the table primitives provide `table`/`th`/`td` styling while the caller writes `thead`/`tbody`/`tr`. Name a native control with `<label htmlFor>` or `aria-label`, not both.

`Popover` takes `trigger` (a button element that accepts a ref), `children`, and `contentLabel`; it owns outside-click dismissal and focus return to the trigger. Open state is uncontrolled by default; a consumer that must render the same state elsewhere (`Combobox` and its trigger `aria-expanded`) passes `open`/`onOpenChange` so there is exactly one owner. `Combobox` and the `PeriodField` calendar consume it; a feature does not compose Popover directly for a new surface without a reference.

## Observed candidates, not implementations

- `Tooltip`: the Figma design system contains it and page headers repeat it. A future primitive may own focus/hover/Escape and accessible association; `PageHeader` and feature copy stay unchanged.
- Row activation: 18 list occurrences. A future table-level interaction may own keyboard/screen-reader activation and interactive-child exclusion; destination, permission, and row meaning stay feature-owned.
- Status-count filtering: five ticketing variants repeat the action while onsite counts explicitly have no event. A future controlled action item may own accessible activation; filter mapping, URL update, and page reset stay in the feature.
- Empty value `-`: nine occurrences. A future narrow renderer may own only the visible fallback; the caller decides whether a value is absent.

These are inventory-backed candidates with no second code consumer. Do not add APIs or raise their lifecycle stage until a real screen needs the domain-free contract; range slider, selected-label registry, last-value persistence, and `- 이하 생략 -` remain unresolved rather than candidates for implementation.

Which primitive a feature may use directly: `Button`, `Input`, `Checkbox`, `Badge`, `Table*`, `Select`, `Combobox`, `InlineSearchSelect`, `MultiSelect`, `RadioGroup`, `Calendar`, `FileInput`, `Dialog`, `Tabs*`. Consumed only through a pattern: `Accordion` (→ `SectionCard`), `Popover` (→ `Combobox`, `PeriodField`), `BlockingProgress` (→ app shell).

## Controlled tabs

`Tabs.tsx` provides `Tabs(value, onValueChange)`, `TabsList`, `TabsTrigger(value)` and
`TabsContent(value)`. Radix owns tab/tabpanel linkage and roving keyboard focus; the wrappers add tokens.
The first consumer is the performance detail's read-only language panel. The feature owns the selected
language, labels, initial value and whether it belongs in local state or URL; a locale tab is not a UI-locale switch.
Inactive content unmounts by default. A caller requiring retained panels explicitly passes `forceMount` to
`TabsContent`; inactive retained panels stay hidden. This option does not decide form-value preservation.
Only the read-only consumer and default lifecycle are verified here; editable-language panels need their own
form and failed-field visibility evidence. The primitive's existence does not complete other inventoried tabs.

Test the interaction actually changed: accessible name/description, keyboard operation, focus entry/restoration, disabled state, controlled value, and relevant visual variants. Read a more specific reference as well when the primitive is a selection control, date/file control, dialog, or table surface.
