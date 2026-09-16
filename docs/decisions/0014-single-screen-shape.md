# 0014. 단일 화면 형태와 공용 경계

- 상태: 채택
- 날짜: 2026-09-16
- 결정자: 제품 소유자 (사용자)
- 대체: 0009(목록·필터 공용화), 0010(폼 공용화), 0011(상세 조회·API 소비 계층·업데이트 이력), 0012(필터 초안 조합). 네 결정의 살아 있는 내용은 이 문서와 계약 문서로 옮겼고 파일은 삭제했다. 번호는 결번으로 남긴다
- 관찰 근거: [전체 surface 인벤토리](../reference/zero-sol/README.md), [공용화 판정 기록](../reference/zero-sol-figma-analysis.md). 도메인별 사실은 그 문서와 소비자 코드·테스트가 소유한다

## 이 ADR 의 책임

목록·상세·등록/수정 화면이 **모든 도메인에서 한 형태**를 갖는 이유, 그 형태를 떠받치는 공용 단위의 경계, 거부한 대안, 재검토 조건을 소유한다. 사용법은 [list](../../.agents/skills/feature-contract/references/list.md)·[detail](../../.agents/skills/feature-contract/references/detail.md)·[form](../../.agents/skills/feature-contract/references/form.md)·[router](../../.agents/skills/feature-contract/references/router.md)가, 각 공용 단위의 계약은 [catalog](../../.agents/skills/shared-ui-contract/references/catalog.md)가, 승격·좁힘 절차는 [promotion](../../.agents/skills/shared-ui-contract/references/promotion.md)이, 배치는 [folder-structure-contract](../../.agents/skills/folder-structure-contract/SKILL.md)가 소유한다. 특정 도메인의 사실·이력·소비자 목록은 여기 두지 않는다 — 그것은 제품 원장과 소비자 코드·테스트의 것이다.

## 맥락

같은 저장소 안의 다섯 도메인이 목록·상세·폼을 서로 다른 형태로 갖고 있었다. 결과 훅의 반환 모양, 필터 훅이 문구를 아는가, 확인 다이얼로그를 누가 렌더하는가, 폴더 이름에 엔티티 접두가 붙는가, 미연결 mutation 이 reject 하는가 resolve 하는가가 도메인마다 달랐다. 그 차이는 제품 요구가 아니라 작성 시점의 차이였다.

이 형태 차이는 두 비용을 만들었다. 첫째, "○○ 화면을 구현해주세요"라는 요청을 받은 작업자가 어느 도메인을 정답으로 삼을지 고르게 되고, 고른 도메인의 제품 값을 새 화면에 복사했다. 둘째, 문서가 여러 도메인의 예외를 함께 설명하느라 길어졌고(목록 문서 하나가 33KB), 화면 하나를 만들 때 읽어야 하는 문서 비용이 버튼 하나를 만들 때와 같았다.

한 feature 를 화면 단위로 병렬 분할한 실측에서는 `model/`·`api/` 의 데이터 계약이 작업마다 갈렸고(4 사이클에서 반복), 한 feature 를 한 요청으로 흐르게 한 실측에서는 발산이 없었다. 분할 축은 화면이 아니라 feature 다.

## 결정

