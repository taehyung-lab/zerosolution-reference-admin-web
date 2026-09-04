# 0009. 목록·필터 공용화 경계와 레퍼런스 검증

- 상태: 공용화 방향 승인됨 — Managers 첫 consumer, 두 번째 실제 consumer 미확인
- 날짜: 2026-08-28
- 근거 재확인: 2026-09-04 — Figma frame 보유 leaf page 59개·top-level frame 272개 + Notion Feature 72페이지 전체 인벤토리로 재판정
- 적용 범위: 레퍼런스 프로젝트의 목록·필터·결과 mechanic
- 관찰 근거: [전체 surface 인벤토리](../reference/zero-sol/README.md), 판정 기록: [ZEROsol 공용화 판정](../reference/zero-sol-figma-analysis.md)

## 이 ADR의 책임

이 문서는 목록 공용화의 이유, 거부한 대안, 소유권 결정, provisional 상태, 재검토 조건을 보존한다. Managers 구현 가이드나 최신 테스트 결과표가 아니다.

- 반복 구현 절차: `.agents/skills/feature-contract/references/list-workflow.md`
- shared 승격·confirm·demote 절차: `.agents/skills/shared-ui-contract/references/promotion.md`
- route integration: `.agents/skills/feature-contract/references/router.md`
- 화면 유형 조립: `.agents/skills/feature-contract/references/screen-composition.md`
- 현재 동작과 기계적 불변식: 코드·타입·테스트·lint·CI

이 결정이나 단계가 바뀌면 이 ADR을 갱신한다. 실행 규칙이 바뀌면 해당 Skill reference와 검사를 갱신한다. 일회성 분석, 파일 목록, 마지막 green 시각은 이 ADR에 누적하지 않는다.

## 맥락

이 저장소는 Manager 한 화면을 납품하는 제품이 아니라, 이후 신규 프로젝트에 채택할 수 있는 UI·상태·URL·API 경계를 실제 vertical slice에서 검증하는 레퍼런스다. Managers는 첫 consumer이지 계약의 소유자나 전체 제품의 축소판이 아니다.

Figma에서 filter frame, 기간 선택, 검색 전·후 상태, toolbar, table, pagination의 반복을 관찰했다. 이 관찰은 domain-free mechanic을 provisional shared로 검증할 근거는 되지만 Query `enabled`, endpoint, enum, 권한, payload, 실패 semantics를 증명하지 않는다. 리허설 OpenAPI도 실제 복잡도를 시험할 근거일 뿐 신규 제품 계약이나 두 번째 실제 consumer가 아니다.

공용화 판단은 JSX 모양이나 파일 수가 아니라 다음을 묻는다.

1. 여러 도메인에서 의미, 상태 전이, 실패 behavior가 같은가?
2. public API를 도메인 타입과 서버 DTO 없이 설명할 수 있는가?
3. 중복이나 접근성·상태 결함 위험을 실제로 줄이는가?
4. 예외를 흡수할 `mode`, resource config, callback override가 필요하지 않은가?

## 검토한 대안

### 모든 것을 feature-local로 둔다

첫 코드 occurrence만 보면 안전하지만 draft 보존, 접근 가능한 field/table/paging, 기간·keyword lifecycle 같은 반복 mechanic이 화면마다 달라진다. 전체 화면에서 확인된 제품 공통 후보를 레퍼런스에서 검증할 수 없으므로 거부했다.

### 범용 목록 프레임워크를 만든다

`ResourcePage`, `UniversalList`, `useCrud`, `useListPageController`, schema/config 기반 필터 renderer처럼 Router·Query·API·권한을 한 추상화에 넣으면 shared가 두 번째 애플리케이션이 된다. 화면 차이를 mode와 callback으로 흡수하고 추적 비용을 키우므로 거부했다.

### 작은 mechanic을 explicit feature composition으로 조립한다

도메인 없는 UI·상태 대수만 shared에 두고 feature가 URL, Query, payload, enum, 권한, 컬럼, copy, workflow를 소유한다. 화면 조립 차이를 숨기지 않으면서 반복 결함을 줄일 수 있어 채택했다.

## 결정

