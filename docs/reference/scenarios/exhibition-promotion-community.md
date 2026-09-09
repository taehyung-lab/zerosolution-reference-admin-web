# 시나리오 카드 — 전시·프로모션·커뮤니티 운영

게시 상태 변경, 이미지 업로드, 행 안 상태 action, 피드백 설정, 상세 상태 변경과 검색 팝업을 한 계열에서
대조한다. 화면별 적용 결론은 #35·#36·#37·#38이 갖는다.

표기: `[확인]`은 2026-09-04 Figma 전수 판독과 정정된 인벤토리, `[추론]`은 그 사실에서 나온 설계,
`[미확인]`은 6절이다. 모든 변경은 입력·확인 뒤 호출 직전에서 끝난다.

## 1. 이 시나리오가 요구하는 것

배너와 APP Splash의 cascade는 `게시 상태 > 대기 / 게시중 / 종료`다. 업로드 hint는
`권장 사이즈 : 가로 {n}px * 세로 {n}px 지원확장자 : png, 1MB 이하`이며 `{n}`은 토큰으로 남는다
([07-exhibition.md](../zero-sol/07-exhibition.md):7-16). `[확인]`

APP PUSH는 checkbox·bulk cascade 없이 `등록`만 있고, 상태 셀은 발송예정일 때 `발송취소`, 발송중일 때
`중단`을 노출한다([08-promotion.md](../zero-sol/08-promotion.md):7-15). 게시판 등록의 설정 이름은
`피드백 설정`이며, 게시물 조회는 답변상태와 게시상태를 각각 바꾸는 두 컨트롤을 가진다. 카테고리 설정,
참여자 조회, 댓글등록, 작성자 검색 팝업도 별도 surface다([09-community.md](../zero-sol/09-community.md):7-23). `[확인]`

## 2. 상태와 전이

| 상태 | 소유자 |
| --- | --- |
| 목록 검색·sort·page | 각 route search |
| 선택 ID와 게시 상태 변경 intent | 배너/게시물 목록 feature |
| 업로드 파일과 form 값 | 해당 form |
| PUSH 행 action 노출 | 행의 서버 발송상태에서 파생 |
| 작성자 검색 draft·candidate | popup host local state |
| 게시물 답변상태·게시상태 선택 | 상세 feature의 서로 다른 intent |

```text
배너/Splash 선택 → 게시 상태 선택 → 행 검증 → 변경 호출 직전
파일 선택 → png·1MB 이하 검증 → form 입력 확정 → 저장 호출 직전
PUSH 행 상태 → 허용 action 클릭 → 확인 입력 확정 → 취소/중단 호출 직전
게시물 상세 → 답변상태 또는 게시상태 intent 선택 → 호출 직전
작성자 팝업 열기 → local 검색 → candidate 선택 → 확인 시 parent field commit → 저장 호출 직전
```

## 3. 추론한 실패 위험

| 무엇이 깨질 수 있나 | 왜 | 차단 규칙 |
| --- | --- | --- |
| `[추론]` `{n}`을 임의 px 값으로 치환 | 디자인 token을 제품 값으로 추측 | token을 그대로 노출하고 실제 크기 확정 전 검증값을 만들지 않는다 |
| `[추론]` 모든 PUSH 행에 취소·중단을 함께 노출 | 상태와 action을 별도 config로 관리 | 한 exhaustive 상태 판정에서 action을 파생한다 |
| `[추론]` 답변상태 변경이 게시상태까지 덮음 | 두 intent를 하나의 status mapper로 합침 | 필드·copy·request 입력을 서로 분리한다 |
| `[추론]` 작성자 팝업 취소 후 parent 값이 바뀜 | candidate를 즉시 form에 기록 | 확인 전 candidate는 popup local, 취소는 폐기한다 |

## 4. 처음부터 알았다면 이렇게 설계한다

각 목록은 list mechanic을 조립하되 배너/Splash의 cascade, PUSH row action, 게시물 bulk intent를 feature에
둔다. DataTable에 게시 상태나 action `mode`를 추가하지 않는다. `[추론]`

이미지 form은 확인된 `png, 1MB 이하`만 검증하고 `{n}` 크기는 질문으로 남긴다. 업로드 파일·제거·검증은
form과 file workflow가 소유한다. `[확인]`

작성자 검색은 table composition kind E다. 검색 draft와 candidate는 popup local이고, 확인할 때만 parent
field에 commit하며 취소·닫기는 폐기한다. parent URL은 바꾸지 않는다
([table-composition.md](../../../.agents/skills/feature-contract/references/table-composition.md):15,19,24). PUSH의
대상 영역에 보이는 Tabs는 shared 후보를 유지하되 tab 종류·회원 cardinality는 feature가 소유한다. `[추론]`

## 5. 우리 공용 계약과의 대조

| 요구 | 현재 계약 | 판정 |
| --- | --- | --- |
| 기간 필터 | `PeriodField` 구현 | 채택 — [filter-fields.md](../../../.agents/skills/shared-ui-contract/references/filter-fields.md):11,19 |
| 업로드·제거 | 파일 범위·선행조건·payload는 feature 소유 | 커버됨 — [file-workflow.md](../../../.agents/skills/feature-contract/references/file-workflow.md):3-13 |
| 행 안 상태 action | column renderer와 action은 feature 소유 | 커버됨 — table-composition.md:28 |
| 작성자 popup 목록 | kind E local draft/candidate/confirm/cancel | 커버됨 — table-composition.md:15,19 |
| PUSH 대상 tab | 다섯 shared 후보 중 `Tabs` | 후보 유지 — [primitives-and-tokens.md](../../../.agents/skills/shared-ui-contract/references/primitives-and-tokens.md):21 |
| 행 클릭 상세 | 다섯 shared 후보 중 행 활성화 | 후보 유지 — primitives-and-tokens.md:23 |
| 값 없음 `-` | 다섯 shared 후보 중 빈 값 표현 | 후보 유지 — primitives-and-tokens.md:25 |

## 6. 미확인

1. 배너·Splash 이미지의 `{n}` 가로·세로 값과 업로드 request 계약.
2. PUSH 발송취소·중단의 확인 문구와 호출 입력, 완료·중단 상태의 전체 enum.
3. `피드백 설정`의 세부 option과 게시물 두 상태 변경의 권한 식별자.
4. 작성자·PUSH 대상 선택의 단일/다중 cardinality, 반환값과 label 보존.
5. 미리보기 대상 수와 게시순서 편집 방식.
