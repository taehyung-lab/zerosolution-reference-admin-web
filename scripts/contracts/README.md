# Seed bundles and transplant inputs

Owner: this file explains what a new project takes from this repository and in what order.
`seed.mjs` owns the actual declarations and the closure calculation; ADRs own why each boundary was
drawn. Several capability contracts (list, form, detail, transport) consume this procedure, so it does
not belong to any one of them.

## What a bundle is

A new project does not copy this repository. It takes **adoption candidates**, and each candidate is
declared as one bundle of four parts plus its ownership split:

1. **code** — the public entry points.
2. **skill** — the reference `file` + `heading` + a `marker` sentence inside that section.
3. **ADR** — the `file` + `heading` + a `marker` line that records the decision and its stage.
4. **tests** — the focused tests that pin the behaviour.

`ownership.shared` and `ownership.feature` say what the contract owns and what stays with the product.
A bundle missing any part is not an adoption candidate; it is code that happens to exist.

## Consumption examples

`node scripts/evidence/cli.mjs bundle <id>` also returns optional `examples` from `seed.mjs`:
`files` to read together, `useWhen` describing the composition to compare, and `doNotCopy` naming
product-specific choices or unverified behavior. Initial examples cover list results, tables, draft
composition and save forms. Other bundles still expose their code, contract and focused tests;
an absent example is not a finding that no consumer exists.

These are scoped reading aids, not approved whole screens or a second contract. Read their current
code against the linked skill/ADR; hook counts, matching names and file existence do not prove quality.
When the example or its contract changes, recheck the described composition and limits, then update
or remove that entry. The existing bundle checker checks paths and descriptions, not that comparison.
Examples never enter the code/test export closure. On transplant, replace or remove these source-product
pointers with the target's observed consumers; do not copy feature code to satisfy the catalog.

## What the checker proves, and what it does not

People choose the four roots and the ownership split. `contracts:check` then computes, from those roots
only:

- the local import closure of each code root and of each declared focused test;
- that every declared file, heading and marker actually exists;
- that no two bundles own the same code root;
- that each bundle's declared export names (`SEED_BUNDLE_EXPORTS`) match the code-root `export` set; a
  session that changes that set must also carry a `modify` decision for the bundle;
- that the materialized seed is closed — no file in it imports something outside it;
- that no feature, route, generated or domain-translation file leaked into the seed.

A focused test's explicit `vi.mock` is a real execution seam, so the mocked module's production
dependencies are not walked. If a closure comes out wider than expected, narrow the entry point or cut
the dependency — do not append files to a list.

The checker proves declaration and closure. **It does not judge whether a value is right or whether a
candidate should be adopted.** That stays with review.

## Applying a bundle to a new product

Use three stages: **target-owned documents → required shared contracts/code → one screen workflow at a time**. These are work boundaries, not three new commands or required report files. Keep decisions in the target’s existing product owner and the task conversation; use an ignored handoff only when another session needs it.

| Stage | Carry and replace | Evidence needed to move on |
| --- | --- | --- |
| 1. Documents | Adapt `AGENTS.md` and runtime pointers; bring only applicable skill/reference and ADR decisions with their linked owners. Register the target’s sources through `docs/reference/product.json`. Replace product facts, defaults, wording, inventory, judgments and scenarios with target evidence. | A screen, partial UI, or logic request can reach its own requirements and relevant contract without consulting a source-product domain. Referenced owners exist; unknown API/policy remains explicit. This is document readiness, not bootstrap or implementation completion. |
| 2. Shared | Choose only what the first real screen needs. Compare each candidate’s code, contract, ADR and focused tests with that requirement; declare adopt/modify/exclude and the feature-owned remainder. | Trace requirement → first consumer → focused verification in the existing task. No shared API widening for one consumer and no need to copy an unrelated source feature to satisfy a bundle example. |
| 3. Screens | Implement one bounded workflow, or the requested component/logic slice, using the target’s design and policy. Keep the implementation request small; inspect connected transitions without rebuilding unrequested screens. | Observe UI and interactions, verify state ownership/shared boundaries/failure paths, return to the cause of a failure and update its existing owner. Compare a different second consumer before confirming a provisional abstraction. |

For this reference project, stage 1 preserves its product facts and moves them out of portable rules; then stage 3 can exercise screens here before migration. An unavailable backend does not prevent measured UI and confirmed interaction work. Use the existing [pre-server responsibility boundary](../../product/policies/evidence.md): an explicit fixture proves only the scenario it supplies. Do not invent endpoint, DTO, permission, status or success semantics. When the actual API arrives, replace the feature adapter and verify payload, response mapping, errors, cache consequences and real environment per screen before claiming that screen’s integration is complete.

