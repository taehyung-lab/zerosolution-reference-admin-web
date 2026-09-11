# 9. 커뮤니티

표 형식은 [README.md](README.md). Notion 열의 `(대기)`는 아래 **Notion 요점**과 `notion/` 원문으로 대체한다.

| 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |
| --- | --- | --- | --- | --- | --- |
| 9.1 게시판 | 검색 전 상태 | 검색전 frame 없음. 결과 3건(소규모 목록) | **진입 즉시 조회** — 원문 시나리오가 `게시판 리스트를 조회할 수 있다`이고 `화면진입 시 검색안내 화면이 제공된다`가 아니다([진입 판별](../../../.agents/skills/feature-contract/references/list-workflow.md), 2026-09-10 사용자 확정). 초기화 후 상태는 미확인 | 초기화가 결과를 비우는지([질문 24](../zero-sol-figma-analysis.md#질문-24)) | `screens/board-list/model/useBoardListFilter.ts`(초기화는 조건만 default 로 되돌린다) |
| 9.1 게시판 | 기간·검색어 | 기준 등록일·최근업데이트일. 검색어 게시판명 1개 + chip | 기간 기준 2개·검색어 대상 게시판명·다중 키워드 허용(원문 35·37·38행) | 기간 기준 기본값([질문 26](../zero-sol-figma-analysis.md#질문-26)) | `screens/board-list/model/board-list-search.ts`(대상이 하나여도 URL 은 축을 가진 `keywords: {field,value}[]`) |
| 9.1 게시판 | 다중선택 | 유형(일반 1개), 구분(전체·일반·상담), 사용상태(전체·사용·사용안함) | 구분·사용상태 다중선택이고 default 는 전체(원문 38·39행). 유형은 원문 검색 영역에 없다 | 유형의 옵션 집합([질문 25](../zero-sol-figma-analysis.md#질문-25)) | `screens/board-list/ui/BoardListFilters.tsx`(`CheckboxTree` `emptyMeansAll`) |
| 9.1 게시판 | **cascade select 필터** | 권한 > "쓰기 *"(필수 표시) select: 전체 / 비회원 포함 / 전체회원 / 회원등급 > (일반회원·특별회원) / 운영자 — 2단 cascade. 아래 13행의 `Case 정의` frame 은 cascade 가 없다고 적어 서로 어긋난다 | 검색 영역 권한은 **쓰기·읽기 두 개**이고 각각 전체·비회원 포함·전체회원·회원등급·운영자 중 택1(원문 41행). 하위 등급 목록은 원문에 없다 | 2단 cascade 존재 여부와 회원등급 하위 목록([질문 23](../zero-sol-figma-analysis.md#질문-23)) | `BoardListFilters.tsx`(`권한` 이름의 `FilterField group` 하나 아래 쓰기·읽기 단일 select 2개, cascade 미구현) |
| 9.1 게시판 | toolbar 우 | `등록`만 | 일괄변경 없음(2026-09-10 사용자 확정). [질문 18](../zero-sol-figma-analysis.md#질문-18) 철회. `등록` 은 등록 화면으로 이동(원문 43행) | — | `screens/board-list/ui/BoardListResult.tsx`(toolbar 우 `등록` → `/community/boards/new`, 이동은 route 가 소유) |
| 9.1 게시판 | table | checkbox 없음, `No.`. 유형·구분·게시판명·권한(쓰기/읽기)·게시물수·게시물(**link 셀 "조회"** → 게시물 목록 이동)·사용상태·등록일/최근업데이트일 | 행 선택 checkbox 없음(2026-09-10 사용자 확정). [질문 18](../zero-sol-figma-analysis.md#질문-18) 철회. 행 클릭은 조회 화면 이동(원문 51행) | `No.` 가 서버 번호인지 페이지 내 순번인지. 형제 목록과 **방향이 다르다** — 공연 목록(`performance-columns.tsx`)은 `total - offset - index` 로 내림차순이고 이 화면은 `offset + index + 1` 로 오름차순이다. 어느 쪽이 제품 정책인지 미확인이라 현재 동작을 유지했다. 권한 한 컬럼에 쓰기/읽기 두 값을 어떻게 배치하는지 | `screens/board-list/ui/board-list-columns.ts`(`DataTable`, `No.` 는 페이지 내 순번, 권한은 쓰기·읽기 두 컬럼). 행 클릭은 `DataTable onRowActivate` → `/community/boards/$boardId`. **게시물 `조회` link 는 게시물 목록 route 가 없어 여전히 미구현** |
| 9.1 게시판 (`129:59279` Case) | 정렬·cascade | cascade 없음. 정렬은 등록일·최근업데이트일·유형·구분·게시판명·권한·게시물수 | 정렬 7개 확정(2026-09-10 사용자 확정). Notion 원문은 `정렬 → 리스트 중 택1` 로 목록을 열거하지 않는다. 보기 default 는 100(원문 46행 + [질문 1](../zero-sol-figma-analysis.md#질문-1) 확정) | 정렬 **default 필드**: `notion/09-community.md:47` 은 `등록일 or 마지막으로 설정한 값` 이라 확정값이 아니고, [질문 1](../zero-sol-figma-analysis.md#질문-1)의 답은 보기에만 적용된다. 현재 코드의 `registeredAt` 은 추론이다. 정렬 기본 방향은 `desc` 로 확정(2026-09-11 사용자, [질문 3](../zero-sol-figma-analysis.md#질문-3)); 활성 컬럼은 첫 렌더부터 방향 표시 | `screens/board-list/ui/useBoardListResult.ts`·`board-list-columns.ts`(URL 은 `sortType`·`sortDirection`, 값은 `asc`/`desc` 기본 `desc`, 활성 컬럼에만 `aria-sort` — `headerSortDirection`) |
| 9.1 게시판 | 상세(조회) | 조회 frame 존재 | 업데이트 내역의 `업데이트일 : 수정되어 저장된 날짜`. `수정 버튼 → 클릭시, 수정 화면으로 이동`. `삭제 버튼 → 클릭시 삭제 확인 alert 제공` → 문구는 공통 `1.1.3.1.1 삭제 확인`([01-common.md](01-common.md))의 `삭제하시겠습니까? / 확인, 취소` → `확인 : 삭제되며, 삭제 완료 alert 제공`(원문 「게시판정보를 조회할 수 있다」·[99-cross-screen](notion/99-cross-screen.md) 39·41·49·93행) | 조회 화면이 어떤 필드를 어떤 순서로 보여 주는지와 업데이트 내역의 열 구성, 삭제 완료 alert 문구([질문 31](../zero-sol-figma-analysis.md#질문-31)). 원문 44행의 `저장 버튼 → 유효성 체크`(출처 「게시판정보를 조회할 수 있다」)가 조회 화면 안의 저장 표면인지 — 아래 폼 행으로 옮긴 것은 추론 | `screens/board-detail/ui/BoardDetailScreen.tsx`(원장 12행이 레코드 값으로 열거한 9개 필드 + 공용 `UpdateHistory` 3열), `model/board-history.ts`, `model/board-detail-requests.ts`(삭제는 요청 함수 도달까지) |
| 9.1 게시판 | 등록·수정 폼 | 등록(+Case)·수정 frame 존재. 등록의 항목 사용 설정 이름은 `피드백 설정`(+`조회수`) | `구분 → 필수선택, 직접선택` · `일반, 상담, 공지사항 중 택1` · `default : 일반`, `게시판명 → 필수입력, 직접입력`, `권한 → 쓰기 → 비회원 포함, 전체회원, 회원등급, 운영자 중 택1`, `저장 버튼 → 클릭시, 유효성 체크 → Case02. 정상`(원 출처는 「게시판정보를 조회할 수 있다」 44행 — 폼 행으로 옮긴 것은 추론). 취소 문구는 [99-cross-screen](notion/99-cross-screen.md) 21행(원문 「게시판을 등록할 수 있다」) | 폼에 `읽기` 권한·사용상태 입력이 있는지([질문 29](../zero-sol-figma-analysis.md#질문-29)), 수정 화면의 필드 집합([질문 30](../zero-sol-figma-analysis.md#질문-30)), `피드백 설정` 세부 옵션([질문 28](../zero-sol-figma-analysis.md#질문-28)), `회원등급` 선택 시 하위 등급 입력([질문 32](../zero-sol-figma-analysis.md#질문-32)), 게시판명 길이·문자 제약. 검색 영역의 구분은 2개인데 등록은 3개다 | `screens/board-form/`(`model/board-form-schema.ts` 세 필드, `ui/BoardCreateScreen.tsx`·`BoardEditScreen.tsx`, 저장은 `model/board-form-requests.ts` 도달까지) |
| 9.1 게시판 | 카테고리 설정 팝업 | 팝업 카테고리 설정 frame 존재 | `카테고리 → 카테고리 설정 버튼 → 클릭시 카테고리 설정 팝업 제공` · `추가 버튼 → 클릭시, 입력 필드가 최상단(순서 1)에 추가됨` · `정렬 → 드래그&드롭으로 순서 변경 가능` · `순서` · `제목 지정 → 삭제 버튼` | 확인·취소의 커밋 시점, 제목 검증, 최대 개수, 순서 저장 단위([질문 27](../zero-sol-figma-analysis.md#질문-27)) | 없음 — 위 미확인이 풀리기 전에는 만들지 않는다 |
| 9.2 게시물 | 검색 전 상태 | 검색전 frame 없음 | (대기) | — | — |
| 9.2 게시물 | 기간·검색어 | 기준 등록일·최근업데이트일. 검색어 대상 내용·제목 + chip("내용 : 공지사항") | (대기) | — | — |
| 9.2 게시물 | **option-source select** | 게시판: 단일 select, 옵션이 서버 게시판명 목록(`{게시판명}` 반복) — 동적 option source. 회원유형: 단일 select(전체·비회원 포함·전체회원·운영자) | (대기) | 게시판 옵션 로딩 실패 시 표시 | `AsyncFieldBoundary` |
| 9.2 게시물 | 다중선택 | 구분(일반·상담), 답변상태(대기·검토중·완료), 게시상태(사용·사용안함) | (대기) | — | — |
| 9.2 게시물 | toolbar 우 | `선택▾`+`변경` · `등록` | (대기) | — | — |
| 9.2 게시물 | table | checkbox. 구분·게시판·카테고리·제목·내용(2줄 말줄임 + **이미지 썸네일 행**)·회원유형/회원등급·작성자(이름(이메일))·좋아요·싫어요·평점·댓글·조회·답변상태·게시상태·등록일/최근업데이트일 | (대기) | — | — |
| 9.2 게시물 | 상세·등록·수정 | 조회(`129:61360`)+Case(`203:6217`), 등록(`129:61332`)+Case(`129:61290`), 수정(`129:61245`)이 별도 top-level frame. 조회에는 답변상태 변경(대기·검토중·완료)과 상태변경(게시·게시안함) 컨트롤이 각각 있다 | (대기) | — | — |
| 9.2 게시물 | 팝업 | 보기(`129:61240`) · 참여자 조회(좋아요 `129:61080`/Case `129:61055`, 싫어요 `129:60895`/Case `129:60870`, 평점 `129:60679`/Case `129:60636`) · 댓글등록(`129:60619`/Case `129:60611`) · 작성자 검색(`150:21095` 검색전/`150:21518` 검색후/`150:21829` Case). 참여자 정렬은 참여일·회원유형·회원등급·아이디·이름 | (대기) | — | — |
| 9.2 게시물 | **팝업 안의 list 조립** | `작성자 검색` 팝업(1219×967): 라디오(APP 회원/운영자) + 기간 + 검색어(이메일·이름·휴대폰번호·아이디) + 가입방법·계정 상태·활동제한 + 검색/초기화 → 검색결과·보기·정렬 → `선택` 라디오/체크 컬럼 table → paging → `확인`/`취소`. **검색전/검색후 frame이 팝업 안에도 존재** | (대기) | 단일/다중 선택, 확인 시 반환값 | list mechanic이 Router search에 묶여 있으면 재사용 불가 |

### 작성자 검색 APP 회원 Case 재대조 (2026-09-07, Aside)

`150:21829` 렌더는 **APP 회원 라디오가 선택된 상태**다. 기간 기준은 가입일·최근접속일,
검색어 대상은 이메일·이름·휴대폰번호·아이디 4개가 보인다. 가입방법은 직접가입·카카오 간편가입·
네이버 간편가입·애플 간편가입 4개, 계정 상태는 일반회원·불량회원, 활동제한은 스페셜콘텐츠·1:1문의다.
회원 목록의 옵션 집합을 그대로 복사하지 않는다. 이 관찰은 운영자 세그먼트의 옵션이나 서버 enum을 확정하지 않는다.

## Notion 요점 (원문: [notion/09-community.md](notion/09-community.md))

- 초기화·보기(100)·정렬(등록일) 동일. 행 클릭 → 조회 화면. 게시물 일괄변경 3단계 alert. **게시판에는 일괄변경이 없다**(2026-09-10 사용자 확정, [질문 18](../zero-sol-figma-analysis.md#질문-18) 철회). 구분 "전체, 일반, 상담 중 다중선택". 게시물 default 대기/게시.
