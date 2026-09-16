# Shared ownership and promotion

Read this file only when deciding whether a feature UI composition, state mechanic, or pure utility should enter, remain in, narrow within, or leave `src/shared` (`ui`, `model`, `lib`) or `src/api`. The current shared set and its contracts are listed in [catalog.md](catalog.md); this file owns the decision procedure.

## Admission test

One use stays feature-local. Two uses are compared. A third stable use starts review; it does not guarantee promotion. Promote only when all are true:

- semantics, interaction lifecycle, ownership, and failure behavior match across the compared callers
- the public API contains no domain type, server DTO, Query, Router, permission, or mutation policy
- no resource/entity switch, domain mode, schema injection, or callback override is needed. An opaque generic — a schema type parameter the hook never reads, a `run(values)` callback, a pure classifier result, a completion callback, a `resetKey` string — is not schema injection: the unit learns no field, DTO, endpoint, or destination from it
- one implementation reduces observed change cost or defect risk (a repeated defect, a transition rewritten in every consumer, an accessibility invariant that was missed once)

Visual similarity, anticipated reuse, and a mechanical third occurrence are not evidence. Design repetition counts only when semantics, state transitions, and failure behavior are legible and match; it may establish a documented contract before code uses, never a component by itself. The target inventory located through `docs/reference/product.json` is evidence about behavior, not a second code consumer.

A shared unit may own confirmed product-generic copy in the `shared` namespace when that wording is part of its interaction contract (error/retry/trace labels, the save confirm/acknowledge pair, the alert title). A sentence that carries workflow meaning (not-searched, empty, a domain confirmation) stays feature copy.

The completion report answers every admission item, not a verdict word:

| admission item | required evidence |
| --- | --- |
| semantics, lifecycle, ownership, failure behavior match | compared call sites and the matching/differing transitions |
| public API has no domain, DTO, Query, Router, permission, or mutation policy | the smallest domain-free input/output and the feature-owned remainder |
| no resource switch, schema injection, or callback override | the required variation and why an opaque generic does not teach shared a domain fact |
| implementation reduces observed cost or risk | the concrete duplication, change cost, or defect |

If any row is unanswered, keep the code feature-local.

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

When the request names a shared unit rather than a screen, the same procedure applies from the other direction: the unit's focused tests are the contract, completeness is those tests plus every existing consumer still passing, and a caller's need never widens the contract on its own — that is step 4 with a new consumer. Implement only inside the unit's ownership; absorbing anything the catalog assigns to the feature is a failure even when a caller asks for it.

Consequential selection (a select whose change needs confirmation before it commits) is not a shared control feature: keep the committed value unchanged, hold one local candidate, open `ConfirmDialog`, commit through the caller on confirm, discard on cancel. Shared controls expose controlled values and never open workflow dialogs themselves.

## Demotion signals

- domain `mode`, resource descriptor, schema injection, or permission branch
- callback overrides added for exceptional callers
- Router, Query, mutation, endpoint, or server DTO knowledge (an injected `run` promise or a domain-free failure vocabulary is not that knowledge)
- a different failure lifecycle hidden behind configuration
- a unit whose only consumer is its own test and for which no consumer is expected

Return the differing workflow to feature code and narrow the shared contract instead of growing an option framework. Delete a unit whose consumers are gone and none is expected; a `Form*Field` adapter with no consumer is the exception the product owner keeps for the declared input set. The reasons behind the current shared set are recorded in [ADR 0014](../../../../docs/decisions/0014-single-screen-shape.md).
