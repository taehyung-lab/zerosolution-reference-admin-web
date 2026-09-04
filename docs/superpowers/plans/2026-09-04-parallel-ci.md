# Parallel CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve all nine verification stages while reducing reliable PR and `main` feedback to 3–4 minutes.

**Architecture:** Keep `pnpm verify` as the ordered local/bootstrap entry point. GitHub Actions runs the same stage set as four runner jobs: static plus gates, two unit shards, and E2E; a contract test proves set equality between both representations.

**Tech Stack:** GitHub Actions, pnpm 10, Node 24.19, Vitest 4, Playwright 1.62, Vite 8

**Spec:** `docs/superpowers/specs/2026-09-04-parallel-ci-design.md`

## Global Constraints

- `pnpm verify` keeps its current nine stages and order.
- PR and `main` execute every stage; no path filtering in this change.
- PR supersession may cancel old work; `main` work is never cancelled.
- Playwright stays at one CI worker.
- Do not increase timeout or retries to hide the E2E failure.
- Each agent-facing Markdown file remains at or below 200 lines.

---

### Task 1: Mechanically prove CI stage coverage

**Files:**
- Modify: `scripts/contracts/contracts.mjs`, `scripts/contracts/contracts.test.mjs`, `scripts/contracts/check.mjs`, `package.json`

**Interfaces:**
- Produces: `CI_VERIFY_SCRIPTS`, `ciVerifyStageFailures(scripts)`, `ciWorkflowScriptFailures(workflow)`; consumes existing `parseVerifyChain(script)`

- [ ] **Step 1: Add failing stage-set tests**

Add tests that expect no failures for these scripts and failures for one missing, one extra, and one duplicated stage:

```js
const scripts = {
  verify: 'pnpm api:check && pnpm contracts:check && pnpm test:unit',
  'ci:static': 'pnpm api:check && pnpm contracts:check',
  'ci:unit': 'pnpm test:unit',
  'ci:e2e': 'pnpm test:e2e:smoke',
}
expect(ciVerifyStageFailures(scripts)).toEqual([
  expect.stringContaining('CI에만 존재: test:e2e:smoke'),
])
```

Use a complete fixture whose `verify` also includes `test:e2e:smoke`, plus separate missing/extra/duplicate fixtures.

- [ ] **Step 2: Add failing workflow-call tests**

Use inline YAML fixtures. A fixture calling `pnpm run ci:static`, `pnpm run ci:unit -- --shard=1/2`, and
`pnpm run ci:e2e` passes; removing `ci:e2e` fails. Run:

```bash
pnpm exec vitest run scripts/contracts/contracts.test.mjs
```

Expected: FAIL because the two exported functions do not exist.

- [ ] **Step 3: Implement the narrow parser and package scripts**

Export the exact script names and compare stage ownership, then scan workflow text only for those commands:

```js
export const CI_VERIFY_SCRIPTS = ['ci:static', 'ci:unit', 'ci:e2e']
export function ciVerifyStageFailures(scripts) { /* missing, extra, duplicate ownership */ }
export function ciWorkflowScriptFailures(workflow) { /* exact expected vs called scripts */ }
```

Add scripts without changing `verify`:

```json
"ci:static": "pnpm api:check && pnpm contracts:check && pnpm typecheck && pnpm lint && pnpm i18n:check && pnpm gates:negative && pnpm build",
"ci:unit": "pnpm test:unit",
"ci:e2e": "pnpm test:e2e:smoke"
```

Wire both failure arrays into `scripts/contracts/check.mjs`, reading `.github/workflows/verify.yml` once.

- [ ] **Step 4: Run focused and CLI checks**

```bash
pnpm exec vitest run scripts/contracts/contracts.test.mjs
pnpm contracts:check
```

Expected: PASS; output names the verify↔README and verify↔CI stage checks.

- [ ] **Step 5: Commit**

Run `git add package.json scripts/contracts/contracts.mjs scripts/contracts/contracts.test.mjs scripts/contracts/check.mjs && git commit -m "test: enforce CI verify stage coverage"`.

### Task 2: Remove the E2E server variable and isolate failure ownership

**Files:**
- Modify: `playwright.config.ts`; modify only if evidence requires: `tests/e2e/error-boundaries.smoke.spec.ts`

