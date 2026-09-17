<!-- 생성물이다. scripts/product/build-index.mjs 가 만든다. 손으로 고치지 않는다. -->
# 제품 사실 색인

요청이 제품 값에 의존하면 여기서 대상을 찾고 **그 하나만** 연다. 관례로 여러 개를 열지 않는다.
아래 **두 표를 모두** 본 뒤에도 없으면 그때가 `미확인`이다 — 무엇을 누구에게 물어야 하는지 적고
그 부분만 보류한다. 첫 표에 없다는 것만으로 부재라고 쓰지 않는다.

이 표의 이름·역할·상태는 각 fact 파일의 frontmatter 가 소유한다. 이 파일을 고치지 말고 fact 를 고친 뒤
`pnpm product:index` 를 다시 돌린다.

| ID | 제목 | 역할 | 상태 | fact |
| --- | --- | --- | --- | --- |
| `CONTACT-MASKING` | 목록·조회의 연락처 마스킹 | policy | 관찰됨 | [CONTACT-MASKING.md](facts/CONTACT-MASKING.md) |
| `PERF-DETAIL` | 공연 조회 | detail | 관찰됨 | [PERF-DETAIL.md](facts/PERF-DETAIL.md) |
| `PERF-EDIT-ADMISSION` | 공연 수정 — 입장안내정보 | form | 관찰됨 | [PERF-EDIT-ADMISSION.md](facts/PERF-EDIT-ADMISSION.md) |
| `PRINTER-DETAIL` | 스마트프린터 조회 | detail | 관찰됨 | [PRINTER-DETAIL.md](facts/PRINTER-DETAIL.md) |
| `PRINTER-FORM` | 스마트프린터 등록·수정 | form | 관찰됨 | [PRINTER-FORM.md](facts/PRINTER-FORM.md) |
| `PRINTER-LIST` | 스마트프린터 목록 | list | 관찰됨 | [PRINTER-LIST.md](facts/PRINTER-LIST.md) |
| `PROFILE-DETAIL` | 내정보 조회 | detail | 관찰됨 | [PROFILE-DETAIL.md](facts/PROFILE-DETAIL.md) |
| `PROFILE-EDIT` | 내정보 수정 | form | 관찰됨 | [PROFILE-EDIT.md](facts/PROFILE-EDIT.md) |

총 8개.

## 아직 fact 로 옮기지 않은 화면

여기 있는 surface 는 **관찰이 존재한다.** 형식만 옛 원장이다. 대상이 이 표에 있으면 `미확인` 이라고
쓰지 말고 그 원장을 읽는다 — 다만 원장은 한 파일이 여러 화면을 담으므로 **그 화면의 행만** 읽고,
다른 화면의 값을 근거로 쓰지 않는다. 그 화면을 실제로 구현하거나 고치는 작업에서 fact 로 옮긴다.