### 소유권 경계

| shared가 소유할 수 있음                 | feature가 반드시 소유                                     |
| --------------------------------------- | --------------------------------------------------------- |
| 접근성·token primitive                  | route schema와 URL transition                             |
| domain-free layout와 controlled surface | defaults, field, enum, option source, label               |
| 한 가지 상태 대수만 가진 focused hook   | Query enablement, key, params, endpoint                   |
| 입력과 출력이 명시된 순수 utility       | result-state reachability, summary meaning, columns       |
| caller가 결정한 result state의 렌더링   | permission, row/bulk action, navigation, failure workflow |

shared는 feature, Router, Query, endpoint, server DTO, permission을 알지 않는다. feature·route·app·api import와 `@tanstack/react-router`·`@tanstack/react-query` import는 ESLint가 금지하고 `gates:negative`가 부정 대조군으로 검사한다(2026-09-02 Query 추가). feature screen은 필요한 작은 단위를 명시적으로 조립하며 shared screen shell이나 controller hook을 만들지 않는다.

### 검증 단계

| 단계               | 의미                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------- |
| feature-local      | 도메인 의미나 workflow가 포함되거나 공통성이 아직 근거 없음                           |
| provisional shared | 승인된 cross-screen 근거가 있고 현재 대표 consumer가 domain-free contract를 실제 사용 |
| confirmed shared   | 두 번째 실제 consumer에서 semantics, lifecycle, failure behavior가 일치               |
| demoted            | 다른 consumer를 위해 분기나 도메인 지식이 필요해 계약을 좁히거나 feature-local로 복귀 |

한 곳은 로컬, 두 곳은 비교, 세 번째 안정적 사용은 승격 검토 신호일 뿐 자동 규칙이 아니다. 접근성 불변식이나 승인된 cross-screen mechanic은 첫 consumer부터 provisional shared가 될 수 있다. 다음 consumer가 다르면 API를 넓히지 않고 좁히거나 demote한다.

### URL과 서버 어휘

Managers 리허설에서는 URL search와 요청에 리허설 서버 enum을 그대로 사용하고 별도 client codec을 두지 않는다. 현재 이득은 URL 가독성뿐인데 enum별 양방향 mapping, option 응답의 미지 값 처리, 완전성 테스트 비용이 생기기 때문이다. 범용 `SCREAMING_SNAKE ↔ camelCase` 변환도 만들지 않는다.

이는 신규 제품의 영구 어휘 결정이 아니다. 새 프로젝트는 실제 OpenAPI, URL 공유·복원 요구, migration 비용을 확인해 다시 결정한다. shared UI는 어느 어휘도 알지 않고 `aria-sort`처럼 표준 접근성 어휘만 사용한다. 컬럼 ID와 서버 sort key의 짝, 그리고 URL·Select·헤더에 노출하는 sort key subset은 feature의 단일 typed mapping이 소유한다. 컬럼이 없는 리허설 값(`AGENCY`)은 노출하지 않는다.

## 현재 provisional 계약

Managers가 실제 사용하는 아래 단위는 레퍼런스의 provisional shared다. 파일이 존재하거나 테스트가 한 번 통과했다는 이유로 confirmed라 부르지 않는다.

