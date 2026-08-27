# TanStack Router contract

Read this file for route creation, params/search validation, auth or permission entry guards, loader dependencies, preload, or route-level error/not-found behavior.

## Thin route

A route owns validation, entry guards, loader orchestration, and one feature screen or explicit screen composition. It contains no columns, form state, mutation, toast, payload mapping, or domain workflow. Root router context exposes the QueryClient and only confirmed auth readiness/facts; root owns error and not-found boundaries.

## Search and navigation

Use a feature-owned Zod 4 schema directly as TanStack Router's Standard Schema validator; do not add `@tanstack/zod-adapter` while its peer contract is Zod 3. Invalid optional search fields recover to declared defaults with schema fallback, while missing resource params/not-found remain explicit failures. A loader that reads search declares `loaderDeps` from validated search.

Committed filter, sort, page, page size, and shareable tab state live in route search. Local draft exists only until Apply, Enter, or the declared debounce commits it. Filter identity changes reset page according to the schema.

## Loader and preload

A loader is optional. Use it only for redirect, data-dependent entry permission, not-found, named first-paint readiness, or intentional preload-on-intent cache warming. The route and screen call the same exported query options.

Trigger and waiting are separate decisions. Inside the same loader, `await ensureQueryData` only for data that must be ready before entry; start independent auxiliary warming with non-awaited `prefetchQuery`. Configure `defaultPreload: 'intent'` only when desired and set `defaultPreloadStaleTime: 0` so Router does not become a second server-cache freshness owner above TanStack Query.

Independent prerequisites may use `Promise.all`. Do not create a second loader-only query definition or fetch generated operations directly.

## Guards

`beforeLoad` handles session or permission facts already present in router context and applies redirect policy. When entry permission must be fetched, the loader awaits the shared permission query options; `beforeLoad` does not start a second query path. If a reusable guard option is spread into a route, a route-local `beforeLoad` must compose it explicitly instead of overwriting it. Product permission codes and redirect policy are never inferred.
