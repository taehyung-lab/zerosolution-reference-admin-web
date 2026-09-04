# Blocking progress

Read this file only for app-wide `BlockingProgress`, inert loading coverage, or its accessible progress presentation.

- `BlockingProgress` is the sole confirmed app-wide loading surface. AppShell derives mutations and only observed pending queries that explicitly declare `blockingProgress`; observerless warming and unclassified queries are excluded.
- `blockingProgress` is for a primary request started because the screen is entering without usable primary data (list result from a searched entry URL, detail, edit load). After the screen is mounted, search, sort, filter, page, page-size, retry, and background refetch use `contentProgress`, keep usable content when available, and never open the overlay. Duration does not promote a content request to blocking.
- Option and lookup queries declare `inlineProgress`: their field shows its own loading state (`AsyncFieldBoundary`, disabled select) and the route warms them on entry and preload intent. A screen never opens the overlay because a select is loading its choices.
- The action that started a mutation also shows its own pending state (`FormSubmitButton pending`, a disabled button); the overlay is not a substitute for it. Whether download or bulk actions open the overlay is unconfirmed — Figma shows only 로딩중/등록중 — so they start with button pending only.
- The covered surface becomes inert. The primitive receives only `open`, `message`, and children.
- It owns no Query, retry, cancel, percentage, access policy, or feature workflow.

Use an appropriate live region and test inert coverage, progress announcement, mutation copy priority, and the opening/closing transition actually changed.
