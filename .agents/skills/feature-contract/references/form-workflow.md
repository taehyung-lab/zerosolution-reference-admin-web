# Form workflow

Read this file for create/edit form ownership, validation, conditional sections, dirty state, or server field errors. Mutation presentation and files have separate references.

## Form ownership

- TanStack Form owns values, dirty/touched state, and field errors.
- Unsaved input is `state.isDirty && !state.isDefaultValue`: restoring defaults leaves nothing to discard, while a successful save rebases values and defaults to a clean baseline. Do not use the sticky `isDirty` flag alone for exit protection.
- Feature Zod schemas define UI input. Keep explicit input/output aliases when validation transforms values.
- Bind the schema as `validators: { onDynamic: schema }` with `validationLogic: revalidateLogic()` (validate on submit; after the first rejected submit, revalidate on every change). Do not use a bare `onSubmit` validator: TanStack Form clears a field's `onSubmit` error when a blur/change run finds no validator, so leaving a failed field would silently remove its message (ADR 0010).
- Create and edit share a schema only when fields and validation match. Otherwise share stable fragments and keep separate schemas.
- Defaults and request mappers are explicit and separate. Do not add a schema `mode` switch.
- Submit orchestration is `useSaveForm` (shared): it takes `schema`, `defaultValues`, `sections`, `save.run/isPending`, `mapError`, `onDone`, optional `resetKey` and `save.getDefaultValues` and returns `form`, `sections`, `stage`, `submit`, `guard`, `dialogs`. Render `dialogs` once — it holds local close confirmation and the save confirm/acknowledge pair; the app-level Provider renders Router exit confirmation. The feature passes `mapError: (e) => classifyFormError(e, fieldOrder)` (`src/api/form-error.ts`) and reads `stage.kind === 'failed'` for the root line (`FormSaveFailureMessage`). Do not add resource descriptors, a domain `mode`, or callback overrides to it; a differing workflow stays feature-local.
- Do not mirror fields in component state, use Query cache as form state, or build a schema-driven renderer.
- Conditional controls explicitly clear values when product behavior requires it; mapper whitelists do not fix dirty state or validation.
- When the product instead requires restoring hidden input, keep values in the parent `useForm` and use React `Activity` only for the dependent group's visibility; the schema and confirmed-input mapper decide by the authoritative status, not DOM visibility, and clearing a dependent group must not mutate the editing draft. Hidden Activity cleans up child Effects, so test field hide/restore and validation with the real Form; do not replace every `keepMounted` section with Activity. (Current consumer: [이 저장소의 관찰](#이-저장소의-관찰).)
- Fields bind through typed `shared/ui/form` adapters. Feature schema, defaults, conditional behavior, normalization, and payload mapping remain outside shared UI.
- Server option `queryOptions` return raw reference records. A feature option hook may use Query `select` to expose `{ value, label }` while preserving the raw loader-warmed cache; forms consume that hook instead of calling `useQuery` and mapping records themselves. The hook projects each option query to `{ state, items, retry }` and the select renders that state in place (`FormSelectField state/onRetry`); `data ?? []` alone makes a failed request look like an empty list. Dependent options keep their prerequisite in the hook/query contract; clearing dependent values is wired by the screen at the select's `onValueChange`, next to the field, not in an effect.
- A domain's create and edit screens render one feature form component (`{Domain}Form`) that owns what they share: the option queries, the dependent-value policy, the common fields in Figma order, and the shell (`{save.dialogs}`, `<form>`, `FormSaveFailureMessage`, `SectionCard` with the whole `sectionProps(section)` object, action row). Each screen declares `useSaveForm` (schema, defaults, mutation, destination) and passes only what differs — a slot for the differing fields and where cancel goes. That component is domain-specific by construction; do not reduce it to a domain-free shell (the next domain would copy it) and do not lift it to shared.

A consuming form keeps its fields, schema, defaults, validation copy, conditional clearing, option sources, mapper, destination, and whether save uses the confirm/acknowledge pair. It adopts `SectionCard`, adapters, and `useUnsavedChangesGuard.leave()` through the contracts above; missing issue text does not justify a second cancel dialog, inline-form hook, or form controller.

