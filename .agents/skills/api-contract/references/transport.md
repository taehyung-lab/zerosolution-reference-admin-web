# Axios transport and envelope

Read this file for Axios, request headers, response envelopes, business errors, refresh, locale, request IDs, or session incidents.

## Transport boundary

One project Axios instance owns base URL, cancellation, confirmed credentials, `Accept-Language`, request ID extraction, and normalized errors. It never navigates or renders toast/dialog UI. Replication delay, menu context, client path, and other custom headers require an explicit backend contract; do not copy them from another project.

## Envelope and errors

If the declared response is `{ header: { resultCode, resultMessage }, data }`, HTTP 200 is not sufficient for success. One boundary checks the documented success codes, unwraps successful `data`, and converts every failure before it reaches Query or UI.

Canonicalize supported failure `data` shapes into one field-error array. Keep server `message` for redacted developer logs only; UI copy is chosen from confirmed `code` or `validCode` through i18n.

`ApiError.kind` expresses recoverable meaning rather than only transport shape, for example `network`, `timeout`, `cancelled`, `unauthorized`, `forbidden`, `validation`, `not-found`, `conflict`, `rate-limited`, `server-error`, or `contract`. Preserve status, business code, request ID, and canonical field errors when present. Business-code overrides occur in this boundary only.

## Auth and incidents

Implement refresh only from a confirmed server contract. It is single-flight for concurrent failures; rotating refresh credentials also require the confirmed cross-tab serialization mechanism. Exclude pre-auth and refresh endpoints, and prevent a late refresh from reviving a terminated session.

The interceptor emits a one-way incident fact. The app incident boundary owns display and navigation with one terminal incident per session epoch. No reverse import from transport to app exists.

## Locale

Decide at Day 0 which response families vary with `Accept-Language`. Encode that policy once in query-option/key construction so language changes cannot reuse stale localized cache entries.