| 종류             | provisional 단위                                                                                                                 | shared 소유의 한계                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| filter surface   | `FilterPanel`, `FilterField`, `AsyncFieldBoundary`, `PeriodField`, `KeywordChipField`, `PeriodFilterField`, `KeywordFilterField`, `CheckboxTree`(다중선택 그룹) | frame·field layout·accessible association·caller가 결정한 비동기 field state의 generic rendering·controlled rendering만 소유. `FilterField group`은 여러 컨트롤을 한 이름으로 묶는 `role=group` 래퍼. `PeriodFilterField`/`KeywordFilterField`는 그 행을 optional 기준·대상 select(`FilterSelectSlot`: 문자열 value·options·label만)와 함께 조립한 composite(2026-09-02: 인벤토리 25+ 화면 동일, 기준 無 6 화면·대상 無 2 화면은 slot 생략). enum 의미·기본값·라벨은 feature. `CheckboxTree`는 "전체 ✓ | 개별" 다중선택 그룹의 전체/leaf 토글 대수와 `emptyMeansAll`만 소유(인벤토리 30여 목록 화면 반복). 노드는 재귀 union이라 부모–자식 n단계도 같은 대수(부모 클릭=하위 leaf 전체 토글, 값은 leaf만)로 처리하며 test가 2단계를 고정한다. 접근권한 matrix는 화면 행마다 가능한 기능 집합이 달라 행·기능 의미를 feature가 Table+Checkbox로 조립한다. 미확인: 부분 선택 `aria-checked="mixed"` 표시, 중첩 배치의 디자인 대조 |
| result surface   | `ResultToolbar`, `ResultSummary`, `ListResult`                                                                                   | slot/layout, caller가 결정한 state, 공용 error/retry/trace 표현만 소유                                                                                                                                                                                                                                                                                                                                                                                                       |
| table/navigation | `DataTable`, `Pagination`, `PageSizeControl`, `SortControl`                                                                      | table/paging/control mechanics만 소유; URL·Query·options·sort behavior는 제외. `SortControl`은 정렬 필드 select만(2026-09-02 narrow: 방향 컨트롤은 Figma 전 화면에 없음). `DataTable`은 `meta.sort`(optional `direction: ascending \| descending` + `onSort`)로 헤더 버튼·`aria-sort`·glyph를 같은 값에서 렌더(2026-09-02 widen: 접근성 불변식, 인벤토리 12+ table 반복). `aria-sort`는 WAI-ARIA 1.2 기준 한 테이블에 활성 헤더 하나만 가지며, 비활성 정렬 가능 헤더는 버튼만 두고 `aria-sort`·glyph를 생략한다(2026-09-02 수정: ARIA 값 `none`을 direction으로 모델링하지 않음); 정렬 가능 컬럼·방향·전이는 feature |
| state mechanic   | `useDraftCommit`, `usePeriodDraft`, `useKeywordDraft`                                                                            | preserve/rebuild, preset/custom conversion, pending keyword 대수만 소유                                                                                                                                                                                                                                                                                                                                                                                                      |
| pure utility     | search compact/default resolve, datetime/format/option mapping                                                                   | 입력·출력이 domain-free인 순수 변환만 소유; schema·mapper·endpoint 조립은 제외. filter/view partition 선언과 pick/key는 2026-09-02 feature-local로 demote(consumer 1곳)                                                                                                                                                                                                                                                                                                      |
| shared config    | `standardPageSizeOptions`, `standardPeriodPresetValues`                                                                          | 표준 목록 선택지·기간 preset 값의 provisional named preset만 소유; feature가 명시적으로 선택하고 default(목록 100·전체 / 등록 화면 200 / 통계 1개월 전)·예외를 소유                                                                                                                                                                                                                                                                                                          |
| bulk action surface | 일괄변경 미선택 alert·확인·`run(values)` callback 후보 | Notion 미선택 20 / 확인 17 / 완료 17의 product-generic copy와 lifecycle 반복. `run(values)`는 callback override가 아니며 shared에 endpoint를 가르치지 않는다. 첫 consumer가 쓰는 표면만 provisional로 두고 선택 ID·cascade·action value·권한·호출 이후는 feature가 소유한다. |
| download scope surface | 선택/전체 mode·미선택/선택 0건 검증 후보 | 택1 6 / 미선택 오류 7의 반복. `(mode, count) → selected\|all\|error` 순수 분류기는 domain fact를 배우지 않는다. 첫 consumer가 쓰는 검증 표면만 provisional로 두고 row ID·committed 조건·파일 형식·권한·실행 callback은 feature가 소유한다. |

