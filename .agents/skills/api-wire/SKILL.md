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

One project Axios instance owns base URL, cancellation, confirmed credentials, `Accept-Language`, request ID extraction, and normalized errors. It never navigates or renders toast/dialog UI. Replication delay, menu context, client path, and other custom headers require an explicit backend contract; do not copy them from another project.

## Envelope and errors

If the declared response is `{ header: { resultCode, resultMessage }, data }`, HTTP 200 is not sufficient for success. One boundary checks the documented success codes, unwraps successful `data`, and converts every failure before it reaches Query or UI.

When the generator types an endpoint with the envelope itself (`{ header?, data? }`), the mutator that unwraps `data` must also unwrap the static type: map the return type through `UnwrapEnvelope<T>` (`T extends { data?: infer D } ? Exclude<D, undefined> : T`) so callers receive `Promise<Data>`, never a cast or `any`. A test that reads a field of the unwrapped result directly guards the regression.

Canonicalize supported failure `data` shapes into one field-error array. Keep server `message` for redacted developer logs only; UI copy is chosen from confirmed `code` or `validCode` through i18n.

`ApiError.kind` is the closed 12-kind taxonomy: `network`, `timeout`, `cancelled`, `business`, `unauthorized`, `forbidden`, `validation`, `not-found`, `conflict`, `rate-limited`, `server-error`, and `contract`. Preserve status, business code, `x-request-id`, and canonical field errors when present. Business-code overrides occur in this boundary only; unconfirmed business codes stay `business`.

Kind does not choose a UI location. The operation context owns the result: cancelled work the user left has no surface; recoverable feature operations render in place; terminal auth/access is an app incident; render, route-loader, unhandled fatal, and route not-found belong to root. A recoverable `contract` failure stays in place, while a render/loader contract failure belongs to root.

