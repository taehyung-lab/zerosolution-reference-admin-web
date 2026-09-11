# Blocking progress

Read this file only for app-wide `BlockingProgress`, inert loading coverage, or its accessible progress presentation.

- `BlockingProgress` is the sole confirmed app-wide loading surface. AppShell derives mutations and only observed pending queries that explicitly declare `blockingProgress`; observerless warming and unclassified queries are excluded.
- `blockingProgress` is for a list result started because the screen is entering with a searched URL and no usable primary data. Detail and edit loads no longer declare it: the route loader awaits them before the screen mounts, no observer exists to open the overlay, and the router's `RoutePending` is the wait surface ([router.md](../../feature-contract/references/router.md#loader-and-preload), 2026-09-11). After the screen is mounted, search, sort, filter, page, page-size, retry, and background refetch use `contentProgress`, keep usable content when available, and never open the overlay. Duration does not promote a content request to blocking.
- Option and lookup queries declare `inlineProgress`: their field shows its own loading state (`AsyncFieldBoundary`, disabled select) and the route warms them on entry and preload intent. A screen never opens the overlay because a select is loading its choices.
- The action that started a mutation also shows its own pending state (`FormSubmitButton pending`, a disabled button); the overlay is not a substitute for it. Whether download or bulk actions open the overlay is unconfirmed — Figma shows only 로딩중/등록중 — so they start with button pending only.
- The covered surface becomes inert. The primitive receives only `open`, `message`, and children.
- It owns no Query, retry, cancel, percentage, access policy, or feature workflow.

Use an appropriate live region and test inert coverage, progress announcement, mutation copy priority, and the opening/closing transition actually changed.