`ListResult`는 `notSearched | loading | error | empty | ready` 다섯 상태를 판정하며 `ListResultData`는 renderer가 실제로 읽는 facts(rows·searched·isPending·isFetching·isError·trace·retry)만 요구한다(2026-09-02 narrow). total·totalPages는 feature 확장 타입이다. searched entry의 pending 첫 조회는 공용 `BlockingProgress`가 loading 표면을 덮고 area skeleton은 두지 않는다. observer가 없는 prefetch는 로딩·에러 표면에서 배제한다. feature는 상태, 검색 전/결과 없음 문구, retry 동작, 구조적 trace, footer와 ready content를 제공한다. shared pattern은 공용 error/retry 문구, live region과 `ErrorTrace` disclosure를 직접 소유하며 API를 import하거나 raw message를 받지 않는다. 이 다섯 상태는 모든 목록의 필수 단계가 아니며, `DataTable`은 caller의 `meta.sort`로 헤더 버튼·`aria-sort`·glyph를 렌더하고 `onSort`를 호출할 뿐 어떤 컬럼이 정렬 가능한지, 방향 전이, route policy를 소유하지 않는다.

Managers는 제품이 확정한 명시적 검색 화면이다. URL은 검색 전 `{}`와 검색 후 `{ periodType, ...기본값이 아닌 view/filter }`의 discriminated union이며, `periodType`은 실제 서버 필터이자 판별자다. Query enablement와 `notSearched`는 이 한 사실에서 파생한다. 비어 있지 않은 손편집 URL에 `periodType`이 없으면 canonical guard가 기본 기간 기준을 채워 replace하고, `{}`는 그대로 둔다. 같은 조건 재검색은 같은 URL·Query key를 유지하므로 강제 refetch하지 않는다.

기간 range UI는 반대쪽 선택값을 `min/max`와 calendar disabled bound로 사용할 수 있지만 이것이
feature validation을 대체하지 않는다. Managers의 역전된 직접 URL은 날짜 pair만 제거해 `ALL` 기간
상태로 canonicalize하고, 기간 기준·정렬처럼 독립적으로 유효한 검색값은 보존한다.

`AsyncFieldBoundary`는 feature가 결정한 초기 `loading | error | ready`와 retry callback만 받아 제품 공통 문구와 접근 가능한 상태를 렌더한다. Query, endpoint, option mapping, 선택 의미를 알지 않으며 cached data가 있으면 background refetch 실패 중에도 feature가 `ready`로 판정한다.

Managers의 route schema, defaults, option query, endpoint, enum, params mapper, query key, result-state 결정, columns, summary 의미, page-size default·preset 선택, domain copy, permission, selection, bulk action value와 navigation은 feature-local이다. bulk·download의 product-generic 검증/copy 후보는 위 최소 surface만 shared가 맡고 리허설의 `manager-types`, `excludeInternal`, permission endpoint·누락 같은 사실을 제품 공통 계약으로 승격하지 않는다.

### 행 선택 소유권

20개 이상 목록이 행 선택을 쓰지만 `DataTable`은 의도적으로 selection을 소유하지 않는다. 선택은 list screen 또는 feature-local table adapter가 stable ID로 보관하며 header checkbox는 현재 page의 선택 가능 행만 다룬다.
page·pageSize·sort·committed search·route가 바뀌면 해제하고, draft 편집은 유지한다. 같은 조건 refetch는 여전히 존재하고 선택 가능한 ID만 보존하며 bulk 실패는 유지하고 성공 뒤 선언된 cache consequence가 끝나면 해제한다. 검색결과 전체 선택은 서버가 조건 기반 payload를 선언할 때 별도 계약으로 다룬다.

Figma 원장의 field-level evidence는 현재 surface와 의도적 차이를 찾는 근거다. ADR은 그 내용을 구현
체크리스트로 복제하지 않고, 해당 evidence가 공용 경계를 승인할 만큼 충분한지와 provisional 단계만
판정한다. 코드 변경 후 최신 화면이 같은지 여부는 focused test와 실제 browser 대조가 각각 검사한
범위로만 보고한다.

## 첫 consumer 판정과 미확인

Managers vertical slice는 sparse URL → resolved defaults → draft commit → Query → result/table 흐름에서 위 경계를 소비한다. 이 사실은 구현 가능성과 첫 경계 검증을 뜻하며, 최신 작업 트리의 green이나 디자인 일치를 대신하지 않는다. 완료 판정은 관련 focused test, `pnpm verify`, 필요한 브라우저·Figma 실측이 각각 실제로 검사한 범위만 주장한다.

