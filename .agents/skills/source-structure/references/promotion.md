# 공용 단위의 승격 심사

**공용으로 올릴지·좁힐지·내릴지·지울지를 실제로 판정할 때만 읽는다.**
배치만 정하는 요청은 `SKILL.md` 의 배치 판단으로 닫힌다.

## 공용 단위의 승격

코드 모양이 아니라 **의미와 상태 전이**로 판단한다.

```text
첫 소비자    → 기능 내부에서 가장 단순하게 구현
두 번째      → 공통점과 차이를 비교
반복         → 의미·입력·상태 전이·실패·수명이 같을 때만 승격 검토
```

**쓰는 것과 승격하는 것은 다른 결정이다.** 기존 계약이 그대로 맞으면 그냥 쓰고 이 절을 열지 않는다.
한 곳에서만 필요하면 그 기능 안에 두고 역시 열지 않는다.

승격하려면 넷이 모두 참이어야 한다.

- 비교한 호출자들에서 의미·상호작용 수명·소유·실패 동작이 같다
- 공개 계약에 도메인 타입·서버 DTO·Query·Router·권한·mutation 정책이 없다
- 자원·엔티티 switch, 도메인 mode, schema 주입, callback override 가 필요 없다. 단위가 필드·DTO·
  endpoint·목적지를 배우지 않는 불투명 인자(읽지 않는 schema 타입 인자, `run(values)` callback,
  순수 분류 결과, 완료 callback, `resetKey` 문자열)는 schema 주입이 아니다
- 하나의 구현이 **관측된** 변경 비용이나 결함 위험을 줄인다(반복된 결함, 소비자마다 다시 쓰는 전이,
  한 번 놓친 접근성 불변식)

시각적 유사성, 예상되는 재사용, 기계적인 세 번째 발생은 근거가 아니다.

**승격하지 않을 신호**: 도메인 이름이나 제품 값을 알아야 함 · 경로·권한·캐시를 직접 알아야 함 ·
호출자마다 mode 가 늘어남 · callback 과 설정으로 차이를 계속 흡수함 · 한 소비자 때문에 공개 API 가
넓어짐 · 생김새만 같고 실패·수명이 다름.

맞지 않으면 **중복을 허용한다.** 읽기 쉬운 명시적 조립이 잘못된 추상화보다 낫다.

승격한 단위는 계약을 공개한다: 입력 / 출력 / 소유하는 상태와 수명 / 직접 하는 부작용 / 처리하는
실패의 범위 / **호출자에게 남기는 것** / 좁히거나 되돌릴 조건. 첫 소비자는 소비자이지 소유자가 아니다 —
두 번째 실제 workflow 가 같은 의미·수명·실패를 확인하기 전까지 그 단위는 잠정이다.

### 승격 보고 · 공용 로직 · 수명 · 강등 신호

승격을 결정한 작업 기록에 비교한 호출자·같은 전이·남겨 둔 차이·줄어드는 비용이나 결함 위험을 적는다.
위 판단을 뒷받침하지 못하면 feature-local로 둔다. 기존 단위를 그대로 쓰는 작업에 별도 심사표를 요구하지 않는다.

## Shared logic

A focused shared state mechanic owns one domain-neutral algebra: draft preservation while a caller identity is equal, period preset/custom transitions from explicit timezone inputs, pending keyword add/remove/trim, page-scoped row selection, one rejection message, the confirm → run → close lifecycle. The caller owns identity policy, field/enum meaning, defaults, submit/reset destinations, navigation, Query enablement, and API mapping. Navigation ports, query options, resource modes, or schema configs are demotion signals.

A pure utility may compact values, resolve declared defaults, normalize a pair, format primitive values, or map structurally generic options only when it does not broaden keys or invent server semantics. Keep it local when arguments grow to absorb domain differences.

Before promoting, compare the real callers on input differences, state transitions, failure/recovery, and owner. Merge same-role copies in the nearest feature owner first; only a domain-free mechanic moves to shared. A fixture's search/sort/page calculation imitates the server and disappears with the real API — tidy it inside the mock and do not count it as shared evidence. Responsibilities that survive connection (query outcome judgment, selection lifetime, confirmation value holding) are compared against the existing catalog first. Report the compared consumers and the differences left outside; "no duplication" holds only inside the compared range.

## Lifecycle

A unit stays provisional until a second real workflow validates the same semantics, lifecycle, and failure behavior. The first consumer is a consumer, not the owner.

1. name the evidence and the current consumer
2. state the smallest public contract and the feature-owned remainder
3. implement only the surface the current consumer uses
4. compare the next real consumer
5. confirm, narrow, or demote from observed differences

When the request names a shared unit, inspect its actual consumers before changing its contract. Verify
the changed behavior and affected consumption patterns as defined by [shared-ui](../../shared-ui/SKILL.md#이-계약의-검증-대상).
A caller's need does not by itself justify widening the public responsibility. Keep feature-owned meaning with the caller.

Consequential selection (a select whose change needs confirmation before it commits) is not a shared control feature: keep the committed value unchanged, hold one local candidate, open `ConfirmDialog`, commit through the caller on confirm, discard on cancel. Shared controls expose controlled values and never open workflow dialogs themselves.

## Demotion signals

- domain `mode`, resource descriptor, schema injection, or permission branch
- callback overrides added for exceptional callers
- Router, Query, mutation, endpoint, or server DTO knowledge (an injected `run` promise or a domain-free failure vocabulary is not that knowledge)
- a different failure lifecycle hidden behind configuration
- a unit whose only consumer is its own test and for which no consumer is expected

Return the differing workflow to feature code and narrow the shared contract instead of growing an option framework. Delete a unit whose consumers are gone and none is expected; a `Form*Field` adapter with no consumer is the exception the product owner keeps for the declared input set. The reasons behind the current shared set are recorded in [ADR 0014](../../../../docs/decisions/0014-single-screen-shape.md).
