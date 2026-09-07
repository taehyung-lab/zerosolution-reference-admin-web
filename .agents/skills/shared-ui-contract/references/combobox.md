# Combobox

Read this file only for searchable single selection (`Combobox`, `FormComboboxField`).

- Current contract (what the primitive does): `Combobox({ value: string | null, onValueChange, options: { value, label }[], searchValue, onSearchValueChange, placeholder, searchLabel, emptyLabel, id?, ariaLabelledby?, ariaDescribedby?, ariaInvalid?, onBlur? })`. Selection is one ID or `null`; search text is a separate controlled string; filtering is a local label match over the given options.
- Open state has one owner: `Combobox` holds `open` and drives `Popover` through its controlled `open`/`onOpenChange`, so every dismissal path (trigger toggle, Escape, outside pointer, option pick) reaches the same state. The trigger passes no `aria-expanded` of its own; Radix `Popover.Trigger` renders `aria-expanded`/`aria-haspopup`/`aria-controls` from that state (2026-09-03, fixed from the earlier dual-owner defect).
- The feature owns the option source, mapping, and whether search text drives a Query. When it does, the feature keeps the options ready in cache and passes the resolved list; the primitive has **no** async status, error, or unavailable-selection props today.
- Remote search with pending/error presentation, preservation of an unresolved selected ID, and custom entry (`CreatableCombobox`) are **unimplemented candidates**: the inventory shows lookup filters (공연 검색, 공연장) that will need them, and the first such consumer defines that contract instead of widening this one silently.

Read [form-fields.md](form-fields.md) for `FormComboboxField` and [primitives-and-tokens.md](primitives-and-tokens.md) for Popover/focus/keyboard mechanics. Test search filtering, the null/value transition, keyboard operation, and focus actually changed.

## Inline single selection

`InlineSearchSelect` is the provisional native input + matching option buttons + removable selection contract used by the performance venue filter. Its controlled `searchValue` and `value: string | undefined` remain caller-owned. It locally filters `{ value, label }` options; empty search hides candidates, picking one clears search and locks the input until removal. The caller supplies `selectedLabel` independently so a selected value is not silently erased when absent from options. Labels, lookup sources, remote pending/error states, reset, URL/form commit and domain policy stay outside. It has no popup, async query or performance/venue mode.

Whole performance search dialogs are domain widgets composed from Dialog/table/filter primitives, not variants of this input. Their candidate/confirm/cancel, query and round dependencies belong to the performance feature; routes connect them to other features. The dt-admin-web venue search and performance selector demonstrate that reuse boundary, not a server contract for this project.