| 옛 ID | 제목 | 역할 | 상태 | 원장 |
| --- | --- | --- | --- | --- |
| `common` | 공통 shell·LNB·alert·세션 | — | **미이관** | [docs/reference/zero-sol/01-common.md](../docs/reference/zero-sol/01-common.md) |
| `auth` | 로그인·찾기·가입·결과조회 | — | **미이관** | [docs/reference/zero-sol/02-auth.md](../docs/reference/zero-sol/02-auth.md) |
| `dashboard` | 대시보드 집계·이동 | — | **미이관** | [docs/reference/zero-sol/03-dashboard.md](../docs/reference/zero-sol/03-dashboard.md) |
| `members` | 회원 목록·상세·폼·상담·소명·접속 | — | **미이관** | [docs/reference/zero-sol/04-members.md](../docs/reference/zero-sol/04-members.md) |
| `member-messaging` | 회원 SMS·이메일 팝업 | — | **미이관** | [docs/reference/zero-sol/04-members.md](../docs/reference/zero-sol/04-members.md) |
| `performance-list` | 5.2 공연 목록 | — | **미이관** | [docs/reference/zero-sol/05-performances.md](../docs/reference/zero-sol/05-performances.md) |
| `performance-venue` | 5.2 공연 목록 내부 공연장 선택 | — | **미이관** | [docs/reference/zero-sol/05-performances.md](../docs/reference/zero-sol/05-performances.md) |
| `performance-language` | 5.2 기본정보 내부 언어 탭 | — | **미이관** | [docs/reference/zero-sol/05-performances.md](../docs/reference/zero-sol/05-performances.md) |
| `performance-content` | 5.1 콘텐츠 목록·조회·수정 | — | **미이관** | [docs/reference/zero-sol/05-performances.md](../docs/reference/zero-sol/05-performances.md) |
| `content-preview` | 5.1 콘텐츠 미리보기 팝업 | — | **미이관** | [docs/reference/zero-sol/05-performances.md](../docs/reference/zero-sol/05-performances.md) |
| `ticketing` | 발권 등록·목록·상세·프린터 | — | **미이관** | [docs/reference/zero-sol/06-ticketing.md](../docs/reference/zero-sol/06-ticketing.md) |
| `exhibition` | 전시 배너·APP Splash | — | **미이관** | [docs/reference/zero-sol/07-exhibition.md](../docs/reference/zero-sol/07-exhibition.md) |
| `promotion` | 프로모션 APP PUSH | — | **미이관** | [docs/reference/zero-sol/08-promotion.md](../docs/reference/zero-sol/08-promotion.md) |
| `community` | 게시판·게시물·작성자 검색 팝업 | — | **미이관** | [docs/reference/zero-sol/09-community.md](../docs/reference/zero-sol/09-community.md) |
| `statistics` | 통계 집계·회차·전치 표 | — | **미이관** | [docs/reference/zero-sol/10-statistics.md](../docs/reference/zero-sol/10-statistics.md) |
| `manager-list` | 운영자 목록 | — | **미이관** | [docs/reference/zero-sol/11-settings.md § 11.1 운영자 — 목록](../docs/reference/zero-sol/11-settings.md) |
| `manager-detail` | 운영자 상세 | — | **미이관** | [docs/reference/zero-sol/11-settings.md § 11.1 운영자 — 상세](../docs/reference/zero-sol/11-settings.md) |
| `manager-create` | 운영자 등록 | — | **미이관** | [docs/reference/zero-sol/11-settings.md § 11.1 운영자 — 등록](../docs/reference/zero-sol/11-settings.md) |
| `manager-edit` | 운영자 수정 | — | **미이관** | [docs/reference/zero-sol/11-settings.md § 11.1 운영자 — 수정](../docs/reference/zero-sol/11-settings.md) |
| `settings` | 운영자·약관·정책·권한·로그 | — | **미이관** | [docs/reference/zero-sol/11-settings.md](../docs/reference/zero-sol/11-settings.md) |
| `search` | 통합검색의 독립 결과 영역 | — | **미이관** | [docs/reference/zero-sol/12-search.md](../docs/reference/zero-sol/12-search.md) |
| `onsite` | 현장발권 예매검색·신규예매·출입조회 | — | **미이관** | [docs/reference/zero-sol/14-onsite.md](../docs/reference/zero-sol/14-onsite.md) |
| `notifications` | 개별 알림·알림 목록 패널 | — | **미이관** | [docs/reference/zero-sol/15-notification.md](../docs/reference/zero-sol/15-notification.md) |
| `content-bulk` | 5.1 콘텐츠 사용상태 일괄변경 | — | **미이관** | [docs/reference/zero-sol/05-performances.md](../docs/reference/zero-sol/05-performances.md) |
| `content-edit` | 5.1 콘텐츠 조회·수정 | — | **미이관** | [docs/reference/zero-sol/05-performances.md](../docs/reference/zero-sol/05-performances.md) |

총 25개.
