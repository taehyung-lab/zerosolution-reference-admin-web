# Shared logic promotion

Read this file only when deciding whether a feature-local state mechanic or pure utility should enter, remain in, narrow within, or leave `shared/lib`.

Use the same evidence threshold as UI promotion: compare real callers and admit only a domain-neutral contract that reduces observed change cost or defect risk.

## Shared logic admission

A focused shared state mechanic owns one domain-neutral algebra, such as:

- draft preservation while a caller identity is equal and rebuild when it changes
- period preset/custom transitions from explicit timezone inputs
- pending keyword add/remove/trim behavior

The caller owns identity, field/enum meaning, defaults, submit/reset/navigation, Query enablement, and API mapping. Navigation ports, query options, resource modes, or schema configs are demotion signals.

A pure utility may compact values, resolve declared defaults, format primitive values, or map structurally generic options only when it does not broaden keys or invent server semantics. Keep it local when arguments grow to absorb domain differences.

Report compared callers, the smaller public contract, and removed cost/risk. Repeated syntax alone is not promotion evidence.

## 실제 API에서도 남는 중복인가

공용화 전에 실제 호출부 전체에서 입력 차이, 상태 전이, 실패·복구, 소유자를 비교한다.
같은 역할의 복사본은 가장 가까운 feature 소유자에서 먼저 합치고, 도메인을 모르는 mechanic만 shared로 올린다.

fixture의 검색·정렬·페이지 계산은 서버 동작을 흉내 낸 코드인지 먼저 판정한다.
서버 페이지 API로 교체되면 사라질 계산은 mock 안에서 정리하고 제품 공용 계약의 근거로 삼지 않는다.
반면 Query 결과 판정, 선택 수명, 확인 값의 보관처럼 연결 후에도 남는 책임은 기존 공용 계약을 우선 대조한다.
공용화 결과에는 비교한 실제 소비자와 남긴 차이를 적는다. 컬럼·옵션만 다른 경우와 검색 게이트·업무 액션이 다른 경우를 구분하며,
“중복 없음”은 대조한 범위 안에서만 판단한다.
