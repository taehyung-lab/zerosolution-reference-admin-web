# TanStack Router contract

Read this file for route creation, params/search validation, auth or permission entry guards, loader dependencies, preload, or route-level error/not-found behavior.

## Thin route

A route owns validation, entry guards, loader orchestration, and one feature screen or explicit screen composition. It contains no columns, form state, mutation, toast, payload mapping, or domain workflow. Root router context exposes the QueryClient, typed current UI locale, and only confirmed auth readiness/facts; it never exposes the mutable i18n instance. Root owns error and not-found boundaries.

For cross-feature dialogs, the source feature owns the action intent, selected target IDs, recipient projection, and open/close lifecycle; the destination feature owns its form and validation. The route may invoke the source feature's focused hook and connect its public values/callbacks to the destination UI. It does not duplicate that state with route-local `useState`, query fixtures to resolve recipients, or implement eligibility/policy decisions. Mounting two features together permits wiring, not workflow ownership. Do not evade this boundary by making either feature import the other's UI or adding an app-level domain controller.

## Route file layout

Route files mirror the URL. A single leaf stays a flat file (`<domain>/new.tsx`). A param or static segment with more than one leaf becomes a directory: `<domain>/$<id>/index.tsx` (detail) and `<domain>/$<id>/edit.tsx` (edit). A directory alone creates no route, so these leaves are siblings under `<domain>`; add `$<id>/route.tsx` only when the screens actually share chrome (header, tabs) and must render through an `<Outlet />`. Do not use the flat non-nesting escape (`$<id>_.edit.tsx`): it needs a comment to explain and hides the layout decision. Co-located tests match `routeFileIgnorePattern` and are not routes.

## Search and navigation

Use a feature-owned Zod 4 schema directly as TanStack Router's Standard Schema validator; do not add `@tanstack/zod-adapter` while its peer contract is Zod 3. Invalid optional search fields recover to declared defaults with schema fallback, while missing resource params/not-found remain explicit failures. A loader that reads search declares `loaderDeps` from validated search.

Committed filter, sort, page, page size, and shareable tab state live in route search. List lifecycle, draft commit and page-reset rules are owned by [list-workflow.md](list-workflow.md); field declarations and sparse/resolved defaults by [list-search-contract.md](list-search-contract.md). This file owns only their Router integration.

## Loader and preload

A list route's loader is optional (option warming only). A detail or edit route's loader is required: it awaits the record (below). Other legitimate uses are redirect, data-dependent entry permission, and named first-paint readiness. The route and screen call the same exported query options.

Trigger and waiting are separate decisions. Use the current QueryClient `query` API: await `queryClient.query(options)` only for data that must be ready before entry, and start independent auxiliary warming with `void queryClient.query(options).catch(...)`. Do not introduce `ensureQueryData`, `prefetchQuery`, `fetchQuery`, or `fetchInfiniteQuery`: TanStack Query 5.102 marks them `@deprecated` in favour of `queryClient.query`/`infiniteQuery` (verified in the installed `query-core` types), and `@typescript-eslint/no-deprecated` fails the build on any deprecated library API. Configure `defaultPreload: 'intent'` only when desired and set `defaultPreloadStaleTime: 0` so Router does not become a second server-cache freshness owner above TanStack Query.

Independent prerequisites may use `Promise.all`. Do not create a second loader-only query definition or fetch generated operations directly.

A detail or edit route awaits its record: `loader: ({ context, params, preload }) => loadRequired(context.queryClient, xDetailQuery(context.locale, params.id), { preload })` (`src/app/router/required-loader.ts`, 2026-09-11 user decision). `loadRequired` turns a `not-found` ApiError into Router `notFound({ data: { kind: 'record' } })`, so a missing ID renders the not-found page with the record sentence — inside the shell, because `_app` declares `notFoundComponent`/`errorComponent` around the same components the root declares shell-less. A 403 belongs to `IncidentBoundary` alone: the loader republishes the incident with `origin: 'route-loader'` (never on preload), the boundary shows the access cover, and the error component renders nothing underneath ([incidents.md](../../shared-ui-contract/references/incidents.md)). Any other failure renders the unexpected-error page. The screen keeps `useDetailQuery` + `DetailStateBoundary` for transitions after entry only (refetch failure, a record deleted meanwhile), so detail queries no longer declare `blockingProgress`; the awaited query has no observer while the loader runs, and the router's `defaultPendingComponent` (`RoutePending`, tested, not yet observed against a Figma frame) is the wait surface after the router's default pending delay. `contracts:check` fails a `$param` route leaf under `src/routes/_app` without a loader.

Every route whose screen renders selects backed by option queries (list filters, create/edit forms) warms those options in its loader with `void queryClient.query(options).catch(() => undefined)`. With `defaultPreload: 'intent'` this runs on link hover, so the field is usually ready before it mounts; if not, the field's inline state covers it and the app-wide overlay stays closed because the option query declares `meta.progress: 'inline'`.

Loaders read `context.locale`; components read `useLocale().locale`. The app-level Router provider projects locale changes into the existing Router context and never recreates the Router.

## 형태

목록 route 본문의 요소는 넷이다: `validateSearch: <sparse schema>`, `beforeLoad: canonicalSearchGuard(<schema>)`, 선택지 query 가 있을 때만 위 [Loader and preload](#loader-and-preload) 의 예열, 그리고 `component` 가 `<XScreen search={Route.useSearch()} onSearchChange={(next) => void navigate({ search: () => next })} onActivate={...} />` 를 mount 한다. 다른 feature 의 다이얼로그를 함께 조립하는 것은 위 [Thin route](#thin-route) 가 허용하는 배선이다. 파일 배치는 [Route file layout](#route-file-layout) 이 정한다.
**목록 자체의 query 는 진입 즉시 조회 화면이어도 loader 에서 await 하지 않는다** — 진입 progress 는 `src/api/list-query.ts` 가, 이후 전이는 `contentProgress` 가 소유하며 `loaderDeps` 로 검색을 loader 에 묶으면 정렬·페이지마다 loader 가 다시 돈다. 해소(`resolve*Search`)는 route 가 아니라 화면이 한다.
**조회 진입 정책은 loader 유무나 표식 존재만으로 정하지 않는다.** 제품 근거로 정책을 선택하고 [list-workflow의 State and URL lifecycle](list-workflow.md#state-and-url-lifecycle)이 정한 확정 검색 상태로 Query와 결과를 함께 구동한다. 이 문서는 표식 의미를 재정의하지 않는다.

상세·수정 route 본문의 요소는 둘이다: `loader: ({ context, params, preload }) => loadRequired(context.queryClient, <domain>DetailQuery(context.locale, params.<id>), { preload })` 와 화면을 mount 하는 `component`(위 [Loader and preload](#loader-and-preload)). 없는 ID·그 외 실패는 app error boundary가 셸 안에서 상태 페이지를 그리고, 403은 접근 제한 표면, 401은 인증 진입 이동 하나가 소유한다(`{ preload }` 를 빼면 hover 예열마다 제한 표면이 뜬다). 화면의 `DetailStateBoundary` 는 진입 이후 전이만 담당한다. 검사기는 route의 `$param` 상세·수정 파일에서 `loader` 유무만 본다.

## Guards

`beforeLoad` handles session or permission facts already present in router context and applies redirect policy. When entry permission must be fetched, the loader awaits the shared permission query options; `beforeLoad` does not start a second query path. If a reusable guard option is spread into a route, a route-local `beforeLoad` must compose it explicitly instead of overwriting it. Product permission codes and redirect policy are never inferred.
