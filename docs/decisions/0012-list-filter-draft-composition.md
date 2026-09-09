# 0012. 목록 필터 초안 조합의 공용화

- 상태: provisional shared 채택 — 기본 primitive의 confirmed 판정을 상속하지 않음
- 날짜: 2026-09-08
- 적용 범위: 동일한 확정 identity를 공유하는 필터·기간·검색어 초안 조합
- 출처: ADR 0009의 2026-09-08 초안 조합 결정을 분리. 결정과 검증 단계는 변경하지 않음
- 상위 경계: [ADR 0009](0009-shared-boundaries.md#소유권-경계)

이 ADR은 조합 훅을 별도 공용 단위로 채택한 이유와 재검토 조건을 소유한다. 목록 전체의 소유권과
단위별 단계 색인은 ADR 0009가, 사용법은 아래 연결된 skill reference가 소유한다.

## 초안 조합 결정

판정: `useListFilterDraft`를 **provisional shared**로 채택한다. 기본 훅의 기존 confirmed 판정을 조합 훅에 상속하지 않는다. 비교 대상은 아래 5개 코드 호출부이며, 리허설이나 같은 업무의 변형을 별개의 독립 제품 요구로 세지 않는다.

| 비교한 호출부 | 공용 조합 밖에 남긴 차이 |
| --- | --- |
| [공연](../../src/features/performances/screens/list/model/usePerformanceListFilter.ts) | 진입 즉시 조회·초기화 대기, `searched: false`, 공연장 검색용 로컬 입력 |
| [활성 회원](../../src/features/members/screens/list/model/useMemberListFilter.ts) | 명시 검색, 회원 URL 변환·첫 페이지 정책 |
| [회원 기록](../../src/features/members/mechanics/record-list/model/useMemberRecordFilter.ts) | 선택된 화면의 필드 집합, 명시 검색/즉시 조회를 정하는 host 정책 |
| [제품 운영자](../../src/features/managers/screens/list/model/useManagerDirectoryFilter.ts) | 제품 schema, 옵션 조회·표시, 명시 검색 표식 |
| [리허설 운영자](../../src/features/managers/screens/list/model/useManagerListFilter.ts) | 서버 keyword 어휘의 양방향 변환, 기존 view 전이·옵션 Query |

공통 책임은 일반 필터·기간·검색어가 같은 확정 identity로 유지·재생성되는 것이다. view 변경은 초안을 보존하고, filter 또는 검색/대기 전환은 함께 재생성한다. 제출은 현재 입력을 먼저 수집하고 기간만 reset하며, 취소 성격의 초기화는 모든 초안을 현재 확정값에서 재생성한다. URL 목적지 선택은 그 다음 feature가 수행한다.

### 채택 이유와 거부한 대안

채택 이유는 다섯 호출부의 `filterKey`·`keyOf`·`createDraft`와 세 초안 reset 복제를 제거하여 같은 전이를 고칠 위치를 줄이기 위해서다. 공용 훅은 기존 primitive를 재사용하며 두 번째 상태 소유자나 별도 URL 저장소를 만들지 않는다. `prepareSubmit`의 필터 투영은 로컬 임시 값이 제출 입력에 섞이는 것을 막는다. 선택 variant에만 있는 필드는 타입에서도 optional이므로 존재하지 않는 입력을 필수로 주장하지 않는다.

거부한 대안은 (1) 복제된 조립을 계속 feature-local로 유지, (2) `preventDefault` 한 줄만 공용 함수로 감싸기, (3) schema·`onChange`·Query까지 받는 submit/reset controller다. 첫째는 같은 상태 전이의 여러 소유자를 남기고, 둘째는 추적 경로만 늘리며, 셋째는 위 표의 제품 차이를 shared로 이동시킨다. 따라서 feature의 정책 소유와 shared의 반복 실행 소유를 구분한다.

### 적용 한계와 재검토 조건

모든 `use*Filter`의 의무 기반 훅은 아니다. 기간·검색어의 수명이 다르면 기본 primitive를 직접 조립한다. 새 차이를 흡수하기 위한 mode·schema·navigation callback이 필요해지면 조합을 좁히거나 demote한다. 옵션 조회, 결과 정렬/페이지 전이, fixture의 서버 모사 로직은 이 조합으로 옮기지 않는다.

### 실행 계약과 검증 범위

사용 API의 단일 출처는 [shared-values의 State mechanics](../../.agents/skills/shared-ui-contract/references/shared-values.md#state-mechanics-sharedlib), 실행 순서는 [list-workflow](../../.agents/skills/feature-contract/references/list-workflow.md#draft-commit)다. [조합 테스트](../../src/shared/lib/use-list-filter-draft.test.tsx)는 view 보존·scope 전환·입력 수집·로컬값 제외·variant·반복 reset을, [소비자 E2E](../../tests/e2e/search-contract.spec.ts)는 URL·기간·history를 대조한다. 이 판정은 제품 전 페이지 감사, 실 API 완료, 신규 제품 이관 또는 전체 검사 무실패 판정이 아니다. 최신 실행 결과는 작업 review가 소유한다.