**Target facts never come from source history.** Do not transplant `.ai-work/`, `.superpowers/`, `docs/superpowers/`, `docs/design/`, `docs/research/`, source-product inventory/judgments/scenario contents, or rehearsal API facts as target operating instructions. Portable skills remain domain-neutral; source-specific reference and ADR evidence is replaced with target evidence when available. An ADR carries rationale and adoption conditions, not authority over the new product’s defaults.

**Authentication is conditional.** The current `transport-auth` bundle couples HTTP transport with credential storage and reissue/replay policy. Exclude it until target OpenAPI/auth policy confirms the credential body, storage/lifetime, endpoint, cookie settings and replay behaviour. A target needing a different policy implements that boundary against its own contract; this document does not claim a separate `transport-core` bundle exists. Only a dependency on the excluded credential/reissue implementation requires narrowing or deferral. Sharing pure error types or classification with this bundle does not require adopting its auth policy.

**Current tool boundary.** `pnpm transplant:plan` and `pnpm transplant:stage` with explicit `--bundles` produce review material containing code, documents, gates and configuration together. They do not implement stage 1 alone. For documents-first work, edit the target-owned documents and required linked owners directly; do not apply the whole staged payload or carry runtime hooks whose scripts have not arrived. At stage 2, inspect the selected staged contents, remove source observations/policy through the target’s own document edits, merge dependencies/configuration deliberately, and use `pnpm transplant:apply --target <repo>` only for the reviewed tool payload. Apply verifies staged digests: do not hand-edit staging bytes and call them a verified payload. Existing target files are merge items, so they still require explicit integration after apply.

Do not use `--with-ledger` for this clean-product workflow: it copies source facts. The option still exists; this is an explicit workflow exclusion, not a new hard gate. Bundle selection/closure, path rewriting and sentinel scans do not prove semantic neutrality. Review the actual target copy before implementation, especially retained ADR observations, app/translation copy and source-only examples.

Leave `TRANSPLANT_PENDING_<ID>` at an explicitly allowed temporary adapter or unresolved adoption value. Do not clear it merely to pass target checks. During document preparation and pre-API screen trials, report those limits; full bootstrap still requires the target verification chain and all applicable unresolved conditions to be closed. No new adoption manifest, file-per-screen checklist or additional gate is required by these stages.

## Transplant material that is not a candidate

`TRANSPLANT_MANIFEST` in `seed.mjs` declares the material that travels with selected bundles: whole skills, their linked ADRs, conditional version decisions, runtime entrypoints, gates, configuration, test harness, i18n runtime and app copy. This is the tool’s payload, not a requirement to install all of it during document preparation.

- `--bundles a,b` limits code/test closure and the copied `SEED_BUNDLES` / `SEED_BUNDLE_EXPORTS` catalog; omitting it selects every bundle. It does not narrow the manifest’s whole skills, linked ADRs or gate/config files. Resolve their dependencies or choose a smaller manual document adaptation; do not leave pointers to unavailable owners.
- `templates`, `config` and `app` entries require merging. Other files copy only when absent; existing target files are also merge items. Source product feature/routes/generated code, domain translations and `src/test/workflows/` tests are excluded. Consumer examples stay outside the code/test closure and must be replaced or removed in the target catalog.
- Default stage creates empty inventory, judgment, scenario and index shells at the target `docs/reference/product.json` paths (or `product-paths.mjs` defaults). It preserves schema/evidence rules, not source facts, and marks target facts unresolved. `--with-ledger` instead copies the active source ledger unchanged and is excluded from the clean-product procedure above.
- Source ledger paths are rewritten only when the resulting target exists in the payload or target tree. Links to excluded product evidence are unlinked and recorded with source provenance in `PENDING.md`; text is not thereby rewritten into valid target policy. Missing normative skill/active ADR dependencies fail staging. Retired or unselected ADR citations retain source provenance instead of claiming a target decision.
- Staged `AGENTS.md` uses product-repository mode and the target fact pointer. The checker and package draft default to target mode. Package script paths not carried by the payload, retained source vocabulary and unresolved links appear in `PENDING.md`; the file is review input, not proof that every policy dependency was detected.
- Run plan/stage at the reference repository root. Apply verifies every staged digest before copying and preserves existing target files. Package name/scripts, dependency versions, runtime entrypoints, CI and test harness remain target-owned integration work.
- If `tests/e2e/search-contract.spec.ts` is absent, list-route join produces a notice; it is not proven. Keep the relevant target verification or restate the rule, rather than copying a source feature test. The source-product integration test stays here; generic routing tests travel.

The implementation loop selects applicable references; transplant copies complete documents. Neither successful staging nor a closed import graph proves a valid handoff. After target adaptation, run `contracts:check --mode target` and the adopted package verification chain; use actual browser/API evidence for the screen’s integration claim. The checker reports missing package/CI prerequisites, but document-only preparation and pre-API trials are explicitly earlier stages.

## Verification ownership

