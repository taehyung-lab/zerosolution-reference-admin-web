# OpenAPI generation and contract

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

Runtime validation and mismatch handling are owned by [contract-validation.md](contract-validation.md). Transport and envelope errors are owned by [transport.md](transport.md).
