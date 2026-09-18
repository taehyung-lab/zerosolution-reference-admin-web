---
name: form-contract
description: >
  등록·수정 폼의 저장, 확인·완료, 검증 실패와 focus, 서버 필드 오류, dirty 이탈, 취소를 바꿀 때 사용한다. 필드·필수값·문구는 product-evidence, 반복 행은 collection-contract로 보낸다.
---

# 역할 계약 — 폼 (등록·수정)

**답하는 질문**: 등록·수정 한 쌍에서 저장 lifecycle·필드·취소·이탈을 누가 소유하고, 무엇을 봐야
그 변경이 닫히는가.

**담지 않는 것**: 어떤 필드가 있고 무엇이 필수이며 문구가 무엇인가 — 그것은 그 화면의 fact 다.
파일이 어디 놓이는가 — `.agents/skills/source-structure/SKILL.md` 다.

## 소유

| 값 | 소유자 |
| --- | --- |
| 입력 값·dirty·필드 오류 | TanStack Form (`useSaveForm` 이 만든 `form`) |
| 입력 schema·기본값·요청 mapper | `model/` 세 선언. 등록·수정이 다르면 각각 선언하고 공통 조각만 공유 |
| 저장 단계(확인 → 저장 → 완료), 잘못된 제출의 reveal·focus, 서버 필드 오류 배치, dirty 이탈 보호 | `useSaveForm` |
| 서버 실패 분류 | `classifyFormError(error, fieldOrder)` → `{ fields, root? } \| undefined` |
| 저장 mutation | 도메인 `api/mutations.ts` |
| 저장·취소의 목적지 | route 가 `onSaved`·`onCancel` 에 navigate 를 넣는다. 어디로 가는지는 fact |

값은 전부 문자열이다 — `Select` 의 빈 선택은 `''` 이어야 schema 가 placeholder 상태를 거부할 수
있다. 검증 문구는 schema 안에 있고 필드 어댑터가 그린다. **필드·필수·길이·문구는 fact 에서 읽고
형제 화면에서 복사하지 않는다.**

## 저장 lifecycle

```ts
const save = useSaveForm({
  schema,                       // z.ZodType<TOutput, TInput>
  defaultValues,                // TInput
  sections: { info: fieldOrder },
  save: { run: (values) => mutateAsync(toSettings(values)), isPending },
  mapError: (error) => classifyFormError(error, fieldOrder),
  onDone: onSaved,
});
```

- 반환: `form`, `sections.sectionProps(section)`, `stage`, `guard`, `submit.{run, isPending}`,
  `dialogs`(이탈 질문 + 저장 확인/완료 쌍 — **한 번**만 렌더).
- 제출: `form.handleSubmit()` → 유효하면 `stage: confirming`(저장 확인) → 확인 → `save.run(parsed)`
  → 성공 → 기준선 갱신 → `stage: saved`(완료 alert) → 확인 → `onDone()`. 취소는 idle 로 돌아가고
  아무것도 부르지 않는다.
- 검증은 `validators: { onDynamic: schema }` + `revalidateLogic()` 이다(제출에서 검증, 첫 거부 뒤
  change 마다 재검증). 잘못된 제출은 **선언 순서의 첫 오류 필드를 연 뒤 focus** 한다. 확인창은
  열리지 않는다.
- 실패: `mapError` 가 `fields` 를 주면 그 필드에 `onServer` 문구(다음 제출 시작에 지운다), `root` 를
  주면 폼 위에 한 줄. `undefined` 면 표시 없음. 입력·기준선은 유지한다.
- 성공 기준선: `save.getDefaultValues(result)` 가 있으면 그 값, 없으면 제출 snapshot. 그래서 완료
  뒤 guard 가 풀린다.
- 수정은 상세 상태 경계 안에서 `key={record.id}` 로 폼을 mount 한다 — 조회가 성공한 뒤에만 폼이
  있고 refetch 가 초안을 덮지 않는다.
