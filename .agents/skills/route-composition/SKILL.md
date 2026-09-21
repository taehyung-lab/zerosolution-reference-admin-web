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

Route files preserve the product URL hierarchy and make shared layout explicit. Exact file naming, nesting syntax,
layout component, and test-ignore convention belong to the installed Router and [source-structure](../source-structure/SKILL.md).

Segment names are the product's external URL contract and need not match the screen folder name ([folder structure](../source-structure/SKILL.md)). A resource collection defaults to the plural noun. A state, workflow, or fixed view takes the name the product's IA gives it, which is often not a plural. A URL the product has already fixed wins over both defaults.

## Search and navigation

Use one feature-owned schema as the Router validator. The installed Router/schema types and executable tests decide the
compatible adapter API; this contract does not pin a library major. Invalid optional search fields recover to declared
defaults, while missing resource params/not-found remain explicit failures. A loader that reads search declares
dependencies from validated search.

Committed filter, sort, page, page size, and shareable tab state live in route search. Field declarations, resolution, canonical form, and transitions are owned by [list.md](../list-contract/SKILL.md#url). This file owns only their Router integration.

## Loader and preload

A loader waits only for data or permission that must exist before entry. Lists, details, edits, redirects and named
first-paint requirements choose that boundary from their confirmed role/fact; route and screen reuse one server-state declaration.

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

Route는 검증된 params/search, 진입 guard, 필요한 loader, 화면 mount와 navigation callback만 조립한다.
목록 query를 진입 전에 기다릴지, 상세 record를 기다릴지, 등록·수정의 목적지는 확인된 역할 계약과 fact가
정한다. exact helper·prop·component·route file shape는 Router 타입과 현재 코드 테스트가 소유한다.

## Guards

The entry guard consumes session or permission facts already available at the boundary. A permission that must be fetched
uses the shared server-state declaration rather than a second query path. Exact guard/loader APIs belong to the installed
Router. Product permission codes and redirect policy are never inferred.
