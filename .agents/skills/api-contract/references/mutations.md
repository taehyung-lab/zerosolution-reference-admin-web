# Mutations and cache consequences

Read this file only for mutation payloads, invalidation, exact cache updates, optimistic behavior, retry, field-error handoff, or a write whose server contract does not exist yet.

## Declaration

`features/{domain}/api/mutations.ts` exports one `mutationOptions` factory per write. The factory takes `locale` only; everything the request needs — the target id, the settings, the selected ids — travels in the mutation **input**, so one factory serves every screen that performs that write.

```ts
export function update{Entity}Mutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: ({ id, settings }: { id: string; settings: {Entity}Settings }) => …,
    meta: { invalidates: [{entity}QueryKeys.{entity}s(locale)] },
  })
}
```

- The screen runs it with `useMutation(update{Entity}Mutation(locale))` and calls `mutateAsync(input)` from `useSaveForm.save.run`, `useConfirmation.run`, or an action form. No workflow mutation hook sits between the screen and the factory.
- Request mapping (`to{Entity}Settings(values)`) stays beside the form/model that produced the values.
- `retry: false` is the client default for mutations; do not retry automatically.
- Generated operations may be called only from `features/*/api` and `src/api` (ESLint).

## Cache consequence

The mutation declares what its success makes stale in `meta.invalidates: QueryKey[]`; the app `MutationCache.onSuccess` invalidates those keys. A screen never wires `onSuccess` invalidation by hand, so a forgotten invalidation cannot leave a list showing a record the user just changed.

- Enumerate the affected families. A domain records prefix (list + detail, not options) is the usual key; a root key is allowed only when it is the confirmed aggregate family and narrower membership is unknowable. Record the reason on the key factory.
- Prefer invalidation over an exact cache write. An exact update or optimistic write requires a material UX benefit, a rollback test, and the real server response shape.
- The calling screen owns navigation, dialog closure, acknowledgement copy, and focus after success ([form](../../feature-contract/references/form.md#save-lifecycle), [detail Actions](../../feature-contract/references/detail.md#actions), [list Selection and actions](../../feature-contract/references/list.md#selection-and-actions)).
- Field errors are normalized by transport into `ApiError.fieldErrors` and classified for the form by `classifyFormError`; transport does not know the form.

## 시나리오 요청

서버 계약이 아직 없는 쓰기는 `mutationFn: scenarioRequest<TInput>('업무 이름')`(`src/api/scenario.ts`)이다. 이 함수는 `[시나리오] <업무 이름>: 요청 입력 확인 → API 연결 대기` 한 줄을 `console.log` 하고 resolve 한다. 그래서 화면은 실서버와 **같은 성공 경로**를 끝까지 돈다 — 저장 완료 alert, `meta.invalidates` 무효화, `onDone` 이동. API 가 생기면 그 factory 의 `mutationFn` 본문만 교체하고 화면·확인 흐름·테스트는 바뀌지 않는다.

- 업무 이름은 한글 고정 문자열이다. 대상 ID·입력 객체·비밀번호·연락처·사유를 로그에 싣지 않는다. 종류가 여러 개인 액션 mutation 은 종류 → 이름 map 하나를 두고 `scenarioRequest(labels[input.type])(input)` 로 부른다.
- 폼·선택·확인을 통과한 입력만 이 함수에 닿는다. 검증 실패·미선택·확인 취소에서는 로그가 없고, 최종 확인에서 한 번 기록된다. 중간 전달 함수나 공용 Confirm 에 중복 로그를 두지 않는다.
- callback 생략·빈 함수·`reject` 로 미연결을 표현하지 않는다. 조회 전용 surface 처럼 액션이 없는 경우와는 타입으로 구분한다.
- 테스트는 `vi.spyOn(console, 'log')` 로 그 한 줄을 단언하고 입력 값이 로그에 없음을 함께 단언한다.

### 시나리오 상태와 관찰 범위

상태 어휘와 정의는 [도달 상태](../../screen-loop/SKILL.md#도달-상태)가 소유한다. 여기는 각 상태를 주장하려면 어디까지 관찰해야 하는가만 적는다.

- **시나리오 확정됨** — 검색은 조건 조립·URL 커밋·요청 전 검증까지, 저장은 폼 검증·확인 alert·검증된 업무 입력 조립과 요청 함수 호출까지. 상세는 그 화면의 모든 최종 액션(행 액션, 다이얼로그 열기/선택/반환, 탭 이동, 인라인 저장, 선택 삭제)을 빠짐없이 포함한다.
- **시나리오 구현 완료** — 미연결 액션을 브라우저에서 최종 확인까지 눌러 요청 함수의 `console.log` 한 줄과 그 뒤 전이(완료 alert·이동)를 관찰한다. 검색·이동·다이얼로그 선택 같은 내부 전이는 실제 URL 과 화면 상태로 확인한다. 목록·상세 fixture 응답의 성공은 등록·수정의 성공 증거가 아니다.
- 실서버 이후 동작(권한·enum 의미·실패 코드)은 별도 미확인으로 남긴다. 신규 API 연결 시 `mutationFn` 을 교체하고 이관 sentinel 을 해소한다.

Read [query-cache.md](query-cache.md) only when defining or changing key families or query identity; consuming an already exported key does not require the whole query reference.
