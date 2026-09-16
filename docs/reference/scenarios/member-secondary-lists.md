# 시나리오 카드 — 회원 보조 목록과 소명 처리

비활성회원·회원상담·소명신청·회원접속이 같은 목록 골격을 쓰면서도 action과 처리 상태는 서로 다르다는
사실을 기록한다. 화면별 적용 결론은 #18·#19·#20·#21·#22·#23이 갖는다.

표기: `[확인]`은 2026-09-04 Figma 전수 판독과 정정된 인벤토리, `[추론]`은 그 사실에서 나온 설계,
`[미확인]`은 6절이다. 이 카드는 호출에 필요한 입력이 확정되는 지점까지만 다룬다.

## 1. 이 시나리오가 요구하는 것

대응 화면은 휴면회원·탈퇴회원·회원상담·불량회원 소명신청·회원접속이며 모두 ZERO PLUS+ workflow로
확인됐다([04-members.md](../zero-sol/04-members.md):51-78). 탈퇴회원은 목록과 별도의 조회 frame
`148:7774`도 갖는다(:63). **적용 가능**하다. `[확인]`

- 휴면회원 toolbar는 SMS·이메일뿐이고 탈퇴회원은 action이 없다. 상담·접속은 다운로드, 소명은 변경·SMS·이메일을 쓴다(:57,61,68,73,77).
- 다운로드는 `선택한 항목`/`검색결과 전체` 중 하나를 고르며, 선택 범위에는 행 선택이 필요하다(:99).
- 소명 처리 결과는 입력 전 → 통보 전 수정 가능 → 통보 후 읽기 전용의 세 상태다(:87).

## 2. 상태와 전이

