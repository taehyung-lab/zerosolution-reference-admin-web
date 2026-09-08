# 시나리오 카드 — 설정 tab과 화면별 권한

로그·회원 정책·마케팅의 tab 구조와 운영자·접근권한·다국어 설정의 서로 다른 편집 표면을 대조한다.
화면별 적용 결론은 #12·#28·#29·#31·#32·#33이 갖는다.

표기: `[확인]`은 2026-09-04 Figma 전수 판독과 정정된 인벤토리, `[추론]`은 그 사실에서 나온 설계,
`[미확인]`은 6절이다. 저장·다운로드·복사는 호출 입력이 확정되는 지점까지만 다룬다.

## 1. 이 시나리오가 요구하는 것

page tab은 로그 6종, 정책 회원 3종, 마케팅 2종과 그 안의 channel sub-tab으로 관찰됐다
([11-settings.md](../zero-sol/11-settings.md):34-44,53). 로그는 로그인만 `접속일시·아이디·구분·결과·IP`,
나머지 다섯은 `수행일시·아이디·IP·메뉴·경로`로 갈리며 모두 다운로드 action이 있다(:55-62). `[확인]`

접근권한의 `기능1~8`은 고정 기능 열이 아니라 익명 슬롯이다. 대시보드는 조회, 회원 목록은 조회·등록·수정·
탈퇴·SMS/이메일·일괄변경처럼 각 화면 행의 기능 집합이 다르다(:52). 회원 정책은 접이식 섹션과 사유 반복
행, 다국어는 한국어·일본어·영어 input을 가진 편집 표, 마케팅은 사용 시 조건부 섹션과 sub-tab을 연다
(:38-54). 선택복사는 약관·접근권한에 적용된다(:68). `[확인]`

## 2. 상태와 전이

| 상태 | 소유자 |
| --- | --- |
| 활성 page/sub-tab | 화면 local; 공유·복원 요구가 확인되면 route search |
| 로그별 필터·sort·page | 각 로그 목록 feature |
| 권한 matrix leaf 선택 | 접근권한 form |
| 다국어 input·사유 반복 행·조건부 필드 | 각 TanStack Form |
| 서버가 제공할 권한 식별자·option | Query, 계약은 미확인 |

```text
tab 전환 → 해당 화면의 필터·컬럼·action 조립
로그 검색 조건 확정 → 해당 로그 호출 직전
권한 상위 선택 → 그 화면 행의 가능한 하위 leaf만 토글 → 검증 → 저장 호출 직전
회원 정책 사유 추가/삭제 → 검증 → 저장 확인 → 호출 직전
마케팅 사용 → 조건부 섹션·channel sub-tab → 필수값 검증 → 호출 직전
선택복사 → 1개 이상 선택 검증 → 복사 입력 확정 → 호출 직전
```

## 3. 관측된 실패

| 무엇이 깨질 수 있나 | 왜 | 차단 규칙 |
| --- | --- | --- |
| `[추론]` 조회 로그에 로그인 전용 `구분·결과`가 나타남 | 여섯 tab을 같은 filter config로 취급 | 로그인 1 / 나머지 5의 typed 정의를 분리한다 |
| `[추론]` 권한의 기능 n이 모든 행에서 같은 의미 | `기능1~8`을 고정 enum 열로 해석 | 각 화면 행이 허용 기능 leaf를 직접 선언한다 |
| `[추론]` 숨긴 마케팅 필드가 저장 입력에 남음 | 조건부 표시와 form 값을 따로 관리 | 조건이 꺼지는 event에서 관련 값을 명시적으로 clear한다 |
| `[추론]` 반복 행 삭제 뒤 다른 행 오류가 이동 | 배열 index를 정체성으로 사용 | form row에 안정 render key를 둔다 |

## 4. 처음부터 알았다면 이렇게 설계한다

tab primitive는 controlled value·tab/tabpanel 접근성만 맡고, URL/local 소유와 panel 수명은 화면이 결정한다.
로그 여섯 개는 공통 list mechanic을 쓰되 filter·sort·컬럼 source를 로그인과 나머지 종류별로 둔다. `[추론]`

권한 matrix는 `CheckboxTree(emptyMeansAll)`의 controlled leaf 대수를 채택하되 메뉴 계층, 행별 가능한 기능,
권한 식별자와 payload는 접근권한 feature가 소유한다. `기능1~8`을 domain enum으로 만들지 않는다. `[확인]`

