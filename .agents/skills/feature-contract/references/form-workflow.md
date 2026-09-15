# Form workflow

Read this file for create/edit form ownership, validation, conditional sections, dirty state, or server field errors. Mutation presentation and files have separate references.

## Form ownership

- TanStack Form owns values, dirty/touched state, and field errors.
- Unsaved input is `state.isDirty && !state.isDefaultValue`: restoring defaults is clean; successful save updates values and their default baseline. Do not use the sticky `isDirty` flag alone for exit protection.
- Feature Zod schemas define UI input. Keep explicit input/output aliases when validation transforms values.
- Bind the schema as `validators: { onDynamic: schema }` with `validationLogic: revalidateLogic()` (validate on submit; after the first rejected submit, revalidate on every change). Do not use a bare `onSubmit` validator: TanStack Form clears a field's `onSubmit` error when a blur/change run finds no validator, so leaving a failed field would silently remove its message (ADR 0010).
- Create and edit share a schema only when fields and validation match. Otherwise share stable fragments and keep separate schemas.
- Defaults and request mappers are explicit and separate. Do not add a schema `mode` switch.
- 저장 확인·완료 쌍의 lifecycle이 맞으면 `useSaveForm`을 채택한다. API·resource 변경 reset·성공 기준선 갱신은 [form-fields의 Form action and save surfaces](../../shared-ui-contract/references/form-fields.md#form-action-and-save-surfaces)가 소유한다. feature는 schema·defaults·저장·이동과 `classifyFormError(e, fieldOrder)` 연결을 소유하고, `dialogs`는 한 번 렌더한다. 다른 lifecycle을 resource descriptor·mode·callback override로 흡수하지 않는다.
- Do not mirror fields in component state, use Query cache as form state, or build a schema-driven renderer.
- Conditional controls explicitly clear values when product behavior requires it; mapper whitelists do not fix dirty state or validation.
- When the product instead requires restoring hidden input, keep values in the parent `useForm` and use React `Activity` only for the dependent group's visibility; the schema and confirmed-input mapper decide by the authoritative status, not DOM visibility, and clearing a dependent group must not mutate the editing draft. Hidden Activity cleans up child Effects, so test field hide/restore and validation with the real Form; do not replace every `keepMounted` section with Activity.
- Fields bind through typed `shared/ui/form` adapters. Feature schema, defaults, conditional behavior, normalization, and payload mapping remain outside shared UI.
- Server option `queryOptions` return raw reference records. A feature option hook may use Query `select` to expose `{ value, label }` while preserving the raw loader-warmed cache; forms consume that hook instead of calling `useQuery` and mapping records themselves. The hook projects each option query to `{ state, items, retry }` and the select renders that state in place (`FormSelectField state/onRetry`); `data ?? []` alone makes a failed request look like an empty list. Dependent options keep their prerequisite in the hook/query contract; clearing dependent values is wired by the screen at the select's `onValueChange`, next to the field, not in an effect.
- 같은 feature의 등록·수정에서 필드 묶음·선택지·종속값 전이가 같으면 그 부분을 feature-local Form으로 재사용한다. 서로 다른 필드는 명시적 슬롯이나 별도 조립으로 남기고, schema·기본값·요청 mapper·저장·이동은 각 workflow가 소유한다. 검증 차이만으로 공통 표시를 복제하지 않으며, 공통 전이가 없으면 하나의 Form을 강제하지 않는다. 저장 쌍을 쓰는 조립은 `save.dialogs`·`FormSaveFailureMessage`·전체 `sectionProps(section)`·액션 행을 보존한다. 도메인 간 공통 shell이나 mode renderer로 승격하지 않는다.

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
| Save flow                         | `useSaveForm` (its `dialogs` node renders the confirm → acknowledge pair), `FormSaveFailureMessage`, `FormSubmitButton`, `FormCancelButton` (default 저장/취소 labels) | mutation, destination, error classification (`classifyFormError`) | [mutation-actions.md](mutation-actions.md). A save without the pair composes `useForm` + adapters directly |
| Cancel and dirty leave            | `useUnsavedChangesGuard` (Router blocker + both confirmed sentences), composed by `useSaveForm` with `when: isDirty`, dialog rendered inside `save.dialogs` | destination after leaving (`guard.leave(navigate)`) | this file |

## 형태

등록·수정 한 쌍이 `screens/form/` 하나를 쓴다. 파일 집합만 적는다. 각 역할의 규칙은 위 [Form ownership](#form-ownership) 이 소유한다.
「있을 때」행은 그 책임이 있을 때만 파일을 만든다. 공유 필드가 없으면 공유 `Form` 파일을 만들지 않는다.

| 파일 | 담는 것 |
| --- | --- |
| `model/*-schema.ts` | 입력 Zod schema(등록·수정이 다르면 각각) |
| `model/*-defaults.ts` | 기본값(등록·수정이 기본값 계산을 공유할 때) |
| `model/*-request.ts` | 검증된 입력 → 요청 입력 mapper |
| `model/use*Mutation.ts` 또는 `*-requests.ts` | 저장 실행과 캐시 후속(API 연결 전이면 요청 함수 도달까지) |
| `model/use*FormOptions.ts` | 선택지 투영 훅(선택지가 있을 때) |
| `ui/*Form.tsx` | 위 재사용 조건을 만족하는 공통 입력 조립(있을 때). 다른 필드·검증은 공통 부분과 분리한다 |
| `ui/*CreateScreen.tsx`·`*EditScreen.tsx` | 각자의 저장·입력 조립. 저장 쌍이면 `useSaveForm`, 요청 전 시나리오면 위 명시적 callback 흐름. 입력 어댑터를 분리해도 같은 역할이다 |

route 는 [Route file layout](router.md#route-file-layout) 을 따르고, 수정 route 는 상세 query 를 await 해 기본값을 준비할 수 있다.

## Validation copy

Every validator supplies a message; the schema owns it and `FormField` renders it with the invalid state.
A screen whose own wording is not confirmed uses the product's default copy for that error kind rather than
inventing wording or rendering an invalid state with no message. Which default applies is a product choice
owned by the confirmed product ledger, not by this contract; the reusable strings and the rendering mechanic
belong to [form-fields](../../shared-ui-contract/references/form-fields.md).

## Sections and error visibility

A collapsed section can hide an invalid field and make submit appear silent. Form sections therefore stay mounted while closed (`useFormSections` → `keepMounted`), so TanStack Form never clears their errors. On rejected submit, reveal the sections containing errors and focus the first invalid control in declared order; no revalidation after reveal is needed because nothing remounted. While a section with errors is collapsed, its header shows the invalid-field count (`errorCount` from the same `fieldMeta.errors` selection). Shared UI owns disclosure and the count rendering; the feature owns field-to-section mapping and the invalid-field selection.

Server field errors: `useSaveForm` writes `fieldMeta.errorMap.onServer` for the classified fields, reveals their sections, and focuses the first in declared order. Ordinary validation never clears `onServer`, so the hook clears every `onServer` at the start of the next submit — the server decides again. A failure with no field becomes `stage.kind === 'failed'`, replaced by the next valid submit. Preserve entered values; the real-Router test `useSaveForm.test.tsx` owns this transition.

## Cancel and tabs

보호 대상·제외·문구는 product.json이 연결한 제품 공통 정책과 해당 동작 근거로 결정한다. page·inline·dialog 또는 등록·수정이라는 이름만으로 보호를 채택하거나 제외하지 않는다.

보호 폼은 `UnsavedChangesProvider` 아래 등록한다. 값은 Form, 집계는 dirty/pending 사실만이다. 취소·×·Escape·outside 등 입력을 폐기하는 경로는 같은 `guard.close(discard)` 정책으로 연결하고, 화면을 떠나는 명시적 취소는 `guard.leave(navigate)`로 연결한다. `close(..., { when: false })`는 그 동작이 draft를 보존할 때만 질문을 생략하며, pending 거부와 Router 등록은 유지한다. local 취소를 우회하려고 route 보호를 제거하지 않는다.

clean 입력은 질문 없이 나가고, dirty 질문을 거절하면 입력을 보존하며 승인하면 원래 동작을 한 번 실행한다. pending local·Router 이탈은 조용히 거부하고 browser 이탈은 native 경고를 쓴다. local 취소와 Router 이동의 문구를 구분하고 질문은 한 소유자가 렌더한다. 실제 host에서 각 닫기 경로·동시 dirty·history·unmount를 검증한다.

Tabs inside a form (translation tabs, sub-tabs of a settings section) are presentation state of the nearest component, not URL state, unless the product confirms deep links. A failed field on an inactive tab must be revealed the same way a collapsed section is; that is a single-active algebra and not `useFormSections`.

## Dirty and consequential changes

provider의 blocker·beforeunload와 저장 reset API는 form-fields가 소유한다. 목적지나 입력을 global store에 복제하지 않는다. 성공 값은 feature가 서버 응답에서 투영하거나 제출 snapshot을 쓰며, 값·기준선 갱신 뒤 완료 acknowledgement를 연다. 같은 resource의 refetch는 draft를 덮지 않고 resource identity 변경만 새 입력으로 reset한다. 결과가 중대한 필드 변경은 확인 전 candidate 하나만 확정 Form 값 밖에 두고 승인 후 `setFieldValue`한다. 이 candidate는 form mirror가 아니다.

Read [mutation-actions.md](mutation-actions.md) for pending, confirmation, feedback, and post-success navigation. Read [file-workflow.md](file-workflow.md) only when the form contains file workflow behavior.
