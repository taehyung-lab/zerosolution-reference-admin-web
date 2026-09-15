# Form workflow

Read this file for create/edit form ownership, validation, conditional sections, dirty state, or server field errors. Mutation presentation and files have separate references.

## Form ownership

- TanStack Form owns values, dirty/touched state, and field errors.
- Unsaved input is `state.isDirty && !state.isDefaultValue`: restoring defaults is clean; successful save updates values and their default baseline. Do not use the sticky `isDirty` flag alone for exit protection.
- Feature Zod schemas define UI input. Keep explicit input/output aliases when validation transforms values.
- Bind the schema as `validators: { onDynamic: schema }` with `validationLogic: revalidateLogic()` (validate on submit; after the first rejected submit, revalidate on every change). Do not use a bare `onSubmit` validator: TanStack Form clears a field's `onSubmit` error when a blur/change run finds no validator, so leaving a failed field would silently remove its message (ADR 0010).
- Create and edit share a schema only when fields and validation match. Otherwise share stable fragments and keep separate schemas.
- Defaults and request mappers are explicit and separate. Do not add a schema `mode` switch.
- feature가 native `useForm`에 schema·validators·입력 기본값·유효 제출을 연결한다. 오류 노출은 [form-fields](../../shared-ui-contract/references/form-fields.md#form-action-and-save-surfaces)의 `useFormFeedback`, 확인은 기존 `useConfirmation`/Confirm, dirty 보호는 기존 guard를 필요한 소유자 한 곳에서 조립한다. 저장 결과는 이 문서의 Dirty and consequential changes가 소유한다. 다른 전이를 mode/descriptor로 흡수하지 않는다.
- Do not mirror fields in component state, use Query cache as form state, or build a schema-driven renderer.
- Conditional controls explicitly clear values when product behavior requires it; mapper whitelists do not fix dirty state or validation.
- When the product instead requires restoring hidden input, keep values in the parent `useForm` and use React `Activity` only for the dependent group's visibility; the schema and confirmed-input mapper decide by the authoritative status, not DOM visibility, and clearing a dependent group must not mutate the editing draft. Hidden Activity cleans up child Effects, so test field hide/restore and validation with the real Form; do not replace every `keepMounted` section with Activity.
- Fields bind through typed `shared/ui/form` adapters. Feature schema, defaults, conditional behavior, normalization, and payload mapping remain outside shared UI.
- Server option `queryOptions` return raw reference records. A feature option hook may use Query `select` to expose `{ value, label }` while preserving the raw loader-warmed cache; forms consume that hook instead of calling `useQuery` and mapping records themselves. The hook projects each option query to `{ state, items, retry }` and the select renders that state in place (`FormSelectField state/onRetry`); `data ?? []` alone makes a failed request look like an empty list. Dependent options keep their prerequisite in the hook/query contract; clearing dependent values is wired by the screen at the select's `onValueChange`, next to the field, not in an effect.
- 같은 feature의 등록·수정에서 필드 묶음·선택지·종속값 전이가 같으면 그 부분을 feature-local Form으로 재사용한다. 서로 다른 필드는 명시적 슬롯이나 별도 조립으로 남기고, schema·기본값·요청 mapper·저장·이동은 각 workflow가 소유한다. 검증 차이만으로 공통 표시를 복제하지 않으며, 공통 전이가 없으면 하나의 Form을 강제하지 않는다. 저장 쌍을 쓰는 조립은 `save.dialogs`·`FormSaveFailureMessage`·전체 `sectionProps(section)`·액션 행을 보존한다. 도메인 간 공통 shell이나 mode renderer로 승격하지 않는다.

A consuming form keeps its fields, schema, defaults, validation copy, conditional clearing, option sources, mapper, destination, and whether save uses the confirm/acknowledge pair. It adopts `SectionCard`, adapters, and `useUnsavedChangesGuard.leave()` through the contracts above; missing issue text does not justify a second cancel dialog, inline-form hook, or form controller.

API 미연결이면 위 입력·확인·보호 조립에서 검증된 입력을 필수 업무 callback에 전달한다. 성공·reset·완료 알림·이동은 만들지 않는다.
그 종착점과 관찰은 [mutation-actions](mutation-actions.md#api-연결-전-시나리오-요청)가 소유한다. 실제 저장과 다른 lifecycle을 같은 hook의 mode로 표현하지 않는다.

## Composition index

Select only the surfaces the current form uses.

| Surface                           | Shared mechanic                                                                                                        | Feature owns                                                                  | Read next only when changing it                                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Field binding                     | `FormField` and the approved `Form*Field` adapters                                                                     | schema, defaults, field set, conditional clearing                             | [form-fields.md](../../shared-ui-contract/references/form-fields.md), then the control reference it routes to                                   |
| Sections                          | `SectionCard` + `useFormSections`                                                                                      | field-to-section mapping, failed field names                                  | this file                                                                                                                                       |
| Repeating or editable rows        | form array field, `Table` primitives or `DataTable`                                                                    | row schema, min/max, add/remove policy                                        | [table-composition.md](table-composition.md) kind D                                                                                             |
| Server-backed search or selection | `Combobox`, `MultiSelect`, or a dialog-hosted table                                                                    | search Query, candidate commit, unavailable labels                            | [table-composition.md](table-composition.md) kind E, or the control reference routed by [shared-ui-contract](../../shared-ui-contract/SKILL.md) |
| Save flow | 기존 Confirm/Alert·버튼·실패 문구 | native Form, 확인 snapshot, mutation, 오류 분류, 기준선 갱신, 목적지 | [mutation-actions](mutation-actions.md)와 아래 Dirty and consequential changes |
| Cancel and dirty leave | 기존 provider/guard | 보호 소유자 한 곳, Form dirty와 mutation pending, 폐기/이동 callback, guard.dialog 한 번 렌더 | 아래 Cancel and tabs |

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
| `ui/*CreateScreen.tsx`·`*EditScreen.tsx` | native Form·입력 feedback·확인·guard와 각자의 저장 결과를 조립한다. 렌더/focus adapter로 분리해도 같은 역할이다 |

route 는 [Route file layout](router.md#route-file-layout) 을 따르고, 수정 route 는 상세 query 를 await 해 기본값을 준비할 수 있다.

## Validation copy

Every validator supplies a message; the schema owns it and `FormField` renders it with the invalid state.
A screen whose own wording is not confirmed uses the product's default copy for that error kind rather than
inventing wording or rendering an invalid state with no message. Which default applies is a product choice
owned by the confirmed product ledger, not by this contract; the reusable strings and the rendering mechanic
belong to [form-fields](../../shared-ui-contract/references/form-fields.md).

## Sections and error visibility

오류 선택·section 유지/개수/reveal·선언 순서 focus·onServer 표시/정리는 [form-fields](../../shared-ui-contract/references/form-fields.md#form-action-and-save-surfaces)의 입력 feedback API가 소유한다.
feature는 field-to-section·복합 컨트롤 focus·inactive tab 노출을 연결한다. root 실패와 성공은 아래 저장 결과 전이가 소유하며 오류 시 입력·기준선은 보존한다.

## Cancel and tabs

보호 대상·제외·문구는 product.json이 연결한 제품 공통 정책과 해당 동작 근거로 결정한다. page·inline·dialog 또는 등록·수정이라는 이름만으로 보호를 채택하거나 제외하지 않는다.

보호 폼은 `UnsavedChangesProvider` 아래 등록한다. 값은 Form, 집계는 dirty/pending 사실만이다. 취소·×·Escape·outside 등 입력을 폐기하는 경로는 같은 `guard.close(discard)` 정책으로 연결하고, 화면을 떠나는 명시적 취소는 `guard.leave(navigate)`로 연결한다. `close(..., { when: false })`는 그 동작이 draft를 보존할 때만 질문을 생략하며, pending 거부와 Router 등록은 유지한다. local 취소를 우회하려고 route 보호를 제거하지 않는다.

clean 입력은 질문 없이 나가고, dirty 질문을 거절하면 입력을 보존하며 승인하면 원래 동작을 한 번 실행한다. pending local·Router 이탈은 조용히 거부하고 browser 이탈은 native 경고를 쓴다. local 취소와 Router 이동의 문구를 구분하고 질문은 한 소유자가 렌더한다. 실제 host에서 각 닫기 경로·동시 dirty·history·unmount를 검증한다.

Tabs inside a form (translation tabs, sub-tabs of a settings section) are presentation state of the nearest component, not URL state, unless the product confirms deep links. A failed field on an inactive tab must be revealed the same way a collapsed section is; that is a single-active algebra and not `useFormSections`.

## Dirty and consequential changes

값·기준선의 소유자는 같은 Form이다. resource identity가 바뀌면 새 Form 수명으로 시작하고 동일 resource refetch는 draft를 덮지 않는다. 살아 있는 Form의 defaults를 성공 값으로 갱신한 뒤 reset해야 이전 defaults로 되돌아가지 않는다.
실 저장 확인은 parsed output과 exact input snapshot을 보관한다. pending은 실제 mutation 사실이며 시작 액션과 이탈을 막는다. 매 제출 시작에 onServer를 정리하고 root 실패는 다음 유효 제출이 대체한다.
실 mutation 성공만 canonical input 또는 submitted input으로 값·default baseline을 함께 reset한다. 요청 중 입력 변경도 현행 저장 쌍에서는 이 기준값으로 대체한다. 미연결 callback 반환은 저장 성공이 아니다.
실패는 feature/API classifier의 `{fields, root?} | undefined`로 배치한다. fields는 feedback에 전달하고 root는 호출부 실패 상태에 둔다. 무표시 incident는 app에 위임하며 입력·기준선은 유지한다.
saved·완료 알림·onDone은 제품이 그 전이를 요구하는 호출부가 소유한다. baseline 갱신 후 saved를 열고 acknowledgement에서 닫고 onDone을 한 번 실행한다. 인라인/부모 닫기는 자기 전이를 쓰며 쌍을 강제하지 않는다.
중대한 선택 candidate는 확인 전 Form 밖에 하나만 둔다. 성공 값·pending·dirty·목적지를 다른 store에 복제하지 않는다. 이전 Form 수명의 결과로 새 Form이나 onDone을 실행하지 않는다.

Read [mutation-actions.md](mutation-actions.md) for pending, confirmation, feedback, and post-success navigation. Read [file-workflow.md](file-workflow.md) only when the form contains file workflow behavior.