1. **한 역할에 한 형태.** 목록 8 파일(+선택 액션 쌍), 상세 2 파일(+이력·입력 액션), 폼 6 파일의 집합과 Screen → 훅 → 컴포넌트 배선을 모든 도메인이 그대로 쓴다. 파일 안의 제품 값(필드·문구·기본값·정책)만 그 화면의 원장에서 온다. 형제 도메인은 형태의 예시이지 값의 출처가 아니다.
2. **폴더는 항상 `{entity}-list|detail|form`.** 대표 엔티티라도 접두를 생략하지 않는다. URL 변형은 같은 화면 + `model/` 의 typed definition 이다.
3. **보기 전이는 공용이다.** 페이지·보기·정렬 키·헤더 방향 전이는 도메인 사실이 없으므로 `shared/lib/list-view.ts` 의 `listViewControls` 하나가 소유한다. 활성 컬럼 헤더 클릭만 방향을 뒤집고 다른 키 선택은 방향을 유지한다.
4. **필터 훅은 초안 + `submit` + `reset` 만이고 문구를 모른다.** 라벨·선택지·"전체" 항목은 Filters 컴포넌트가, 서버 선택지는 `api/` 훅이 `{ state, items, retry }` 로 준다.
5. **확인 lifecycle 은 `useConfirmation` 이 `dialog` 노드까지 돌려준다.** 소유자는 액션 컴포넌트이고 `searched`/`ready` 분기 밖에서 렌더한다. 선택 요구 액션의 거절은 `useSelectionGate` + `SelectionAlert` 하나다. 일괄 변경 전용 다이얼로그 묶음은 삭제했다 — 같은 대수의 두 번째 표현이었다.
6. **상세는 Screen → `use{Entity}Detail` → `DetailStateBoundary({ query, children(data) })` → Content.** 진입 실패는 route loader(`loadRequired`), 진입 이후 전이만 경계가 그린다. 판정은 `resolveRequiredQueryOutcome` 하나다.
7. **등록·수정은 전부 `useSaveForm`.** schema·기본값·mapper·mutation·오류 분류·목적지를 입력으로 받고 폼 인스턴스·저장 단계·reveal/focus·서버 오류 배치·기준선·dirty guard·다이얼로그 노드를 소유한다. 입력 오류 노출과 저장 결과를 분리했던 이전 결정(`useFormFeedback`)은 두 소비자에서 같은 조립이 반복돼 하나로 합쳤다.
8. **mutation 은 `api/mutations.ts` 의 `mutationOptions(locale)` 팩토리이고 캐시 후속은 `meta.invalidates` 선언이다.** 화면은 `useMutation(factory(locale))` 를 직접 쓰고 workflow mutation 훅을 두지 않는다. 대상 ID 는 입력에 싣는다.
9. **미연결 mutation 은 reject 하지 않는다.** `scenarioRequest(label)` 이 업무 이름 한 줄을 로그하고 resolve 해 성공 경로(완료 alert → 이동, 무효화)를 끝까지 돌린다. API 가 생기면 `mutationFn` 본문만 바뀐다.
10. **`Form*Field` 어댑터 집합은 소비자 0 이어도 남긴다.** 제품이 선언한 입력 종류(input·select·multi-select·file·date-range·date·time…)의 계약이며, 삭제 근거는 "소비자가 생길 예정도 없음"이다.
11. **문서는 판단 규칙만 담고 데이터 계약은 코드가 담는다.** 목록·상세·폼 문서 각 하나, 공용 단위는 catalog 한 표. 도메인 이름·소비자 목록·개정 이력은 문서에서 뺐다. 화면 하나는 역할 문서 하나를 읽고, 버튼·로직 하나는 catalog 행 하나를 읽는다.

### 공용 경계

단위마다 shared/api 가 소유하는 것과 feature 가 반드시 소유하는 것이다. 각 단위의 props·반환은 catalog 가, 4-part bundle 선언은 `scripts/contracts/seed.mjs` 가 소유한다.

| 단위 | shared/api 가 소유 | feature 가 반드시 소유 |
| --- | --- | --- |
| `defineSearchFields`·`defineGatedSearchFields`, 복구 codec, `filterPartitionKey` | 선언 → schema·defaults·partition·resolve·canonical 파생, 검색 표식의 수명, 반쪽 기간 제거 | 필드·enum·기본값·검색 정책·요청 mapper |
| `listViewControls`, `headerSortDirection` | 보기·정렬 키·페이지·헤더 방향의 순수 전이, 활성 컬럼 하나의 `aria-sort` 어휘 | 정렬 키 집합·기본 방향·커밋 목적지 |
| `useListFilterDraft`(`useDraftCommit`·`usePeriodDraft`·`useKeywordDraft`) | 확정 정체성에 따른 초안 보존·재생성, 입력 수집, 기간의 UTC 변환 | partition·scope 의미, 라벨, 제출·초기화 목적지 |
| `usePageRowSelection`, `useSelectionGate`·`SelectionAlert`, `useConfirmation` | 현재 페이지 선택 수명, 거절 문구 하나의 수명, 요청 → 확인 → `run` → 닫힘과 그 dialog 노드 | 선택 가능 규칙, 대상 ID, 문구, `run` 의 내용과 이후 |
| `useListQuery`, `useDetailQuery`, `blockingProgress`·`contentProgress`·`inlineProgress` | 빈 페이지 = 결과, 진입 fetch 만 blocking, incident 제외, 필수 단건의 판정 우선순위 | queryOptions·key·응답 → 행 투영 |
| `useSaveForm`, `Form*Field` 어댑터, `FormField`, `UnsavedChangesProvider`, `FormSaveDialogs` | 저장 단계, reveal·focus, `onServer` 배치, 기준선, dirty guard, 저장 확인·완료 문구 | schema·기본값·mapper·mutation·오류 분류·목적지 |
| `FilterPanel`·`FilterField`·`PeriodFilterField`·`KeywordFilterField`, `DataTable`·`selectionColumn`, `Pagination`·`PageSizeControl`·`SortControl`, `ListResult`·`ResultToolbar`·`ResultTotal` | 렌더와 접근성 계약, 다섯 결과 상태 판정, 공용 오류·재시도·trace 문구 | 라벨·선택지·컬럼·두 도메인 문구·행 액션 |
| `PageHeader`·`SectionCard`·`DetailField`·`DetailStateBoundary`·`UpdateHistory`, `InlineSearchSelect`, `BlockingProgress` | 헤더·섹션·필드·상태 경계·이력 표의 markup 과 개폐, inline 선택, inert 덮개 | 섹션 구성·라벨·마스킹·이력 mapper·액션 |
| `maskEmail`·`maskPhone`, `hasRepeatedOrSequentialAsciiTriplet`, `standardPageSizeOptions`·`standardPeriodPresetValues` | 문자열 알고리즘과 채택 선택지 집합 | 권한·해제, 길이·문자군·schema·문구, 기본값 |
| `scenarioRequest`, `meta.invalidates` | 미연결 쓰기의 로그 한 줄과 resolve, 성공 뒤 무효화 실행 | 업무 이름, 무효화할 key, 연결 시점 |

