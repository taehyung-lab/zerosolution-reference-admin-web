# 시나리오 카드 — 운영자 목록·상세·등록·수정

제품 사실은 [설정 원장](../zero-sol/11-settings.md)의 각 `11.1 운영자` 절이 소유한다. 별도 접근권한 관리
화면의 matrix·정책·로그 계약은 운영자 화면에 합치지 않는다. 운영자 목록의 권한 필터와 등록·수정의 권한
선택은 각 화면 자체의 option-source 계약이므로 포함한다.

## 1. 이 시나리오가 요구하는 것

- 목록은 검색 gate, URL 복원, 독립 option Query, 결과·오류·재시도, 선택 상태 변경과 상세 이동을 연결한다.
- 상세는 query 결과와 다섯 상태별 action을 연결하되, 미연결 서버 성공을 가장하지 않는다.
- 등록과 수정은 필드 mechanic을 공유하되 route, 초기값, 아이디 편집 가능 여부, mutation을 각각 소유한다.

## 2. 상태와 전이

### 목록

surface: `manager-list`

```text
route search 해석 → 검색 전 또는 조회 → 결과·오류·재시도
filter draft 변경 → 검색 확정 → URL commit → page 1 → query
행 선택 → 허용 상태 검증 → 확인 → 변경 intent
행 클릭 → 선택한 ID의 상세 route
```

빈 URL은 검색 전이며, 명시적으로 확정한 기본 검색은 `searched=true`로 복원한다. 권한 옵션은 독립 Query의
loading·error·retry를 가진다. 일괄 상태 변경은 대기·거절·잠금 대상을 허용된 대상으로 확대하지 않는다.

### 상세

surface: `manager-detail`

```text
route ID → 상세 query → loading | error/retry | 상태별 상세
상태별 action → 입력·검증 → 확인 → ID와 입력값을 요청 경계로 전달
```

대기·거절·활성·비활성·잠금은 서로 다른 action 집합을 가진다. 개인정보 공개·탈퇴·비밀번호 변경·잠금
해제는 성공을 가장하지 않고 현재 확인된 요청 입력까지만 닫는다. 이력 응답은 feature가 표시 문자열로
변환하고 공용 표에는 날짜·변경 줄·행위자만 전달한다.

### 등록

surface: `manager-create`

```text
option query → 빈 form 입력 → client 검증 → 저장 확인 → create 입력 전달
dirty 상태에서 취소·뒤로가기 → 이탈 확인 → 유지 또는 route 이동
```

유형 변경 시 종속된 권한 선택을 초기화한다. 등록 route와 빈 초기값, create 입력, 취소 목적지를 검증한다.

### 수정

surface: `manager-edit`

```text
상세 query → form 초기값 → client 검증 → 저장 확인 → update 입력 전달
dirty 상태에서 취소·뒤로가기 → 이탈 확인 → 유지 또는 상세 route 이동
```

아이디는 읽기 전용이며 기존 값으로 초기화한다. 수정 route와 update 입력, 상세 복귀 목적지를 검증한다.

## 3. 실패 증거와 위험

| 위험 | 차단 기준 |
| --- | --- |
| 목록의 권한 option 실패가 빈 목록처럼 보임 | option Query의 loading·error·retry를 독립 렌더 |
| 상태 변경 불가 행이 mutation 입력에 포함됨 | 선택 검증 뒤 허용된 ID만 확인 단계로 전달 |
| 상세 action이 fixture 성공을 실제 서버 성공으로 표현 | 요청 입력 도달까지만 상태를 닫고 후속 성공 UI를 만들지 않음 |
| 등록과 수정의 차이를 하나의 mode가 숨김 | route·defaults·mutation은 각 screen, 공통 필드만 form component |

## 4. 처음부터 알았다면 이렇게 설계한다

Router search가 복원할 화면 상태, Query가 서버 데이터·option·cache, TanStack Form이 입력과 검증, 가장 가까운
화면 component가 확인 dialog와 일시 선택을 각각 한 번만 소유한다. 공용 UI는 완성된 label과 actor 문자열을
받으며 운영자 status·permission·endpoint를 알지 않는다.

## 5. 우리 공용 계약과 검증

### 목록 검증

surface: `manager-list`

list workflow·filter/result/table mechanic을 적용하고 URL 복원, 검색 gate, option 실패·재시도, 선택 검증,
상세 이동을 확인한다.

### 상세 검증

surface: `manager-detail`

required query·detail state·UpdateHistory·dialog를 적용하고 query 실패·재시도, 다섯 상태별 action,
입력 취소·검증·요청 payload를 확인한다.

### 등록 검증

surface: `manager-create`

form workflow·option Query·unsaved guard를 적용하고 option 전이, 필드 검증, 저장 확인, dirty 이탈,
create 입력을 확인한다.

### 수정 검증

surface: `manager-edit`

form workflow·option Query·unsaved guard를 적용하고 초기값, 필드 검증, 저장 확인, dirty 이탈,
update 입력을 확인한다.

fixture와 mock으로 확인한 호출 직전 결과를 실제 서버 수용이나 이관 완료로 보고하지 않는다.

## 6. 미확인

1. 실제 option 식별자와 사용 상태 계약.
2. 아이디 중복 검사의 endpoint·응답 의미.
3. create/update 성공 응답과 정확한 cache consequence.
4. 권한 payload와 서버 validation field mapping.
