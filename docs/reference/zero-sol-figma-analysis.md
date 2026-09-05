# ZEROsol 공용화 판정 (Figma + Notion 전체 인벤토리 기준)

- 성격: 비규범적 판정 기록. 제품 계약이 아니며 단계와 되돌리기 어려운 결정은 ADR 0009·0010이 소유한다.
- 입력: [전체 surface 인벤토리](zero-sol/README.md)(Figma frame 보유 leaf page 59개 · top-level frame 272개, Notion Feature 72페이지 원문), 현재 `src/shared/**`·`src/features/managers/**`, `promotion.md`, `list-workflow.md`.
- 판정일: 2026-09-02, Figma 전수 재확인 2026-09-04. 방식: Claude와 Codex가 같은 입력으로 독립 초안을 쓰고 교차 리뷰한 뒤 근거로 합쳤다. 합친 결론은 §2·§8 표가 소유하고, 쟁점별 해소 과정은 세션 작업 문서에 두었다.
- 이전 판(2026-08-31)은 Figma 대표 node만 보고 Managers 한 화면에서 판정했다. 그 관찰(Alert·공통화면 카피)은 [zero-sol/01-common.md](zero-sol/01-common.md)로 옮겼다.
- 갱신 조건: 인벤토리가 바뀌거나, 두 번째 코드 consumer가 provisional 계약을 confirm/demote하거나, §5 질문의 답이 나올 때.

## 1. 판정 원칙

1. Figma 열은 **UI 구성·정적 상태**만, Notion 열은 **동작·정책 문장**만 증명한다. 둘 다 없는 것은 미확인이고 리허설 API·현재 코드로 채우지 않는다.
2. 전 제품 인벤토리는 provisional 승격 근거를 강화하지만 **두 번째 코드 consumer 검증을 대체하지 않는다**. 지금 코드 consumer는 Managers 하나이므로 Managers가 실제로 소비하는 표면만 코드로 바꾼다. 나머지는 §4 후보로 기록하되 API 이름을 선점하지 않는다.
3. shared는 Router·Query·endpoint·DTO·permission을 모른다. 이 원칙은 인벤토리로 **강화**됐다: 게시물 > 작성자 검색 팝업(9.2)은 필터·summary·보기/정렬·table·paging·검색전/후를 dialog-local 상태로 조립하고, 현장발권(14.x)은 별도 창 chrome에서 같은 mechanic을 쓴다. Router를 아는 shared였다면 두 host에서 재사용할 수 없었다. dialog 안 검색은 `table-composition.md` kind E가 이미 소유한다.
4. Simplicity First: 판정은 "무엇을 공용으로 만들까"보다 "지금 공용에 있는 것 중 증거가 없거나 읽는 비용만 늘리는 것"을 먼저 찾는다.

## 2. surface별 판정

