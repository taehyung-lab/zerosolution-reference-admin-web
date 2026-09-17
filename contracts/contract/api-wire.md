# 계약 — API wire

**답하는 질문**: 요청과 응답이 실제로 어떤 모양으로 오가고, 실패가 어떤 어휘로 분류되며, 그 실패가
어디에 표시되는가.

**담지 않는 것**: 무엇을 언제 조회·저장하는가 — `contracts/contract/server-state.md` 다.
어떤 문구를 보여 주는가 — 그 화면의 fact 와 `contracts/direct/shared-ui.md` 다.


## Transport boundary

One project Axios instance owns base URL, cancellation, confirmed credentials, `Accept-Language`, request ID extraction, and normalized errors. It never navigates or renders toast/dialog UI. Replication delay, menu context, client path, and other custom headers require an explicit backend contract; do not copy them from another project.

## Envelope and errors

If the declared response is `{ header: { resultCode, resultMessage }, data }`, HTTP 200 is not sufficient for success. One boundary checks the documented success codes, unwraps successful `data`, and converts every failure before it reaches Query or UI.

When the generator types an endpoint with the envelope itself (`{ header?, data? }`), the mutator that unwraps `data` must also unwrap the static type: map the return type through `UnwrapEnvelope<T>` (`T extends { data?: infer D } ? Exclude<D, undefined> : T`) so callers receive `Promise<Data>`, never a cast or `any`. A test that reads a field of the unwrapped result directly guards the regression.

Canonicalize supported failure `data` shapes into one field-error array. Keep server `message` for redacted developer logs only; UI copy is chosen from confirmed `code` or `validCode` through i18n.

`ApiError.kind` is the closed 12-kind taxonomy: `network`, `timeout`, `cancelled`, `business`, `unauthorized`, `forbidden`, `validation`, `not-found`, `conflict`, `rate-limited`, `server-error`, and `contract`. Preserve status, business code, `x-request-id`, and canonical field errors when present. Business-code overrides occur in this boundary only; unconfirmed business codes stay `business`.

Kind does not choose a UI location. The operation context owns the result: cancelled work the user left has no surface; recoverable feature operations render in place; terminal auth/access is an app incident; render, route-loader, unhandled fatal, and route not-found belong to root. A recoverable `contract` failure stays in place, while a render/loader contract failure belongs to root.

The four outcomes `none | feature | incident | root` are decided only in `src/api/error-outcome.ts` (`resolveErrorOutcome(context, kind)`, `isFeatureError(error)`); the UI-side placement of each outcome is [공용 UI 의 Feedback](../direct/shared-ui.md#feedback).
Feature consumers use its context-free feature predicate instead of repeating cancelled/unauthorized/forbidden
comparisons. Context remains only for real differences such as observerless prefetch, pre-auth failures that end no
session, and root failures.

Never expose `resultMessage`, another raw server message, or a stack in UI. Safe translated copy and a recovery action are mandatory. `requestId` is the visible inquiry code; a details disclosure may additionally show request ID, status, and kind.

Do not copy `X-Client-Path`, `X-Menu-Id`, `X-Write-Consistency`, a guessed replication-delay window, or SSE recovery coupling without a new backend contract. No reverse import from transport to app exists.

Auth/reissue rules are owned by `contracts/contract/auth-session.md`(미작성 — 인증·재발급을 바꿀 때 쓴다). Locale-sensitive transport and cache identity are owned by `contracts/contract/server-state.md`.

## 이 계약의 검증 대상

| 축 | 무엇을 확인하나 |
| --- | --- |
| wire | 실제 요청 URL·method·headers·payload 와 응답 본문 |
| 봉투 | 성공 코드 판정과 `data` 해제가 타입까지 따라가는가 |
| 실패 | 각 `kind` 가 의도한 자리(none/feature/incident/root)에 표시되는가 |
| 로그 | 원문 server message·stack·비밀 값이 UI 와 로그에 없는가 |

브라우저 증거는 **어떤 요청이 나갔고 무엇이 돌아왔는지**를 적는다. 요청 함수 로그 한 줄은 그 호출
하나만 증명한다.
