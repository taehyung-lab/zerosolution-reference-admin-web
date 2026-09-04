# Disclosure sections

Read this file only for `SectionCard`, the `Accordion` primitive, or a collapsible section in a detail, form, or settings screen.

## Which surface

- A titled block of a detail/form/settings screen (회원정보, 운영자정보, 업데이트 이력, 자동 발송 설정): `SectionCard`. Every such block in the inventory carries the same header with a `^` disclosure.
- The bare `Accordion` is consumed only through `SectionCard`; features do not import it. The implementation is Radix Accordion either way — here a single-item wrapper, in a shadcn/ui project the `Accordion/AccordionItem/AccordionTrigger/AccordionContent` source (ADR 0008 개정 3). This file states the contract, not the implementation; a new project keeps every bullet below and swaps the primitive.
- Disclosure glyph: the inventory shows `^` at the header end of every section, always drawn open. The closed glyph and any rotation rule are unconfirmed and the current `SectionCard` renders no glyph. Add it only from a confirmed closed frame or product answer; `aria-expanded` is the state of record until then.
- A filter frame is `FilterPanel`, not `SectionCard`, even though both disclose.

## Data the caller passes

```tsx
<SectionCard title={t('detail.section')} actions={<Button …/>}>…</SectionCard>              // uncontrolled, open by default
<SectionCard title="…" open={open} onOpenChange={setOpen}>…</SectionCard>                     // controlled (forms)
<SectionCard title="…" collapsible={false}>…</SectionCard>                                    // fixed header, no disclosure
```

- `title` is a translated string; `actions` is an optional header-end slot for section-local controls only.
- `collapsible` defaults to `true`. `defaultOpen` (default `true`) seeds the uncontrolled state; `open`/`onOpenChange` make it controlled.
- **Closed content is unmounted by default** (detail and settings sections). A **form** section passes `keepMounted` so its closed content stays in the DOM as `hidden`: TanStack Form keeps the fields registered and their client/server errors intact. `useFormSections.sectionProps(section)` returns `open`, `onOpenChange`, `keepMounted: true`, and `errorCount`; spread it here.
- `errorCount` (0 hides it) renders as a danger `Badge` **inside the trigger**, so the header's accessible name becomes "운영자정보 오류 2개" and stays announced while collapsed. Copy is `shared:formSection.errors`; the caller passes only the number. It is not a live region — the field `role="alert"` messages and the first-error focus already announce a rejected submit.
- With several sections, a rejected submit opens **every** section holding a failed field (sections without errors keep their state) and focus goes to the first failed field in the declared section/field order. The user may collapse a revealed section again; the count on its header is what keeps the error findable (WCAG 3.3.1 is met by the inline messages, the badge preserves that after re-collapsing). No top-of-form error summary and no "cannot collapse while invalid" rule.
- Which fields belong to which section, initial open state, and whether several sections may be open are caller policy.

## Accessibility

The header renders a button with `aria-expanded` and `aria-controls` over the content region; the title is the button's name. Pass no extra `role="group"` around it.

Test controlled/uncontrolled open transitions, header actions, and that a reopened section remounts its content.
