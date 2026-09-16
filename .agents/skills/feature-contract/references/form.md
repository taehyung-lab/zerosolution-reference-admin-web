# Form

등록·수정 한 쌍의 계약이다: 저장 lifecycle, 필드, 취소·이탈, 파일 집합. 등록과 수정은 한 폴더 `screens/{entity}-form/` 을 쓴다. `{entity}` 자리에 그 화면의 엔티티가 들어간다.

## Ownership

| 값 | 소유자 |
| --- | --- |
| 입력 값·dirty·필드 오류 | TanStack Form (`useSaveForm` 이 만든 `form`) |
| 입력 schema·기본값·요청 mapper | `model/` 세 파일. 등록·수정이 다르면 각각 선언하고 공통 조각만 공유한다 |
| 저장 단계(확인 → 저장 → 완료), 잘못된 제출의 reveal·focus, 서버 필드 오류 배치, dirty 이탈 보호 | `useSaveForm` |
| 서버 실패 분류 | `classifyFormError(error, fieldOrder)`(`src/api/form-error.ts`) → `{ fields, root? } \| undefined` |
| 저장 mutation | `api/mutations.ts` 의 `create{Entity}Mutation(locale)` · `update{Entity}Mutation(locale)` |
| 목적지 | route 가 `onSaved`·`onCancel` 에 navigate 를 넣는다 |

값은 전부 문자열이다 — `Select` 의 빈 선택은 `''` 이어야 schema 가 placeholder 상태를 거부할 수 있다. 검증 문구는 schema 안에 있고 필드 어댑터가 그린다. 필드·필수·길이·문구는 원장에서 읽고 형제 화면에서 복사하지 않는다.

## Save lifecycle

```ts
const save = useSaveForm({
  schema: {entity}CreateSchema,                 // z.ZodType<TOutput, TInput>
  defaultValues: {entity}CreateDefaults,        // TInput (수정: to{Entity}EditDefaults(record))
  sections: { info: {entity}CreateFieldOrder }, // 섹션 → 필드 순서. 첫 오류 focus 와 섹션 badge 의 기준
  save: { run: (values) => create.mutateAsync(to{Entity}CreateSettings(values)), isPending: create.isPending },
  mapError: (error) => classifyFormError(error, {entity}CreateFieldOrder),
  onDone: onSaved,
});
```

