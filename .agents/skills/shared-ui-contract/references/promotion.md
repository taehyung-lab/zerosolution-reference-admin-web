# Shared ownership and promotion

Read this file only when deciding whether a feature UI composition or shared pattern should enter, remain in, narrow within, or leave `shared/ui`. Source-owned primitive creation and shared logic have separate references.

## Admission test

One use stays feature-local. Two uses are compared. A third stable use starts review; it does not guarantee promotion. An explicitly approved reference-project pattern may start provisional shared only when the current screen needs it. Promote other code only when all are true:

- semantics, interaction lifecycle, ownership, and failure behavior match
- the public API contains no domain type, server DTO, Query, Router, permission, or mutation policy
- no resource/entity switch, domain mode, schema injection, or callback override is needed. An opaque generic — a schema type parameter the hook never reads, a `run(values)` callback, a pure classifier result, a completion callback — is not schema injection or a callback override: the hook learns no field, DTO, endpoint, or destination from it (`useSaveForm`, ADR 0010 2026-09-03)
- one implementation reduces observed change cost or defect risk

Figma repetition counts only when semantics, state transitions, and failure behavior are legible and match. It may establish a documented contract before three code uses; it does not automatically authorize a component. Visual similarity and anticipated reuse are not evidence.

A whole-product inventory (`docs/reference/zero-sol/`) is a third evidence type: Figma frames prove UI composition and static states, Notion Feature sentences prove behavior and policy. An identical sentence repeated across domains strengthens a provisional contract, but it never replaces the second code consumer, and a candidate observed only in the inventory is recorded as behavior in the judgment document, not as a named API in shared or in this skill.

A pattern may own confirmed product-generic status or action copy in the `shared` namespace when that wording
is part of the pattern's interaction contract. For example, `ListResult` owns shared error/retry/trace labels,
while its search-before and no-result messages remain feature-owned because they carry workflow meaning.

In the completion report, name compared call sites, matching lifecycle, reduced cost/risk, and the domain-free public API. Otherwise keep the code feature-local.

## Reference-project lifecycle

A bootstrap contract remains provisional until a second real workflow validates the same semantics, lifecycle, and failure behavior. Manager is a consumer, not the owner or sufficient confirmation.

For each candidate:

1. name evidence and current consumer
2. state the smallest public contract and feature-owned remainder
3. implement only the surface the current consumer uses
4. compare the next real consumer
5. confirm, narrow, or demote from observed differences

Do not count rehearsal endpoints or a second visual instance as another implementation consumer. Keep current list-candidate status in ADR 0009 and form status in ADR 0010; this reference owns the decision procedure, not inventories or last-green reports.

## Demotion signals

- domain `mode`, resource descriptor, schema injection, or permission branch
- callback overrides added for exceptional callers
- Router, Query, mutation, endpoint, or server DTO knowledge (an injected `run` promise or a domain-free failure vocabulary is not that knowledge)
- different failure lifecycle hidden behind configuration

Return the differing workflow to feature code and narrow the shared contract instead of growing an option framework.
