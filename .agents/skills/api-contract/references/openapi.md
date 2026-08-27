# OpenAPI generation and contract

Read this file only when work touches the API snapshot, generator, generated output, or a server-contract mismatch.

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
- Any `dev`, `typecheck`, or CI command that imports generated code must run or depend on offline `api:generate` first; it must not depend on Swagger availability.
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

## Runtime validation

Generated TypeScript is not runtime validation, but duplicating the whole OpenAPI contract in Zod creates a second schema. Add runtime validation only for an identified high-risk boundary such as session restoration, authorization facts, destructive operations, persisted external data, or a reproduced mismatch.

## Contract mismatch

Collect redacted evidence and stop. Distinguish `required` from `nullable`; changing one does not imply the other. At the mismatch boundary, `as`, a non-null assertion, or a fallback value is not validation and must not be used to make the response appear conformant.

The backend updates the implementation and Swagger together. A frontend compatibility adapter is exceptional and must be approved by the responsible product or API-contract owner and name the upstream issue, accepted shapes, telemetry, tests, owner, and removal condition in `docs/decisions/`.

Transport and envelope error rules are owned by [transport.md](transport.md).
