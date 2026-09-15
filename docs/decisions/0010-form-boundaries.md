# 0010. 폼 공용화 경계와 검증 근거

- 상태: 채택 — 공용화의 이유와 재검토 조건. 특정 도메인의 구현 가이드가 아니다.
- 최초 결정: 2026-09-01. 저장 조립 개정: 2026-09-03. 보호 범위 재결정: 2026-09-14.
- 관련 결정: [공용 경계](0009-shared-boundaries.md), [primitive 선택](0008-primitive-implementation-selection.md), [상세 데이터 경계](0011-detail-data-and-update-history-boundaries.md).

## 책임

이 ADR은 왜 같은 동작을 공유했고 어떤 반증이면 좁히는지만 소유한다.
필드·파일·호출 방법과 최신 제품 정책을 여기서 다시 정의하지 않는다.

| 판단할 것 | 정본 |
| --- | --- |
| 입력·검증·조건부 값·저장·취소 적용 | [form-workflow](../../.agents/skills/feature-contract/references/form-workflow.md) |
| typed field·어댑터·저장 및 guard API | [form-fields](../../.agents/skills/shared-ui-contract/references/form-fields.md) |
| 파일 배치·import 방향 | [folder-structure-contract](../../.agents/skills/folder-structure-contract/SKILL.md) |
| progress·읽기 섹션·대화상자 | [blocking-progress](../../.agents/skills/shared-ui-contract/references/blocking-progress.md), [disclosure-sections](../../.agents/skills/shared-ui-contract/references/disclosure-sections.md), [dialogs](../../.agents/skills/shared-ui-contract/references/dialogs.md) |
| 실제 필드·문구·권한·보호 대상·저장 목적지 | [제품 근거 진입점](../reference/product.json)이 연결한 해당 제품 원장 |
| 실제 구현과 수용 상태 | 해당 소비자 코드·테스트·시나리오. 소비자 구현 자체는 공용 기준이 아니다 |

## 결정과 이유

1. **같은 입력 전이와 실패 복구만 공유한다.** 스키마·기본값·mapper·필드·선택지·조건부 정책은 소비 workflow에 남겼다. 화면의 필드 차이를 mode나 descriptor로 숨기면 입력 타입과 서버 계약이 합집합으로 번지고 추적 비용이 증가했다. 공통 표시가 있다는 이유로 검증·저장까지 합치지 않았다.
2. **입력 오류 노출과 저장 결과를 분리한다.** 오류 노출의 반복은 입력 UI adapter에 남기고, 성공/실패·기준선·완료 이동은 실제 저장 workflow로 돌린다. 미연결 요청도 보호·오류 노출을 재사용할 수 있으며 부모 보호·inline·blur 검증을 저장 쌍에 억지로 맞추지 않는다. 순서 보존은 입력과 실제 소비자의 기존 전이 테스트로 검증한다.
3. **입력 값은 Form, 오류·접근성 연결은 어댑터가 소유한다.** TanStack Form과 Zod Standard Schema는 설치된 타입으로 필드 경계를 확인할 수 있었다. primitive는 폼 라이브러리를 모르며, Query는 옵션·서버 응답만 소유한다. 실제 transformed output의 생성은 workflow 책임으로 남겼다.
4. **보호의 기계적 동작과 제품 대상 범위를 분리한다.** 여러 폼의 dirty/pending 사실은 하나의 provider가 집계하지만 값·목적지는 복제하지 않는다. 2026-09-07의 화면 종류 중심 제한은 2026-09-14의 입력 손실 중심 사용자 결정으로 대체됐다. 현행 대상·제외와 문구는 제품 원장, 적용 방법은 form-workflow가 소유한다. 이전 대상 목록을 공용 계약이나 새 제품에 이식하지 않는다.
5. **반복 입력과 순서 변경도 책임을 분리한다.** typed array mechanic은 Form의 값 변경만, 정렬 mechanic은 센서·handle·접근성·이동 계산만 소유하도록 결정했다. row factory·identity·검증·표시는 feature에 남겼다. editable DataTable이나 schema renderer를 만들 근거가 아니었다.
6. **진행 표면은 요청의 역할로 구분했다.** 확인된 공통 진행 표면은 app shell이 소유하고, 관찰 중인 진입 primary Query·mutation과 마운트 이후 content 전이·보조 옵션을 구별했다. 예열·lookup까지 overlay로 덮으면 화면 workflow와 보조 데이터가 결합되므로 제외했다. 현재 progress API와 상세 loader의 대기 표면은 각 계약이 소유한다.