- 반환: `form`, `sections.sectionProps(section)`, `stage`, `guard`, `submit.{run, isPending}`, `dialogs`(이탈 질문 + 저장 확인/완료 쌍 — **한 번** 렌더).
- 제출: `form.handleSubmit()` → 유효하면 `stage: confirming`(확인창 "저장하시겠습니까?") → 확인 → `save.run(parsed)` → 성공 → 기준선 갱신 → `stage: saved`(완료 alert) → 확인 → `onDone()`. 취소는 idle 로 돌아가고 아무것도 부르지 않는다.
- 검증은 `validators: { onDynamic: schema }` + `revalidateLogic()` 이다(제출에서 검증, 첫 거부 뒤 change 마다 재검증). 잘못된 제출은 선언 순서의 첫 오류 필드를 연 뒤 focus 한다. 확인창은 열리지 않는다.
- 실패: `mapError` 가 `fields` 를 주면 그 필드에 `onServer` 문구(다음 제출 시작에 지운다), `root` 를 주면 `FormSaveFailureMessage` 로 폼 위에 한 줄. `undefined` 면 표시 없음(incident 는 app 이 맡는다). 입력·기준선은 유지한다.
- 성공 기준선: `save.getDefaultValues(result)` 가 있으면 그 값, 없으면 제출 snapshot. 그래서 완료 뒤 guard 는 "unsaved 없음"으로 풀린다.
- 수정은 `DetailStateBoundary` 안에서 `key={record.id}` 로 폼 컴포넌트를 mount 한다 — 조회가 성공한 뒤에만 폼이 있고, refetch 가 초안을 덮지 않는다. 진입 실패는 route loader 의 것이다([detail State](detail.md#state)).
- 미연결 mutation 은 `scenarioRequest(label)` 이라 **같은 성공 경로**를 끝까지 돈다(저장 완료 alert → 이동, `meta.invalidates` 무효화). 미연결이라는 이유로 성공·이동을 빼거나 다른 lifecycle 을 mode 로 만들지 않는다([mutations](../../api-contract/references/mutations.md#시나리오-요청)).

## Fields

`ui/{Entity}Form.tsx` 는 등록·수정이 공유하는 입력 조립이다. 공유 필드가 없으면 만들지 않는다.

- props: `{ save, identity?: ReactNode, onCancel }`. 등록만 있는 필드(아이디·비밀번호)는 `identity` slot 에 넣고 수정은 읽기 전용 `FormTextField` 를 넣는다.
- 렌더 순서: `{save.dialogs}` → `<form noValidate onSubmit={preventDefault + save.submit.run()}>` → `stage.kind === 'failed'` 면 `FormSaveFailureMessage` → `SectionCard title {...save.sections.sectionProps('info')}` 안에 `Form*Field` 들 → `FormSubmitButton pending` + `FormCancelButton onClick={() => save.guard.leave(onCancel)}`.
- 어댑터는 `FormTextField`·`FormSelectField`·`FormMultiSelectField`·`FormComboboxField`·`FormCheckboxField`·`FormRadioGroupField`·`FormDateField`·`FormDateRangeField`·`FormFileField`·`FormPermissionTreeField`·`FormArrayField` 다([catalog Form](../../shared-ui-contract/references/catalog.md#form)). 소비자가 없어도 이 집합은 남는다; 다른 이름의 별칭은 만들지 않는다.
- 서버 선택지는 `api/use{Entity}Options.ts` 훅의 `{ state, items, retry }` 를 `FormSelectField state/onRetry` 에 그대로 넘긴다. 종속 선택지(유형 → 권한)는 훅의 `enabled` 로 선행 조건을 표현하고, 종속 값 비우기는 그 필드의 `onValueChange` 에서 `form.setFieldValue` 로 한다 — effect 가 아니다.
- 조건부 필드군: 제품이 숨긴 입력의 복원을 요구하면 값은 부모 폼에 두고 React `Activity` 로 가시성만 바꾼다. schema 가 authoritative 상태로 검증하고 mapper 가 확정 입력만 싣는다. 복원을 요구하지 않으면 값을 명시적으로 비운다.
- 반복 행은 `FormArrayField` + `Table` primitive. row factory·stable id·최소 개수는 feature 가 정한다.
- 비밀번호 확인처럼 blur 에서도 알려야 하는 불일치는 `validators.onBlur` 에 필드 하나만 더한다.

## Cancel and dirty leave

- 보호 대상은 앱의 `UnsavedChangesProvider` 아래 등록된 모든 페이지 폼이다. `useSaveForm` 이 `useUnsavedChangesGuard({ when: isDirty && !isDefaultValue, refuseSilently: isPending })` 를 등록하고 그 질문을 `dialogs` 안에 그린다.
- 명시적 취소는 `save.guard.leave(onCancel)`: clean 이면 바로 나가고, dirty 면 취소 문구로 묻고 승인 시 한 번 실행한다. 일반 route 이동은 provider 의 blocker 가 이동 문구로 묻는다. 저장 중 이탈은 조용히 거부하고 브라우저 이탈은 native 경고다.
- 다이얼로그 안의 입력 폼(상세 액션)은 자기 `useUnsavedChangesGuard` 와 `guard.close(onClose)` 로 취소·×·Escape·바깥 클릭을 같은 정책으로 묶는다([detail Actions](detail.md#actions)).
- 폼 안의 탭은 가장 가까운 컴포넌트의 표시 상태다. 비활성 탭의 실패 필드도 접힌 섹션처럼 드러낸다.

## 형태

**책임이 있으면 이 이름·이 자리에 둔다. 없으면 파일도 없다.** 등록·수정 어느 한쪽만 있어도 폴더 이름은 `{entity}-form` 이고, 그 한쪽만 있으면 Screen 도 하나다.

| 책임 | 있으면 이 자리 |
| --- | --- |
| 입력 schema 와 화면 순서 | `model/{entity}-form-schema.ts` |
| 빈 초기값·레코드 → 입력값 | `model/{entity}-form-defaults.ts` |
| 검증된 값 → 저장 입력 mapper | `model/{entity}-form-request.ts` |
| 등록·수정이 공유하는 입력 조립([Fields](#fields)) | `ui/{Entity}Form.tsx` |
| 등록 진입 | `ui/{Entity}CreateScreen.tsx` |
| 수정 진입(레코드 뒤에 폼 mount) | `ui/{Entity}EditScreen.tsx` |

- 등록·수정의 필드·검증이 갈라지면 schema·기본값·mapper 를 각각 선언하고, **공유 필드가 없으면 `{Entity}Form.tsx` 를 만들지 않는다.** 작은 폼은 schema 와 기본값이 한 파일에 있어도 된다 — 나누는 기준은 파일 수가 아니라 등록·수정이 실제로 갈라지는 지점이다.
- 저장 mutation 은 도메인 `api/mutations.ts`, 선택지 훅은 도메인 `api/`. 화면 폴더에 mutation 훅을 만들지 않는다.
- route: 등록은 loader 없음(선택지는 필드가 스스로 연다), 수정은 상세 options 를 `loadRequired` 로 기다린다([router 형태](router.md#형태)). 저장·취소의 목적지는 그 화면의 원장이 말한다.
- 테스트는 파일 수가 아니라 **닫아야 할 동작**으로 고른다: 입력 계약(화면 순서 = schema 키, 빈 제출이 거부하는 필드 집합, mapper 가 UI 전용 필드를 떨어뜨림)과 저장 동작(빈 저장은 첫 오류로 focus 하고 확인창을 열지 않음, 확인 취소는 아무것도 부르지 않음, 확정은 요청 → 완료 → 목적지, 비밀·개인 값이 로그에 없음, dirty 가 이탈 보호를 켬, 선택지 실패의 필드 재시도, 수정의 읽기 전용·종속 값·없는 ID).

## Verification

바뀐 것만: 검증 문구와 focus, 확인·완료 쌍, 서버 필드·root 실패 배치, 기준선 갱신과 guard 해제, 종속 선택지, 취소·이탈 각 경로. 브라우저 증거는 어떤 값을 넣어 무엇을 눌렀고 어디로 갔는지를 적는다.
