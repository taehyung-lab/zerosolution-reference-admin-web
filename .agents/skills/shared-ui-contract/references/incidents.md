# Access and session incidents

Read this file only for access/session incident presentation or deciding which UI surface renders a normalized error.

- Error location is caller-decided from operation context and normalized kind; shared UI renders caller-owned content but does not classify API errors.
- The four placement outcomes are decided in `src/api/error-outcome.ts`: `resolveErrorOutcome(context, kind)` → `'none' | 'feature' | 'incident' | 'root'`: `route-not-found`/`render`/`route-loader`/`fatal` contexts → root regardless of kind; `prefetch` + `forbidden` → none; otherwise `cancelled` → none, `unauthorized`/`forbidden` → incident, every other kind → feature, and `isFeatureError(error)` is the `unknown → ApiError` guard a feature uses before showing an error inline. App and feature surfaces consume that decision instead of repeating error-kind groups.
- `IncidentBoundary` owns terminal auth/access presentation.
- A session boundary (remaining-time display, extension, expiry warning — Figma 상단 바 "로그아웃까지 남은시간 30:00 연장", 1.4.4 팝업) is **not implemented**; the current app lifecycle is `AuthProvider` sign-out only. When built it owns those without copying Query session data.
- Observerless prefetch has no loading or incident surface.
- `ErrorTrace({ value: { requestId?, status?, kind? } })` directly reads its five labels from the `shared` namespace and renders nothing when all three are absent. List, detail, and root callers pass only `ErrorTraceValue` (an `ApiError` satisfies it structurally); they do not repeat the disclosure labels or pass raw messages.

Classification or reissue changes also require the API auth/transport reference. Test safe copy, live-region behavior, focus, recovery action, and the incident state actually changed.
