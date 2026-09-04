# Axios transport and envelope

Read this file for Axios, request headers, response envelopes, business errors, refresh, locale, request IDs, or session incidents.

## Transport boundary

One project Axios instance owns base URL, cancellation, confirmed credentials, `Accept-Language`, request ID extraction, and normalized errors. It never navigates or renders toast/dialog UI. Replication delay, menu context, client path, and other custom headers require an explicit backend contract; do not copy them from another project.

## Envelope and errors

If the declared response is `{ header: { resultCode, resultMessage }, data }`, HTTP 200 is not sufficient for success. One boundary checks the documented success codes, unwraps successful `data`, and converts every failure before it reaches Query or UI.

When the generator types an endpoint with the envelope itself (`{ header?, data? }`), the mutator that unwraps `data` must also unwrap the static type: map the return type through `UnwrapEnvelope<T>` (`T extends { data?: infer D } ? Exclude<D, undefined> : T`) so callers receive `Promise<Data>`, never a cast or `any`. A test that reads a field of the unwrapped result directly guards the regression.

Canonicalize supported failure `data` shapes into one field-error array. Keep server `message` for redacted developer logs only; UI copy is chosen from confirmed `code` or `validCode` through i18n.

`ApiError.kind` is the closed 12-kind taxonomy: `network`, `timeout`, `cancelled`, `business`, `unauthorized`, `forbidden`, `validation`, `not-found`, `conflict`, `rate-limited`, `server-error`, and `contract`. Preserve status, business code, `x-request-id`, and canonical field errors when present. Business-code overrides occur in this boundary only; unconfirmed business codes stay `business`.

Kind does not choose a UI location. The operation context owns the result: cancelled work the user left has no surface; recoverable feature operations render in place; terminal auth/access is an app incident; render, route-loader, unhandled fatal, and route not-found belong to root. A recoverable `contract` failure stays in place, while a render/loader contract failure belongs to root.

The four outcomes `none | feature | incident | root` are decided only in `src/api/error-outcome.ts` (`resolveErrorOutcome(context, kind)`, `isFeatureError(error)`); the UI-side placement of each outcome is [shared-ui-contract incidents.md](../../shared-ui-contract/references/incidents.md).
Feature consumers use its context-free feature predicate instead of repeating cancelled/unauthorized/forbidden
comparisons. Context remains only for real differences such as observerless prefetch and root failures.

Never expose `resultMessage`, another raw server message, or a stack in UI. Safe translated copy and a recovery action are mandatory. `requestId` is the visible inquiry code; a details disclosure may additionally show request ID, status, and kind.

Do not copy `X-Client-Path`, `X-Menu-Id`, `X-Write-Consistency`, a guessed replication-delay window, or SSE recovery coupling without a new backend contract. No reverse import from transport to app exists.

Auth/reissue rules are owned by [auth-session.md](auth-session.md). Locale-sensitive transport and cache identity are owned by [locale-cache.md](locale-cache.md).
