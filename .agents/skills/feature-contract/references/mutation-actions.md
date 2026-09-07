# Mutation actions and feedback

Read this file for mutation pending/result, confirmation, alert, toast, dialog closure, or post-success navigation.

## Ownership

The feature mutation owns the server call and declared cache consequence. The calling screen owns safe feedback copy, navigation, dialog closure, and focus restoration. Disable the initiating action with `isPending`; do not create a loading store or feature overlay. App-wide progress derives directly from Query/Mutation state when the confirmed product contract requires it.

## Interaction choice

- Consequential yes/no decision: shared Confirm.
- Explicit completion acknowledgement: shared Alert.
- Incidental non-blocking feedback: toast.
- Form or rich interaction: feature composition of the shared Dialog primitive. A dialog that hosts a search/selection table is kind E in [table-composition.md](table-composition.md).

Render dialogs declaratively. Keep intent and open state near the caller. Confirmation does not catch and hide mutation errors, and pending cannot be bypassed by close behavior. Do not create a global imperative confirm service or a hook returning hidden JSX.

Do not infer the destination or feedback channel from a generic “success” label. Product policy determines whether success stays, returns, enters detail, closes a dialog, resets selection, or requires acknowledgement.

Read the API mutation reference when changing payload/cache behavior. Read [form-workflow.md](form-workflow.md) only for form values, validation, dirty state, or field-error mapping.

## 시나리오 상태와 관찰 범위

`AGENTS.md` §4의 완료 단계 중 화면 작업의 두 상태는 여기가 소유한다.

- **시나리오 확정됨** — 그 화면의 모든 상호작용을 업무별 최종 요청 함수 호출과 한글 로그 관찰까지 이슈에
  적고 인벤토리 절과 대조했을 때. 검색은 조건 조립·URL commit·요청 전 검증까지, 저장은 폼 검증·확인
  alert·검증된 업무 입력 조립과 요청 함수 호출까지 다룬다. 상세는 SMS·이메일·개인정보 전체보기·비밀번호
  변경·탈퇴·팝업 열기/선택/반환·tab 이동·인라인 폼 저장·선택삭제를 빠짐없이 포함한다.
- **시나리오 구현 완료** — 구현된 API 미연결 액션을 브라우저에서 최종 확인으로 눌러 업무별 요청 함수를
  호출하고 그 함수의 `console.log`까지 관찰했을 때. 검색·이동·팝업 선택 같은 내부 전이는 실제 URL과 화면
  상태로 확인한다.

그다음 두 상태(**완료**, **이관 검증됨**)는 실 API 연결과 신규 프로젝트 채택 판정이므로 `AGENTS.md`가 소유한다.

## API 연결 전 시나리오 요청

실제 API가 없는 것으로 명시된 작업은 feature의 업무별 요청 함수까지 연결한다. 폼·선택·확인 절차를
통과한 입력을 필수 callback으로 전달하며, callback 생략이나 빈 함수로 구현 누락을 숨기지 않는다.
조회 전용 surface처럼 action 자체가 없는 경우와는 타입으로 구분한다.
확인할 값의 보관·취소·전달은 `useConfirmation`을 쓰고 Confirm UI는 호출부에서 선언한다. 이 훅은 성공 상태를 만들지 않는다.

- 요청 함수는 해당 업무 옆의 `*-requests.ts`에 둔다. 앱 헤더 진입 요청은 `app/shell`이 소유한다. 상태가 없으면 훅을 만들지 않는다.
- 호출부는 업무 이름이 있는 함수를 연결한다. 여러 화면에서 같은 업무를 호출하면 같은 함수를 쓰되,
  회원 ID·활동 ID·검색 범위처럼 실제 요청에 필요한 정체성을 전달한다. 서로 다른 업무를 범용 dispatcher로 합치지 않는다.
- 한글 주석으로 용도·도달 조건·미연결 후속 처리를 밝힌다. 요청 함수는 한글 `console.log`로 업무 이름과
  API 연결 대기를 기록하며 비밀번호·연락처·본문·입력 객체·대상 ID는 출력하지 않는다.
- 최종 확인은 요청 함수를 실제 호출하고 그 함수에서 로그를 한 번 남겨야 한다. 중간 전달 함수나 공용 Confirm에 중복 로그를 추가하지 않는다.
- 로그는 요청 입력 경계의 관찰 증거다. 성공·실패 응답을 만들거나 dirty/선택/서버 데이터를 초기화하지 않는다.
  실제 API가 연결된 업무는 기존 mutation·결과 처리를 유지한다.
- 메시지 작성창처럼 여러 route가 같은 요청을 소비해도 최종 callback은 필수다. 각 호출부에서 업무별 요청
  함수를 명시적으로 전달해 시나리오의 종착점을 드러낸다. 컴포넌트 기본 핸들러로 연결 누락을 숨기지 않는다.
- 브라우저에서 잘못된 입력·미선택·확인 취소는 요청 로그가 없고 최종 입력 확인은 한 번 기록되는지 확인한다.
  입력의 정확성과 대상 결합은 focused test가, 실제 route 연결과 입력 보존은 브라우저가 검증한다.

API 미연결 시나리오의 완료는 검증·확인을 통과한 최종 업무 함수가 호출되고 그 함수의 로그까지 관찰된 상태다.
확인창이 열리거나 닫힌 것만으로 완료로 보지 않는다. 목록·상세 mock 응답의 성공도 등록·수정의 성공 증거가 아니다.
시나리오 목록에는 등록·수정 외에도 메시지 발송·인라인 저장·일괄변경·삭제·다운로드 등 현재 surface의 최종 액션과
각 호출부의 연결·취소·입력 보존 검증 결과를 적는다. 실 API 성공 이후 동작은 별도 미확인으로 남긴다.

신규 API 연결 시 해당 요청 함수를 화면 옆 mutation workflow로 교체하고 이관 sentinel을 해소한다.
검색·이동·팝업 선택 등 이미 URL이나 화면 상태로 관찰되는 내부 전이에 로그용 wrapper를 추가하지 않는다.
