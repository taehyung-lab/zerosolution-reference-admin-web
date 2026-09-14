# Shared ownership and promotion

Read this file only when deciding whether a feature UI composition or shared pattern should enter, remain in, narrow within, or leave `shared/ui`. Source-owned primitive creation and shared logic have separate references.

## Admission test

One use stays feature-local. Two uses are compared. A third stable use starts review; it does not guarantee promotion. An explicitly approved reference-project pattern may start provisional shared only when the current screen needs it. Promote other code only when all are true:

- semantics, interaction lifecycle, ownership, and failure behavior match
- the public API contains no domain type, server DTO, Query, Router, permission, or mutation policy
- no resource/entity switch, domain mode, schema injection, or callback override is needed. An opaque generic — a schema type parameter the hook never reads, a `run(values)` callback, a pure classifier result, a completion callback — is not schema injection or a callback override: the hook learns no field, DTO, endpoint, or destination from it (`useSaveForm`, ADR 0010 2026-09-03)
- one implementation reduces observed change cost or defect risk

Figma repetition counts only when semantics, state transitions, and failure behavior are legible and match. It may establish a documented contract before three code uses; it does not automatically authorize a component. Visual similarity and anticipated reuse are not evidence.

A whole-product inventory (`docs/reference/zero-sol/`) is a third evidence type: Figma frames prove UI composition and static states, Notion Feature sentences prove behavior and policy. An identical sentence repeated across domains strengthens a provisional contract, but it never replaces the second code consumer. An inventory-only candidate may be recorded in the judgment document and `primitives-and-tokens.md` with its evidence and feature-owned boundary, but it is not a named API or implementation commitment.

A pattern may own confirmed product-generic status or action copy in the `shared` namespace when that wording
is part of the pattern's interaction contract. For example, `ListResult` owns shared error/retry/trace labels,
while its search-before and no-result messages remain feature-owned because they carry workflow meaning.

The completion report must answer every admission item, not return only a verdict word:

| admission item | required evidence |
| --- | --- |
| semantics, lifecycle, ownership, failure behavior match | compared call sites and the matching/differing transitions |
| public API has no domain, DTO, Query, Router, permission, or mutation policy | the smallest domain-free input/output and the feature-owned remainder |
| no resource switch, schema injection, or callback override | required variation and why an opaque generic, pure classifier, `run(values)`, or completion callback does not teach shared domain facts |
| implementation reduces observed cost or risk | concrete duplication, change cost, or defect evidence |

If any row is unanswered, keep the code feature-local. A verdict such as `feature-local` or `provisional shared` alone is not a completed promotion report. Implementation-loop N5 treats an unanswered row or a single-caller widening as E6, not as a completed screen.

## Reference-project lifecycle

A bootstrap contract remains provisional until a second real workflow validates the same semantics, lifecycle, and failure behavior. The first consumer is a consumer, not the owner or sufficient confirmation.

For each candidate:

1. name evidence and current consumer
2. state the smallest public contract and feature-owned remainder
3. implement only the surface the current consumer uses
4. compare the next real consumer
5. confirm, narrow, or demote from observed differences

Do not count an isolated non-product endpoint or a second visual instance as another implementation consumer. Keep current list-candidate status in ADR 0009 and form status in ADR 0010; this reference owns the decision procedure, not inventories or last-green reports.

When the request itself names a shared contract rather than a screen, the same procedure applies from the
other direction. The bundle's focused tests are the contract, so completeness is those tests plus every
existing consumer still passing, not a count of facts. Implement only inside `ownership.shared`; absorbing
anything the bundle assigns to the feature is a failure even when a caller asks for it. If the request
cannot be satisfied without widening the public contract, that is step 4 above with a new consumer, not
implementation: compare it and then confirm, narrow, or demote. A single caller's need never widens a
contract on its own.

## Demotion signals

- domain `mode`, resource descriptor, schema injection, or permission branch
- callback overrides added for exceptional callers
- Router, Query, mutation, endpoint, or server DTO knowledge (an injected `run` promise or a domain-free failure vocabulary is not that knowledge)
- different failure lifecycle hidden behind configuration

Return the differing workflow to feature code and narrow the shared contract instead of growing an option framework.
