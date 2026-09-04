# Mutations and cache consequences

Read this file only for mutation payloads, invalidation, exact cache updates, optimistic behavior, retry, or field-error handoff.

- Mutations own the server call and declared cache consequence. Request mapping remains beside the feature form/model.
- Declaration and execution are split (ADR 0011): `features/{domain}/api/mutations.ts` exports `mutationOptions` factories (generated call, `retry: false`) because generated operations may not leave `api/`; the workflow hook beside the screen (`form/useUpdate{Domain}Mutation`) runs `useMutation({ ...options, onSuccess })` and owns `useQueryClient` and the awaited invalidation. Do not pass a `QueryClient` into an options factory.
- The calling screen owns navigation, toast wording, dialog closure, and focus restoration.
- Prefer an exact cache update or invalidation. Invalidate a list family only when membership or ordering across active variants cannot be known; record that semantic reason.
- Enumerate affected families. A root key is allowed only when it is the confirmed aggregate family and narrower membership is unknowable.
- Do not retry mutations automatically.
- Optimistic updates require material UX benefit and a rollback test.
- Normalize field errors and hand them to the feature form; transport does not know the form implementation.

Use direct awaited consequences by default. Add a key-agnostic `meta.invalidates` dispatcher only after local declarations demonstrably drift from cross-domain fan-out or repeated event consequences. A mutation uses either the dispatcher or local `onSuccess` invalidation, not both. Navigation-critical invalidation remains awaited.

Read [query-cache.md](query-cache.md) only when defining or changing key families/query identity; consuming an already exported key does not require the whole query reference.