- 미연결 mutation 은 **같은 성공 경로**를 끝까지 돈다(완료 alert → 이동, 무효화). 미연결이라는
  이유로 성공·이동을 빼거나 다른 lifecycle 을 mode 로 만들지 않는다.

## 등록·수정의 갈림이 도구를 고른다

형태를 먼저 정하고 차이를 밀어 넣지 않는다.

| 등록·수정의 차이 | schema | 도구 |
| --- | --- | --- |
| 없다 | 1개 | 없다. 한 폼을 그대로 공유한다 |
| 필드별 `disabled` 나 문구만 다르다(자리 수 무관) | 1개 | `mode` prop 을 받아 그 필드에서 읽는다 |
| 한쪽에만 있는 필드가 있고 화면 순서상 **한 자리**에 모인다 | 2개 | `children` 자리에 그 필드군을 넣는다 |
| 한쪽에만 있는 필드가 화면 순서상 **여러 자리**로 흩어진다 | 2개 | 등록·수정 폼을 나눈다 |

- `readOnly` 는 schema 를 가른다. 읽기 전용 어댑터는 `form`·`name` 을 받지 않는 배타 오버로드라,
  읽기 전용이 되는 필드는 입력 값이 아니라 **레코드에서 온 정적 표시**가 된다. `disabled` 는
  필드가 폼에 묶인 채로 꺼진다.
- `children` 을 쓰는 폼의 props 는 `{ save, children, onCancel }` 다. 한쪽에만 있는 필드는
  **호출 화면이** 그린다 — 그 화면만 자기 입력 타입을 알기 때문이고, 공유 조립은 공통 부분집합만
  알면 된다. 구멍을 둘 이상 뚫지 않는다; 그 요구가 나오면 위 표의 마지막 행이다.
- 한쪽만 있는 제품이면 그 한쪽 Screen 만 두고 공유 조립 파일을 만들지 않는다.

## 필드

- 렌더 순서: `{save.dialogs}` → `<form noValidate onSubmit={preventDefault + save.submit.run()}>`
  → 실패면 폼 위 한 줄 → 섹션 안에 필드들 → 제출 버튼 + 취소 버튼(`save.guard.leave(onCancel)`).
- 어댑터 집합은 `.agents/skills/shared-ui/SKILL.md` 의 Form 행이 소유한다. 다른 이름의 별칭은 만들지
  않는다.
- 서버 선택지는 `{ state, items, retry }` 를 그대로 넘긴다. 종속 선택지는 훅의 `enabled` 로 선행
  조건을 표현하고, 종속 값 비우기는 그 필드의 `onValueChange` 에서 한다 — effect 가 아니다.
  선택지를 별도 훅에서 가져올지 이미 받은 레코드에 실을지는 **그 값의 수명이 레코드와 같은가**로
  정한다: 레코드마다 달라지면 레코드와 함께, 화면과 무관하게 고정이면 별도 훅이다.
- 조건부 필드군: 제품이 숨긴 입력의 복원을 요구하면 값은 부모 폼에 두고 가시성만 바꾼다. schema 가
  authoritative 상태로 검증하고 mapper 가 확정 입력만 싣는다. **복원을 요구하지 않으면 값을
  명시적으로 비운다.**
- 반복 행은 배열 필드 어댑터 + 표 primitive. row factory·stable id·최소 개수는 그 화면이 정한다.
  **배열 index 를 행 정체성으로 쓰지 않는다** — 삭제 뒤 오류가 다른 행으로 옮겨간다.
  반복 행의 개수는 폼 상태이고 `sections` 는 폼 생성 전에 정적으로 넘긴다. 그래서 행 오류는 그 행에서
  드러나되 섹션 요약·첫 오류 focus 에는 들어가지 않는다. 이 한계를 우회하려고 행 수를 화면 상태로
  복제하지 않는다.
- 길이 상한은 입력의 `maxLength` 로 막고 schema 는 `.max()` 만 둔다. 상한 초과 문구를 새로 만들지
  않는다 — fact 가 그 문구를 주지 않으면 제품이 그 오류를 표시하지 않는다는 뜻이다.
