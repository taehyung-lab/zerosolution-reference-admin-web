# Repository preflight and review

Owner: these scripts execute the observable preparation/review parts of `AGENTS.md`.
Product facts stay in the inventory and scenarios; shared decisions stay in skills/ADRs.
Hooks verify routing, declarations and output scope, never policy truth or comprehension.

## Find the task context

For a screen/workflow task, first read AGENTS and the applicable skill, then discover the target:

```sh
node scripts/agents/cli.mjs context
node scripts/agents/cli.mjs context performance-list
node scripts/agents/cli.mjs bundle
node scripts/agents/cli.mjs bundle data-table
```

These are read-only, available before prepare. `bundle` lists the valid IDs; an ID returns its code,
reference sections, ADRs, focused tests and ownership split from the existing seed declaration. `docs/reference/zero-sol/context.json` is owned by the
inventory and contains pointers, not copied policies. It connects targets to inventory/scenario
locations, related inner surfaces, applicable references and existing code paths. Paths are discovery
hints, never code ownership or a folder template. Feature API/model files can serve several surfaces;
index those consumers rather than forcing an unrelated screen requirement just to satisfy a path match. Unimplemented paths are left empty. New product paths need explicit
`evidenceGaps` until their own inventory is indexed; replace this product's index on transplant.

A `group` entry routes a whole inventory family: decompose its actual sections/dialogs yourself.
A `surface` entry is narrower. Neither label certifies complete observation. `gap` states missing
coverage, not permission to invent policy. Figma/Notion conflicts and missing product facts still
follow AGENTS. For this reference product, inspect linked Figma/Notion originals through `aside-browser`.
Use the target inventory's source links when details are missing, ambiguous, conflicting, require visual
measurement, or the user requests source verification. A link or prepared document is not a browser
observation. If access fails, record the exact unverified fact and affected implementation; do not invent
it or silently switch tools. Transplant projects follow their own source and browser instructions.

## Prepare before editing

For new screens, workflow changes or API/shared boundary changes, publish the target and excluded
screens, routes and inner surfaces, state owners, applicable contracts with adopt/modify/exclude,
scenario cards, consumed bundles, unresolved questions/sentinels, edit scope and states to verify.
This checkpoint is disclosure, not an extra approval. Copy/style-only work states numbered requirements,
scope and focused validation briefly; it needs no workflow checklist or permanent plan.

Keep the task checkpoint under `.ai-work/`. The native hook supplies the runtime session ID when
preparation is missing. Use that ID with `prepare`; do not invent a second ID for an active runtime.
A script-only task needs numbered requirements, scope, references, contracts and unresolved as before.
A workflow task also links each requirement to included surfaces, sources and contract decisions.
Applicable SKILL files follow the actual paths in AGENTS §2; an API path also needs api-contract.
Contract IDs must come from `bundle`, not component/hook names or invented labels:

```json
{
  "scope": ["src/features/performances/list/"],
  "surfaces": [
    { "id": "performance-list", "decision": "include" },
    { "id": "performance-venue", "decision": "exclude", "reason": "Only result sorting changes; venue behavior is unchanged." }
  ],
  "requirements": [{
    "id": "R1", "text": "Repeat-click sorting follows the confirmed list scenario.",
    "surfaces": ["performance-list"],
    "sources": ["docs/reference/zero-sol/05-performances.md"],
    "contracts": ["data-table"]
  }],
  "references": ["AGENTS.md", ".agents/skills/feature-contract/SKILL.md"],
  "contracts": [{ "id": "data-table", "decision": "adopt", "reason": "The table renders the feature-owned sort state." }],
  "unresolved": []
}
```

```sh
node scripts/agents/cli.mjs prepare SESSION_ID .ai-work/task/checkpoint.json
```

- Feature, route and app-shell scopes default to workflow in both `build` and `settled` stages. Known
  paths need matching included surfaces; each indexed related surface needs include/exclude, and an
  exclusion needs a reason. Each included surface needs a requirement. Actual edit paths are checked
  again, so a broad preparation scope cannot substitute for the right target.
- `sources` are Markdown paths, `{ "file": "path.md", "heading": "Exact heading" }`, or `"user"` for
  an explicit user requirement. At least one source must belong to that requirement's target context
  or be the user request. `contracts` names decisions declared above; when none apply, give an empty
  array and `contractReason` **inside that requirement**, not at checkpoint top level. Example:
  `{ "id": "R2", "text": "Local copy change", "surfaces": ["performance-list"], "sources": ["user"], "contracts": [], "contractReason": "Feature copy only" }`.
  The checker validates connections, not whether the decisions are sound.
- Unknown paths need `evidenceGaps: [{ "paths": ["src/features/new/"], "reason": "New surface not yet indexed", "references": ["docs/reference/zero-sol/05-performances.md"] }]`.
  This allows evidence discovery without pretending the ledger is complete. It cannot bypass a known
  path's surface. `settled` rejects evidence gaps and included index entries with a gap.
- `work: { "kind": "maintenance", "reason": "Copy/style only; no workflow changes" }` keeps small
  maintenance light. `infrastructure` with a reason is for transport/tooling changes without screen
  behavior. These are reviewable declarations, not semantic detection; do not use them to skip a
  workflow's evidence. Script-only scopes default to infrastructure.
- Product unknowns use `unresolved: [{ "question": "Which wire value?", "paths": ["affected/path/"] }]`.
  Native edits on those paths remain blocked. An indexing gap does not resolve a product unknown.