The four outcomes `none | feature | incident | root` are decided only in `src/api/error-outcome.ts` (`resolveErrorOutcome(context, kind)`, `isFeatureError(error)`); the UI-side placement of each outcome is [공용 UI 의 Feedback](../shared-ui/references/catalog.md#feedback).
Feature consumers use its context-free feature predicate instead of repeating cancelled/unauthorized/forbidden
comparisons. Context remains only for real differences such as observerless prefetch, pre-auth failures that end no
session, and root failures.

Never expose `resultMessage`, another raw server message, or a stack in UI. Safe translated copy and a recovery action are mandatory. `requestId` is the visible inquiry code; a details disclosure may additionally show request ID, status, and kind.

Do not copy `X-Client-Path`, `X-Menu-Id`, `X-Write-Consistency`, a guessed replication-delay window, or SSE recovery coupling without a new backend contract. No reverse import from transport to app exists.

Auth/reissue rules are owned by `.agents/skills/auth-session/SKILL.md`(미작성 — 인증·재발급을 바꿀 때 쓴다). Locale-sensitive transport and cache identity are owned by `.agents/skills/server-state/SKILL.md`.

## OpenAPI snapshot

Read this file only when work touches the API snapshot, generator, generated output, or offline generation checks.

## Sources and generated output

```text
remote Admin OpenAPI
  -- explicit api:pull --> openapi/admin.snapshot.json (committed)
  -- api:generate -----> src/api/generated/** (gitignored)
                                |
                                v
                         features/*/api/**
```

- `openapi/admin.snapshot.json` is the reviewable declared contract.
- `orval.config.ts`, the lockfile, and the custom Axios mutator are committed.
- `api:generate` is offline and consumes only the snapshot.
- `api:check` validates the snapshot, reproduces offline generation, and typechecks a real generated import without contacting Swagger.
- `api:pull` is the only normal command that contacts Swagger. It must leave a reviewable snapshot diff.
- Generated output is gitignored, so `postinstall` runs offline `api:generate` after install and `api:check` reproduces it inside `verify`/CI. No `dev`, `typecheck`, or CI command may depend on Swagger availability.
- A scheduled or explicit remote-drift check may compare Swagger with the snapshot. It is evidence, not the build source.

A clean clone uses this invariant:

```text
api:generate
→ typecheck a real generated import
→ project typecheck
→ lint/test/build
```

`pnpm verify` and CI preserve this dependency order. Listing a generation check after project typecheck is invalid when generated output is gitignored.

Generate typed models and endpoint functions with Orval. Do not generate project-owned TanStack Query hooks, keys, invalidation policy, UI schemas, or domain models.

Runtime validation and mismatch handling are owned by [contract-validation.md](#계약-검증). Transport and envelope errors are owned by [transport.md](#transport-boundary).

## 계약 검증

Read this file only for runtime response validation or a reproduced server/OpenAPI mismatch.

Generated TypeScript is not runtime validation, but duplicating the whole OpenAPI contract in Zod creates a second schema. Add runtime validation only at an identified high-risk boundary such as session restoration, authorization facts, destructive operations, persisted external data, or a reproduced mismatch.

For a mismatch, collect redacted evidence and stop. Distinguish `required` from `nullable`; changing one does not imply the other. `as`, non-null assertions, and fallback values do not validate a response or make it conformant.

The backend updates implementation and Swagger together. A frontend compatibility adapter is exceptional and requires approval from the responsible product/API owner. Record the upstream issue, accepted shapes, telemetry, tests, owner, and removal condition in an ADR.

## Two mechanical checks `contracts:check` owns

Both target the same failure: types compile, tests pass, and the seam is dead only at runtime. Each was added after that failure actually happened, and each ships with a passing and a violating control in `contracts.test.mjs`.

- **Ports look registered.** Transport exposes `register*` seams so it never imports app code back, and a seam nobody fills in production is dead: `readReissuedAccessToken` returned `undefined` for every 401 while its tests registered a reader and passed. The check greps for `export function register…` under `src/api` and for `name(` in any non-test file outside it. That catches the seam nobody wired at all, which is the failure that happened. It does **not** prove registration: a mention inside a comment or an unreachable function satisfies it, an aliased or namespaced call does not, and it never follows the import graph to confirm the module runs. Read it as a tripwire, not a proof. Remove it when transport stops using registration seams.
- **Named request-path constants match the contract.** A `UPPER_SNAKE_PATH` constant holding a single-quoted literal must equal a declared path exactly; a `UPPER_SNAKE_PATHS` array is matched by substring (the pre-auth exemption), so each entry only has to appear inside a declared path. Keeping the two shapes apart is the whole point: `/auth/reissue` is a substring of `/api/v1/auth/reissue`, so one substring rule would pass a value that requests a 404. Its reach is exactly that naming convention. Inline literals, double quotes, template strings, assembled variables, and object properties are invisible to it, and it does not confirm the constant is the one actually sent. A substring matcher can also still admit a longer path or a query that merely contains an exempt prefix. Remove it when every request path comes from the generated client instead of a literal.

Neither check reads a request body. A missing required field still passes both, so body conformance stays with the focused test for that operation.

## Boundaries

- Only `features/*/api/**` and `src/api/**` import `src/api/generated/**`; `eslint.config.js` enforces this.
- Routes, screens, and components never import Axios or generated operations.
- `src/api/http/**` owns the Axios instance, authentication, locale header, cancellation, and transport-error normalization.
- Feature API modules own query/mutation options, keys and API-only execution hooks. A mutation declares its cache consequence in `meta.invalidates`; screens run it with `useMutation` and own navigation and acknowledgement (ADR 0014).
- File creation, relocation and API input type placement follow [`source-structure.md`](../source-structure/SKILL.md).
- Generated files are never edited or committed.

If runtime behavior contradicts the snapshot, stop and report the endpoint, request/response evidence, and blocked work. Do not hide divergence with casts, optional fields, fallback values, or silent response reshaping. A temporary adapter requires explicit approval, an ADR, tests, and a removal condition.

## Common mistakes

- Generating React Query hooks and treating them as the project API
- Fetching the remote specification during install or build
- Rewriting every generated response type as a Zod schema
- Invalidating broad cache roots when an exact consequence is known

## 이 계약의 검증 대상

| 축 | 무엇을 확인하나 |
| --- | --- |
| wire | 실제 요청 URL·method·headers·payload 와 응답 본문 |
| 봉투 | 성공 코드 판정과 `data` 해제가 타입까지 따라가는가 |
| 실패 | 각 `kind` 가 의도한 자리(none/feature/incident/root)에 표시되는가 |
| 로그 | 원문 server message·stack·비밀 값이 UI 와 로그에 없는가 |

브라우저 증거는 **어떤 요청이 나갔고 무엇이 돌아왔는지**를 적는다. 요청 함수 로그 한 줄은 그 호출
하나만 증명한다.
