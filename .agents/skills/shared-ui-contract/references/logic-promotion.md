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