For an explicitly scoped pre-request scenario with no save implementation, compose `useForm`, the
existing adapters/guard, `useConfirmation` and `ConfirmDialog`. Confirmation passes
validated input to the required feature callback; it does not reset dirty state, acknowledge success or navigate.
The explicit request handler and its observation rules are owned by [mutation-actions.md](mutation-actions.md#api-연결-전-시나리오-요청).
Do not resolve a fake mutation, leave a promise pending forever, or add a second-contract mode switch to `useSaveForm`.
Revisit shared validation composition when another real caller demonstrates the same lifecycle.

## Composition index

Select only the surfaces the current form uses.

| Surface                           | Shared mechanic                                                                                                        | Feature owns                                                                  | Read next only when changing it                                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Field binding                     | `FormField` and the approved `Form*Field` adapters                                                                     | schema, defaults, field set, conditional clearing                             | [form-fields.md](../../shared-ui-contract/references/form-fields.md), then the control reference it routes to                                   |
| Sections                          | `SectionCard` + `useFormSections`                                                                                      | field-to-section mapping, failed field names                                  | this file                                                                                                                                       |
| Repeating or editable rows        | form array field, `Table` primitives or `DataTable`                                                                    | row schema, min/max, add/remove policy                                        | [table-composition.md](table-composition.md) kind D                                                                                             |
| Server-backed search or selection | `Combobox`, `MultiSelect`, or a dialog-hosted table                                                                    | search Query, candidate commit, unavailable labels                            | [table-composition.md](table-composition.md) kind E, or the control reference routed by [shared-ui-contract](../../shared-ui-contract/SKILL.md) |
| Save flow                         | `useSaveForm` (its `dialogs` node renders the confirm → acknowledge pair), `FormSaveFailureMessage`, `FormSubmitButton`, `FormCancelButton` (product-owned shared action labels) | mutation, destination, error classification (`classifyFormError`) | [mutation-actions.md](mutation-actions.md). An inline save without the pair does not use `useSaveForm`; compose `useForm` + adapters directly (`LoginScreen`) |
| Cancel and dirty leave            | `UnsavedChangesProvider` (Router blocker and exit confirmation) + `useUnsavedChangesGuard` (local close), composed by `useSaveForm` with `when: isDirty && !isDefaultValue`; local dialog inside `save.dialogs` | destination after leaving (`guard.leave(navigate)`) | this file |

## 형태

등록·수정 한 쌍은 `screens/form/`에 모은다. 아래는 배치 예시이며 필수 파일 목록이 아니다. 각 역할의 규칙은 위 [Form ownership](#form-ownership)이 소유한다.
현재 요청에 필요한 책임만 구현하고, 같은 소유권의 작은 schema·mapper 등은 함께 둘 수 있다. 공유 필드가 없으면 공유 `Form` 파일을 만들지 않는다.

| 파일 | 담는 것 |
| --- | --- |
| `model/*-schema.ts` | 입력 Zod schema(등록·수정이 다르면 각각) |
| `model/*-defaults.ts` | 기본값(등록·수정이 기본값 계산을 공유할 때) |
| `model/*-request.ts` | 검증된 입력 → 요청 입력 mapper |
| `model/use*Mutation.ts` 또는 `*-requests.ts` | 저장 실행과 캐시 후속(API 연결 전이면 요청 함수 도달까지) |
| `model/use*FormOptions.ts` | 선택지 투영 훅(선택지가 있을 때) |
| `ui/{Domain}Form.tsx` | 등록·수정이 공유하는 폼(공유 필드가 있을 때. 등록·수정 필드가 다르면 만들지 않는다) |
| `ui/*CreateScreen.tsx`·`*EditScreen.tsx` | 각자의 `useSaveForm` 과 다른 필드 슬롯. 입력 화면 어댑터를 별도 파일(`*InputScreens.tsx`·`use*InputForm.tsx`)로 두는 것도 이 역할이다 |

route 는 [Route file layout](router.md#route-file-layout) 을 따르고, 수정 route 는 상세 query 를 await 해 기본값을 준비할 수 있다.

## Sections and error visibility

A collapsed section can hide an invalid field and make submit appear silent. Form sections therefore stay mounted while closed (`useFormSections` → `keepMounted`), so TanStack Form never clears their errors. On rejected submit, reveal the sections containing errors and focus the first invalid control in declared order; no revalidation after reveal is needed because nothing remounted. While a section with errors is collapsed, its header shows the invalid-field count (`errorCount` from the same `fieldMeta.errors` selection). Shared UI owns disclosure and the count rendering; the feature owns field-to-section mapping and the invalid-field selection.

Server field errors: `useSaveForm` writes `fieldMeta.errorMap.onServer` for the classified fields, reveals their sections, and focuses the first in declared order. Ordinary validation never clears `onServer`, so the hook clears every `onServer` at the start of the next submit — the server decides again. A failure with no field becomes `stage.kind === 'failed'`, replaced by the next valid submit. Preserve entered values; the real-Router test `useSaveForm.test.tsx` owns this transition.

## Cancel and tabs

Determine which drafts require discard protection from the product evidence entry point (`docs/reference/product.json`); host shape alone does not decide eligibility. Do not inherit another product’s inclusion/exclusion list. For an eligible form, clean cancellation runs immediately; dirty cancellation asks once, preserves input when declined, and runs the original action when confirmed. Cancel, ×, Escape, and outside dismissal use the same policy. A scoped `close(discard, { when: false })` bypass needs a confirmed reason for that action, such as preserving the draft while switching views.

One required app-level `UnsavedChangesProvider` aggregates dirty/pending facts, not values or destinations.
It owns the only Router blocker and browser-exit listener. The form hook owns local close confirmation.
Pending refuses local and Router exits silently; the browser supplies its native warning.

Cancellation/dismissal and navigation are distinct intents. The product owns their wording through its approved translation catalogue; do not carry reference-product sentences into a new product. In the current guard API, an explicit form exit calls `guard.leave(navigate)` and selects cancel copy; ordinary Router navigation selects navigation copy. Neither asks for clean input; do not add a second cancel dialog.

Tabs inside a form (translation tabs, sub-tabs of a settings section) are presentation state of the nearest component, not URL state, unless the product confirms deep links. A failed field on an inactive tab must be revealed the same way a collapsed section is; that is a single-active algebra and not `useFormSections`.

## Dirty and consequential changes

Dirty-leave confirmation uses the Provider's Router blocker (`useBlocker({ shouldBlockFn, withResolver: true, disabled })` — the function/`condition` overloads are deprecated in Router 1.170) and a declarative confirm; do not copy the pending destination into a global store. `useSaveForm` passes `when: isDirty && !isDefaultValue` and `refuseSilently: isPending`. A form that remains mounted across resource identities passes that identity as `resetKey`; changing it resets values/defaults and returns the save stage to idle, while a refetch with the same identity does not overwrite a draft. A focused regression covers the identity transition. On success, the hook resets values and defaults to the server-normalized form input returned by the optional caller-supplied `save.getDefaultValues(result)`, or the exact submitted input snapshot when that mapper is absent or returns `undefined`. This rebase happens before acknowledgement so clean navigation proceeds without a flag, and edits made during the request are replaced by that submitted or normalized baseline, not preserved as an unsaved draft. The feature renders `save.dialogs` once and owns no leave state. A consequential field change keeps one candidate outside the committed form value until confirmation, then calls `setFieldValue`; that candidate is not a form mirror.

Read [mutation-actions.md](mutation-actions.md) for pending, confirmation, feedback, and post-success navigation. Read [file-workflow.md](file-workflow.md) only when the form contains file workflow behavior.

## 이 저장소의 관찰

규칙이 아니라 이 저장소 화면에서 위 규칙을 적용한 기록이다. 신규 프로젝트는 이 절을 비우고 자기 화면으로 다시 채운다.

- 숨긴 입력 복원 + `Activity`: `MemberEditScreen` 이 활동제한 UI 의 표시에만 Activity 를 쓰고, schema 와 확정 입력 mapper 는 계정 상태로 판단한다. 일반회원 입력은 편집 draft 를 건드리지 않고 제한을 지운다.
- 저장 미구현의 요청 직전 시나리오 조립: `MemberCreateScreen`.
- `{Domain}Form` 이 없는 예: 회원 폼은 등록·수정 필드가 달라 공유 폼이 없다.
