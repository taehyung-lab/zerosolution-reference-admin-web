# Runtime contract validation

Read this file only for runtime response validation or a reproduced server/OpenAPI mismatch.

Generated TypeScript is not runtime validation, but duplicating the whole OpenAPI contract in Zod creates a second schema. Add runtime validation only at an identified high-risk boundary such as session restoration, authorization facts, destructive operations, persisted external data, or a reproduced mismatch.

For a mismatch, collect redacted evidence and stop. Distinguish `required` from `nullable`; changing one does not imply the other. `as`, non-null assertions, and fallback values do not validate a response or make it conformant.

The backend updates implementation and Swagger together. A frontend compatibility adapter is exceptional and requires approval from the responsible product/API owner. Record the upstream issue, accepted shapes, telemetry, tests, owner, and removal condition in an ADR.