`package.json` owns the actual verify stages and fail-fast order. `contracts:check` compares the CI
stage set and README projection with that declaration, and checks local links, commands, runtime root
pointers, document-size notices and transplant sentinels. A link's `#anchor` is compared with the
target's headings slugged as GitHub renders them (link text, not URL; underscores kept; fenced code
ignored); setext headings and HTML anchors are not recognized. Remote OpenAPI drift and real-server
login belong to explicit network jobs; do not hide them in the local entry point.

The ESLint ignore list is root-anchored, so a second checkout inside the repository (an agent worktree
under `.worktrees/` or `.claude/worktrees/`) is linted whole unless its root is listed; on 2026-09-10 that
exceeded the Node heap. CI runs on a fresh checkout and never has such a tree, so this regression is
local-only and no CI stage guards it.

The surface index selected by `docs/reference/product.json` fails when a surface cites a skill file that has a unique `형태` heading but delivers neither that heading nor the whole file. The index does not name product domains as the skill set; the context selector adds `형태` when another heading alone was cited.

`screen-shape.mjs` checks selected sort-source mistakes in existing role-named files. It does **not** require a companion search/filter/data/policy/schema/request
file: a partial request and a coherent single-file responsibility must not trigger whole-screen scaffolding.
The former file-set gate and its `SHAPE_EXCEPTIONS` lifecycle were removed after a filter-only probe
produced seven missing-file errors which vanished when the same component was named Panel.

The role references' `형태` tables name the file set of a **whole new screen** of that role, so a reader
knows where each responsibility lives. They are review material, not a machine rule: the checker counts
no files, and a partial request touches only the responsibility it changes. Those two statements agree —
a new list has all eight responsibilities, a filter-only change has one.

List-route registration in `tests/e2e/search-contract.spec.ts` and `$param` leaf loader presence remain
cheap supporting checks. They inspect source conventions, not runtime behavior: renamed roles can be
invisible, a loader body may be wrong, and array membership does not prove an executed test. Actual URL,
state, API, accessibility and shared-boundary correctness belongs to focused tests and consumer review.
The feature references’ `형태` tables describe responsibility placement, not mandatory file counts.

**Everything that travels is product-free, not just the skills.** The same scan runs over the portable
set — skills, the ADRs the skills and gates name, the root instructions, and the seed's production code
and focused tests — because a domain noun leaking into an ADR or a shared comment reaches the target as
a norm just as a skill sentence would. Excluded from the scan, with reasons: `src/app/**` (navigation and
i18n registration are the wiring a target replaces, and the manifest marks them `merge`) and
`src/test/workflows/**` (product workflow tests the transplant excludes), this file (it documents the
vocabulary by example), and any file carrying a `TRANSPLANT_PENDING_` sentinel — that sentinel already
marks the decision and **fails** in target mode, so counting the same line as a notice would blur a
closed placeholder with open drift. `packageManager` is named in `PRODUCT_DOMAIN_TERMS.allow` because a
regex cannot tell its `Manager` from the one in a domain hook.

What remains is one class, and it is closed rather than tolerated: an ADR that cites the **filename** of
a decision which does not travel. The transplant unlinks that citation, keeps the source path as plain
text and records it in `PENDING.md`, so the target never resolves it as its own decision. A new notice
outside these classes means the vocabulary leaked into something portable; close it by removing the
name, excluding the file from the transplant, or marking the spot with a sentinel.

`productNameNotices` scans for this product's
domain nouns, `Manager*`/`Member*`-style identifiers and `src/features/<dir>/` paths
(`PRODUCT_DOMAIN_TERMS` in `contracts.mjs`; replace the vocabulary on transplant) and reports every line,
including examples and fences, as a notice. A rule that needs a
product name to be understood is not yet a rule; the notice is where that rewrite starts. Zero is the
target, and a remaining line needs a stated reason in review. It is a notice, not a failure, because the
vocabulary is substring and generic-word matching (`운영자`, `전시`, `manager` as a field name) and the
false positives are a reviewer's call.

Document notices cover nested `docs/` and `.agents/` Markdown too, including Notion ledgers.
`contracts.mjs` owns the advisory thresholds: 200 lines and 24 KiB (a triage baseline near the
previous expensive list reference, not a semantic quality limit). Dense short files need review too.
Exceeding either threshold emits a notice, never a failure. Compare task delivery and required
evidence before splitting; `context-report` distinguishes direct, linked and unlinked support.

ESLint owns deprecated-library API rejection (`@typescript-eslint/no-deprecated`). When a reference
names a replaced API, update that reference with the replacement. `local/no-prohibited-abstraction`
only rejects exact prohibited names; it does not enforce the whole ban on speculative frameworks.
Change its names together with the supporting skill/ADR statements. `gates:negative` owns the normal
and negative fixtures that exercise these gates. Their success is evidence of those controls only.