| surface | 판정 | 핵심 근거 (인벤토리) | 반영 |
| --- | --- | --- | --- |
| 검색 gate (`searched`) | **feature 한 줄**. 공용 함수 없음 | 검색전 frame 有 ~20 화면 / 無 ~12 화면. 판별자 key가 화면마다 다름(periodType / 공연). Notion "화면 진입시, 검색 안내 화면이 제공된다" 45회는 화면별 정책 | `hasDefinedSearchValue` 삭제(미사용). gate 無 화면은 `searched: true` 명시 |
| 초기화 | 현행 유지 | Notion 34 화면 "default로 설정값 변경 및 검색 전 상태로 변경". Managers `onSearchChange({})` 일치 | — |
| error facts | `api/error-outcome.ts` 소유, feature 축소 | list·detail·edit 3곳 같은 2줄. `isFeatureError`가 이미 `unknown → ApiError` guard. `ApiError`는 `ErrorTraceValue`를 구조적으로 만족하고 `ErrorTrace`는 3필드만 읽음 | `isFeatureError(query.error) ? query.error : undefined`, `trace: error`. `model/error-trace.ts` 삭제 |
| `ListResultData` 리턴 팩토리 | 만들지 않음 | Query result 또는 envelope 콜백을 shared로 끌어옴 = demotion 신호. 8줄 literal이 화면 사실 선언으로 가장 읽기 쉬움 | — |
| `ListResultData.total/totalPages` | **shared 계약에서 제거** | `ListResult`는 rows·searched·isFetching·isError·trace·retry만 읽음(코드). 팝업·통계 등 paging 없는 consumer에 불필요 | feature가 `& { total; totalPages }`로 확장 |
| rows/total DTO 매핑 | feature | 리허설 envelope 승격 금지(ADR 0001) | 신규 OpenAPI 확정 후 `api/` adapter 재검토 |
| summary | `ResultSummary` 현행, **문구만 shared** | 단일 "검색결과 : N" 30 화면 / 다항목 2 화면(6.2·14.3). 14.3 Notion "클릭시 이벤트 없음" | `shared:list.total` 키. flat API 축소는 다항목 consumer에서 검증 |
| 기간 preset 값 목록 | **shared config opt-in** | 8 preset이 회원·공연·발권·운영자·통계·통합검색 표본에서 동일. 라벨은 이미 `usePeriodPresetLabels`가 shared | `standardPeriodPresetValues`. 기본값(목록 전체 / 통계 1개월 전)·채택은 feature |
| 기간 기준 select + PeriodField | **`PeriodFilterField` composite**(optional `criterion` slot) — ②에서는 sibling 유지였으나 사용자 재검토로 ③에서 승격 | 기준 有 25+ / 無 6(통계 4·통합검색·회원접속 고정) / 로그 고정. slot은 문자열 value·options·label만 받아 enum 의미를 모름. 30 화면 × 12줄 반복 vs 1줄이 읽기 비용의 근거 | `FilterField group` 위에 얇은 composite. Managers 첫 consumer |
| 검색어 대상 select + chip | **`KeywordFilterField` composite**(optional `field` slot) | 대상 有 28 / 無 2(통합검색·다국어). `useKeywordDraft<TField extends string \| undefined>`가 두 변형 표현 | 위와 동일 |
| 중복 키워드 거부 | **보류** (초안 오류 수정) | "중복 키워드 검색 허용 안함"은 회원 공통 상세의 활동정보 검색 1곳뿐. 30 화면 반복은 "다중 키워드 검색 허용" | 회원 공통 구현 시 feature validation으로 시작 |
| 페이지 크기 옵션 | `standardPageSizeOptions` 유지 | 100~1000 전 화면 동일, 기본 100, 등록 화면 200 | — |
| 정렬 방향 토글 | **`SortControl`에서 제거(narrow)** | Figma 30 화면 어디에도 방향 컨트롤 없음, 정렬된 컬럼 헤더 아이콘만. Notion 방향 문장 없음 | direction props 제거. 헤더 클릭 토글(`selectManagerSort`)은 feature 유지. 후속(2026-09-02): 헤더 버튼·`aria-sort`·glyph는 `DataTable.meta.sort`가 한 값에서 렌더(접근성 불변식, 인벤토리 12+ table 반복). 정렬 가능 컬럼·방향·전이는 feature `manager-sort.ts` 단일표 |
| `SearchFieldPartition`·`filterPartitionKey/Values` | **feature-local로 demote** | production caller 1곳. "view 변경 중 draft 보존"은 설계 계약이지 인벤토리 문장이 아님 | Managers local로 이동. `useDraftCommit`은 shared 유지. 두 번째 route-backed list에서 재승격 판단 |
| Managers 검색 전 표면 | **feature 불일치 수정** | 11.1 검색전 frame: "검색해주세요." + `등록`만. 현재 `ManagerListResult`는 summary·toolbar를 무조건 렌더 | `data.searched`로 summary·toolbar-left 가림. `ListResult`에 mode 넣지 않음 |
| toolbar 우측 action | slot 유지, 카탈로그 없음 | 화면별 action 집합은 다름. SMS·이메일의 미선택 검증·popup open은 동일 trigger 후보지만 마케팅 정책 gate와 popup 본문은 feature 사실 | trigger는 첫 consumer surface만 provisional, 정책·권한·field·payload는 feature |
| 행 선택 | feature workflow | 헤더 전체선택은 현재 페이지의 선택 가능 행만 대상으로 하고 결과 정체성 변경 시 해제(2026-09-04 사용자 답) | `bulk-actions.md`의 제품 기본 수명 유지 |
| bulk alert 연쇄 | **provisional shared 후보** | 미선택 20 / 확인 17 / 완료 17의 문구·lifecycle 반복. `run(values)`는 endpoint를 shared에 가르치지 않는 callback | 첫 consumer의 미선택·확인·실행 callback만; 선택 ID·cascade·값·권한·호출 이후는 feature |
| 다운로드 선택/전체 | **provisional shared 후보** | 택1 6 / 미선택 오류 7. `(mode, count) → selected\|all\|error`는 순수 분류기 | 첫 consumer의 mode·검증 표면만; row·committed 검색·파일·권한·실행은 feature |
| lookup 필터·종속 필수 select·range slider·cascade·행 인라인 action | primitive만 shared, 조립은 feature. §4 후보 | lookup 12 화면·종속 select 10 화면·range slider는 `129:32748` Case의 6.2에서 실재 확인(나머지 4 variant는 미확인)·cascade와 인라인 action은 화면별 차이 | — |
| 팝업/별도 창의 list | 원칙 유지 + reference 연결 | 9.2·14.x | `list-workflow.md`가 kind E를 명시 연결. 루트 §3 표는 바꾸지 않음 |