회원 정책과 마케팅은 `SectionCard(collapsible)`·form adapter를 채택한다. dirty 취소 확인은
독립 등록·수정 화면에만 적용하며, 단순히 설정 폼이나 편집 가능한 섹션이라는 이유로 붙이지 않는다
([2026-09-07 취소 시나리오](../../../.agents/skills/feature-contract/references/form-workflow.md#cancel-and-tabs), 해당 설정 화면 구현 시 적용). 반복 행은 kind D, 다국어는 editable table을 feature-local로
조립한다. `- 이하 생략 -`은 의미가 확인되기 전 paging이나 상한으로 해석하지 않는다. `[추론]`

## 5. 우리 공용 계약과의 대조

| 요구 | 현재 계약 | 판정 |
| --- | --- | --- |
| page/sub-tab | 다섯 shared 후보 중 `Tabs` | 후보 유지 — [primitives-and-tokens.md](../../../.agents/skills/shared-ui-contract/references/primitives-and-tokens.md):21 |
| 화면별 권한 leaf | `CheckboxTree(emptyMeansAll)` 구현 | 채택 — [list-workflow.md](../../../.agents/skills/feature-contract/references/list-workflow.md#multi-select-group) |
| 접이식 설정 섹션 | `SectionCard(collapsible)` 구현 | 채택 — [form-workflow.md](../../../.agents/skills/feature-contract/references/form-workflow.md):19,28 |
| 취소와 dirty 이탈 | 독립 등록·수정 화면의 dirty 취소에 한정; 설정 내부 local 편집은 자동 채택하지 않음 | 2026-09-07 시나리오 적용 대상 대조 필요 — [form-workflow](../../../.agents/skills/feature-contract/references/form-workflow.md#cancel-and-tabs) |
| 반복 행·편집 표 | kind D, row schema·정책은 feature 소유 | 커버됨 — [table-composition.md](../../../.agents/skills/feature-contract/references/table-composition.md):14,27-30 |
| 선택복사 | 안정 ID·검증·intent는 feature 소유 | 커버됨 — [bulk-actions.md](../../../.agents/skills/feature-contract/references/bulk-actions.md):3-9 |

현재 운영자 consumer(2026-09-07): 등록·수정 dirty 취소 경고는 유지하고 `ManagerActionForm`의 local 취소 경고만 제외했다. `managers-form.smoke.spec.ts`는 clean 취소·dirty 취소 질문의 취소/확인·뒤로가기 문장 구분을, `ManagerDetailActions.test.tsx`는 거절 입력 취소의 무호출과 재입력 요청을 검증한다. 설정의 다른 편집 화면 구현 완료를 뜻하지 않는다.

운영자 목록 검색 구현 관찰(2026-09-07): 빈 URL은 대기, 기본값 검색은 `?searched=true`, 유효한 조건 직접 접근은 표식 없이도 조회한다. 기간 기준은 검색 gate가 아니며 기본값 해석은 화면 경계가 소유한다. Chromium `search-contract.spec.ts`·`managers-list.smoke.spec.ts`에서 새로고침·표식 변경·초기화 2회·보기/정렬 후 검색·history와 결과 표시를 확인했다. 예시 Query 응답에 대한 시나리오 구현 증거이며, 실제 API와 이관 완료를 뜻하지 않는다. 세부 계약은 [list-workflow](../../../.agents/skills/feature-contract/references/list-workflow.md#state-and-url-lifecycle)에 둔다.

## 6. 미확인

1. 로그 6종, 회원 정책 3종, 마케팅 tab/sub-tab의 URL 공유·복원 여부와 panel 수명.
2. 서버 권한 식별자와 화면 행·기능 leaf의 payload 구조.
3. 회원 정책 반복 사유의 최소·최대 개수와 다국어 표의 저장 단위·행 상한.
4. 마케팅 인증 흐름과 조건부 필드의 정확한 request 계약.
5. `- 이하 생략 -`이 행 상한·축약·paging 대체 중 무엇을 뜻하는지.

2026-09-07 기간 계약 확장: 확정 검색은 양끝을 요구하며 한쪽 결손·불량·역전은 양쪽을 제거한다. 입력 중 draft는 한쪽을 보존한다. 공통 실행 규칙은 [list-search-contract](../../../.agents/skills/feature-contract/references/list-search-contract.md#기간-입력과-확정-경계), 전체 목록의 직접 입력·mock 비교 회귀는 `src/test/workflows/closed-search.test.ts`가 소유한다.
