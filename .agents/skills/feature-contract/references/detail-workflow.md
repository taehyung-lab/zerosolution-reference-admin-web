# Detail workflow

Read this file for an ID-backed detail screen, detail state, sections, actions, or entry to edit.

## Detail ownership

- The feature owns the ID query definition, DTO mapping, sections, copy, permissions, actions, and navigation. The `queryOptions` factory stays in `features/{domain}/api/` because route loaders warm the same cache entry; a workflow hook beside the screen (`screens/detail/model/use{Domain}Detail`, `screens/form/model/use{Domain}EditDetail`) injects the locale and runs it. Screens call the hook, never `useQuery` directly. `features/*/api/**` declares no hooks (lint, ADR 0011).
- Use an ID-based query key. A partial list row is not authoritative detail data.
- Sections remain feature-local. Every collection inside the detail (history, child records, paged child lists) is classified by [table-composition.md](table-composition.md); a detail DTO array is kind A and a paged child list is kind C, not this file's ID query.
- Product permission, missing-resource meaning, and post-action navigation come from confirmed contracts, not Figma or rehearsal data.
- The product's detail screens share one archetype (inventory 2026-09-02: 회원·발권·소명·운영자 조회): header actions, collapsible sections of read-only fields, child collections, an update-history table, and a bottom action row whose set depends on the record status. Compose it per feature from `PageHeader.actions`, `SectionCard`, `DetailField`, and the collection kinds; do not build a `DetailPage`/`ResourceDetail` shell or a status-to-action catalog in shared.
- An editable section inside a detail (회원상담, 소명 처리 결과, 공연 입장안내정보) is one form of its own: it follows [form-workflow.md](form-workflow.md) with its own TanStack Form instance, save flow, and dirty state, and invalidates the detail query on success. When the record status makes the section read-only (소명 통보 완료), render the read-only surface from the authoritative status instead of disabling the form.

## Detail state

A detail or edit-load screen composes `DetailStateBoundary` for `ready | error | notFound` with `PageHeader` outside. The state decision is not written in the screen: the feature hook returns `useDetailQuery(options)` from `src/api/required-query.ts`, whose pure `resolveRequiredQueryOutcome` fixes the priority `incident → not-found → usable data → pending → local error → settled-without-data` ([ADR 0011](../../../../docs/decisions/0011-detail-data-and-update-history-boundaries.md)). The feature supplies safe copy, retry, trace, and content.

- Session/permission failures are `delegated`: no local error surface, the incident boundary owns them even when cached data exists.
- A fresh `not-found` wins over cached data; any other failure keeps already-loaded data `ready`.
- Pending and delegated render as `ready` without content because app-wide progress and the incident boundary own them.
- Settled with neither payload nor `ApiError` is an abnormal recoverable `error`; do not invent not-found meaning.
- This is not the list workflow's five-state `notSearched | loading | error | empty | ready` result boundary; list hooks keep their own facts.

## Composition index

Select only the surfaces the current detail uses.

| Surface | Shared mechanic | Feature owns | Read next only when changing it |
| --- | --- | --- | --- |
| Header | `PageHeader` outside the boundary | breadcrumb, title, header actions | this file |
| State | `useDetailQuery` (api) + `DetailStateBoundary` | which query, safe copy, retry, trace | this file |
| Fields | `SectionCard`, `DetailField`, `Badge` | section mapping, labels, exhaustive status-to-tone mapping, empty value copy | [badge.md](../../shared-ui-contract/references/badge.md) only for tone semantics |
| Collections | per kind | rows, columns, empty copy, child key or params | [table-composition.md](table-composition.md) |
| Update history | `UpdateHistory` (kind A rows) | pure mapper `to*HistoryEntries(logs, t)`: field labels, value formatting, redaction, unsupported/unknown copy; section title and empty copy | [page-and-detail-surfaces.md](../../shared-ui-contract/references/page-and-detail-surfaces.md) |
| Actions | Confirm, Alert, Link | visibility per record status, permission, confirmation, destination | [mutation-actions.md](mutation-actions.md) |
| Editable section | one form per section (see above) | section schema, mapper, read-only transition | [form-workflow.md](form-workflow.md) |

## Actions and verification

The feature owns edit/back/delete visibility, confirmation, mutation outcome, cache consequence, and destination. Read [form-workflow.md](form-workflow.md) only when entering or changing a form, [mutation-actions.md](mutation-actions.md) when an action mutates or confirms, and [bulk-actions.md](bulk-actions.md) only for multi-row work.

Test ID/query identity, ready/error/not-found mapping, retry, permission-visible actions, safe trace presentation, and navigation actually changed by the task. Browser evidence names the exact detail state and action exercised.
