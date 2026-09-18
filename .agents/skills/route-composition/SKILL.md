---
name: route-composition
description: >
  Use when the request touches routing itself — route 파일·URL segment·params/search 검증·진입 guard·loader·preload·not-found, 여러 feature 를 한 route 에 조립, 화면이 앱에서 도달 가능한가. route, URL, guard, loader, preload, navigation entry, not found.
  Do not use for 화면 안의 상태와 동작 (list-contract·detail-contract·form-contract), 폴더·파일 이름과 import 경계 (source-structure), 토큰 저장과 재발급 자체 (auth-session).
---

# 역할 계약 — route 조립

**답하는 질문**: URL 검증·guard·loader·navigation 과 여러 feature 의 조립을 route 가 어디까지 하는가.

**담지 않는 것**: 화면 안의 상태 — 역할 계약이다. segment 이름과 파일 모양 — `source-structure.md` 다.

Read this file for route creation, params/search validation, auth or permission entry guards, loader dependencies, preload, or route-level error/not-found behavior.

## Thin route

A route owns validation, entry guards, loader orchestration, and one feature screen or explicit screen composition. It contains no columns, form state, mutation, toast, payload mapping, or domain workflow. Root router context exposes the QueryClient, typed current UI locale, and only confirmed auth readiness/facts; it never exposes the mutable i18n instance. Root owns error and not-found boundaries.

For cross-feature dialogs, the source feature owns the action intent, selected target IDs, recipient projection, and open/close lifecycle; the destination feature owns its form and validation. The route may invoke the source feature's focused hook and connect its public values/callbacks to the destination UI. It does not duplicate that state with route-local `useState`, query fixtures to resolve recipients, or implement eligibility/policy decisions. Mounting two features together permits wiring, not workflow ownership. Do not evade this boundary by making either feature import the other's UI or adding an app-level domain controller.

## 도달 가능한 진입점

화면을 만드는 요청의 기본 범위는 **그 화면과 그것을 실제로 여는 최소 연결**이다. 앱에서 도달 가능한
실제 route 나, 기존 host 에서 그 화면을 여는 조립 중 하나가 있어야 한다. 둘 다 없으면 요청을
수행하는 최소 route 나 host 를 **같은 작업에서 만든다.** 사용자가 component 나 한 surface 만
요청한 경우에만 진입점 연결을 범위에서 뺀다.

화면 파일을 직접 render 한 테스트는 연결이 아니다. 빈 route·stub 도 아니다 — 그것들은 "열린다"를
증명하지 않는다.

## Route file layout

Route files mirror the URL. A single leaf stays a flat file (`<domain>/new.tsx`). A param or static segment with more than one leaf becomes a directory: `<domain>/$<id>/index.tsx` (detail) and `<domain>/$<id>/edit.tsx` (edit). A directory alone creates no route, so these leaves are siblings under `<domain>`; add `$<id>/route.tsx` only when the screens actually share chrome (header, tabs) and must render through an `<Outlet />`. Do not use the flat non-nesting escape (`$<id>_.edit.tsx`): it needs a comment to explain and hides the layout decision. Co-located tests match `routeFileIgnorePattern` and are not routes.

Segment names are the product's external URL contract and need not match the screen folder name ([folder structure](../source-structure/SKILL.md)). A resource collection defaults to the plural noun. A state, workflow, or fixed view takes the name the product's IA gives it, which is often not a plural. A URL the product has already fixed wins over both defaults.

## Search and navigation

Use a feature-owned Zod 4 schema directly as TanStack Router's Standard Schema validator; do not add `@tanstack/zod-adapter` while its peer contract is Zod 3. Invalid optional search fields recover to declared defaults with schema fallback, while missing resource params/not-found remain explicit failures. A loader that reads search declares `loaderDeps` from validated search.

