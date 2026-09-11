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

`node scripts/agents/cli.mjs bundle <id>` also returns optional `examples` from `seed.mjs`:
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
- that the materialized seed is closed — no file in it imports something outside it;
- that no feature, route, generated or domain-translation file leaked into the seed.

A focused test's explicit `vi.mock` is a real execution seam, so the mocked module's production
dependencies are not walked. If a closure comes out wider than expected, narrow the entry point or cut
the dependency — do not append files to a list.

The checker proves declaration and closure. **It does not judge whether a value is right or whether a
candidate should be adopted.** That stays with review.

## Applying a bundle to a new product

1. Split the new product's screens and logic by surface, and extract UI, state ownership, URL, API
   payload/cache, permission, i18n, navigation and failure/recovery as requirements.
2. Compare each requirement against the existing candidates and judge `그대로 채택 / 제품에 맞게 수정 /
   제외 / feature-local 신규 구현`. Meaning, lifecycle, ownership and failure behaviour must match — a
   shared name is not evidence.
3. Assemble only the adopted minimum into the first representative vertical slice. When a Manager value
   or a rehearsal contract is needed, do not widen the shared API; return it to the product feature.
4. Verify each requirement against real screens and responses, then confirm, narrow or demote the
   provisional candidates once a second real consumer exists.

Leave `TRANSPLANT_PENDING_<ID>` wherever an adoption decision is still open. One remaining sentinel
means bootstrap is not complete.

## Transplant material that is not a candidate

`TRANSPLANT_MANIFEST` in `seed.mjs` lists what travels without being an adoption candidate: whole
skills, the ADRs a skill names, version-pin ADRs to compare against the target, the product inventory,
gates, configuration, the test harness, the i18n runtime, and app shell copy to merge. Entries under
`templates` are merged into the target, not copied over it.

The agent context index under the product inventory travels as product-specific reference material,
not a shared candidate. Rebuild its evidence/path connections from the target product before claiming
handoff validation. `prepare` uses the bundle's declared section locations for reading; transplant still
copies the complete declared documents and computes the same code/test closure.

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

The surface index (`docs/reference/zero-sol/context.json`) fails when a surface cites a skill file that has a unique `형태` heading but delivers neither that heading nor the whole file. The index does not name product domains as the skill set; grain and the path skill load `형태` even when other headings were omitted.

`screen-shape.mjs` compares each `screens/<workflow>/` (and `mechanics/<name>/`) with the role shapes
that the feature-contract references own in their `형태` sections: a role-named file must sit in its
segment (`ui/` or `model/`; `lib/` and `config/` are left to the placement table). The tables distinguish
invariants from files that exist only when the role is present; the checker still sees names and
existence, not whether the missing role was a correct omission. A list screen must
carry its search, filter, data and policy files unless it imports a mechanic's `model/` (the mechanic's
own names are not checked), a detail with actions needs its request boundary, a form needs schema plus
request or mutation, and every list route must appear in an array literal of
`tests/e2e/search-contract.spec.ts`; a `$param` route leaf must declare a `loader`, and a list `*-columns` file may not write the aria-sort vocabulary by hand (both read the file's source with comments stripped). Otherwise it reads names and existence only — a screen that ignores the
naming convention is invisible to it, two stacks in one directory are not told apart, and URL field
names, value shapes and `locale` types are review's job. A failure names the section to read. Screens
that predate a shape are listed in `SHAPE_EXCEPTIONS` with the condition that closes them and reported
as notices; a closed gap still listed, or a vanished screen, is a failure, so the list only shrinks.

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
