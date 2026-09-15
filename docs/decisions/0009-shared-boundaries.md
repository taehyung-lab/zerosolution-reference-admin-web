# 0009. 목록·필터 공용화 경계와 레퍼런스 검증

- 상태: 공용화 방향 승인됨 — 단위별 단계는 아래 표. 이 문서는 목록·필터·결과 **기능 단위** 계약이며 특정 도메인의 구현 가이드가 아니다
- 날짜: 2026-08-28
- 근거 재확인: 2026-09-04 — Figma frame 보유 leaf page 59개·top-level frame 272개 + Notion Feature 72페이지 전체 인벤토리로 재판정
- 적용 범위: 레퍼런스 프로젝트의 목록·필터·결과 mechanic
- 관찰 근거: [전체 surface 인벤토리](../reference/zero-sol/README.md), 판정 기록: [ZEROsol 공용화 판정](../reference/zero-sol-figma-analysis.md)

## 이 ADR의 책임

이 문서는 목록 공용화의 이유, 거부한 대안, 소유권 결정, provisional 상태, 재검토 조건을 보존한다. 구현 가이드나 테스트 결과표가 아니다.

- 반복 구현 절차: `.agents/skills/feature-contract/references/list-workflow.md`(목록 lifecycle), `.agents/skills/feature-contract/references/list-search-contract.md`(검색 선언·기본값)
- shared 승격·confirm·demote 절차: `.agents/skills/shared-ui-contract/references/promotion.md`
- route integration: `.agents/skills/feature-contract/references/router.md`
- 화면 유형 조립: `.agents/skills/feature-contract/references/screen-composition.md`
- 현재 동작과 기계적 불변식: 코드·타입·테스트·lint·CI

이 결정이나 단계가 바뀌면 이 ADR을 갱신한다. 실행 규칙이 바뀌면 해당 Skill reference와 검사를 갱신한다. 일회성 분석, 파일 목록, 마지막 green 시각은 이 ADR에 누적하지 않는다.

## 맥락