shared 는 도메인·Router·Query·endpoint·permission·workflow 를 모른다. ESLint 가 import 를 막고 `gates:negative` 가 대조군을 실행한다.

### 삭제와 이동

| 대상 | 처분 | 이유 |
| --- | --- | --- |
| 일괄 변경 전용 다이얼로그 묶음(`shared/ui/dialog`) | 삭제 → `SelectionAlert` + `useConfirmation.dialog` | 같은 대수의 두 번째 표현 |
| `shared/model` 의 확인 값 보관 훅 | `shared/ui/dialog/useConfirmation` 으로 이동(dialog 를 렌더하므로 `ui`) | 소유 계약이 렌더를 포함한다 |
| 화면별 `*-policy.ts` 보기 전이 | `shared/lib/list-view.ts` 로 이동 | 도메인 사실이 없다 |
| 격리 계약(ADR 0001) 의 생성 API 소비자 나무(한 도메인의 `api/` 어댑터·MSW 핸들러·`Directory` 화면) | 삭제 | 신규 제품 계약이 아니며 두 번째 형태를 만들었다 |
| 한 도메인의 `mechanics/record-list` | 해체 → 각 `{entity}-list` 의 8 파일 | 목록마다 검색 정책·액션이 달라 한 mechanic 이 mode 를 갖게 됐다 |
| 폼 입력 feedback 어댑터 | `useSaveForm` 으로 합침 | 두 소비자에서 같은 조립 반복 |
| 목록·검색·상세·폼·bulk·mutation·table 문서 7개, 공용 문서 22개 | 목록·상세·폼 3개 + catalog 1개로 통합 | 화면 하나에 문서 하나 |

## 검토한 대안

- **한 도메인을 기준으로 나머지를 맞춘다** — 그 도메인의 제품 값이 규범으로 읽힌다. 거부. 세 도메인을 비교해 공통 형태만 남기고 값은 각자 원장에서 가져왔다.
- **범용 목록·폼 프레임워크**(`ResourcePage`·`useCrud`·descriptor renderer) — Router·Query·API·권한을 한 추상화에 넣어 shared 가 두 번째 애플리케이션이 된다. 거부(`local/no-prohibited-abstraction` 가 이름을 막는다).
- **미연결 mutation 을 reject 로 두고 성공 경로를 만들지 않는다** — 화면이 실서버와 다른 lifecycle 을 갖고, 연결 시 화면·테스트가 함께 바뀐다. 거부. 성공 경로는 지금 검증하고 연결은 함수 본문 하나로 좁혔다.
- **화면 단위 병렬 분할** — 데이터 계약이 작업마다 갈렸다. 거부. 분할 축은 feature 다.
- **문서에 소비자 목록·단계표를 유지** — 소비자가 바뀔 때마다 문서가 낡고 도메인 이름이 규범으로 읽힌다. 거부. 소비자 사실은 코드·테스트가, 판단 규칙만 문서가 갖는다.

## 재검토 조건

- 새 도메인의 화면이 이 형태의 파일 중 하나를 빈 어댑터로 두어야만 맞는다 — 형태를 좁힌다.
- 공용 단위가 도메인 `mode`·resource 설정·Router/Query/endpoint/permission 인자를 요구한다 — 좁히거나 feature 로 되돌린다.
- 실서버 계약이 `meta.invalidates` 로 표현할 수 없는 정확한 캐시 갱신을 요구한다 — 그 mutation 만 예외를 기록한다.
- 같은 요구를 바뀐 문서로 다시 구현한 실측에서 같은 질문·같은 예외·도메인 복사가 다시 나온다 — 문서의 그 절로 돌아간다.

재검토는 투표가 아니라 실제 diff·focused test·브라우저 실측으로 판정한다.
