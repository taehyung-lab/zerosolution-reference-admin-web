# TanStack Router contract

Read this file for route creation, params/search validation, auth or permission entry guards, loader dependencies, preload, or route-level error/not-found behavior.

## Thin route

A route owns validation, entry guards, loader orchestration, and one feature screen or explicit screen composition. It contains no columns, form state, mutation, toast, payload mapping, or domain workflow. Root router context exposes the QueryClient, typed current UI locale, and only confirmed auth readiness/facts; it never exposes the mutable i18n instance. Root owns error and not-found boundaries.

For cross-feature dialogs, the source feature owns the action intent, selected target IDs, recipient projection, and open/close lifecycle; the destination feature owns its form and validation. The route may invoke the source feature's focused hook and connect its public values/callbacks to the destination UI. It does not duplicate that state with route-local `useState`, query fixtures to resolve recipients, or implement eligibility/policy decisions. Mounting two features together permits wiring, not workflow ownership. Do not evade this boundary by making either feature import the other's UI or adding an app-level domain controller.

## Route file layout

Route files mirror the URL. A single leaf stays a flat file (`managers/new.tsx`). A param or static segment with more than one leaf becomes a directory: `managers/$managerId/index.tsx` (detail) and `managers/$managerId/edit.tsx` (edit). A directory alone creates no route, so these leaves are siblings under `managers`; add `$managerId/route.tsx` only when the screens actually share chrome (header, tabs) and must render through an `<Outlet />`. Do not use the flat non-nesting escape (`$managerId_.edit.tsx`): it needs a comment to explain and hides the layout decision. Co-located tests match `routeFileIgnorePattern` and are not routes.

## Search and navigation

Use a feature-owned Zod 4 schema directly as TanStack Router's Standard Schema validator; do not add `@tanstack/zod-adapter` while its peer contract is Zod 3. Invalid optional search fields recover to declared defaults with schema fallback, while missing resource params/not-found remain explicit failures. A loader that reads search declares `loaderDeps` from validated search.

Committed filter, sort, page, page size, and shareable tab state live in route search. List lifecycle, draft commit and page-reset rules are owned by [list-workflow.md](list-workflow.md); field declarations and sparse/resolved defaults by [list-search-contract.md](list-search-contract.md). This file owns only their Router integration.

## Loader and preload

A loader is optional. Use it only for redirect, data-dependent entry permission, not-found, named first-paint readiness, or intentional preload-on-intent cache warming. The route and screen call the same exported query options.

Trigger and waiting are separate decisions. Use the current QueryClient `query` API: await `queryClient.query(options)` only for data that must be ready before entry, and start independent auxiliary warming with `void queryClient.query(options).catch(...)`. Do not introduce `ensureQueryData`, `prefetchQuery`, `fetchQuery`, or `fetchInfiniteQuery`: TanStack Query 5.102 marks them `@deprecated` in favour of `queryClient.query`/`infiniteQuery` (verified in the installed `query-core` types), and `@typescript-eslint/no-deprecated` fails the build on any deprecated library API. Configure `defaultPreload: 'intent'` only when desired and set `defaultPreloadStaleTime: 0` so Router does not become a second server-cache freshness owner above TanStack Query.

Independent prerequisites may use `Promise.all`. Do not create a second loader-only query definition or fetch generated operations directly.

Every route whose screen renders selects backed by option queries (list filters, create/edit forms) warms those options in its loader with `void queryClient.query(options).catch(() => undefined)`. With `defaultPreload: 'intent'` this runs on link hover, so the field is usually ready before it mounts; if not, the field's inline state covers it and the app-wide overlay stays closed because the option query declares `meta.progress: 'inline'`.

Loaders read `context.locale`; components read `useLocale().locale`. The app-level Router provider projects locale changes into the existing Router context and never recreates the Router.

## Guards

`beforeLoad` handles session or permission facts already present in router context and applies redirect policy. When entry permission must be fetched, the loader awaits the shared permission query options; `beforeLoad` does not start a second query path. If a reusable guard option is spread into a route, a route-local `beforeLoad` must compose it explicitly instead of overwriting it. Product permission codes and redirect policy are never inferred.