다음은 미확인이라 공용화하거나 구현하지 않는다.

- 신규 제품의 endpoint, DTO, enum, permission, option source와 실패 semantics
- 다른 목록의 명시적 검색과 required prerequisite의 실제 Query gate 정책
- bulk의 binary/partial success와 권한. cross-page selection은 2026-09-04 제품 답으로 제외하고 현재 페이지의 선택 가능 행만 선택한다
- 범위 밖 page의 제품 canonicalization 정책
- API `timezone` 파라미터의 의미와 값
- rehearsal `INACTIVE`와 Figma의 거절·비활성 상태 의미의 대응
- array·object-array query의 실제 서버 wire binding

두 번째 후보는 Figma의 전체회원 목록이지만 신규 회원 계약이 없어 현재 confirm/demote 판정이 불가능하다. 회원별 통계는 목록 전체가 아니라 기간 mechanic만 독립 비교할 후보다. 계약이 연결되기 전에는 리허설 endpoint를 대신 쓰거나 Figma에서 runtime 정책을 추론하지 않는다.

2026-09-04 전수 인벤토리는 근거를 보강했지만 코드 consumer는 여전히 Managers 하나다. 새 관찰 후보는 Tabs(7 surface/8 set, APP PUSH 타겟 포함), Tooltip(디자인 시스템과 page header 반복), 행 활성화(18회), 상태 count 클릭 필터(발권 5 variant), 빈 값 `-` 표현(9회)이다. 이들은 접근성·controlled interaction 또는 표현만 shared가 맡고 URL·Query·권한·destination·absence 판정은 feature에 남긴다는 경계만 기록하며 아직 단계 값을 부여하지 않는다.

range slider는 `129:32748`에서 출처가 확인됐지만 다른 발권 4 variant에는 미확인이고, 선택 label registry는 cardinality, 보기·정렬 마지막값은 저장 범위, `- 이하 생략 -`은 의미가 미확인이다. 팝업 안 목록은 `table-composition.md` kind E의 component-local params로 충분하며 새 controller가 필요하지 않는다.

## 신규 프로젝트 채택 경계

새 프로젝트는 이 저장소 전체나 Managers 구현을 복사하지 않는다. 새 제품의 요구사항, Figma, OpenAPI가 제품 진실이고 이 ADR은 설계 근거다.

그대로 가져갈 수 있는 것은 shared/feature 소유권 원칙, explicit composition, provisional → 실제 consumer 비교 → confirm/demote 절차, 그리고 증거가 검사한 범위만 완료로 말하는 원칙이다.

다음은 새 제품 사실과 대조한 뒤에만 채택한다: sparse URL과 resolved defaults, draft/period/keyword mechanic, result-state 집합, no-codec 선택, option preload, page reset, 각 shared public API. Router·OpenAPI·복원 요구가 다르면 현재 제품 사실을 우선한다.

리허설 snapshot, Manager schema·enum·defaults·options·columns·copy, mock/fixture, 미확인 permission·bulk·selection 정책, 새 화면이 소비하지 않는 provisional code는 가져가지 않는다. 첫 대표 vertical slice가 실제로 필요한 범위만 채택하고, 두 번째 성격의 화면에서 각 후보를 confirm하거나 demote한다.

### 인계 입력과 적용 순서

새 프로젝트의 AI와 개발자는 새 제품의 요구사항·Figma·OpenAPI·정책과 함께 root `AGENTS.md`와 채택
후보별 **4-part bundle**을 입력으로 사용한다. 한 bundle은 (1) public code 진입점, (2) 그 계약을
규정하는 skill reference의 file + 절 + 문장 marker, (3) ADR 결정/stage의 file + 절 + 행 marker,
(4) 동작을 고정하는 focused test로 구성되며 shared와 feature가 각각 소유하는 범위도 선언한다.
문서나 코드 한 조각만 떼어 쓰지 않는다. 이 묶음은 제품 요구사항을 대신하는 완성품이 아니라,
요구사항을 빠뜨리지 않고 경계를 다시 결정하기 위한 설계 기준이다.

