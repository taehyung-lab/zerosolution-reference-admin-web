# Runtime contract validation

Read this file only for runtime response validation or a reproduced server/OpenAPI mismatch.

Generated TypeScript is not runtime validation, but duplicating the whole OpenAPI contract in Zod creates a second schema. Add runtime validation only at an identified high-risk boundary such as session restoration, authorization facts, destructive operations, persisted external data, or a reproduced mismatch.

For a mismatch, collect redacted evidence and stop. Distinguish `required` from `nullable`; changing one does not imply the other. `as`, non-null assertions, and fallback values do not validate a response or make it conformant.

The backend updates implementation and Swagger together. A frontend compatibility adapter is exceptional and requires approval from the responsible product/API owner. Record the upstream issue, accepted shapes, telemetry, tests, owner, and removal condition in an ADR.

## Two mechanical checks `contracts:check` owns

Both target the same failure: types compile, tests pass, and the seam is dead only at runtime. Each was added after that failure actually happened, and each ships with a passing and a violating control in `contracts.test.mjs`.

- **Ports look registered.** Transport exposes `register*` seams so it never imports app code back, and a seam nobody fills in production is dead: `readReissuedAccessToken` returned `undefined` for every 401 while its tests registered a reader and passed. The check greps for `export function register…` under `src/api` and for `name(` in any non-test file outside it. That catches the seam nobody wired at all, which is the failure that happened. It does **not** prove registration: a mention inside a comment or an unreachable function satisfies it, an aliased or namespaced call does not, and it never follows the import graph to confirm the module runs. Read it as a tripwire, not a proof. Remove it when transport stops using registration seams.
- **Named request-path constants match the contract.** A `UPPER_SNAKE_PATH` constant holding a single-quoted literal must equal a declared path exactly; a `UPPER_SNAKE_PATHS` array is matched by substring (the pre-auth exemption), so each entry only has to appear inside a declared path. Keeping the two shapes apart is the whole point: `/auth/reissue` is a substring of `/api/v1/auth/reissue`, so one substring rule would pass a value that requests a 404. Its reach is exactly that naming convention. Inline literals, double quotes, template strings, assembled variables, and object properties are invisible to it, and it does not confirm the constant is the one actually sent. A substring matcher can also still admit a longer path or a query that merely contains an exempt prefix. Remove it when every request path comes from the generated client instead of a literal.

Neither check reads a request body. A missing required field still passes both, so body conformance stays with the focused test for that operation.