## 3. 이번 판정으로 바뀌는 것 (③ Managers 증명 범위)

코드 — 축소: error 2줄→1줄(3곳)·`error-trace.ts` 삭제·`hasDefinedSearchValue` 삭제·`ListResultData` totals 제거·`SortControl` direction 제거·partition 유틸 feature-local·caller ARIA div 2개 제거.
코드 — 정합: `ManagerListResult` 검색 전 `등록`만·`FilterField group`·`standardPeriodPresetValues`·`shared:list.total`.
문서: ADR 0009 provisional 표·재검토 조건, `promotion.md` 인벤토리 근거 유형, `list-workflow.md` gate 無·kind E 연결·partition 문장, `list-result.md` facts 목록.
검증: focused test + `pnpm verify` + 브라우저(운영자 검색전/후, 기간·검색어 group 접근성 이름, 정렬 컨트롤).

## 4. 후보 (근거 있음 · 코드 consumer 없음 · 이름 미확정)

| 반복 행동 | 근거 | 착수 조건 |
| --- | --- | --- |
| 행 checkbox + 전체선택 | 20 화면 | 현재 페이지 선택 수명은 확정. 첫 bulk consumer에서 feature-local 상태와 checked/mixed 계산 검증 |
| 일괄 변경 alert 연쇄 | Notion 미선택 20 / 확인 17 / 완료 17의 product-generic copy와 lifecycle 반복; `run(values)`는 domain-free | 첫 consumer가 쓰는 미선택·확인·실행 callback만 provisional로 구현; 선택·cascade·권한·호출 이후는 feature |
| 다운로드 선택/전체 | Notion 택1 6 / 미선택 오류 7; `(mode, count)` 순수 분류기로 검증 가능 | 첫 consumer가 쓰는 mode·검증만 provisional로 구현; row·검색조건·파일·권한·실행은 feature |
| SMS·이메일 trigger | 회원·발권에서 미선택 검증·popup open 문구와 lifecycle 반복 | trigger만 provisional; 정책 gate·권한·popup 본문은 feature |
| lookup(검색 → 단일 선택 chip) | Figma 12 화면, Notion "택1·삭제 후 재선택" | 첫 구현 시 접근성 primitive만 |
| 보기/정렬 "마지막으로 설정한 값" | Notion 30 화면 | §5-1 답 |
| 통계 집계 위젯(interval select·차트·전치 표·섹션 다운로드) | 10.x 5 화면 + 대시보드 | 통계 endpoint |
| Tabs | 인벤토리 7 surface/8 set, APP PUSH 타겟 검색에도 존재 | 첫 실제 화면에서 tab/tabpanel·키보드·controlled value만 검증; URL/local과 panel 수명은 caller 소유 |
| Tooltip | 디자인 시스템 컴포넌트 + page header 반복 | 첫 header consumer에서 focus/hover/Escape 계약 검증; `PageHeader`는 넓히지 않음 |
| 행 활성화 | 일반·회원·발권 목록 18회 | 키보드·스크린리더 activation과 interactive child 예외를 함께 검증; destination·permission은 feature 소유 |
| 상태 count 클릭 필터 | 발권 5 variant 동일 문장, 현장 count는 이벤트 없음 | 접근 가능한 controlled item만 검증; filter·URL·page reset은 feature 소유 |
| 빈 값 `-` 표현 | 9회 | caller가 absence를 판정하고 shared는 표현만 맡는 가장 좁은 표면을 첫 실제 consumer에서 검증 |