저장소 운영 모드(다른 제품으로 옮길 레퍼런스)는 [AGENTS.md 함정](../../AGENTS.md#이-저장소의-함정)이 소유한다. Manager는 첫 검증 consumer일 뿐 공용 설계의 기준이나 소유자가 아니며, 그 지위는 이 ADR이 소유한다.

Figma에서 filter frame, 기간 선택, 검색 전·후 상태, toolbar, table, pagination의 반복을 관찰했다. 이 관찰은 domain-free mechanic을 provisional shared로 검증할 근거는 되지만 Query `enabled`, endpoint, enum, 권한, payload, 실패 semantics를 증명하지 않는다. 리허설 OpenAPI도 실제 복잡도를 시험할 근거일 뿐 신규 제품 계약이나 두 번째 실제 consumer가 아니다.

공용화 판단은 JSX 모양이나 파일 수가 아니라 다음을 묻는다.

1. 여러 도메인에서 의미, 상태 전이, 실패 behavior가 같은가?
2. public API를 도메인 타입과 서버 DTO 없이 설명할 수 있는가?
3. 중복이나 접근성·상태 결함 위험을 실제로 줄이는가?
4. 예외를 흡수할 `mode`, resource config, callback override가 필요하지 않은가?

## 검토한 대안

동일 feature의 동일 workflow는 작은 typed definition으로 실제 필드·컬럼 차이를 표현할 수 있다(같은 workflow의 별도 route + 전용 screen). 이것은 도메인 전반의 config renderer 승격 근거가 아니다. 같은 도메인의 나머지 목록은 기존 filter mechanic을 재사용하고, 반복되는 정렬/page 전이만 feature-local 순수 함수로 모은다. 서로 다른 결과 action과 selection 소유자는 각각 남긴다.

fixture 기반 요청 직전 검증은 실제 서버 consumer에 의한 shared 확정이나 신규 프로젝트 이관 검증을 대체하지 않는다.

2026-09-06 사용자 공용화 요청과 dt-admin-web의 VenueSearchInput/PerformanceSearchDialog 대조로 `InlineSearchSelect`를 provisional primitive로 분리했다. 관찰된 단일 선택·삭제·재선택과 초기화 누락 위험만 공유하며 options/value/label/callback 외에 도메인·API·mode를 받지 않는다. 원격 조회 정책과 선택 모달의 부가 입력·확인/취소는 그것을 여는 feature가 소유한다. 아직 재사용 확정 단계가 아니다.

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
| confirmed shared   | 아래 기계 필요조건이 모두 참이고 사람이 독립 요구를 근거와 함께 판정했을 때          |
| demoted            | 다른 consumer를 위해 분기나 도메인 지식이 필요해 계약을 좁히거나 feature-local로 복귀 |

한 곳은 로컬, 두 곳은 비교, 세 번째 안정적 사용은 승격 검토 신호일 뿐 자동 규칙이 아니다. 접근성 불변식이나 승인된 cross-screen mechanic은 첫 consumer부터 provisional shared가 될 수 있다. 다음 consumer가 다르면 API를 넓히지 않고 좁히거나 demote한다.

#### confirmed의 조건 — 기계가 증명하는 것과 사람이 책임지는 것

**실서버 연결은 confirm의 조건이 아니다.** 이 저장소의 검증 경계는 API 호출 직전이므로 실서버 실패
비교를 요구하면 어떤 계약도 confirmed가 될 수 없고, 그 정의는 이 단계표를 죽은 칸으로 만든다. 실 API로
workflow를 실측하는 것은 `완료`, 신규 제품에서 채택까지 한 것은 `이관 검증됨`이며 둘 다 별도 단계다
([도달 상태](../../.agents/skills/screen-loop/SKILL.md#도달-상태)가 어휘를 소유한다).

기계가 증명하는 필요조건(하나라도 거짓이면 confirmed가 아니다):

- 선언된 각 consumer 파일이 그 계약의 export를 실제로 **호출**한다. import만 있는 파일은 세지 않는다.
- 모든 consumer가 같은 public API를 소비하고, 금지된 `mode`·resource config import가 없다.
- 선언된 focused test가 실제로 실행되고 통과하며, 계약이 소유한 상태 전이와 실패를 덮는다.
- 선언 이후 code·caller·test·근거 문서의 내용이 바뀌면 판정이 무효가 되고 재검토 대상이 된다.
- 새 caller가 나타나면 `미평가 consumer`로 표시한다. 숫자가 늘었다고 자동으로 confirmed가 되지 않는다.

사람이 판정하고 서명하는 것(기계가 대신할 수 없다):

- **독립 요구인가.** 디렉터리 수나 호출 수가 아니라 별개의 제품 요구인지로 센다. 같은 업무의 route 3개나
  같은 wrapper를 거치는 호출 2개는 하나다. 근거로 각 consumer의 인벤토리 절·frame 식별자 또는 날짜 있는
  사용자 답을 링크하고, 그 요구에서 달라지는 입력·검색 gate·상태 소유자·행 의미를 비교해 적는다.
- **callback 안에 예외 정책을 숨기지 않았는가.** 같은 props가 같은 의미인지는 타입이 보장하지 않는다.
- 제거한 중복·결함과 검증하지 않은 경계.

`서명`은 검토자와 검토 대상 revision을 기록하는 책임 표시이며 별도 승인 절차가 아니다.

### URL과 서버 어휘

같은 계약의 값을 가독성만을 위해 별도 어휘로 복제하지 않는다. 양방향 변환·미지 값 처리·정합성 검증 비용에 비해 이득이 부족했기 때문이다. 범용 `SCREAMING_SNAKE ↔ camelCase` 변환도 만들지 않는다. 별도 어휘나 변환은 확인된 요구가 이 비용을 정당화할 때 재검토한다.

이는 신규 제품의 영구 어휘 결정이 아니다. 새 프로젝트는 실제 OpenAPI, URL 공유·복원 요구, migration 비용을 확인해 다시 결정한다. shared UI는 어느 어휘도 알지 않고 `aria-sort`처럼 표준 접근성 어휘만 사용한다. 컬럼 ID와 서버 sort key의 짝, 그리고 URL·Select·헤더에 노출하는 sort key subset은 feature의 단일 typed mapping이 소유한다. 컬럼이 없는 리허설 값(`AGENCY`)은 노출하지 않는다.

## 현재 provisional 계약

아래 단위는 레퍼런스의 shared 후보다. 파일이 존재하거나 테스트가 한 번 통과했다는 이유로 confirmed라 부르지 않는다.

이 표는 **경계**(shared가 어디까지 소유하는가)만 담는다. 단위별 **단계와 비교 요구 수**는 [단위별 단계와 소비자](#단위별-단계와-소비자)가, 그렇게 좁힌 **근거와 이력**은 표 아래 산문이 소유한다. 셋 중 하나를 바꾸면 나머지를 대조한다.

| 종류             | provisional 단위                                                                                                                 | shared 소유의 한계                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| filter surface   | `FilterPanel`, `FilterField`, `AsyncFieldBoundary`, `PeriodField`, `KeywordChipField`, `PeriodFilterField`, `KeywordFilterField`, `CheckboxTree`(다중선택 그룹) | frame·field layout·accessible association·caller가 결정한 비동기 field state의 generic·controlled rendering만 소유. `FilterField group`은 여러 컨트롤을 한 이름으로 묶는 `role=group` 래퍼. composite 행은 optional 기준·대상 select(`FilterSelectSlot`: 문자열 value·options·label만)까지, `CheckboxTree`는 전체/leaf 토글 대수와 `emptyMeansAll`까지. enum 의미·기본값·라벨·행 의미는 feature |
| result surface   | `ResultToolbar`, `ResultSummary`, `ListResult`                                                                                   | slot/layout, caller가 결정한 state, 공용 error/retry/trace 표현만 소유                                                                                                                                                                                                                                                                                                                                                                                                       |
| table/navigation | `DataTable`, `Pagination`, `PageSizeControl`, `SortControl`                                                                      | table/paging/control mechanics만 소유; URL·Query·options·sort behavior는 제외. `SortControl`은 정렬 필드 select만. `DataTable`은 caller의 `meta.sort`(optional `direction: ascending \| descending` + `onSort`)에서 헤더 버튼·`aria-sort`·glyph를 렌더한다. 정렬 가능 컬럼·방향·전이는 feature |
| state mechanic   | `useDraftCommit`, `usePeriodDraft`, `useKeywordDraft`, `useListFilterDraft`                                                                            | preserve/rebuild, preset/custom conversion, pending keyword 대수와 동일 수명의 입력 조합만 소유. 필터 분류·초기값·제출/초기화 목적지는 feature 정책이다. 편집 중 draft는 반쪽 기간을 허용하고 확정 경계가 닫힌 범위를 요구한다                                                                                                                                                                                                                                                                                                                                                                                                      |
| row selection    | `usePageRowSelection`                                                                                                            | 현재 페이지의 선택 가능 행만, 커밋된 view가 바뀌면 해제, 같은 view refetch에는 잔존·선택 가능 ID만 유지. `getId`·`isSelectable`·`resetKey`는 caller가 주는 opaque 값이라 shared가 도메인을 배우지 않는다 |
| list query 투영  | `api/list-query.ts` (`useListQuery`)                                                                                             | provisional. `required-query.ts`의 형제 자리([API 소비 경계](0011-detail-data-and-update-history-boundaries.md#api-호출-계층-조회목록mutation-공통)). 빈 페이지는 결과이고 오류가 아님, 진입 fetch만 blocking 표면을 염, incident surface가 가진 실패(session·permission)는 목록의 오류가 아님 — 셋만 소유. queryOptions·searched 판별·응답→rows/total·pageSize는 feature |
| pure utility     | search compact/default resolve, closed instant pair 정규화, 선언 기본값 생략, datetime/format/option mapping, 정렬 헤더 방향 매핑(`shared/lib/list-sort.ts`, 2026-09-11 네 목록 소비자)                                                                   | 입력·출력이 domain-free인 순수 변환만 소유; 업무 schema·mapper·endpoint 조립은 제외. filter/view partition(`shared/lib/search-partition.ts`)과 `defineSearchFields`는 caller가 선언한 필드·map만 읽고 도메인을 모른다. 필드별 복구·기본값·분류, 검색 gate·기간 기준·기본값 선택·초기화·API/캐시는 feature. 세부 사용법과 기본값은 list-search-contract/shared-values가 소유하고 목록 lifecycle은 list-workflow가 소유한다                                                                                                                                                                                                                                                                                                      |
| shared config    | `standardPageSizeOptions`, `standardPeriodPresetValues`                                                                          | 표준 목록 선택지·기간 preset 값의 provisional named preset만 소유; feature가 명시적으로 선택하고 default(목록 100·전체 / 등록 화면 200 / 통계 1개월 전)·예외를 소유                                                                                                                                                                                                                                                                                                          |
| 선택 요구 action | 미선택 판정·미선택 alert·확인 alert 대수·`run(values)` 호출 시점 | 선택 게이트(미선택 판정+alert)와 확인→`run` 대수만 소유하며, 이는 `일괄변경` 전용이 아니라 **선택을 요구하는 모든 action**의 규칙이라 SMS·이메일·다운로드도 같은 것을 쓴다. 옵션 집합·cascade 유무와 모양·값 미완 판정·행 단위 변경 가능 여부·문구·선택 ID·권한·호출 이후는 전부 feature. `run(values)`와 caller가 주는 문구는 opaque 값이다 |
| download scope surface | 선택/전체 mode·미선택/선택 0건 검증 후보 | 택1 6 / 미선택 오류 7의 반복. `(mode, count) → selected\|all\|error` 순수 분류기는 domain fact를 배우지 않는다. 첫 consumer가 쓰는 검증 표면만 provisional로 두고 row ID·committed 조건·파일 형식·권한·실행 callback은 feature가 소유한다. |

### 각 경계를 그렇게 좁힌 근거

`PeriodFilterField`/`KeywordFilterField` composite는 2026-09-02에 인벤토리 25+ 화면이 같은 행 구성을 쓰고 기준 無 6 화면·대상 無 2 화면만 slot을 생략한다는 관찰로 묶었다. `CheckboxTree`는 30여 목록 화면에서 반복되는 "전체 ✓ | 개별" 그룹이며, 노드가 재귀 union이라 부모–자식 n단계도 같은 대수(부모 클릭=하위 leaf 전체 토글, 값은 leaf만)로 처리하고 test가 2단계를 고정한다. 접근권한 matrix는 화면 행마다 가능한 기능 집합이 달라 행·기능 의미를 feature가 Table+Checkbox로 조립한다. 미확인: 부분 선택 `aria-checked="mixed"` 표시, 중첩 배치의 디자인 대조.

`SortControl`은 2026-09-02에 방향 컨트롤이 Figma 전 화면에 없어 정렬 필드 select로 narrow 했고, 같은 날 `DataTable`의 `meta.sort`는 인벤토리 12+ table이 반복하는 접근성 불변식이라 widen 했다. `aria-sort`는 WAI-ARIA 1.2 기준 한 테이블에 활성 헤더 하나만 가지며, 비활성 정렬 가능 헤더는 버튼만 두고 `aria-sort`·glyph를 생략한다(ARIA 값 `none`을 direction으로 모델링하지 않는다).

`useListQuery`가 소유한 세 semantics는 `list-query.test.tsx`가 빈 페이지·incident 실패 제외·진입 fetch만 blocking·**지연된 새 view 동안 이전 행 보존**으로 고정한다. 실서버 실패 비교는 이 저장소의 경계 밖이라 조건이 아니다.

filter/view partition을 2026-09-02 demote 했다가 재승격한 이유는 두 번째 목록이 같은 결함을 실제로 보였기 때문이다. 그 결함은 draft를 resolved search 전체로 만들 때 나타난다 — `filterKey`가 view를 빼도 submit이 낡은 sort·pageSize로 덮어써서, 정렬·보기를 바꾼 뒤 재검색하면 되돌아간다(재현 테스트로 고정). 특정 도메인의 성질이 아니라 draft를 partition 없이 만든 모든 목록의 성질이다. 배열은 항목 단위 복구와 배열 전체 복구를 소비자별로 구분하며 어느 쪽도 기본값이 아니다. 신규 제품 이관 검증 전이다.

**`일괄변경`은 공용 단위가 아니다(2026-09-05).** 같은 `변경` 이름과 Notion 반복 횟수는 같은 기능의 근거가 되지 못한다. 원장이 확정한 차이는 이런 모양이다 — 한 소비자는 값 선택에 조건부 cascade(어떤 값을 고르면 다른 필드가 따라 열림)를 갖고, 다른 소비자는 cascade 없이 **현재 상태에 따라 그 행 자체를 변경할 수 없다**는 행 단위 정책과 병기 문구를 갖는다. 두 번째 쪽은 첫 번째에 대응물이 없어 하나로 묶으면 `mode`나 예외 predicate가 들어온다(demotion 신호). 어느 소비자의 옵션 집합도 기준이 아니며, 값이 미완인 코드는 제품 근거가 미확정이라 이관 sentinel로 표시돼 있어 이 경계의 근거로 쓰지 않는다.

`ListResult`는 `notSearched | loading | error | empty | ready` 다섯 상태를 판정하며 `ListResultData`는 renderer가 실제로 읽는 facts(rows·searched·isPending·isFetching·isError·trace·retry)만 요구한다(2026-09-02 narrow). total·totalPages는 feature 확장 타입이다. searched entry의 pending 첫 조회는 공용 `BlockingProgress`가 loading 표면을 덮고 area skeleton은 두지 않는다. observer가 없는 prefetch는 로딩·에러 표면에서 배제한다. feature는 상태, 검색 전/결과 없음 문구, retry 동작, 구조적 trace, footer와 ready content를 제공한다. shared pattern은 공용 error/retry 문구, live region과 `ErrorTrace` disclosure를 직접 소유하며 API를 import하거나 raw message를 받지 않는다. 이 다섯 상태는 모든 목록의 필수 단계가 아니며, `DataTable`은 caller의 `meta.sort`로 헤더 버튼·`aria-sort`·glyph를 렌더하고 `onSort`를 호출할 뿐 어떤 컬럼이 정렬 가능한지, 방향 전이, route policy를 소유하지 않는다.

2026-09-07 사용자 결정: 검색 의도를 실제 필터(`periodType`)와 분리한다. 기본값 검색과 최초 진입이 같은 빈 URL로 합쳐지는 문제를 해결하기 위해서이며, boolean을 local state에 복제하지 않는다. 표식의 극성·수명·정규화 규칙 자체는 여기서 다시 정의하지 않는다. 화면별 정책은 feature에 남기고 이 날짜·기본값 결정의 공용 범위는 실제 소비자에서 중복·비교 차이가 확인된 순수 변환이다. 초안 조합의 후속 결정은 아래 별도 절을 따른다. 값·표식·기본값의 실행 순서와 예외 소비자는 [list-workflow](../../.agents/skills/feature-contract/references/list-workflow.md#state-and-url-lifecycle), 공용 함수 계약은 [shared-values](../../.agents/skills/shared-ui-contract/references/shared-values.md)가 소유한다. 이전의 서버 필터 판별자 의무와 별도 표식 금지는 이 범위에서 대체한다. 초기화가 최초 진입 계약을 다시 적용하므로 진입과 초기화를 가르는 URL 표식은 두지 않는다.

기간 range는 오류 메시지를 두지 않는다(2026-09-05 demote). 반대쪽 값이 `min/max`와 calendar bound가 되고, 그것으로 막지 못하는 직접 타이핑은 방금 편집한 bound를 남기고 낡은 bound를 지운다. 2026-09-07 사용자 결정으로 확정 범위는 양끝을 요구한다. 제출·직접 URL의 한쪽 결손, 불량 또는 역전은 날짜 pair만 제거하고 기간 기준·정렬처럼 독립적으로 유효한 검색값은 보존한다. 이 demote의 제품 근거(원장에 역전 오류 문구 0건)는 판정 기록 §5가 소유한다.

`AsyncFieldBoundary`는 feature가 결정한 초기 `loading | error | ready`와 retry callback만 받아 제품 공통 문구와 접근 가능한 상태를 렌더한다. Query, endpoint, option mapping, 선택 의미를 알지 않으며 cached data가 있으면 background refetch 실패 중에도 feature가 `ready`로 판정한다.

위 소유권 표를 목록에 적용하면 route schema, defaults, option query, endpoint, enum, params mapper, query key, result-state 결정, columns, summary 의미, page-size default·preset 선택, domain copy, permission, selection, bulk action value와 navigation이 전부 feature-local이다. 특정 제품의 enum·옵션 endpoint·누락 같은 사실은 그 화면의 인벤토리가 소유하며 공통 계약으로 승격하지 않는다.

### 목록 필터 초안 조합 (2026-09-08)

결정의 비교 근거·대안·적용 한계는 [ADR 0012](0012-list-filter-draft-composition.md)가 소유한다.
이 절은 기존 링크의 진입점이며, 단위별 단계 표는 해당 결정으로 연결한다.

### 행 선택 소유권

20개 이상 목록이 행 선택을 쓰지만 `DataTable`은 의도적으로 selection을 소유하지 않는다. 선택은 list screen 또는 feature-local table adapter가 stable ID로 보관하며 header checkbox는 현재 page의 선택 가능 행만 다룬다.
page·pageSize·sort·committed search·route가 바뀌면 해제하고, draft 편집은 유지한다. 같은 조건 refetch는 여전히 존재하고 선택 가능한 ID만 보존하며 bulk 실패는 유지하고 성공 뒤 선언된 cache consequence가 끝나면 해제한다. 검색결과 전체 선택은 서버가 조건 기반 payload를 선언할 때 별도 계약으로 다룬다.

Figma 원장의 field-level evidence는 현재 surface와 의도적 차이를 찾는 근거다. ADR은 그 내용을 구현
체크리스트로 복제하지 않고, 해당 evidence가 공용 경계를 승인할 만큼 충분한지와 provisional 단계만
판정한다. 코드 변경 후 최신 화면이 같은지 여부는 focused test와 실제 browser 대조가 각각 검사한
범위로만 보고한다.

## 단위별 단계와 소비자

아래 수는 **각 판정 당시 비교한 독립 제품 요구의 수**이며 최신 import·호출 수가 아니다. 같은 업무의 여러 route나 wrapper 호출은 하나로 센다. 새 caller의 적용 상태는 코드와 시나리오 카드에서 확인하고, 의미·상태 전이·실패 계약을 다시 비교한 뒤 판정을 갱신한다. 사용처 증가만으로 기존 confirmed 판정이 새 caller에 확장되지는 않는다. 비교 근거는 [판정 기록](../reference/zero-sol-figma-analysis.md)이 소유한다.

| 단위 | 비교 당시 단계 | 비교 요구 수 | 경계와 근거 |
| --- | --- | --- | --- |
| `CheckboxTree(emptyMeansAll)` | **confirmed** | 2 | 양쪽이 leaf-only 값·전체 선택=`[]`·caller enum 소유로 일치. domain mode 없이 같은 API를 소비한다 |
| `DataTable` 기본·`meta.sort` | **confirmed** | 2 | feature column·opaque `getRowId`·단일 active `aria-sort`. URL/sort policy는 feature |
| `Accordion`/filter/draft/period/keyword·page controls | **confirmed** | 2 | `FilterPanel`이 공용 disclosure를 조립하고 draft 보존·UTC range·URL commit·page reset이 일치. 한쪽의 중복 target 거부는 feature validation이라 shared API를 넓히지 않았다 |
| `useListFilterDraft` | **provisional shared(2026-09-08)** | 미확정 — 5 코드 호출부 대조 | [초안 조합 판정](0012-list-filter-draft-composition.md). 동일 입력 수명의 반복 실행만 묶고 제품 정책은 유지. 기본 훅의 confirmed와 구분 |
| `useListQuery` | **confirmed(2026-09-06)** | 4 | 위 목록 계약 표 참조. 확장 없는 3인자 소비 + focused test |
| `ListResult`·summary·toolbar | **provisional 유지** | 2 | `notSearched`·`empty`·ready 조립만 비교했다. loading/error/retry failure lifecycle을 두 번째 workflow에서 확인하지 못했다 |
| 행 활성화 | **provisional shared** | 1 | `DataTable.onRowActivate(row)`가 pointer·Enter·Space와 interactive child 제외만 소유. destination·permission은 feature callback |
| 일괄변경 alert 연쇄 | **provisional shared** | 1 | 선택 유무 판정과 frozen opaque values·`run(values)`까지만. ID·cascade·권한·호출 이후는 feature |
| `selectionColumn` | **provisional shared(2026-09-06)** | 2 | 동일한 page/mixed/row 체크박스 렌더를 추출. 입력은 선택 controller·라벨·순수 선택 가능 판정이며 DTO·URL·권한을 모른다. 상태는 `usePageRowSelection`에 유지 |
| `useConfirmation` | **provisional shared(2026-09-06)** | 3 | 값 보관→취소/확정만. opaque 값과 `run`만 알고 폼·성공·API를 모른다. 서버 이후 `useSaveForm`은 유지 |
| `maskEmail`·`maskPhone` | **provisional shared(2026-09-06)** | 2 | 동일한 문자열 알고리즘 복제본 제거. 문자열만 받고 표시 문자열만 반환하며 공개 권한·API는 호출부 소유. 현재 규칙의 재사용이며 신규 제품 마스킹 정책 확정이 아니다 |
| `hasRepeatedOrSequentialAsciiTriplet` | **provisional shared(2026-09-07)** | 2 | 입력 검증의 동일 ASCII 3반복/3연속 판정만 추출. 길이·문자군·schema·카피는 feature에 남고 서버 이력이나 신규 제품 정책은 알지 않는다 |
| `usePageRowSelection` | **confirmed(2026-09-05)** | 2 | page 한정·view 변경 시 해제·같은 view refetch 잔존. 두 번째 소비자가 배열 identity 의존의 무한 렌더를 드러내 내용 비교로 고쳤다 |
| filter/view partition·`defineSearchFields`·search codecs | **confirmed(2026-09-05, 2026-09-07 확장)** | 2 | 두 목록이 같은 결함을 보여 재승격. 2026-09-07에 세 map 파생·복구 codec·closed pair 정규화·기본값 생략을 추가했다. 배열 복구는 항목 단위와 전체 중 소비자가 고르며 어느 쪽도 기본이 아니다 |
| `standardPageSizeOptions`·`standardPeriodPresetValues` | **provisional named preset** | 다수 | 값 목록만 공용. 채택 선언·default·예외는 feature가 명시적으로 소유한다 |
| download scope 분류기 | **provisional shared** | 1 | `(mode, count) → selected\|all\|error` 순수 분류만. 첫 consumer의 검증 표면이며 row ID·파일 형식·권한은 feature |
| Tooltip | **provisional source-owned primitive** | 1 | trigger/content·focus/hover·Escape와 접근 가능한 연결만. header copy는 feature |

다음은 미확인이라 공용화하거나 구현하지 않는다.

- 신규 제품의 endpoint, DTO, enum, permission, option source와 실패 semantics
- 다른 목록의 명시적 검색과 required prerequisite의 실제 Query gate 정책
- bulk의 binary/partial success와 권한. cross-page selection은 2026-09-04 제품 답으로 제외하고 현재 페이지의 선택 가능 행만 선택한다
- 범위 밖 page의 제품 canonicalization 정책
- API `timezone` 파라미터의 의미와 값
- rehearsal `INACTIVE`와 Figma의 거절·비활성 상태 의미의 대응
- array·object-array query의 실제 서버 wire binding

통계 화면은 목록 전체가 아니라 기간 mechanic만 독립 비교할 후보다. 계약이 연결되기 전에는 리허설 endpoint를 대신 쓰거나 Figma에서 runtime 정책을 추론하지 않는다. 아직 code consumer가 없는 Tabs·상태 count 클릭 필터·빈 값 `-` 표현은 후보일 뿐 단계 값을 부여하지 않는다.

range slider는 `129:32748`에서 출처가 확인됐지만 다른 발권 4 variant에는 미확인이고, 선택 label registry는 cardinality, 보기·정렬 마지막값은 저장 범위, `- 이하 생략 -`은 의미가 미확인이다. 팝업 안 목록은 `table-composition.md` kind E의 component-local params로 충분하며 새 controller가 필요하지 않는다.

## 신규 프로젝트 채택 경계

새 프로젝트는 이 저장소의 구현을 복사하지 않는다. 새 제품의 요구사항, Figma, OpenAPI가 제품 진실이고 이 ADR은 설계 근거다.

그대로 가져갈 수 있는 것은 shared/feature 소유권 원칙, explicit composition, provisional → 실제 consumer 비교 → confirm/demote 절차, 그리고 증거가 검사한 범위만 완료로 말하는 원칙이다.

다음은 새 제품 사실과 대조한 뒤에만 채택한다: sparse URL과 resolved defaults, draft/period/keyword mechanic, result-state 집합, no-codec 선택, option preload, page reset, 각 shared public API. Router·OpenAPI·복원 요구가 다르면 현재 제품 사실을 우선한다.

리허설 snapshot, Manager schema·enum·defaults·options·columns·copy, mock/fixture, 미확인 permission·bulk·selection 정책, 새 화면이 소비하지 않는 provisional code는 가져가지 않는다. 첫 대표 vertical slice가 실제로 필요한 범위만 채택하고, 두 번째 성격의 화면에서 각 후보를 confirm하거나 demote한다.

### 인계 입력과 적용 순서

4-part bundle의 구성, 기계가 증명하는 범위, 새 제품에 적용하는 순서는 목록만의 규칙이 아니라 form·detail·transport
계약도 함께 쓰는 절차이므로 [scripts/contracts/README.md](../../scripts/contracts/README.md)가 소유한다. 선언된
bundle 목록과 closure 계산은 `scripts/contracts/seed.mjs`가 소유한다. 실제로 확정한 계약만 선언하며 통계·권한
matrix·알림처럼 미구현 화면 유형은 후보로 추측하지 않는다.

### 채택 성공 조건

새 프로젝트가 이 기준을 성공적으로 채택했다는 판정에는 다음 증거가 모두 필요하다.

- 새 제품의 요구사항과 레퍼런스 가정이 구분되고, 각 요구사항의 소유 레이어와 채택 판정 근거가 추적된다.
- Manager schema, 리허설 endpoint·DTO·enum·permission, 사용하지 않는 provisional code가 제품 사실로 유입되지 않는다.
- 선택한 공용 계약이 도메인 mode, resource config, Router·Query·API·permission 분기로 제품 차이를 숨기지 않는다.
- 완료 보고가 [AGENTS.md 완료](../../AGENTS.md#완료)의 필드를 갖춘다.

문서가 존재하거나 코드를 복사했다는 사실만으로는 성공이 아니다. 실제 신규 프로젝트에서 이 절차만으로 요구사항에 맞는 vertical slice를 구현·검증하고, 그 과정에서 발견한 기준의 누락을 단일 소유 문서·코드·검사에 되돌려 반영했을 때 인계 가능성이 검증된다. 목록·필터 외 화면 유형은 이 ADR을 범용 근거로 삼지 않고 처음 필요할 때 자체 관찰 근거와 경계 결정을 만든다.

## 재검토 조건

- 두 번째 실제 목록 또는 기간 consumer가 구현되어 의미·lifecycle·failure behavior를 비교할 수 있을 때
- shared API가 Router, Query, endpoint, permission, DTO 또는 domain mode를 요구할 때
- 신규 제품의 URL·API·timezone·권한 계약이 리허설 가정과 다를 때
- Figma 원본의 반복 구조나 대표 상태가 바뀌거나 Notion Feature 문장이 바뀔 때
- 판정 기록 §5의 미확인(보기/정렬 마지막 값 기억, gate 없는 화면의 초기화, 정렬 방향 UI, 중복 키워드 동일성, 운영자 bulk 정책)이 답을 얻을 때

재검토 결과는 투표나 역할 의견이 아니라 현재 제품 계약, 실제 diff, 테스트와 브라우저 증거로 판정한다.

## 목록 소비자 정리 (2026-09-07)

목록 파일 배치는 feature-contract의 screen-composition이 소유한다.
`ResultTotal(searched, total)`은 기존 `ResultSummary`를 사용해 한 개 건수의 공용 문장·포맷과
검색 전 부재/검색 후 0건 표시를 묶는다. 네 목록 소비자의 동일한 표시 책임을 비교했다. 위치·툴바 노출·추가 loading gate·선택·조회 정책은 소비자에 남긴다.
반환 모양이 같다는 이유로 결과 훅이나 검색 스키마 전체를 팩토리로 승격하지 않는다.
기본값 결합은 기존 `resolveSearchDefaults`를 채택하고 제품별 enum/default/URL 확정 정책을 유지한다.
실 API 실패 수명과 신규 프로젝트 이관이 검증된 계약으로 승격한 것은 아니다.
