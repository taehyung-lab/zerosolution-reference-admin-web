# List

목록 화면 하나의 계약이다: URL 검색 필드, 조회, 필터 초안, 결과, 정렬, 행 선택과 액션, 파일 집합.
읽는 순서는 요청이 바꾸는 절만이다. 도메인 이름은 어디에도 없다 — `{entity}` 자리에 그 화면의 엔티티가 들어간다.

## Ownership

| 값 | 소유자 |
| --- | --- |
| 조회 데이터와 캐시 | TanStack Query (`api/queries.ts` 의 `queryOptions` 하나를 route·화면·테스트가 같이 쓴다) |
| 확정된 필터·정렬·페이지·보기 | route search. 화면은 sparse 를 받아 경계에서 한 번 해소한다 |
| 아직 확정하지 않은 입력 | 필터 초안 (`useListFilterDraft`) |
| 행 선택 | 결과 훅 (`usePageRowSelection`) — 확정 검색이 바뀌면 사라진다 |
| 액션의 확인·거절 문구 | 액션 컴포넌트 (`useConfirmation`, `useSelectionGate`) |

feature 가 소유하는 것: 필드와 enum 의미, 기본값, 선택지 출처, 라벨, 컬럼, 요청 mapper, 검색 정책(즉시 조회인가 검색 뒤 조회인가), 액션의 대상·문구·권한.
shared 가 소유하는 것: 위 표의 mechanic 과 렌더 계약([catalog](../../shared-ui-contract/references/catalog.md)). 검색 정책·기본값·"조건 없음"의 뜻은 제품 원장에서 읽고, 형제 화면에서 복사하지 않는다.

## URL

`model/{entity}-list-search.ts` 한 파일이 필드별 `schema`·`defaultValue`·`kind` 를 선언하고 `defineSearchFields`(진입 즉시 조회) 또는 `defineGatedSearchFields`(검색 뒤 조회)를 부른다. 결과 하나에서 `schema`(route 검증)·`defaults`·`partition`·`resolve`·`canonical` 을 얻는다.

| 필드 | 모양 | kind |
| --- | --- | --- |
| `page` | 양의 정수, 기본 1 | view |
| `pageSize` | `standardPageSizeOptions` 중 하나 | view |
| `sortType` | 정렬 키 enum. 컬럼 집합과 같은 타입에서 나온다 | view |
| `sortDirection` | `'asc' \| 'desc'`, **`defaultValue` 필수**(활성 컬럼은 첫 렌더부터 방향을 가진다. `contracts:check` 가 `undefined` 를 잡는다) | view |
| `periodType`, `startDateTime`, `endDateTime` | 기간 기준 enum + UTC instant 둘. 한쪽만 있거나 역전이면 canonical 이 둘 다 지운다 | filter |
| `keywords` | `{ field, value }[]` — 대상이 하나여도 이 모양 | filter |
| 다중선택 | enum `string[]`, 빈 배열 = 조건 없음 | filter |
| 단일선택 | enum 값 또는 `undefined`(조건 없음). UI 의 "전체" 항목은 화면 전용 값이고 URL 에 나가지 않는다 | filter |
| `searched` | gated 목록만. `defineGatedSearchFields` 가 붙인다 — 빈 URL 은 검색 전, 유효 조건이 하나라도 있으면 검색된 URL, `searched: false` 커밋은 검색 전으로 복귀(초기화) | — |