## 5. 미확인 — 답이 구현을 바꾸는 질문

답을 받은 항목은 지우지 않고 그 자리에 `답(YYYY-MM-DD): …`와 그 답이 바꾼 판정을 남긴다.

실측으로 닫힌 판독 질문:

- 답(2026-09-04): 개인정보 전체보기와 회원 탈퇴는 현재 운영자 비밀번호 재입력 재인증이며, 탈퇴는 사유(5자 이상)도 요구한다. 재인증 성공 후 재조회/클라이언트 해제, 해제 범위(화면 1회/세션), 감사 기록만 미확인이다.
- 답(2026-09-04): 티켓인증 활동정보 컬럼은 인증일·공연명·회차·공연일시·예매번호·좌석번호다.
- 답(2026-09-04): 운영자 일괄변경 cascade는 `계정 상태 > 활성 / 비활성`이다.
- 답(2026-09-04): 발권 5 variant는 cascade·정렬 축이 서로 다르고 분실에는 상태변경 cascade가 없다.
- 답(2026-09-04): 출입조회 결과 컬럼은 입장일·퇴장일·구분·티켓일련번호·등급·출입상태·입장유형·NFC리더기·게이트다.
- 답(2026-09-04): 게시판의 기존 "항목 사용 설정" 표면 이름은 `피드백 설정`이며 `조회수`가 함께 있다.

- 답(2026-09-05): 목록에는 **중복 키워드 거부 규칙이 없다.** `99-cross-screen.md`에 `다중 키워드 허용`이 30화면, 금지는 0이며 유일한 중복 문장은 `회원 > 공통(조회/등록/수정)` 활동정보 tab이다(질문 4가 그 자리다). 목록에 들어가 있던 거부 로직과 3개 국어 문구를 삭제했다.
- 답(2026-09-05): **기간 역전 오류 문구도 원장에 0건이다.** Notion은 날짜 제약을 `오늘 이후의 날짜 선택 불가`처럼 항상 `선택 불가`로 쓴다. 오류 상태 대신 `min`/`max`와 방금 편집한 bound를 남기는 방식으로 바꾸고 문구 6개를 삭제했다.
- 답(2026-09-05): 미선택 오류는 일괄변경 전용 규칙이 아니다. Case01 20화면에는 일괄변경이 없는 `회원 > 비활성회원 > 휴면회원`(SMS)과 목록이 아닌 `회원 > 공통(조회/등록/수정)`이 들어 있다. 일괄변경으로 확정되는 것은 Case02 **18화면**이고, 미선택 오류의 주체는 **선택을 요구하는 모든 action**이다.