Committed filter, sort, page, page size, and shareable tab state live in route search. Field declarations, resolution, canonical form, and transitions are owned by [list.md](../list-contract/SKILL.md#url). This file owns only their Router integration.

## Loader and preload

A list route's loader is optional (option warming only). A detail or edit route's loader is required: it awaits the record (below). Other legitimate uses are redirect, data-dependent entry permission, and named first-paint readiness. The route and screen call the same exported query options.

Trigger and waiting are separate decisions. Use the current QueryClient `query` API: await `queryClient.query(options)` only for data that must be ready before entry, and start independent auxiliary warming with `void queryClient.query(options).catch(...)`. Do not introduce `ensureQueryData`, `prefetchQuery`, `fetchQuery`, or `fetchInfiniteQuery`: TanStack Query 5.102 marks them `@deprecated` in favour of `queryClient.query`/`infiniteQuery` (verified in the installed `query-core` types), and `@typescript-eslint/no-deprecated` fails the build on any deprecated library API. Configure `defaultPreload: 'intent'` only when desired and set `defaultPreloadStaleTime: 0` so Router does not become a second server-cache freshness owner above TanStack Query.

Independent prerequisites may use `Promise.all`. Do not create a second loader-only query definition or fetch generated operations directly.

A detail or edit route awaits its record: `loader: ({ context, params, preload }) => loadRequired(context.queryClient, xDetailQueryOptions(context.locale, params.id), { preload })` (`src/app/router/required-loader.ts`). `loadRequired` turns a `not-found` ApiError into Router `notFound({ data: { kind: 'record' } })`, so a missing ID renders the not-found page with the record sentence — inside the shell, because `_app` declares `notFoundComponent`/`errorComponent` around the same components the root declares shell-less. A 403 belongs to `IncidentBoundary` alone: the loader republishes the incident with `origin: 'route-loader'` (never on preload), the boundary shows the access cover, and the error component renders nothing underneath ([catalog Feedback](../shared-ui/references/catalog.md#feedback)). Any other failure renders the unexpected-error page. The screen keeps `useDetailQuery` + `DetailStateBoundary` for transitions after entry only (refetch failure, a record deleted meanwhile), so detail queries do not declare `blockingProgress`; the awaited query has no observer while the loader runs, and the router's `defaultPendingComponent` (`RoutePending`) is the wait surface after the router's default pending delay. `contracts:check` fails a `$param` route leaf under `src/routes/_app` without a loader.

Option queries declare `meta.progress: 'inline'` and their field renders its own loading/error/retry state, so a route works without warming them. A route may still warm them with `void queryClient.query(options).catch(() => undefined)`; with `defaultPreload: 'intent'` this runs on link hover. Warming is optional; the field state is the contract.

Loaders read `context.locale`; components read `useLocale().locale`. The app-level Router provider projects locale changes into the existing Router context and never recreates the Router.

## 형태

목록 route 본문의 요소는 셋이다: `validateSearch: {entity}ListSearch.schema`, `beforeLoad: canonicalSearchGuard({entity}ListSearch.canonical)`, 그리고 `component` 가 `<{Entity}ListScreen search={Route.useSearch()} onSearchChange={(next) => void navigate({ search: () => next })} onActivate={(id) => void navigate({ to: …, params })} onCreate={() => void navigate({ to: … })} />` 를 mount 한다. URL 변형은 같은 화면에 `definition` 을 넘긴다. 다른 feature 의 다이얼로그를 함께 조립하는 것은 위 [Thin route](#thin-route) 가 허용하는 배선이다.
**목록 자체의 query 는 진입 즉시 조회 화면이어도 loader 에서 await 하지 않는다** — 진입 progress 는 `useListQuery` 가, 이후 전이는 `contentProgress` 가 소유하며 `loaderDeps` 로 검색을 loader 에 묶으면 정렬·페이지마다 loader 가 다시 돈다. 해소(`resolve`)는 route 가 아니라 화면이 한다. 검색 정책(즉시 조회인가 검색 뒤 조회인가)은 제품 원장에서 읽고 [list URL](../list-contract/SKILL.md#url) 의 두 선언 함수 중 하나로 표현한다.

상세·수정 route 본문의 요소는 둘이다: `loader: ({ context, params, preload }) => loadRequired(context.queryClient, {entity}DetailQueryOptions(context.locale, params.id), { preload })` 와 화면을 mount 하는 `component`(`key={id}` 로 ID 가 바뀌면 새 수명). 없는 ID·그 외 실패는 app error boundary 가 셸 안에서 상태 페이지를 그리고, 403 은 접근 제한 표면, 401 은 인증 진입 이동 하나가 소유한다(`{ preload }` 를 빼면 hover 예열마다 제한 표면이 뜬다). 화면의 `DetailStateBoundary` 는 진입 이후 전이만 담당한다.

등록 route 는 loader 가 없고 `<{Entity}CreateScreen onSaved={goToList} onCancel={goToList} />` 를 mount 한다. 수정 route 는 상세와 같은 loader 에 `<{Entity}EditScreen id={id} onSaved={goToDetail} onCancel={goToDetail} />` 다. 목적지가 다른 제품은 원장을 따른다.

## Guards

`beforeLoad` handles session or permission facts already present in router context and applies redirect policy. When entry permission must be fetched, the loader awaits the shared permission query options; `beforeLoad` does not start a second query path. If a reusable guard option is spread into a route, a route-local `beforeLoad` must compose it explicitly instead of overwriting it. Product permission codes and redirect policy are never inferred.