## 보존할 실측 근거

아래는 당시 비교·재현의 기록이다. 현재 실행 결과나 신규 제품 수용을 뜻하지 않는다.

| 관찰한 실패·차이 | 설계에 남긴 이유 | 현재 검증 소유자 |
| --- | --- | --- |
| 닫힌 섹션의 필드가 사라져도 전체 입력 검증은 제출을 차단했으나 오류와 focus가 보이지 않았다. 필드 unmount는 오류 map도 비웠다 | 폼 섹션의 mount 유지와 같은 오류 원천의 badge·reveal·focus가 필요했다. 재마운트 후 재검증 보상 절차는 폐기했다 | [입력 feedback 테스트](../../src/shared/ui/form/useSaveForm.test.tsx), [섹션 계약](../../.agents/skills/shared-ui-contract/references/disclosure-sections.md) |
| 제출 전용 validator만 연결하면 blur/change 뒤 오류가 사라졌다 | 첫 제출 뒤 같은 스키마로 change 재검증하는 연결을 선택했다. 재파싱으로 별도 오류 집합을 만드는 안은 폐기했다 | [필드 테스트](../../src/shared/ui/form/FormField.test.tsx), form-workflow의 검증 연결 |
| Standard Schema 성공 output은 submit values를 치환하지 않았다 | UI 입력 타입과 검증 output·요청 mapper 경계를 분리했다 | form-fields와 소비 schema·mapper 테스트 |
| form-level 서버 오류는 당시 Form 타입과 맞지 않았고, field 서버 오류는 일반 검증으로 지워지지 않았다 | root 실패 stage와 field 오류를 분리하고 다음 제출에서 서버 오류를 다시 판단하도록 했다 | 저장 전이 테스트 |
| 최초 defaults를 계속 전달한 채 reset하면 값이 되돌아갔고, 같은 폼에서 resource가 바뀌면 값이 섞일 수 있었다 | 성공 값·기준선과 resource identity 변경을 하나의 소유자가 갱신한다. 현재 reset API는 form-fields가 소유한다 | 저장 전이 테스트 |
| pending overlay 아래의 이탈 질문은 조작할 수 없었다 | pending 이탈을 조용히 거부했다. 브라우저 이탈은 native 경고라는 별도 경계로 남겼다 | [Router 보호 테스트](../../src/shared/ui/form/UnsavedChangesGuard.router.test.tsx) |
| 두 dirty 폼의 Router 질문이 순차로 두 번 나타났다 | 단일 blocker/provider가 사실만 집계하도록 바꿨다. provider 없는 별도 Router fallback은 두지 않았다 | Router 보호 테스트, [중첩 폼 테스트](../../src/shared/ui/form/UnsavedChangesGuard.integration.test.tsx) |
| 배열 입력에서 행 조작과 값·오류·순서의 소유자가 달라질 수 있었다 | typed array와 순서 이동을 조합하고 안정 identity·최소 개수 정책은 caller에 남겼다 | [배열 필드 테스트](../../src/shared/ui/form/FormArrayField.test.tsx) |

오류 시 접기 금지, 상단·필드·헤더의 중복 오류 표현, pending 가드를 끄고 effect로 이동하는 안은 각각 사용자 제어·표현·순서 소유 문제로 거부했다. 실제 control과 설치 버전의 동작이 바뀌면 이 근거도 재측정한다.

## 검증의 한계

첫 소비자는 공통 입력과 다른 입력·검증을 분리할 수 있다는 근거였을 뿐 필수 화면 구조가 아니었다.
mock·리허설 API·요청 callback 도달은 실제 저장 성공·권한·enum 의미·파일 생성·후속 이동을 증명하지 않는다.
제품·서버 계약의 미확인은 해당 원장과 실제 소비자의 sentinel·테스트에서 확인하며, 다른 화면으로 채우지 않는다.
읽기 섹션·lookup·진입 progress·로컬 취소·Router 이탈은 다른 책임이므로 한 화면 controller로 합치지 않았다.

## 재검토 조건

- 새 실제 소비자에서 같은 입력·상태 전이·실패를 유지할 수 없거나 shared가 도메인·Query·endpoint·permission·mode를 요구하면 좁히거나 feature-local로 되돌린다.
- 설치 버전·실제 control의 동작이 위 관찰을 반박하면 해당 mechanic과 테스트를 함께 재측정한다.
- 제품 정책이나 서버 계약이 확정·변경되면 해당 소유자와 소비 workflow를 고친다. 이 ADR에 새 구현 recipe나 대상 목록을 덧붙이지 않는다.