1. "보기/정렬 default: 100 **or 마지막으로 설정한 값**" — `or`의 우선순위, 저장 범위(화면/계정/브라우저), URL 공유 시 우선권. 답에 따라 resolver 기본값 주입 mechanic 필요 여부가 갈린다.
2. 검색전 frame 없는 화면(콘텐츠·공연목록·배너·PUSH·게시판·게시물·회원상담·소명신청·스마트프린터·접근권한)도 Notion "초기화 → 검색 전 상태" 문장을 가진다. 진입 즉시 조회인지, 초기화 후 상태가 무엇인지.
3. 정렬 방향을 바꾸는 UI가 있는가(헤더 아이콘 클릭?). 임시 답(2026-09-02): 활성 헤더 클릭이 유일한 방향 전환 UI이고 Select에서 다른 값을 고르면 방향은 유지된다. 남은 질문: 비활성 sortable 헤더에도 아이콘을 보이는지, Figma 아이콘이 방향을 뜻하는지(실측 대기).
4. 중복 키워드의 동일성(대상 포함·대소문자·공백) — 회원 공통 구현 시.
5. Managers(운영자) bulk 변경의 대상 상태와 서버 계약 — 3단계 alert 착수 조건.
6. 현장발권의 배포 형태(별도 창/앱)와 세션 공유.
7. 다운로드·일괄 변경 실행 중 표면(전역 overlay인지 버튼 pending만인지) — Figma 공통화면에 해당 frame 없음.
8. 활성회원 전체·일반·불량 화면 정체성. 답(2026-09-04): Figma page와 Notion Feature처럼 각각 별도 route다. 공용 list mechanic만 재사용하고 한 route의 `variant`/`mode`로 합치지 않는다.
9. 헤더 전체선택 범위와 수명. 답(2026-09-04): 현재 페이지에 보이는 선택 가능 행 전체만 선택한다. 페이지·page size·정렬·커밋된 검색 조건·목록 route 변경 시 해제하고, draft 편집이나 같은 조건 재검색·refetch는 남아 있는 선택 가능 ID만 유지한다. bulk 실패 시 유지하고 성공 후 cache consequence가 끝나면 해제한다. 검색결과 전체 선택은 서버가 조건 기반 payload를 선언할 때 별도 재검토한다.
10. 활성회원의 별도 목록 route 사이 검색 조건 전달. 발생: 전체회원에서 검색 후 일반회원·불량회원 LNB 이동. 공통 필터를 넘길지 각 route의 검색 전 상태로 진입할지 미확인이다. 선택은 어느 답에서도 route 변경 시 해제한다.
11. 세션 경고 시점 충돌. Figma `1.4.4`는 남은 시간 60초, Notion은 5분부터 카운트라고 한다. 경고 팝업과 상단 바가 다른 시간을 재는지 같은 정책이 충돌하는지.
12. 구글OTP 인증 화면이 이메일 인증과 같은 "이메일로 발송된 2차 인증코드" 문구를 쓴다. 디자인 확정인지 컴포넌트 복제 잔재인지.
13. 통합검색 결과 5개 top-level frame이 실제 tab 선택 상태인지 별도 화면인지. tab bar 렌더는 미확인이다.
14. 통계 회차가 `추가` 버튼으로 여러 세션을 고르는 구조인지. 옵션에는 숫자 회차 외 `사운드체크`·`팬이벤트부스`가 있다.
15. 회원 table·다국어·권한 matrix·발권 목록에서 반복된 `- 이하 생략 -`이 상한 안내인지 축약인지 paging 대체인지.
16. KEYSCREEN의 `발권>발권취소`·`설정 > APP 버전`·`CRM`·`상품>전시`가 정규 화면인지, 중복 시안인지, 독립 workflow인지.
17. 전시 정책·배너 이미지의 `권장 사이즈 : 가로 {n}px * 세로 {n}px`에서 실제 가로·세로 값. `png`와 `1MB 이하`는 실측됐다.
18. **충돌** `커뮤니티 > 게시판`(9.1) 일괄변경. Figma toolbar에는 **없는데** Notion Case02 목록에는 **있다**. 어느 쪽을 따르냐에 따라 그 화면에 행 선택과 상태변경 cascade가 있는지가 갈린다.
19. 답(2026-09-05): `회원 > 활성회원 > 일반회원`(4.1.2)에도 **변경완료 alert가 있다.** `99-cross-screen.md` 29행 `확인 : 선택 항목의 상태가 변경되고, 변경 완료 alert 제공`이 일반회원을 포함해 18화면이다. 30행 `[변경완료 alert]`는 그 alert의 명세 블록이 있는 17화면일 뿐이라 표제 행만 보고 부재로 읽으면 안 된다.
20. `회원 > 비활성회원 > 탈퇴회원`(4.2.2)은 행 checkbox가 있는데 toolbar action이 없다. checkbox의 용도가 미확인이다.
21. 운영자 일괄변경에서 **선택한 행이 전부 변경 불가(대기·거절·잠금)일 때** 무엇을 보여주는가. Notion 은 확인 alert 에 변경 불가 상태를 병기하라고만 하고 이 경우를 말하지 않는다. 현재 구현은 확인 후 조용히 아무 일도 하지 않는다(`targetIds.length > 0` guard). 빈 요청을 보내지 않는 것은 맞지만 무반응은 지어낸 동작이므로 답을 받기 전까지 미확인으로 둔다.
22. 일괄변경 대상 select 의 **그룹 제목과 미선택 되돌리기**. 코드는 두 화면 다 평면 옵션 + placeholder 이고 한 번 고른 대상을 다시 미선택으로 되돌릴 수 없다. 근거는 `04-members.md:18` 이 4.1.1 컨트롤을 `선택▾` 로 기록하고 그룹 제목을 적지 않은 것뿐이며 **Figma 를 직접 대조하지 않았다**(11.1 은 원장이 이 컨트롤을 기술하지 않는다). 되돌리기 필요 여부도 제품 근거가 없어 sentinel 옵션을 만들지 않았다. 현재 코드의 평면화와 초기화 불가를 확정 제품 정책으로 복사하지 마라.