- 잘못된 값은 `optional().catch(undefined)` 로 복구하고 다른 유효 필드는 남긴다. 배열은 `recoverArrayItems`(항목 제거) 또는 `recoverArray`(배열 제거) 중 원장이 말하는 쪽.
- 같은 파일의 `to{Entity}ListRequest(search)` 가 해소된 값을 요청 입력으로 옮긴다 (`nonEmptyArray` 로 빈 배열 생략). Query key 도 같은 객체다.
- 화면은 `const search = {entity}ListSearch.resolve(sparse)` 로 한 번 해소하고 모든 URL 전이를 `commit = (next) => onSearchChange({entity}ListSearch.canonical.parse(next))` 하나로 내보낸다. route 는 sparse 만 넘긴다.
- 보기 전이는 `listViewControls({ search, totalPages, commit })`(`shared/lib/list-view.ts`)가 소유한다: 보기·정렬 키 변경은 첫 페이지, 페이지 이동은 나머지 보존, **활성 컬럼 헤더 클릭만 방향을 뒤집고** 다른 키 선택은 방향을 유지한다. 이 전이를 화면에 다시 쓰지 않는다.
- 같은 화면의 URL 변형(탭·경로별 고정 필터)은 `model/{entity}-list-definition.ts` 의 typed definition 하나로 표현하고 route 가 definition 을 고른다. 검색 정책·선택·액션이 다르면 다른 화면이다.

## Query

`model/use{Entity}ListData(search)` 가 `useListQuery({ options, searched, select })`(`src/api/list-query.ts`)를 부르고 `{ rows, total, searched, isPending, isFetching, isError, trace, retry }` 에 `totalPages` 를 더해 돌려준다.