사람이 유지하는 것은 채택 후보, 네 root 위치, shared/feature 소유권뿐이다. 파일 반출 목록은 유지하지
않는다. `scripts/contracts/seed.mjs`가 code root와 명시된 focused-test root 각각에서 local import
closure를 계산하고, 네 부분의 실존·절 안 marker·중복 contract root·materialized seed의 closure를
검사한다. 따라서 `src/shared` 전체 test를 포함하지 않으며 선언된 focused test와 그 실행 의존만
따라간다. focused test의 명시적 `vi.mock`은 실제 실행 대체 seam이므로 그 target의 production
dependency는 순회하지 않는다. closure가 예상보다 넓어지면 목록에 파일을 덧대지 말고 진입점을
좁힐지 의존을 끊을지 사람이 결정한다.

현재 manifest(선언된 bundle 목록과 수)는 `scripts/contracts/seed.mjs`가 소유한다. 실제로 확정한 계약만 선언하며
통계·권한 matrix·알림처럼 미구현 화면 유형은 후보로 추측하지 않는다.

1. 새 제품의 화면과 로직을 surface 단위로 나누고 UI, 상태 소유권, URL, API payload/cache, 권한, i18n, navigation, 실패·복구 흐름을 요구사항으로 추출한다.
2. 각 요구사항을 기존 공용 후보와 비교해 의미, lifecycle, ownership, failure behavior가 같은지 확인하고 `그대로 채택 / 제품에 맞게 수정 / 제외 / feature-local 신규 구현`으로 판정한다.
3. 채택된 최소 계약만 첫 대표 vertical slice에 명시적으로 조립한다. Manager 전용 값이나 리허설 계약이 필요해지면 공용 API를 넓히지 않고 제품 feature 또는 새 계약의 소유자로 돌린다.
4. 코드·타입·테스트와 실제 화면·응답으로 요구사항별 결과를 검증하고, 두 번째 실제 consumer가 생기면 provisional 후보를 confirm, narrow 또는 demote한다.

### 채택 성공 조건

새 프로젝트가 이 기준을 성공적으로 채택했다는 판정에는 다음 증거가 모두 필요하다.

- 새 제품의 요구사항과 레퍼런스 가정이 구분되고, 각 요구사항의 소유 레이어와 채택 판정 근거가 추적된다.
- Manager schema, 리허설 endpoint·DTO·enum·permission, 사용하지 않는 provisional code가 제품 사실로 유입되지 않는다.
- 선택한 공용 계약이 도메인 mode, resource config, Router·Query·API·permission 분기로 제품 차이를 숨기지 않는다.
- 요구사항별 `구현됨 / 미구현 / 다르게 구현됨`, 실행한 검사, 실제 화면·응답 실측, 미확인 정책과 차단 조건이 보고된다.

문서가 존재하거나 코드를 복사했다는 사실만으로는 성공이 아니다. 실제 신규 프로젝트에서 이 절차만으로 요구사항에 맞는 vertical slice를 구현·검증하고, 그 과정에서 발견한 기준의 누락을 단일 소유 문서·코드·검사에 되돌려 반영했을 때 인계 가능성이 검증된다. 목록·필터 외 화면 유형은 이 ADR을 범용 근거로 삼지 않고 처음 필요할 때 자체 관찰 근거와 경계 결정을 만든다.

## 재검토 조건

- 두 번째 실제 목록 또는 기간 consumer가 구현되어 의미·lifecycle·failure behavior를 비교할 수 있을 때
- shared API가 Router, Query, endpoint, permission, DTO 또는 domain mode를 요구할 때
- 신규 제품의 URL·API·timezone·권한 계약이 리허설 가정과 다를 때
- Figma 원본의 반복 구조나 대표 상태가 바뀌거나 Notion Feature 문장이 바뀔 때
- 판정 기록 §5의 미확인(보기/정렬 마지막 값 기억, gate 없는 화면의 초기화, 정렬 방향 UI, 중복 키워드 동일성, 운영자 bulk 정책)이 답을 얻을 때

재검토 결과는 투표나 역할 의견이 아니라 현재 제품 계약, 실제 diff, 테스트와 브라우저 증거로 판정한다.
