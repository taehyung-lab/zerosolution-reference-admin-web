# Detail workflow

Read this file for an ID-backed detail screen, detail state, sections, actions, or entry to edit.

## Detail ownership

- The feature owns the ID query definition, DTO mapping, sections, copy, permissions, actions, and navigation. The `queryOptions` factory and an ID/locale-only execution hook stay in `features/{domain}/api/` (`usePerformanceDetail`, `useMemberDetail`). A hook that combines URL, form or business policy belongs in the consuming workflow model. Screens consume the hook, not `useQuery` directly. Placement follows [folder-structure-contract](../../folder-structure-contract/SKILL.md); API-only hooks are allowed by ADR 0011.
- Use an ID-based query key. A partial list row is not authoritative detail data.
- Sections remain feature-local. Every collection inside the detail (history, child records, paged child lists) is classified by [table-composition.md](table-composition.md); a detail DTO array is kind A and a paged child list is kind C, not this file's ID query.
- Product permission, missing-resource meaning, and post-action navigation come from confirmed contracts, not Figma or rehearsal data.
- The product's detail screens share one archetype (inventory 2026-09-02: 회원·발권·소명·운영자 조회): header actions, collapsible sections of read-only fields, child collections, an update-history table, and a bottom action row whose set depends on the record status. Compose it per feature from `PageHeader.actions`, `SectionCard`, `DetailField`, and the collection kinds; do not build a `DetailPage`/`ResourceDetail` shell or a status-to-action catalog in shared.
- An editable section inside a detail (회원상담, 소명 처리 결과, 공연 입장안내정보) is one form of its own: it follows [form-workflow.md](form-workflow.md) with its own TanStack Form instance, save flow, and dirty state, and invalidates the detail query on success. When the record status makes the section read-only (소명 통보 완료), render the read-only surface from the authoritative status instead of disabling the form.

## Detail state

A detail or edit-load screen composes `DetailStateBoundary` for `ready | error | notFound` with `PageHeader` outside. The state decision is not written in the screen: the feature hook returns `useDetailQuery(options)` from `src/api/required-query.ts`, whose pure `resolveRequiredQueryOutcome` fixes the priority `incident → not-found → usable data → pending → local error → settled-without-data` ([ADR 0011](../../../../docs/decisions/0011-detail-data-and-update-history-boundaries.md)). The feature supplies safe copy, retry, trace, and content.

- Entry is the route's: the detail/edit route awaits the same query options in `loader` through `loadRequired` ([router.md](router.md#loader-and-preload)), so a missing record renders the `_app` not-found page, a 403/401 goes to `IncidentBoundary` (cover / login), any other entry failure renders the `_app` error page, and the screen never mounts. `DetailStateBoundary` therefore handles only what happens after entry — a refetch that fails, a record deleted meanwhile (2026-09-11 user decision).
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

## 형태

파일 집합만 적는다. 각 역할의 규칙은 위 절들이 소유한다. 행의 「있을 때」는 그 책임이 화면에 있을 때만
파일을 만든다는 뜻이다. 없는 섹션·액션·이력을 빈 파일로 두지 않는다.

| 파일 | 담는 것 |
| --- | --- |
| `<domain>/api/*queries.ts` 의 상세 options | route loader 가 기다리므로 `meta.progress` 를 선언하지 않는다(대기 표면은 `RoutePending`). 목록 options 와 다르다. 현재 이탈: 리허설 운영자 `managerDetailQuery`·`managerEditDetailQuery`(`managers/api/queries.ts`)는 loader 없는 리허설 화면이 쓰므로 `blockingProgress` 를 유지한다 |
| `<domain>/api/use*Detail.ts` | 위 [Detail ownership](#detail-ownership) 의 options + 실행 훅. `locale` 은 `UiLocale` |
| `src/routes/_app/<path>/$<id>/index.tsx`(·`edit.tsx`) | `loader: ({ context, params, preload }) => loadRequired(...)` + 화면 mount([router 형태](router.md#형태)). 검사기가 loader 유무를 본다 |
| `model/*-requests.ts` | 액션의 요청 경계(액션이 있을 때) |
| `model/*-actions.ts` | 액션 가시성·확인·후속 정책(있을 때) |
| `model/*-history.ts` | 위 표의 이력 mapper(이력이 있을 때) |
| `ui/*DetailScreen.tsx` | 헤더·상태 경계·섹션 조립. 오류 문구는 `safeErrorKey(detail.error?.kind)`(`src/api/error-copy.ts`) 로 종류별 shared 문장 |
| `ui/*Section.tsx` | 섹션 단위로 정한다: 자기 query·폼·액션을 가진 섹션은 파일로(공연 상세, 소명 처리 폼). 읽기 전용 표시 섹션은 Screen 안 인라인이 기본이고(회원·운영자·게시판 상세), 읽기 전용 섹션이 셋 이상이라 Screen 이 길어지면 파일로 묶어도 된다(소명 상세 `AppealDetailSections.tsx`). 2026-09-11 판정 |
| `ui/*ActionForm.tsx`·`*ActionDialog.tsx` | 액션 입력(있을 때) |

## Actions and verification

The feature owns edit/back/delete visibility, confirmation, mutation outcome, cache consequence, and destination. Read [form-workflow.md](form-workflow.md) only when entering or changing a form, [mutation-actions.md](mutation-actions.md) when an action mutates or confirms, and [bulk-actions.md](bulk-actions.md) only for multi-row work.

Test ID/query identity, ready/error/not-found mapping, retry, permission-visible actions, safe trace presentation, and navigation actually changed by the task. Browser evidence names the exact detail state and action exercised.
