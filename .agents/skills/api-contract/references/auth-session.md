# Auth transport and session incidents

Read this file only for token storage, refresh cookies, reissue, replay, 401/403, or cross-tab auth coordination. ADR 0006 owns the current bootstrap decision and stop conditions.

- Store the access token through the approved try/catch adapter with an in-memory mirror; read it into `Authorization`.
- The refresh token is an HttpOnly server cookie. The client guarantees only `withCredentials: true`; cookie name, expiry, SameSite, and response body remain server-contract inputs.
- HTTP 401 runs `/auth/reissue` once, stores the adapted token, and replays the original request once.
- A document-local `refreshPromise` deduplicates concurrent failures. `navigator.locks` serializes cross-tab rotation and storage is rechecked after acquiring the lock.
- A replayed 401 may use a newer current token once without starting another reissue. Reissue never refreshes itself.
- Terminal incidents distinguish `api`, `refresh`, and `cross-tab` sources.
- HTTP 403 becomes an app incident only for an observed entry operation. Observerless prefetch has no loading or error surface.

Transport emits one-way incident facts; the app boundary owns UI and navigation. Never import app code back into transport.