**Interfaces:**
- Produces CI E2E against `pnpm build && pnpm preview`; local E2E remains `pnpm dev`; consumes existing `baseURL` and `CI` fact.

- [ ] **Step 1: Preserve and inspect failure evidence**

Download the failed-run trace for `33851145016`, open it with `pnpm exec playwright show-trace`, and record whether
navigation, lazy chunk loading, dialog rendering, or the click wait consumed the timeout. Do not edit before this check.

- [ ] **Step 2: Establish the current focused baseline**

```bash
pnpm exec playwright test tests/e2e/error-boundaries.smoke.spec.ts --project=chromium --repeat-each=5
```

Expected: record pass/fail count; a local pass does not invalidate the CI trace.

- [ ] **Step 3: Switch only the CI web server to production preview**

```ts
const webServerCommand = process.env.CI
  ? 'pnpm build && pnpm preview --host 127.0.0.1 --port 4173 --strictPort'
  : 'pnpm dev --host 127.0.0.1 --port 4173 --strictPort'
```

Assign `webServer.command = webServerCommand`. Do not change retries, timeout, or workers.

- [ ] **Step 4: Re-run the focused test under the CI server mode**

```bash
CI=1 pnpm exec playwright test tests/e2e/error-boundaries.smoke.spec.ts --project=chromium --repeat-each=10
```

Expected: 10 passes without retry. If it fails, stop Task 2 and trace that failure before changing the spec.

- [ ] **Step 5: Split the spec only when the trace proves shared test state**

If the trace shows state leaking across detail, root, and access phases, create three tests named
`detail query outcomes`, `root render failure`, and `access denial navigation`, each with a fresh `page` fixture.
If it does not, leave the spec intact and fix the traced owner instead.

- [ ] **Step 6: Run full smoke and commit**

```bash
CI=1 pnpm test:e2e:smoke
git add playwright.config.ts tests/e2e/error-boundaries.smoke.spec.ts
git commit -m "test: stabilize production E2E smoke"
```

Expected: 12 or the intentionally split equivalent pass without retry.

### Task 3: Fan out GitHub Actions without losing stages

**Files:**
- Modify: `.github/workflows/verify.yml`, `README.md`, `AGENTS.md`

**Interfaces:**
- Consumes `ci:static`, `ci:unit`, `ci:e2e`; produces four runner jobs with the same stage set as `pnpm verify`.

- [ ] **Step 1: Replace triggers and add safe concurrency**

Use `pull_request`, `push.branches: [main]`, and:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```

- [ ] **Step 2: Define shared setup separately in each job**

Create `static`, matrix `unit` with `shard: [1, 2]`, and `e2e`. Every job checks out, sets up Node from
`.node-version`, enables Corepack, and performs frozen install. Only E2E installs Chromium.

- [ ] **Step 3: Run the four runner commands**

Use `pnpm run ci:static`, `pnpm run ci:unit -- --shard=${{ matrix.shard }}/2`, and `pnpm run ci:e2e`.
Keep `fail-fast: false` so both unit shards report independently.

- [ ] **Step 4: Update owner documentation**

README states that CI runs the same stage set in parallel. AGENTS §4 keeps `pnpm verify` as the public local/bootstrap
entry point and states that CI fan-out must be mechanically equal to it.

- [ ] **Step 5: Verify and commit**

Run `pnpm contracts:check`, `pnpm verify`, then commit `.github/workflows/verify.yml`, `README.md`, and `AGENTS.md` with `ci: run verification stages in parallel`.

### Task 4: Measure real CI and close only on stable evidence

**Files:**
- Modify if measurements differ: `docs/superpowers/specs/2026-09-04-parallel-ci-design.md`

- [ ] **Step 1: Push the branch and open a PR**
- [ ] **Step 2: Confirm one PR event and no feature-branch push event for the same SHA**
- [ ] **Step 3: Confirm static, both unit shards, and E2E all pass and collectively cover nine stages**
- [ ] **Step 4: Record each job duration; acceptance is critical path at or below 4 minutes**
- [ ] **Step 5: Re-run the PR workflow until five consecutive attempts pass without job retry**
- [ ] **Step 6: Run final review, merge through the PR, and confirm the uncancelled `main` fan-out passes**
- [ ] **Step 7: Report implemented/not implemented/differently implemented against requirements 1–9**
