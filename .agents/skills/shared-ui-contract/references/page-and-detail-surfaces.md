# Page and detail surfaces

Read this file only for `PageHeader`, `DetailField`, `DetailStateBoundary`, `UpdateHistory`, or `EmptyState`.

| Surface | Caller passes | Owns | Does not own |
| --- | --- | --- | --- |
| `PageHeader` | `title` (ReactNode), optional `breadcrumb`, optional `actions` slot | one `h1` header row; actions render at the end (헤더 우측 SMS·이메일 등) | which actions exist, their permission or pending state, navigation |
| `DetailField` | `label` string, `children` value | one `dt`/`dd` pair | the enclosing `dl` and its column grid, empty-value copy (`-`), formatting, masking, links or buttons inside the value |
| `DetailStateBoundary` | `state: 'ready' \| 'error' \| 'notFound'`, `labels { error, notFound }`, optional `retryLabel` + `onRetry`, optional `trace` node, `children` | rendering the three states; the error state is a `role="alert"` region with the retry button and trace | deciding the state (detail-workflow: only `ApiError.kind === 'not-found'` is `notFound`; pending stays `ready` because app progress covers it), copy, the query |
| `UpdateHistory` | `entries: { id, date, lines: readonly string[], manager }[]`, `labels { date, change, manager }`, `emptyText` | the three-column `Table`, a stable row key, one `<li>` per line in the change cell, the empty text | the enclosing `SectionCard` and its title, mapping server change logs to entries (field labels, value formatting, redaction, unsupported/unknown copy — a feature pure function), `ReactNode` or render callbacks, sorting, paging (ADR 0011, provisional: 5 inventory screens, 1 code consumer) |
| `EmptyState` | `children` | a bordered placeholder box | any role or live semantics — the host adds `role="alert"`/`status` when the content is an outcome, not a static hint |

- A detail composes `PageHeader` **outside** `DetailStateBoundary` so the title stays visible in error states; `SectionCard` and `DetailField` go inside (see [disclosure-sections.md](disclosure-sections.md)).
- The 2-column `dl` grid (`grid md:grid-cols-2`) is written by the feature around `DetailField`s; the product shows it on every detail but the pairing per row is domain order.

- `UpdateHistory` entries are already localized, safe strings. The feature mapper (`to*HistoryEntries(logs, t)`) never passes raw server field codes, secrets, or JSON; shared renders lines only.

Test the state actually rendered, the retry callback, the header action slot changed, and for `UpdateHistory` the headers, one list item per line, and the empty text.
