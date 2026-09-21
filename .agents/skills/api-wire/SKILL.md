---
name: api-wire
description: >
  요청 헤더·응답 봉투·business error·OpenAPI snapshot·생성 클라이언트처럼 wire 형태를 바꾸거나 서버와 스키마가 어긋날 때 사용한다. 조회·저장 시점과 cache는 server-state, 자격증명 생명주기는 auth-session으로 보낸다.
---

# 계약 — API wire

**답하는 질문**: 요청과 응답이 실제로 어떤 모양으로 오가고, 실패가 어떤 어휘로 분류되며, 그 실패가
어디에 표시되는가.

**담지 않는 것**: 무엇을 언제 조회·저장하는가 — `.agents/skills/server-state/SKILL.md` 다.
어떤 문구를 보여 주는가 — 그 화면의 fact 와 `.agents/skills/shared-ui/SKILL.md` 다.


## Transport boundary

One project transport boundary owns base URL, cancellation, confirmed credentials and headers, request tracing, and
normalized errors. Its library and adapter API are current-code choices. It never navigates or renders UI. Custom headers
require an explicit backend contract; do not copy them from another project.

## Envelope and errors

If the declared response is `{ header: { resultCode, resultMessage }, data }`, HTTP 200 is not sufficient for success. One boundary checks the documented success codes, unwraps successful `data`, and converts every failure before it reaches Query or UI.

When a boundary unwraps a declared payload wrapper, its static return type must describe the same unwrapped value. Exact
type helpers and generator adapters belong to current code; casts do not prove agreement.

Canonicalize supported failure `data` shapes into one field-error array. Keep server `message` for redacted developer logs only; UI copy is chosen from confirmed `code` or `validCode` through i18n.

Normalize only failure meanings confirmed by the target wire contract. Consumers receive a stable semantic kind plus
available status, declared business code, request identifier, and canonical field errors; the exact kind union and field
names are current code/type API, not a portable list. Unconfirmed application codes remain an unclassified business
failure rather than being guessed into auth, validation, or not-found.

Kind does not choose a UI location. The operation context owns the result: cancelled work the user left has no surface; recoverable feature operations render in place; terminal auth/access is an app incident; render, route-loader, unhandled fatal, and route not-found belong to root. A recoverable `contract` failure stays in place, while a render/loader contract failure belongs to root.

One executable policy maps operation context and semantic failure to no surface, feature surface, app incident, or root
surface. Feature consumers reuse it instead of repeating kind comparisons. Exact function names remain in code/types;
the UI-side placement is [공용 UI 의 Feedback](../shared-ui/references/catalog.md#feedback).

Never expose `resultMessage`, another raw server message, or a stack in UI. Safe translated copy and a recovery action are mandatory. `requestId` is the visible inquiry code; a details disclosure may additionally show request ID, status, and kind.

Do not copy `X-Client-Path`, `X-Menu-Id`, `X-Write-Consistency`, a guessed replication-delay window, or SSE recovery coupling without a new backend contract. No reverse import from transport to app exists.

Auth/reissue rules are owned by `.agents/skills/auth-session/SKILL.md`. Locale-sensitive transport and cache identity are owned by `.agents/skills/server-state/SKILL.md`.

## Schema source and generated output

When the target uses generated clients, one reviewable schema source and a reproducible offline generation step own the
wire types. A clean checkout validates that source, regenerates, and typechecks a real generated import before project
code. Network drift checks stay outside the local build. Exact generator, paths, commands, and committed/generated policy
belong to `README.md`, `package.json`, and executable configuration.

Generate wire models and endpoint functions only. Query keys, cache policy, UI schemas, and domain models remain
project-owned unless the target explicitly adopts another boundary.

## 계약 검증

Read this file only for runtime response validation or a reproduced server/OpenAPI mismatch.

Generated TypeScript is not runtime validation, but duplicating the whole OpenAPI contract in Zod creates a second schema. Add runtime validation only at an identified high-risk boundary such as session restoration, authorization facts, destructive operations, persisted external data, or a reproduced mismatch.

For a mismatch, collect redacted evidence and stop. Distinguish `required` from `nullable`; changing one does not imply the other. `as`, non-null assertions, and fallback values do not validate a response or make it conformant.

The backend updates implementation and Swagger together. A frontend compatibility adapter is exceptional and requires approval from the responsible product/API owner. Record the upstream issue, accepted shapes, telemetry, tests, owner, and removal condition in an ADR.

## Executable seam checks

Runtime registration seams and handwritten request paths need positive and negative executable checks when the target uses
them. Their naming convention, scan limits, and removal condition belong to the checker source and
`scripts/contracts/README.md`, not this portable contract. Request body conformance remains with the focused operation test.

## Boundaries

- Routes and UI do not import the transport library or generated wire operations directly.
- One transport boundary owns credentials, locale/header projection, cancellation, tracing, and error normalization.
- Feature API boundaries own server-state declarations and cache consequences; screens own navigation and acknowledgement.
- File creation, relocation and API input type placement follow [`source-structure.md`](../source-structure/SKILL.md).
- Generated output is never hand-edited; whether it is committed is target tooling policy.

If runtime behavior contradicts the snapshot, stop and report the endpoint, request/response evidence, and blocked work. Do not hide divergence with casts, optional fields, fallback values, or silent response reshaping. A temporary adapter requires explicit approval, an ADR, tests, and a removal condition.

## Common mistakes

- Treating generated cache/UI hooks as the project API without an explicit target decision
- Fetching the remote specification during install or build
- Rewriting every generated response type as a Zod schema
- Invalidating broad cache roots when an exact consequence is known

## 이 계약의 검증 대상

| 축 | 무엇을 확인하나 |
| --- | --- |
| wire | 실제 요청 URL·method·headers·payload 와 응답 본문 |
| 응답 | target이 선언한 성공 판정과 런타임·정적 결과가 맞는가. payload wrapper가 있을 때만 해제 결과까지 확인 |
| 실패 | 확인된 semantic failure가 operation context에 맞는 표면에 표시되는가 |
| 로그 | 원문 server message·stack·비밀 값이 UI 와 로그에 없는가 |

브라우저 증거는 **어떤 요청이 나갔고 무엇이 돌아왔는지**를 적는다. 요청 함수 로그 한 줄은 그 호출
하나만 증명한다.