- blur 에서도 알려야 하는 불일치는 `validators.onBlur` 에 필드 하나만 더한다.

## 취소와 이탈

- 보호 대상은 앱의 unsaved-changes provider 아래 등록된 모든 페이지 폼이다. `useSaveForm` 이
  `{ when: isDirty && !isDefaultValue, refuseSilently: isPending }` 로 등록하고 그 질문을
  `dialogs` 안에 그린다.
- 명시적 취소는 `save.guard.leave(onCancel)`: clean 이면 바로 나가고, dirty 면 취소 문구로 묻고
  승인 시 한 번 실행한다. 일반 route 이동은 provider 의 blocker 가 이동 문구로 묻는다. 저장 중
  이탈은 조용히 거부하고 브라우저 이탈은 native 경고다.
- 다이얼로그 안의 입력 폼은 자기 guard 와 `guard.close(onClose)` 로 취소·×·Escape·바깥 클릭을 같은
  정책으로 묶는다.
- 폼 안의 탭은 가장 가까운 컴포넌트의 표시 상태다. 비활성 탭의 실패 필드도 접힌 섹션처럼 드러낸다.

## 형태

**책임이 있으면 이 이름·이 자리에 둔다. 없으면 파일도 없다.** 등록·수정 어느 한쪽만 있어도 폴더는
같은 이름을 쓴다.

| 책임 | 있으면 이 자리 |
| --- | --- |
| 입력 schema 와 화면 순서 | `model/{screen}-schema.ts` |
| 빈 초기값 · 레코드 → 입력값 | `model/{screen}-defaults.ts` |
| 검증된 값 → 저장 입력 mapper | `model/{screen}-request.ts` |
| 등록·수정이 공유하는 입력 조립(위 표의 3행일 때만) | `ui/{Screen}Form.tsx` |
| 각 진입 | `ui/{Screen}CreateScreen.tsx` · `ui/{Screen}EditScreen.tsx` |

작은 폼은 schema 와 기본값이 한 파일에 있어도 된다 — 나누는 기준은 파일 수가 아니라 등록·수정이
실제로 갈라지는 지점이다. 저장 mutation 은 도메인 `api/`, 화면 폴더에 mutation 훅을 만들지 않는다.

## 이 역할의 검증 대상

이 계약을 읽었으면 아래가 그 변경의 검증 대상이다. **바뀐 것만** 본다.

| 축 | 무엇을 확인하나 |
| --- | --- |
| 검증 | 빈 제출이 거부하는 필드 집합, 첫 오류의 열림과 focus, 확인창이 **열리지 않음** |
| 저장 | 확인 → 요청 도달 → 완료 → 목적지. 확인 취소는 아무것도 부르지 않음 |
| 실패 | 서버 필드 오류의 배치와 root 한 줄, 입력·기준선 유지 |
| 기준선 | 저장 완료 뒤 dirty 해제(이탈 질문이 더 이상 안 뜸) |
| 이탈 | dirty 취소 질문, 일반 이동 질문, 저장 중 조용한 거부 |
| 조건부·종속 | 선행 조건이 없을 때 비활성, 선행이 바뀌면 종속 값이 비워짐 |
| 반복 행 | 추가·삭제 후 값과 오류가 **행을 따라감**, 최소 개수 |
| 로그 | 비밀·개인 값이 로그에 없음 |

브라우저 증거는 **어떤 값을 넣어 무엇을 눌렀고 어디로 갔는지**를 적는다. 실측한 것 중 되돌아올
전이 하나를 `tests/e2e/` 에 회귀 앵커로 남긴다(단언은 제품 동작만, fixture 값 금지).

테스트는 파일 수가 아니라 **닫아야 할 동작**으로 고른다: 입력 계약(화면 순서 = schema 키, 빈 제출이
거부하는 집합, mapper 가 UI 전용 필드를 떨어뜨림)과 위 표의 저장 동작.