### 코드 결함 후보 (2026-09-02 reference 사실 대조에서 발견, Codex·Hermes 교차 리뷰)

DOM으로 검증 가능한 3건은 2026-09-03 사용자 결정으로 이 저장소에서 수정한다(focused test 포함, 다른 에이전트가 진행 중). 나머지 2건은 AT 실측 전에는 고치지 않는 known-defect로 남기고 이관 문서에 기록한다.

- `Combobox`: trigger `aria-expanded`의 local `open`과 `Popover` 내부 open 상태가 둘이라 outside dismiss 후 어긋날 수 있음. — 2026-09-03 수정(다른 에이전트가 진행 중).
- `FormSelectField`: `aria-labelledby="labelId controlId"`로 trigger 자신의 id를 포함(의도 미확인). — 2026-09-03 수정(다른 에이전트가 진행 중).
- `FormDateRangeField`: `FormField`의 `htmlFor`가 control이 아닌 wrapper `div`를 가리킴. — 2026-09-03 수정(다른 에이전트가 진행 중).
- `MultiSelect`: 선택 없음 표시 `—`가 primitive에 하드코딩(caller prop 없음). — known-defect, AT 실측 후.
- `Pagination`: window·이전/다음은 clamp된 page, `aria-current`는 raw `page` → out-of-range면 current 표시 없음(feature canonicalization 전제). — known-defect, AT 실측 후.

## 6. 유지되는 의도적 차이 (2026-08-31 판에서 승계)