`prepare` adds the target's evidence and the chosen seed's skill/ADR sections automatically. References
may select an exact heading; root AGENTS and required SKILL files must be read in full. Selected sections
include their children, document introduction and ancestor lead-ins. They do not implicitly include
sibling rules: read linked sections when they affect ownership, exceptions or failure behavior. All
heading/marker references are checked even when another selection includes the whole file.

The output reports selection count and delivered bytes. Re-preparing suppresses unchanged selections;
a newly requested section in the same file is still delivered. Whole-file hashes detect changes outside
the selected section too. Selected seed code and focused tests still need inspection.

Publish the implementation checkpoint to the user; preparation is not another approval. If scope,
requirements or references change, prepare again. A reference also in scope may be edited by this task;
other reference changes require re-preparation. Exact files or directory paths with a trailing `/` are
supported. Avoid repository-wide scope. Local baselines survive re-preparation.

## Review the actual output

Compare the diff with every requirement and its evidence: target and inner-surface coverage, existing
shared candidates, invented product facts, single state ownership, necessary complexity and actual
failure/recovery behavior. Record each original requirement exactly once as `implemented`,
`unimplemented` or `different`. Workflow requirements that are implemented/different also need concrete
in-scope implementation files and verification methods/results:

```json
{
  "requirements": [{
    "id": "R1", "status": "implemented", "evidence": "Observed both sort directions on repeated clicks.",
    "files": ["src/features/performances/list/ui/PerformanceListResult.tsx"],
    "verification": [{ "method": "Browser interaction", "result": "ascending → descending → ascending", "artifact": ".ai-work/task/browser-report.md" }]
  }],
  "contractReview": "Compared the adopted table contract with the caller's sort ownership.",
  "complexityReview": "No extra wrapper or replicated state.",
  "assumptions": [], "limitations": ["No real API connection."]
}
```

Artifacts are optional; when supplied they must exist. Files must exist in scope or be a recorded
baseline deletion. Unimplemented requirements keep their reason in `evidence`; they need no fabricated
implementation file. Script/maintenance reviews keep the smaller requirement status/evidence shape;
all reviews still require top-level `contractReview`, `complexityReview`, `assumptions` and `limitations`.
When no contract changes apply, say so with the reason; do not omit those fields.

Run `node scripts/agents/cli.mjs review SESSION_ID .ai-work/task/review.json`. It runs contracts and lint,
then records the report against the current output hash; further source edits invalidate it. Types,
scenario tests, browser checks and `pnpm verify` still apply. Text/paths in the report do not prove a test
ran or a design is correct. `unimplemented` can close accountability, never certify task completion.

## Runtime adapters and limits

Checked-in commands require Node 24 and Git on the runtime PATH. Transplant hook files are merge templates:
review runtime availability, repository paths and native trust before enabling them in another environment.

- Codex: `.codex/hooks.json`; inspect and trust the exact hook using `/hooks`. A changed definition needs trust again.
- Claude Code: `.claude/settings.json`; workspace trust and active settings determine whether hooks run.
- Copilot: `.github/hooks/reference.json`; CLI may also discover Claude settings, so handlers are idempotent.
- Other runtimes: use the same prepare/review commands and root instructions. An adapter must be implemented and
  exercised before claiming automatic interception there. “All agents” means one contract, not undocumented hook support.

Native Edit/Write/apply_patch calls check target scope before execution. General shell calls require preparation,
but their write targets are not inferred from shell text. Each adapter's `matcher` must list every tool name the
handler answers (`preflight.test.mjs` fails when one drifts); a name the matcher omits is never intercepted.

Read-only inspection stays available without preparation: `read`, `cat`, `ls`, `rg`, `grep`, `wc`, `pwd`, the listed
`git` subcommands, `find` limited to read-only predicates, and `sed -n <range>p`. The writing forms of the same
commands (`find -exec`/`-delete`/`-fprint`, `sed -i`/`-f`/`w`) are refused, as is any command carrying a pipe,
redirection, separator or substitution. Writes under `.ai-work/` remain available for preparation.

Accountability is per session, not per path, because shell text never reveals a write target. A session becomes
accountable the first time the hook grants it a write capability — a native edit inside scope, or any general shell
call. Review/stop then reconciles actual file changes against the preparation snapshot, even after a commit, and
rejects out-of-scope or unresolved paths. A session that only ran recognized inspection commands produced no tracked
change, so a concurrent session's edits neither block its stop nor invalidate its review; report those changes as
external instead. Shared-tree parallel writing is still not supported: run writing work in one session or an
isolated worktree. Unsupported MCP/custom write
tools and interactive shell continuations are not a complete interception boundary. Review and Git/CI remain
necessary; do not describe this as a sandbox.
No transcript, prompt, secret or global agent configuration is read or modified by these scripts.
Normal and negative controls live in `preflight.test.mjs`; runtime input fixtures prove adapter decisions,
not installation/trust or every native tool path. Report native runtime measurements separately.
Freeze source while a same-tree preparation rehearsal runs. Even a source-read-only worker becomes
accountable after a general shell command (including orchestration messages or copying a log). Later
coordinator edits can then block its Stop. Use a frozen checkout; do not broaden the worker scope or
reset its baseline to conceal another session’s edits.

Source contracts checked 2026-09-06: [Codex hooks](https://learn.chatgpt.com/docs/hooks),
[Claude hooks](https://code.claude.com/docs/en/hooks),
[Copilot hooks](https://docs.github.com/en/copilot/reference/hooks-reference).
Recheck adapters when the runtime payload, hook coverage or trust model changes.
