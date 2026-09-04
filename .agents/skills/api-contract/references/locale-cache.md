# Locale transport and cache identity

Read this file only when responses may vary by UI locale, `Accept-Language` changes, or locale changes can reuse stale cache. ADR 0005 owns the current conservative decision.

- The transport sends the confirmed UI locale through `Accept-Language`.
- Decide which response families are localized from the server contract, not translated UI labels.
- Encode locale policy once in query-option/key construction so language changes cannot reuse stale localized data.
- While localized response families remain unconfirmed, use `localizedQueryKey(uiLocale, ...segments)` for every API-backed key, rooted at `['api', uiLocale, ...segments]`.
- Narrow the conservative policy only when ADR 0005's disposal condition is met; do not make each feature decide independently.