- Figma는 range를 하나의 compact field로 보여 주지만 start/end 편집 방식과 오류 lifecycle을 확정할 수 없다. 레퍼런스는 두 date value를 직접 편집 가능하게 유지하되 하나의 border surface와 calendar affordance로 조립하고, 상호 `min/max`·calendar disabled로 예방하며 수동 입력·직접 URL은 feature validation과 canonicalization으로 차단한다.
- 운영자 정렬(2026-09-02): Figma 11.1은 가입일 헤더에만 정렬 아이콘을 보이지만, 레퍼런스는 정렬 Select의 8개 옵션(가입일·최근접속일·유형·소속·아이디·이름·권한·계정 상태)과 같은 8개 헤더를 모두 클릭 가능하게 두고 glyph(▲▼ pair, 활성 방향 강조)는 활성 컬럼에만 그린다. 기본 상태의 외형은 Figma와 같다.
- 운영자 정렬 어휘: 리허설 API의 `AGENCY`는 Figma에 옵션·컬럼이 없어 URL·Select·헤더에서 제외하고 기획사 컬럼을 만들지 않는다. Figma의 휴대폰번호·이메일·가입경로 정렬은 리허설 enum·DTO(email 없음)에 없어 미확인으로 두고 신규 OpenAPI에서 다시 판정한다.
- 검색 panel 펼침 glyph는 정적 frame만으로 open/closed 의미를 확정하지 않는다. `aria-expanded`와 실제 disclosure state를 우선한다.
- rehearsal `INACTIVE`와 Figma 대기·거절·활성·비활성·잠금(11.1 조회 5 variant)의 대응, array/object-array wire serialization, API `timezone` 값은 미확인.
- 픽셀 수치는 적지 않는다(CSS는 판정 대상 아님).

## 8. 상세·폼·팝업 판정 (2026-09-02 ①′~②′, Claude·Codex 독립 초안 + 교차 리뷰)

결론: 현재 코드에 새 shared 구현을 추가하지 않는다. Tabs·Tooltip·행 활성화·상태 count 클릭 필터·빈 값 `-` 표현은 반복 근거가 생긴 후보지만 두 번째 코드 consumer가 없으며, 기존 `PageHeader.actions`·`SectionCard`·`DetailField`·`DetailStateBoundary`·form adapter·`FormSaveDialogs`·Confirm/Alert 로 현재 archetype을 조립할 수 있다.

