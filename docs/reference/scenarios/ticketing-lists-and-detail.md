# 시나리오 카드 — 발권 목록과 겹친 상세

발권 목록의 lookup·종속 선택·결제 범위·summary와 다섯 variant의 서로 다른 action, 상세 안의 자식 목록·
인라인 폼을 대조한다. 화면별 적용 결론은 #10·#11·#30이 갖는다.

표기: `[확인]`은 2026-09-04 Figma 전수 판독과 정정된 인벤토리, `[추론]`은 그 사실에서 나온 설계,
`[미확인]`은 6절이다. 모든 실행은 호출 직전에서 멈춘다.

## 1. 이 시나리오가 요구하는 것

발권 목록은 `공연 검색 *` lookup 뒤 `공연일 *`을 고른다. 회차 표기는 `{n}회차 {시작} ~ {종료}`이고
전체발권 `129:32748`에는 결제금액 `0~200,000` 양끝 handle이 실재한다
([06-ticketing.md](../zero-sol/06-ticketing.md):9-16). summary는 총·대기·완료·재발권·분실 다항목이다. `[확인]`

다섯 variant는 공통 목록이 아니다. 전체는 발권취소·분실, 대기는 발권완료, 신규·재발권은 발권취소·분실,
분실은 상태변경 없음이며 날짜·추가 정렬 축도 다르다(:19-25). 발권 조회는 읽기 섹션, 입장정보 자식
목록, 회원상담 인라인 폼, 이력을 한 화면에 겹친다(:51-57). 스마트프린터에는 `선택복사`가 있다(:43-47). `[확인]`

## 2. 상태와 전이

| 상태 | 소유자 |
| --- | --- |
| 선택한 공연과 확정된 공연일 | 검색 화면 feature; 공연 변경 시 종속값 clear |
| 결제금액 두 handle draft | 해당 필터 component |
| 커밋된 필터·variant별 sort·page | 각 route search |
| summary facts | Query 결과의 feature projection |
| 발권 상세·자식 목록 | 부모 ID query / 독립 child query |
| 회원상담 값·dirty·검증 | 상세 안 인라인 form |

```text
공연 lookup 확정 → 기존 공연일 clear → 공연일 option 선택
  └ 미충족 → 검색 차단 문구(문구 미확인)
공연·공연일 + 필터 draft 확정 → 검색 호출 직전
summary 상태 항목 활성화 → 해당 filter·page reset 입력 확정 → 검색 호출 직전
행 선택 → variant가 허용한 변경 intent 또는 다운로드 범위 확정 → 호출 직전
상세 상담 입력 → 검증 → 저장 호출 직전
선택복사 → 선택 1개 이상 검증 → 복사 입력 확정 → 호출 직전
```

## 3. 추론한 실패 위험

| 무엇이 깨질 수 있나 | 왜 | 차단 규칙 |
| --- | --- | --- |
| `[추론]` 공연을 바꿨는데 이전 공연일로 검색 | 종속값을 별도 상태로 남김 | 선행 lookup 변경과 같은 event에서 종속값을 clear한다 |
| `[추론]` 분실 화면에 상태변경이 노출됨 | 전체발권 cascade를 다섯 route에 복사 | action·sort 집합을 variant별 typed source로 둔다 |
| `[추론]` summary 클릭과 URL filter가 갈림 | count 표시가 자기 필터 상태를 소유 | feature가 controlled mapping과 page reset을 한 번에 수행한다 |
| `[추론]` 자식 목록 오류가 상세 전체를 덮음 | 부모·자식 query outcome을 합침 | child pending/error/retry는 해당 섹션 안에 둔다 |

## 4. 처음부터 알았다면 이렇게 설계한다

다섯 목록은 각각 route 정체성과 typed 필터·정렬·action 집합을 가진다. list mechanic만 공유하고 cascade나
권한을 공용 `mode`로 만들지 않는다. 결제 slider는 관찰값 `0~200,000`만 표시하며 단위·step·request
mapping을 추측하지 않는다. `[추론]`

lookup은 feature-local draft/commit이며 공연이 확정된 뒤에만 공연일 option query 조건이 생긴다. 종속값이
없으면 호출하지 않는다. summary는 구현된 `ResultSummary.groups`를 채택하고, 상태 항목의 activation만
다섯 shared 후보 중 하나로 남긴다. `[확인]`

상세의 표면은 collection kind별로 분리한다. 부모 facts는 kind A, 필터·paging이 있는 입장정보는 kind C,
회원상담은 독립 인라인 form이다([table-composition.md](../../../.agents/skills/feature-contract/references/table-composition.md):11-17,23). `[추론]`

## 5. 우리 공용 계약과의 대조

| 요구 | 현재 계약 | 판정 |
| --- | --- | --- |
| 공연일 종속 선택 | option prerequisite와 clear를 feature가 소유 | 커버됨 — [form-workflow.md](../../../.agents/skills/feature-contract/references/form-workflow.md):16 |
| 결제금액 slider | 관찰 1건, min/max 외 계약 없음 | 아직 판정 불가 — 추가 판정 없음 |
| 다항목 summary | `ResultSummary.groups` 구현 | 채택 — [list-result.md](../../../.agents/skills/shared-ui-contract/references/list-result.md):10 |
| 상태 count 클릭 | 다섯 shared 후보 중 하나 | 후보 유지 — [primitives-and-tokens.md](../../../.agents/skills/shared-ui-contract/references/primitives-and-tokens.md):24 |
| 행 클릭 조회 | 다섯 shared 후보 중 행 활성화 | 후보 유지 — primitives-and-tokens.md:23 |
| 상세의 자식 목록·인라인 폼 | kind 분리와 form adapter가 이미 소유 | 커버됨 — table-composition.md:11-19, form-workflow.md:19 |
| 선택복사 | 선택 검증·payload는 feature 소유 | 커버됨 — [bulk-actions.md](../../../.agents/skills/feature-contract/references/bulk-actions.md):3-9 |

## 6. 미확인

1. 공연일 미충족 차단 문구, option 실패 표면과 서버 식별자.
2. 결제금액 단위·step·최대값의 제품 근거와 request mapping.
3. 상태 count 클릭이 실제 필터 적용인지, 적용한다면 URL key와 page reset 규칙.
4. 분실 checkbox가 다운로드 선택만 위한 것인지.
5. 발권 상세의 자식 목록 endpoint·안정 ID와 인라인 상담 저장 계약.