2026-09-07 사용자 결정·현재 구현: 휴면·탈퇴·접속은 빈 URL에서 대기하며 검색 버튼은 `searched=true`와 기본값 아닌 조건을 남긴다. 유효한 소유 조건이 있는 직접 접근도 조회한다. 상담·소명은 빈 URL 진입·초기화 모두 즉시 조회하며 표식을 제거한다. 기본값 해석 전 검색 의도를 판정하고, 해석된 같은 값으로 필터·결과·Query·수신자 캐시를 연결한다. 탈퇴의 기간 생략은 경로와 무관하게 `joinedAt`이고 정렬은 `withdrawnAt`이다. 상세 규칙은 [list-workflow](../../../.agents/skills/feature-contract/references/list.md#url)가 소유한다.

Chromium `search-contract.spec.ts`에서 다섯 화면의 기본값 검색, 보기·정렬 후 재검색, 초기화 2회, 뒤로/앞으로, 잘못된 URL 복구와 표식 변경을 실측했다(2026-09-07). 명시 검색 3종은 새로고침 복원도 확인했다. 예시 Query 응답으로 검증한 시나리오 구현이며 실 API 완료·신규 제품 이관 검증은 아니다.

| 상태 | 소유자 |
| --- | --- |
| 커밋된 검색·정렬·page·보기 | route search |
| 검색 draft와 다운로드 범위 | 화면 local state |
| 현재 page의 선택 ID | 해당 목록 feature |
| 소명 처리 결과 값·dirty·검증 | 인라인 TanStack Form |
| 통보 여부와 목록·상세 사실 | 서버 응답을 읽는 Query, 단 계약 값은 미확인 |

```text
목록 조건 확정 → 검색 호출 직전
다운로드 범위 미선택 → 선택한 항목 ─ 행 없음 → 미선택 오류
                              └ 행 있음 ┐
                    검색결과 전체 ──────┴→ 다운로드 입력 확정 → 호출 직전
소명 입력 전 → 처리값 입력 → 통보 전 수정 입력 확정 → 저장 호출 직전
통보 후 → 읽기 전용(입력·호출 없음)
```

## 3. 추론한 실패 위험

| 무엇이 깨질 수 있나 | 왜 | 차단 규칙 |
| --- | --- | --- |
| `[추론]` 탈퇴회원에 변경·등록 action이 나타남 | 회원 목록 하나의 toolbar를 모든 variant에 복사 | action 집합은 화면별로 선언하고 빈 집합도 값으로 둔다 |
| `[추론]` 선택 범위인데 행 없이 다운로드가 진행됨 | 범위 선택과 행 선택 검증을 분리 | 선택 범위일 때 안정 ID 1개 이상을 호출 전 검사한다 |
| `[추론]` 검색결과 전체가 현재 page ID만 보냄 | 두 다운로드 범위를 같은 payload 모양으로 취급 | 전체 범위는 커밋된 검색 조건을 사용하며 request 형태는 계약 전 미확인이다 |
| `[추론]` 통보 후 소명 결과가 다시 편집됨 | 서버 상태와 폼 가능 상태를 분리 | 통보 상태 하나에서 read-only와 action 노출을 함께 파생한다 |

## 4. 처음부터 알았다면 이렇게 설계한다

목록 골격만 공유하고 toolbar action·필터·컬럼·선택 용도는 각 feature가 소유한다. 선택은 현재 page의 안정
ID만 가지며 검색 조건·page·정렬 변경 때 지운다([list.md](../../../.agents/skills/feature-contract/references/list.md#selection-and-actions):3-9). `[확인]`

다운로드 범위는 default 미선택이다. `선택한 항목`은 행 검증 뒤 ID 입력을, `검색결과 전체`는 커밋된
검색 조건을 확정한다. 파일 형식·payload·권한은 feature와 신규 계약이 정할 때까지 만들지 않는다. `[추론]`

소명 처리 결과는 상세 안의 독립 인라인 폼이다. 통보 전에는 필드·검증·dirty를 폼이 소유하고,
`SectionCard`와 form adapter를 채택하되 확인/완료 쌍을 전제한 새 workflow 훅은 만들지 않는다
([form.md](../../../.agents/skills/feature-contract/references/form.md):19,31). 통보 후에는 같은 서버
상태가 필드 read-only와 저장 action 부재를 결정한다. `[추론]`

## 5. 우리 공용 계약과의 대조

| 요구 | 현재 계약 | 판정 |
| --- | --- | --- |
| 목록별 action·선택 수명 | 화면/feature adapter가 소유 | 커버됨 — `list.md:3-9` |
| 다운로드 선택/전체 | 범위·선행조건·request mapping은 feature 소유 | 커버됨 — [file-workflow.md](../../../.agents/skills/feature-contract/references/file-workflow.md):3-13 |
| 다중선택 필터 | `CheckboxTree(emptyMeansAll)` 구현 | 채택 — [list.md](../../../.agents/skills/feature-contract/references/list.md#filter) |
| 소명 인라인 폼·접이식 섹션 | form adapter와 `SectionCard(collapsible)` 구현 | 채택 — form.md:19,28 |
| 회원접속 header 도움말 | 다섯 shared 후보 중 `Tooltip` | 후보 유지 — [primitives-and-tokens.md](../../../.agents/skills/shared-ui-contract/references/primitives-and-tokens.md):22 |
| 행 클릭 조회 | 접근성 있는 행 활성화는 다섯 shared 후보 중 하나 | 후보 유지 — [primitives-and-tokens.md](../../../.agents/skills/shared-ui-contract/references/primitives-and-tokens.md):23 |
| 빈 값 `-` | 표현만 소유하는 다섯 shared 후보 중 하나 | 후보 유지 — primitives-and-tokens.md:25 |

## 6. 미확인

1. 탈퇴회원 checkbox의 용도와 전용 조회 `148:7774`의 필드·action 차이.
2. 소명 결과를 통보 후 잠그는 권위 상태와 통보 호출에 필요한 입력.
3. 다운로드 형식, 선택/전체 request 모양과 권한 식별자.

2026-09-07 기간 계약 확장: 확정 검색은 양끝을 요구하며 한쪽 결손·불량·역전은 양쪽을 제거한다. 입력 중 draft는 한쪽을 보존한다. 공통 실행 규칙은 [list-search-contract](../../../.agents/skills/feature-contract/references/list.md#url), 전체 목록의 직접 입력·mock 비교 회귀는 `src/test/workflows/closed-search.test.ts`가 소유한다.
