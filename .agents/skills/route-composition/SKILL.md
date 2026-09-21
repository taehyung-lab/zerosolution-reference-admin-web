---
name: route-composition
description: >
  route 파일·URL segment·params/search 검증·진입 guard·loader·preload·not-found·navigation 진입점을 바꿀 때 사용한다. 화면 내부 동작은 해당 역할 계약, 파일 배치는 source-structure로 보낸다.
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

Use one feature-owned schema as the Router validator. The installed Router/schema types and executable tests decide the
compatible adapter API; this contract does not pin a library major. Invalid optional search fields recover to declared
defaults, while missing resource params/not-found remain explicit failures. A loader that reads search declares
dependencies from validated search.

Committed filter, sort, page, page size, and shareable tab state live in route search. Field declarations, resolution, canonical form, and transitions are owned by [list.md](../list-contract/SKILL.md#url). This file owns only their Router integration.

## Loader and preload

A list route's loader is optional (option warming only). A detail or edit route's loader is required: it awaits the record (below). Other legitimate uses are redirect, data-dependent entry permission, and named first-paint readiness. The route and screen call the same exported query options.

Trigger and waiting are separate decisions. Await only data that must be ready before entry and start independent
auxiliary warming without turning it into an entry failure. Use the installed QueryClient's supported API; types and lint
own deprecation, not this portable contract. Router preload must not become a second cache-freshness owner above the
server-state library.

Independent prerequisites may use `Promise.all`. Do not create a second loader-only query definition or fetch generated operations directly.

A detail or edit entry waits for the record when the screen cannot render meaningfully without it. Missing records become
the Router's not-found result; confirmed auth/access failures go to the app incident boundary; other entry failures use
the route error boundary. Preload must not show an incident. After entry, the screen owns refetch and meanwhile-deleted
transitions. Exact loader helpers, meta fields, shell files, and component names belong to current code and tests.

Auxiliary option data renders its own loading/error/retry state, so a route works without warming it. Warming is optional,
non-blocking, and never replaces that field state; its exact Query/Router call belongs to the installed API and current code.

Loaders and components read the same app-boundary locale fact. Locale changes update Router context without creating a
second locale owner; the exact provider API belongs to current code.

## 형태

목록 route 본문의 요소는 셋이다: `validateSearch: {entity}ListSearch.schema`, `beforeLoad: canonicalSearchGuard({entity}ListSearch.canonical)`, 그리고 `component` 가 `<{Entity}ListScreen search={Route.useSearch()} onSearchChange={(next) => void navigate({ search: () => next })} onActivate={(id) => void navigate({ to: …, params })} onCreate={() => void navigate({ to: … })} />` 를 mount 한다. URL 변형은 같은 화면에 `definition` 을 넘긴다. 다른 feature 의 다이얼로그를 함께 조립하는 것은 위 [Thin route](#thin-route) 가 허용하는 배선이다.
**목록 자체의 query 는 진입 즉시 조회 화면이어도 loader 에서 await 하지 않는다** — 진입 progress 는 `useListQuery` 가, 이후 전이는 `contentProgress` 가 소유하며 `loaderDeps` 로 검색을 loader 에 묶으면 정렬·페이지마다 loader 가 다시 돈다. 해소(`resolve`)는 route 가 아니라 화면이 한다. 검색 정책(즉시 조회인가 검색 뒤 조회인가)은 제품 원장에서 읽고 [list URL](../list-contract/SKILL.md#url) 의 두 선언 함수 중 하나로 표현한다.

상세·수정 route 본문의 요소는 둘이다: `loader: ({ context, params, preload }) => loadRequired(context.queryClient, {entity}DetailQueryOptions(context.locale, params.id), { preload })` 와 화면을 mount 하는 `component`(`key={id}` 로 ID 가 바뀌면 새 수명). 없는 ID·그 외 실패는 app error boundary 가 셸 안에서 상태 페이지를 그리고, 403 은 접근 제한 표면, 401 은 인증 진입 이동 하나가 소유한다(`{ preload }` 를 빼면 hover 예열마다 제한 표면이 뜬다). 화면의 `DetailStateBoundary` 는 진입 이후 전이만 담당한다.

등록 route 는 loader 가 없고 `<{Entity}CreateScreen onSaved={goToList} onCancel={goToList} />` 를 mount 한다. 수정 route 는 상세와 같은 loader 에 `<{Entity}EditScreen id={id} onSaved={goToDetail} onCancel={goToDetail} />` 다. 목적지가 다른 제품은 원장을 따른다.

## Guards

`beforeLoad` handles session or permission facts already present in router context and applies redirect policy. When entry permission must be fetched, the loader awaits the shared permission query options; `beforeLoad` does not start a second query path. If a reusable guard option is spread into a route, a route-local `beforeLoad` must compose it explicitly instead of overwriting it. Product permission codes and redirect policy are never inferred.
