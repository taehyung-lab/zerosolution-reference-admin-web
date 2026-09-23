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

## 도달 가능한 진입점과 나가는 전이

화면을 만드는 요청의 기본 범위는 **그 화면, 그것을 실제로 여는 최소 연결, 그리고 같은 resource
feature 안에서 도달하는 화면·dialog**다. 현재 checkout 의 fact·원장·시나리오에서 목록·조회·등록·수정이
한 record lifecycle 로 확인되면 목록 하나를 이름으로 요청해도 그 lifecycle 전체가 범위다. 같은 상위
도메인에 있다는 이유만으로 다른 resource 나 독립 workflow 까지 넓히지는 않는다. 사용자가 component 나
한 surface 만 요청한 경우에만 연결과 나머지 lifecycle 을 범위에서 뺀다.

범위는 외부 원문을 다시 열기 **전에** 현재 checkout 의 관찰 snapshot 으로 확정한다. 원문 재관찰은
그 snapshot 의 신선도와 화면별 제품 값을 확인하는 단계이지 범위를 고르는 단계가 아니다. 재관찰에서
새 전이나 폐기된 전이가 확인되면 근거와 함께 범위를 갱신한다.

**들어오는 쪽.** 앱에서 도달 가능한 실제 route 나, 기존 host 에서 그 화면을 여는 조립 중 하나가
있어야 한다. 둘 다 없으면 요청을 수행하는 최소 route 나 host 를 **같은 작업에서 만든다.**

**나가는 쪽.** 원문이 확정한 전이 — 행 클릭, 등록, 저장 후 이동 — 의 목적지가 저장소에 없으면
**같은 작업에서 만든다.** 목적지가 없다는 사실 자체는 범위를 되묻는 사유가 아니다.

나가는 폐쇄는 **같은 feature 안에서 끝난다.** `같은 feature 는 한 요청, 한 소유자`
([boundaries](../source-structure/SKILL.md#boundaries))이므로 그 feature 의 도달 가능한 전이를 닫고,
다른 feature 로 나가는 전이는 범위 밖이다. 깊이로 세지 않는다 — 한 단계에서 끊으면 경계 화면마다
목적지 없는 전이가 남고, 그것은 아래의 stub 금지와 어긋난다.

근거 부족·원문 접근 실패는 이미 확정한 범위를 줄이지 않는다. 화면별로 `구현됨 / 범위 내 보류 /
해당 없음`을 나누고, 보류에는 부족한 근거·영향·재개 조건을 남긴다. lifecycle 구성원이 전부 구현됐거나
제품 근거로 해당 없음이 확인되기 전에는 feature 완료라고 하지 않는다. 범위 밖 전이와 범위 내 보류
전이는 목적지를 이름으로 적어 요청 화면의 fact 가 기록한다.

화면 파일을 직접 render 한 테스트는 연결이 아니다. 빈 route·stub 도 아니다 — 그것들은 "열린다"를
증명하지 않으며 나가는 쪽에서도 목적지가 아니다.

목적지의 구성·정책은 그 목적지의 fact 로 확인하고 요청 화면이나 다른 도메인에서 복사하지 않는다
([근거 정책](../../../product/policies/evidence.md)). 목적지를 만들 의무가 그 목적지의 미확인 값을
추측할 권한이 되지는 않는다.

## Route file layout

Route files preserve the product URL hierarchy and make shared layout explicit. Exact file naming, nesting syntax,
layout component, and test-ignore convention belong to the installed Router and [source-structure](../source-structure/SKILL.md).

Segment names are the product's external URL contract and need not match the screen folder name ([folder structure](../source-structure/SKILL.md)). A resource collection defaults to the plural noun. A state, workflow, or fixed view takes the name the product's IA gives it, which is often not a plural. A URL the product has already fixed wins over both defaults.

## Search and navigation

Use one feature-owned schema as the Router validator. The installed Router/schema types and executable tests decide the
compatible adapter API; this contract does not pin a library major. Invalid optional search fields recover to declared
defaults, while missing resource params/not-found remain explicit failures. A loader that reads search declares
dependencies from validated search.

Committed filter, sort, page, page size, and shareable tab state live in route search. Field declarations, resolution, canonical form, and transitions are owned by [list-contract의 URL](../list-contract/SKILL.md#url). This file owns only their Router integration.

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