- `searched` 는 Query `enabled` 와 결과의 `notSearched` 를 함께 정하는 **한 사실**이다. 즉시 조회 목록은 `true` 를 넘긴다.
- 진입 fetch 만 `blockingProgress`, 이후 검색·정렬·페이지는 `contentProgress` + `keepPreviousData` — `useListQuery` 가 정하므로 화면이 meta 를 다시 쓰지 않는다. 빈 페이지는 결과이고 오류가 아니다. 세션·권한 실패는 목록의 오류가 아니라 incident 표면의 것이다.
- 목록 route 는 목록 query 를 loader 에서 기다리지 않는다([router 형태](router.md#형태)).
- 선택지 query 는 `api/queries.ts` 에 `inlineProgress` + `staleTime: Infinity` 로 따로 선언하고, `api/use{Entity}Options.ts` 의 훅이 `{ state: 'loading' | 'error' | 'ready', items, retry }` 로 투영한다. 필터와 폼이 같은 훅을 쓴다. `data ?? []` 로 실패를 빈 목록으로 접지 않는다.

## Filter

`model/use{Entity}ListFilter(search, commit)` 가 `useListFilterDraft({ search, partition, scope, keywords, initialKeywordField })` 의 결과에 `submit(event)` 와 `reset()` 을 더해 돌려준다.

- `submit`: `preventDefault` → `prepareSubmit()` → `commit({ ...search, ...filters, ...range, keywords, page: 1 })`. gated 목록은 `searched: true` 를 더한다. 보기·정렬은 유지한다.
- `reset`: `resetDrafts()` → 즉시 조회 목록은 `commit({ ...defaults })`, gated 목록은 `commit({ ...defaults, searched: false })`(검색 전 복귀).
- `scope` 는 초안의 정체성에 들어간다. gated 목록은 `search.searched` 를 넘겨 검색 전·뒤 초안이 섞이지 않게 한다.
- 라벨·선택지·"전체" 항목·`AsyncFieldBoundary` 배치는 `ui/{Entity}ListFilters.tsx` 가 소유한다. 훅은 문구를 모른다. 필드 렌더 계약은 [catalog Filter](../../shared-ui-contract/references/catalog.md#filter).
- 기간·검색어의 수명이 다른 화면(즉시 검색 하나, 텍스트 하나)은 `usePeriodDraft`·`useKeywordDraft` 를 직접 조립한다. 없는 입력에 빈 상태를 만들지 않는다.

## Result

`ui/use{Entity}ListResult({ search, rows, totalPages, commit })` 가 `selection`(`usePageRowSelection`, `resetKey: JSON.stringify(search)`)·`view`(`listViewControls`)·`columns` 를 돌려주고, `ui/{Entity}ListResult.tsx` 가 이 순서로 그린다: `ResultTotal` → `ResultToolbar`(왼쪽 `PageSizeControl`·`SortControl` 은 검색 뒤에만, 오른쪽 `actions` slot) → `ListResult`(`data`, `copy: { notSearched, empty }`, `footer: <Pagination {...view.pagination} />`) → 안에 `DataTable`(`rows`, `columns`, `getRowId`, `onRowActivate`).

- `ListResult` 가 `notSearched → loading → error → empty → ready` 를 판정하고 공용 로딩·오류·재시도·trace 를 그린다. 화면은 두 문구만 준다.
- 행 클릭 목적지(`onActivate`)와 등록 목적지(`onCreate`)는 Screen 의 props 이고 route 가 navigate 를 넣는다.
- 컬럼(`ui/{entity}-list-columns.tsx`)은 `selectionColumn(...)` + 정렬 키 배열을 순서대로 map 한다. 셀 포맷은 컬럼 파일 안의 한 함수다.

## Sorting

`SortControl` 은 정렬 **필드** select 만이다. 방향 UI 는 컬럼 헤더 하나다: `DataTable` 이 `meta.sort: { direction, onSort }` 로 헤더 버튼·`aria-sort`·glyph 를 그린다.

- `direction` 은 `headerSortDirection({ type: search.sortType, direction: search.sortDirection }, key)`(`shared/lib/list-sort.ts`)로만 만든다. 활성 키만 값을 갖고 나머지는 `undefined`(테이블당 `aria-sort` 하나). `contracts:check` 는 `ui/*-columns.tsx` 가 `onSort` 를 선언하면 이 import 를 요구하고 손으로 쓴 `'ascending'|'descending'` 을 거부한다.
- `onSort` 는 `view.sort.onHeaderSort(key)` 다. 방향 전이 규칙은 [URL](#url) 의 `listViewControls` 가 소유한다.
- 정렬 가능 컬럼·URL enum·select 옵션은 `model/{entity}.ts` 의 정렬 키 배열 하나에서 나온다.

## Selection and actions

행 선택을 요구하는 액션(일괄 변경·발송·다운로드)은 `model/use{Entity}ListActions(selectedIds, rows)` 와 `ui/{Entity}ListActions.tsx` 쌍이다. 액션이 없으면 두 파일도 없고 등록 버튼은 Result 의 `actions` slot 에 바로 둔다.

- 훅: `useSelectionGate(selectedIds.length)` 로 미선택·부적격을 한 alert 로 거절하고, `useConfirmation({ run, description, confirmLabel? })` 로 확인 → `run` → 닫힘을 소유한다. `run` 은 `useMutation({entity}Mutation(locale)).mutateAsync(input)` 이다. 대상 ID·값·행 적격 규칙·문구는 훅이 정한다.
- 컴포넌트: 버튼과 값 select 를 그리고 `<SelectionAlert controller={gate} />` 와 `{dialog}` 를 **자기 안에** 렌더한다. `searched` 로 가리는 것은 버튼이지 다이얼로그 소유자가 아니다 — 소유자가 `ListResult` 의 ready 분기나 `searched` 분기 안에 있으면 확인 뒤 refetch 의 loading 이 다이얼로그를 떨어뜨린다.
- 헤더 체크박스는 현재 페이지의 선택 가능 행이다. 확정 검색(페이지·보기·정렬·필터)이 바뀌면 선택이 사라지고, 같은 검색의 refetch 는 남아 있는 선택 가능 ID 만 유지한다. 검색 결과 전체 선택은 서버가 조건 기반 payload 를 선언할 때 별도 계약이다.
- payload 는 stable ID 배열이다. 부분 성공은 응답이 행 단위 결과를 노출할 때만 보고한다. 클라이언트 배치·폴링·재시도 정책을 만들지 않는다.
- 미연결 mutation 은 [mutations](../../api-contract/references/mutations.md#시나리오-요청) 의 `scenarioRequest(label)` 로 성공 경로를 끝까지 돈다. 확인창이 닫히는 것으로 완료를 주장하지 않고, 요청 함수의 로그 한 줄을 관찰한다.

## Collections elsewhere

목록 결과 밖의 행 집합(상세 섹션의 표, 폼의 반복 행, 다이얼로그의 검색 결과)은 이 문서가 아니라 [collection](collection.md) 이 분류한다. 그 분류가 다시 이 문서를 가리키는 것은 **필터·정렬·페이지를 가진 집합**뿐이고, 그때도 URL 은 독립 route 로 진입할 때만 쓴다.

## 형태

**책임이 있으면 이 이름·이 자리에 둔다. 없으면 파일도 없다.** 파일 개수는 규칙이 아니다 — 기간·검색어·다중선택이 다 있는 목록과 텍스트 하나로 거르는 목록은 책임 수가 다르고, 그러면 파일 수도 다르다. 이 표가 고정하는 것은 "있을 때 어디서 찾는가" 뿐이다. 폴더는 `screens/{entity}-list/`([folder-structure](../../folder-structure-contract/SKILL.md)).

| 책임 | 있으면 이 자리 |
| --- | --- |
| URL 필드 선언·해소·canonical·요청 mapper([URL](#url)) | `model/{entity}-list-search.ts` |
| 필터 초안과 두 커밋([Filter](#filter)) | `model/use{Entity}ListFilter.ts` |
| 조회 사실([Query](#query)) | `model/use{Entity}ListData.ts` |
| 컬럼과 정렬 매핑([Sorting](#sorting)) | `ui/{entity}-list-columns.tsx` |
| 선택·보기 컨트롤·컬럼 조립 | `ui/use{Entity}ListResult.ts` |
| 필터 패널 렌더와 라벨 | `ui/{Entity}ListFilters.tsx` |
| 건수·툴바·표·페이지 렌더 | `ui/{Entity}ListResult.tsx` |
| 선택 요구 액션([Selection and actions](#selection-and-actions)) | `model/use{Entity}ListActions.ts` · `ui/{Entity}ListActions.tsx` |
| URL 변형의 고정 조건 | `model/{entity}-list-definition.ts` |
| 위의 것들을 배선하고 URL·이동 callback 을 받는 진입 | `ui/{Entity}ListScreen.tsx` |

- **작은 목록은 나누지 않아도 된다.** 필터가 텍스트 하나면 그 상태를 Screen 이 직접 들 수 있고, 결과가 표 하나면 Result 컴포넌트를 따로 만들지 않아도 된다. 나누는 기준은 파일 수가 아니라 **한 파일이 두 가지 상태를 소유하기 시작할 때**다. 한 번 나누면 위 이름을 쓴다.
- 반대로 빈 어댑터는 만들지 않는다. 책임이 없는데 파일만 있으면 읽는 사람이 없는 상태를 찾게 된다.
- 두 화면이 같은 의미·상태 전이·실패로 쓰는 조각만 `mechanics/{capability}/{ui,model}` 로 올린다. 화면이 형제 화면을 import 하는 것은 lint 가 막는다.
- 서버 연결 전 예시 행은 예시임이 드러나는 값을 쓴다.
- route 는 [router 형태](router.md#형태)를 따른다. 목록 route 를 저장소의 검색 계약 e2e 경로 배열에 등록하는 규칙이 있으면 `contracts:check` 가 본다.
- 테스트는 파일 수가 아니라 **닫아야 할 동작**으로 고른다: URL 계약(키 집합·기본값·canonical·불량 값 복구·요청 mapper)과 화면 동작(진입 상태·검색·초기화·정렬·페이지·선택·액션의 거절/취소/확정). 소유자 옆에 두고, 화면 테스트는 route 처럼 커밋된 검색을 되돌려 주는 harness 로 렌더한다.

## Verification

바뀐 전이만 실측한다: canonical URL 복구와 history, 초안 재생성, Query `enabled` 와 key·params 동일성, 다섯 결과 상태 도달, 페이지 리셋, 접근 가능한 이름, stable row ID, 선택 해제, 액션의 거절·취소·확정 각 한 번. 브라우저 증거는 어떤 URL 에서 무엇을 눌러 URL·화면이 어떻게 됐는지를 적는다.

실측한 것 중 되돌아올 전이 하나를 `tests/e2e/` 에 회귀 앵커로 남긴다([screen-loop 실측](../../screen-loop/SKILL.md)).