| surface | 판정 | 근거 | 반영 |
| --- | --- | --- | --- |
| 상세 archetype(헤더 action·접이식 섹션·2열 dl·이력·상태 종속 하단 action) | feature composition | 회원·발권·소명·운영자 조회 4 화면 동일 골격 | detail-workflow 문장 |
| 상세 안 인라인 편집 섹션·섹션 단위 저장 | 섹션 하나 = 폼 하나(form-workflow) | 회원상담·소명 처리 결과·공연 입장안내 | detail-workflow 문장 |
| dialog 안 폼 | feature composition 유지 | SMS·이메일·댓글 | dialogs.md close 표면 문장 |
| page tab·언어 tab | Tabs primitive 후보(미구현), URL 여부는 feature | 7 화면 유형 | form-workflow 문장 |
| 편집 테이블·반복 행·파일 업로드 | kind D·`FormFileField` 현행 | 다국어·공연 수정 | — |
| 권한 matrix | `CheckboxTree`(1D) 로 불충분 → feature-first Table+Checkbox. **`CheckboxTree` 자체는 다중선택 필터 그룹(30여 화면)의 shared 표면으로 이관 대상** — 9/1 "matrix 전용" 제외 사유 철회 | 접근권한 등록 2D / 목록 필터 1D | form-fields.md 문장, ADR 0009 표 |
| `FormSaveDialogs` | opt-in 으로 축소(9/2) → **9/3 ②: `useSaveForm.dialogs` 안에서만 렌더**. 확인 쌍이 없는 인라인 저장은 `useSaveForm` 자체를 쓰지 않는다 | 인라인 저장은 확인 없음 | 주석·ADR 0010 개정 ② |
| 취소 alert | 불일치 → feature `ConfirmDialog`(9/1) → **9/2 재판정: dirty일 때만 뜨고, `useUnsavedChangesGuard` 가 화면 이동(Figma `1.1.3.1.2`)과 같은 blocker로 처리하며 진입 경로로 문장만 고른다** | Notion 20+ 화면 "입력을 취소하시겠습니까?" + Figma 1.3 "화면으로 이동하시겠습니까?" | Managers 적용, ADR 0010 |
| Query 오류 → facts | `api/error-outcome.ts` helper | list·detail·edit 3곳 반복 | Managers 적용 |
| `ManagerDetailScreen` | `목록으로` 제거, 이력 raw table → `Table` primitive | Figma 11.1 조회에 없음 | Managers 적용 |
| 상세·수정 상태 판정 (2026-09-03, Claude·Codex 독립안 → 교차 리뷰 2라운드) | **`src/api/required-query.ts`**: 순수 `resolveRequiredQueryOutcome` + 얇은 `useDetailQuery`. feature 훅(`useManagerDetail`·`useManagerEditDetail`)이 화면 옆에서 실행 | 삼항식이 상세·수정에 글자 그대로 복제. 초기 401/403 = generic error + incident 중복, cached+500 = 내용 소실, cached+404 = stale 표시 결함 3종 실측 | ADR 0011, detail-workflow 재작성, `features/*/api` 훅 금지 lint(사용자 결정) |
| 업데이트 이력 (2026-09-03) | **2층**: `shared/ui/patterns/UpdateHistory`(3열 + `<ul><li>` 렌더만) + feature 순수 함수 `toManagerHistoryEntries(logs, t)`. Accordion 렌더·줄 조립·값 해석 옵션 훅·도메인 formatter 훅으로 나뉜 4층 구조는 제외 | 회원·소명·발권·운영자·콘텍츠 조회 5 화면 동일 3열, 사항 열은 field 단위 `이름: A > B` 다중 행(4.1.4). 현재 코드는 `type` 한 줄로 디자인 미달이었음. discriminated union 은 첫 consumer 에 없는 분기라 YAGNI | ADR 0011, page-and-detail-surfaces 행, seed `update-history` bundle |
| 미구현 유지(계약 없음) | 헤더 SMS·이메일, 개인정보 재인증 이후 처리, 상태별 승인·거절, `agencyId` | 재인증 입력은 확인됐지만 재조회/해제 범위/감사와 서버 계약은 미확인 | ADR 0010·0011 미확인 |
| 접힌 섹션의 오류 표기 | **헤더 "오류 N개" 텍스트 배지 + 폼 섹션 keepMounted** (Claude·Codex 독립안 → 교차 리뷰 합의) | 재접기 후 오류 발견성(WCAG 3.3.1 흐름 유지), Figma 에 상태 frame 없음 → 사용자 요구로 추가. unmount 가 error map 을 비우는 실측 때문에 재파싱 대신 mount 유지 채택 | `SectionCard errorCount/keepMounted`, `useFormSections invalidFields`, ADR 0010 개정, 재검증 절차 제거 |

## 8-1. 진행 표면 정책 (2026-09-02 사용자 요구)

| 조회 종류 | 표면 | 근거·구현 |
| --- | --- | --- |
| 화면 진입 목록 결과·상세·수정 조회 (primary) | 전역 `BlockingProgress` "로딩중" | Figma 1.4.1. observed·pending·명시적 `blockingProgress` |
| 검색·정렬·필터·페이지 등 mounted content GET | 기존 결과 유지 + 결과 영역 `aria-busy`, overlay 없음 | `contentProgress` + `keepPreviousData`; 요청 시간으로 blocking 승격하지 않음 |
| 옵션·lookup (select 선택지) | 필드 inline 상태만, overlay 없음. route loader + preload intent로 warm | `inlineProgress` meta(`api/query-meta.ts`), Managers 3 option query·new/edit loader |
| mutation (저장) | 전역 "등록중" + 시작 버튼 pending | Figma 1.4.2, `FormSubmitButton pending` |
| 다운로드·일괄 작업 | 버튼 pending만(overlay 미확인) | Figma에 frame 없음 → §5 질문 |
