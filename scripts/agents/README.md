# Repository preflight and review

Owner: these scripts execute the observable preparation/review parts of `AGENTS.md`, and this file owns
the review vocabulary (completion states), the delegation brief and the session handoff conventions.
Product facts stay in the inventory and scenarios; shared decisions stay in skills/ADRs.
Hooks verify routing, declarations and output scope, never policy truth or comprehension.

## Know which entry the request is

A request names either **one screen** ("implement the performance list", or an issue already split per
screen) or **one shared contract** ("implement this shared component"). The two are not variants of one
procedure: their truth source, denominator and evidence differ, so decide which entry applies first.

| | screen entry | shared contract entry |
| --- | --- | --- |
| entry command | `context <surface id>` | `bundle <contract id>` |
| truth source | inventory rows, scenario card, judgment document | the bundle's `skills` sections and `adrs` |
| denominator | that screen's rows, minus `n/a` and `ref` | none — see below |
| evidence | scenario observation plus enumerated rows against code | the bundle's `tests` plus every existing consumer still passing |
| boundary | inner surfaces included or excluded with a reason | `ownership.feature` in the bundle, which shared must not absorb |
| never | copy another screen's implementation | copy the `examples.doNotCopy` items |

Walk the **route**, not just the screen, because one route entry can compose another feature and
the same file name can mean opposite roles in two of them.

## Find the task context

For a screen/workflow task, first read AGENTS and the applicable skill, then discover the target:

```sh
node scripts/agents/cli.mjs context
node scripts/agents/cli.mjs context performance-list
node scripts/agents/cli.mjs context-report
node scripts/agents/cli.mjs context-report --summary
node scripts/agents/cli.mjs bundle
node scripts/agents/cli.mjs bundle data-table
```

A denied shell call reports one of two causes, because they need different actions. When the command is
not a literal argv — a pipe, a redirect, a glob, `&&`, or a backtick inside double quotes — the denial
says so and preparing will not help; write the command without shell operators, and put literal text in
single quotes so characters such as backticks stay literal. The recognized subset is not widened for
double-quoted backticks, since the shell would run them as command substitution. When the command parses
but is not an allowlisted read-only executable, the denial asks for preparation, which is the right action.

Read-only inspection stays available without preparation: `read`, `cat`, `ls`, `rg`, `grep`, `wc`, `pwd`,
Git `status`/`diff`/`log`/`show`/`ls-files`/`rev-parse` (including leading `-C <path>` or `-C<path>`),
`find` limited to read-only predicates, `sed -n <range>p`, and the repository's own check scripts — `pnpm lint`,
`typecheck`, `typecheck:generated`, `test:unit`, `i18n:check`, `contracts:check`, and `vitest run <paths>` through
`pnpm` or `node node_modules/vitest/vitest.mjs` without options — which are read-only by contract so an independent reviewer can measure without preparing
(`pnpm verify`/`api:check` regenerate files and stay gated); `pnpm -C <dir>` (or `--dir`) selects a checkout inside the repository — a directory carrying `.git`, such as a reviewed worktree. Test paths must lie under `src/`, `scripts/` or
`tests/`, and node under the user's nvm directory (`$NVM_DIR/versions/node/v<x.y.z>/bin/node`) counts as `node`. `rtk` and `rtk proxy` wrappers are recognized.
Git config/alias options, external diff/text conversion and output-to-file options remain gated.
General Python/Node programs cannot be classified as read-only from their executable name.
The writing forms of the same
commands (`find -exec`/`-delete`/`-fprint`, `sed -i`/`-f`/`w`) require preparation. Literal quoted arguments
are decoded before command/option checks, so `rg 'a|b' file` is inspection while a real pipe,
redirection, separator or substitution requires preparation. Unsupported shell escapes/expansions are
conservatively gated; quote glob patterns such as `find scripts -name '*.mjs'`. This is a limited argv
recognizer, not a shell parser. Writes under `.ai-work/` remain available for preparation.

These are read-only, available before prepare. `bundle` lists the valid IDs; an ID returns its code,
reference sections, ADRs, focused tests, ownership split and any scoped consumption examples from the
existing seed declaration ([example semantics](../contracts/README.md#consumption-examples)). `docs/reference/zero-sol/context.json` is owned by the
inventory and contains pointers, not copied policies. It connects targets to inventory/scenario
locations, related inner surfaces, applicable references and existing code paths. Paths are discovery
hints, never code ownership or a folder template. Feature API/model files can serve several surfaces;
index those consumers rather than forcing an unrelated screen requirement just to satisfy a path match. Unimplemented paths are left empty. New product paths need explicit
`evidenceGaps` until their own inventory is indexed; replace this product's index on transplant.

### Read the migrated rows

`context <id>` also returns a `contract` block when that screen's inventory section has rows carrying an
`id`. The row columns and their meaning are owned by
[the inventory table format](../../docs/reference/zero-sol/README.md#표-형식); this section owns only what
the parser derives from them.

- A row is **unresolved** when its `미확인` cell is filled, its `Figma 관찰` contains `(미판독)`, or its
  `Notion 동작·정책` is `(대기)`. Reading the `미확인` column alone misses the other two and reports a row
  with an unread original as confirmed. `Q<n>` tokens link the judgment ledger's questions.
- `denominator` counts rows except `n/a` and `ref`. It is **what has been observed and recorded so far**,
  so it is the denominator of what this task must cover — **not** the screen's full specification.
  Covering every row is not completeness, and a surface missing from the list is found at the source, never
  inferred not to exist — the inventory already owns that rule at
  [근거의 수명과 읽기 범위](../../docs/reference/zero-sol/README.md#근거의-수명과-읽기-범위):43,133.
  The numerator is not here either: scenario cards own verification state.
- `pointerState` says whether the `현재 코드` pointer still resolves against tracked paths — `present`,
  `stale`, `unverifiable` (a component name, not a path), `none`, or `n/a`. It is pointer freshness only.
  A pointer is a discovery hint: `none` is not proof of missing implementation and `present` is not
  completion evidence.
- `enumerations` lists rows whose facts are a list. Nothing compares them against a code array or enum
  yet, so that comparison is a reader's job like the descriptions are.
- An unmigrated screen returns an empty `rows` with a note. Empty means not yet promoted, never an empty
  screen; read the section table itself.
- The parser reads the table only. A cell that a later re-observation has outdated is still promoted, and
  prose beside it is not, so correct the cell in the same task rather than leaving the two disagreeing.

Promotion is incremental. A table without an `id` column, or a row with an empty `id`, is untouched and
contributes nothing, so one screen can be promoted without migrating the product.

`context-report` shows per-surface selected bytes and full-file/heading choices, plus direct, linked or
unlinked Notion support documents recursively. It does not deliver the root/skill/bundle/checkpoint
inputs that `prepare` adds; use actual prepare output for task comparisons. Link reachability is a
discovery check, not proof that the linked policy answers the task. Cross-screen comparison remains
supporting evidence, not a mandatory input for every surface.

Start a whole-index audit with `context-report --summary`: it retains coverage, explicit gaps, group
decomposition notices, selected bytes and full-file counts without printing every selection. Read the
full report and source sections for affected targets before narrowing them. This summary locates work;
it is neither observation evidence nor a substitute for the selected documents.

A `group` entry routes a whole inventory family: decompose its actual sections/dialogs yourself.
A `surface` entry is narrower. Neither label certifies complete observation. `gap` states missing
coverage, not permission to invent policy. Figma/Notion conflicts and missing product facts still
follow AGENTS. For this reference product, inspect linked Figma/Notion originals through `aside-browser`.
Use the target inventory's source links when details are missing, ambiguous, conflicting, require visual
measurement, or the user requests source verification. A link or prepared document is not a browser
observation. If access fails, record the exact unverified fact and affected implementation; do not invent
it or silently switch tools. Transplant projects follow their own source and browser instructions.

### Trace the whole request

To apply AGENTS' whole-workflow requirement, walk entry → input/selection → action → destination
or returned value, including cancellation, failure and recovery where the product defines them.
Read the actual inventory sections to enumerate hosted tables, tabs, dialogs, files and final actions;
an indexed `group` with no `related` entries is not an empty workflow. Do not invent CRUD for read-only,
aggregation or realtime surfaces. Scope the walk to the requested business flow, not the whole product.

In the temporary task checkpoint, map those discovered surfaces/actions and connections to numbered
requirements, or state why they are excluded or unresolved. A requirement may cover several connected
actions when they have one success condition. Give cross-screen work (selection return, navigation,
post-save refresh) an explicit requirement and verification owner; do not leave it between screen tasks.
Use existing `requirements`, `sources`, `surfaces` and `unresolved`, with explanatory Markdown beside
the JSON when needed. The checker validates declared connections, not whether enumeration is complete.

If delegating, preserve these request IDs in each scoped task, identify the shared decision revision,
owned files and dependencies, and assign one owner for common edits and the combined requirement review.
An isolated worktree does not synchronize product decisions. Artifact location and delegation authority
follow AGENTS §5; this checkpoint records the scoped evidence and ownership.

### Start from missing evidence

An unindexed surface starts with a local Markdown observation under `.ai-work/`, linked by
`evidenceGaps.references`; external URLs belong inside that document, not in the reference array.
Record source location, observation time/method/scope, confirmed facts and unanswered questions using
the [inventory evidence rules](../../docs/reference/zero-sol/README.md#근거의-수명과-읽기-범위).
Bind each gap to its own requirement IDs. An indexing gap permits discovery; an unknown product policy
uses `unresolved` and blocks its affected implementation. Missing code alone is neither kind of gap.

Decisions shared by implementations go to their existing durable owner before the consumers diverge.
Before `settled`, retain the implemented surface's minimum evidence in the product inventory and index
it, including unresolved conditions; eliminate the indexing gap, never erase product unknowns to pass.
This is incremental evidence, not a prerequisite to transcribe every page or wait for a second reading.
Temporary observations remain historical evidence until checked; links and local hashes do not prove
that an external source is still current. Follow the inventory's re-observation conditions.

## Prepare before editing

For new screens, workflow changes or API/shared boundary changes, publish the target and excluded
screens, routes and inner surfaces, state owners, applicable contracts with adopt/modify/exclude,
scenario cards, consumed bundles, unresolved questions/sentinels, edit scope and states to verify.
Disclosure, approval and copy/style-only scope follow AGENTS' start gate. The fields below implement it.

Keep the task checkpoint under `.ai-work/`. The native hook supplies the runtime session ID when
preparation is missing. Use that ID with `prepare`; do not invent a second ID for an active runtime.
Session state lives in the checkout you edit: run `node scripts/agents/cli.mjs prepare …` with that
checkout as the working directory (a nested worktree has its own `.ai-work/agent-checks`), because the
hook judges each edit against the checkout the edited file belongs to.
A script-only task needs numbered requirements, scope, references, contracts and unresolved as before.
A workflow task also links each requirement to included surfaces, sources and contract decisions.
Applicable SKILL files follow the actual paths in AGENTS §2; default (undeclared `work`) work on a
feature or route path also needs screen-loop, the request-shaped entry that decides mode, entry and
return points — declared maintenance/infrastructure work does not; an API path also needs api-contract,
and an app error-boundary path also needs shared-ui-contract.
For file creation, relocation or ownership changes, also declare/read folder-structure-contract.
The path-only hook cannot distinguish a behavioral edit from a placement decision; review owns that distinction.
Contract IDs must come from `bundle`, not component/hook names or invented labels:

```json
{
  "scope": ["src/features/performances/screens/list/"],
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
  "references": ["AGENTS.md", ".agents/skills/screen-loop/SKILL.md", ".agents/skills/feature-contract/SKILL.md"],
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
  or be the user request. Section evidence covers that section and its descendants, not a sibling or
  a whole-file replacement; explicitly link shared policy sections when needed. Additional supporting
  sources remain allowed but do not substitute for the target evidence. `contracts` names decisions declared above; when none apply, give an empty
  array and `contractReason` **inside that requirement**, not at checkpoint top level. Example:
  `{ "id": "R2", "text": "Local copy change", "surfaces": ["performance-list"], "sources": ["user"], "contracts": [], "contractReason": "Feature copy only" }`.
  The checker validates connections, not whether the decisions are sound.
- Unknown paths need `evidenceGaps: [{ "paths": ["src/features/new/"], "requirements": ["R1"], "reason": "New surface not yet indexed", "references": [".ai-work/task/observations.md"] }]`.
  This allows evidence discovery without pretending the ledger is complete. It cannot bypass a known
  path's surface. Only that gap's requirements can use its evidence or unindexed coverage.
  `settled` rejects evidence gaps and included index entries with a gap.
- `work: { "kind": "maintenance", "reason": "Copy/style only; no workflow changes" }` keeps small
  maintenance light. `infrastructure` with a reason is for transport/tooling changes without screen
  behavior. These are reviewable declarations, not semantic detection; do not use them to skip a
  workflow's evidence. Script-only scopes default to infrastructure.
- `prefixLoaded: ["AGENTS.md"]` names declared full-file references this runtime already placed in its
  cached prefix through a root pointer, so the first preparation reports them by hash instead of
  rendering a second copy. Entries must also appear in `references` as whole files. The required
  reference check, whole-file hash and staleness detection are unchanged, and a file that changes
  during the session is delivered in full on re-preparation because a runtime prefix cannot reload.
  A session that owns such a reference as scope still receives it again after authoring it. The entry
  is verified, not believed: preparation accepts it only when a runtime pointer in this repository
  actually loads that document, reusing the pointer checks `scripts/contracts` owns, so a suppressed
  delivery rests on a repository fact rather than a session's claim.
- Preparation reports delivered bytes per whole-file selection over 4 KiB with the input that requested
  it, and the total it contributes. This surfaces what a narrowing decision would buy; it never drops a
  selection on its own. `SKILL.md` files stay whole because AGENTS §2 requires reading them in full.
- Product unknowns use `unresolved: [{ "question": "Which wire value?", "paths": ["affected/path/"] }]`.
  Native edits on those paths remain blocked. An indexing gap does not resolve a product unknown.

`prepare` adds the target's evidence and the chosen seed's skill/ADR sections automatically. References
may select an exact heading; root AGENTS and required SKILL files must be read in full. Selected sections
include their children, document introduction and ancestor lead-ins. They do not implicitly include
sibling rules: read linked sections when they affect ownership, exceptions or failure behavior. All
heading/marker references are checked even when another selection includes the whole file.

Overlapping parent/child sections and ancestor lead-ins are delivered once per file. A full-file
request still wins; prepare identifies the checkpoint, surface or bundle input that caused it.
The output reports selection count and delivered reference bytes (excluding coverage/diagnostic notes). Re-preparing suppresses unchanged selections;
a newly requested section in the same file is still delivered. Whole-file hashes detect changes outside
the selected section too. Selected seed code and focused tests still need inspection.

If scope, requirements or references change, prepare again. A reference also in scope may be edited by this task;
other reference changes require re-preparation. Exact files or directory paths with a trailing `/` are
supported. Avoid repository-wide scope. Local baselines survive re-preparation.

Re-preparation preserves every previously prepared requirement ID and its original text. Add a new ID
for changed or added scope; retain the superseded requirement for an `unimplemented` or `different`
review with the reason and replacement ID. Evidence links may be refined. This preserves accountability,
not authorization for a scope change. A new runtime session must receive the original requirements and
recorded changes in its handoff; session-local state cannot recover another session's request history.

## Completion states

Screen work in this repository is reported in four states, in this order and with no fifth word:
**시나리오 확정됨 → 시나리오 구현 완료 → 완료 → 이관 검증됨**. When a claim needs more nuance, split it into
what was observed here and what the target product still has to judge.

- **시나리오 확정됨** — every interaction of the screen is written down in the issue to the business
  request function it ends in and the Korean log line that proves the call, and compared with the
  inventory section. Which surfaces and transitions that comparison must cover is owned by [mutation-actions.md](../../.agents/skills/feature-contract/references/mutation-actions.md#시나리오-상태와-관찰-범위).
- **시나리오 구현 완료** — the implemented, API-disconnected actions were pressed in a browser to their
  final confirmation, the business request function was called and its log observed, and internal
  transitions were confirmed by real URL and screen state. This is the highest state reachable here:
  there is no real API, so evidence stops at request-function reach and internal URL/state.
- **완료**, **이관 검증됨** — real API success and adoption in the target product. Judged only there.

CSS and the real-server connection are outside screen work in this repository; the evidence is inventory
comparison, not design comparison.

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
    "appliedSections": [{ "file": ".agents/skills/feature-contract/references/list-workflow.md", "heading": "Composition index" }],
    "files": ["src/features/performances/screens/list/ui/PerformanceListResult.tsx"],
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

A gap must point somewhere. An `unimplemented` or `different` requirement names either `replacement`,
another requirement ID declared in the same checkpoint, or `blocked`, the condition that stops it.
Recording neither is rejected, because that would close the task on the gap instead of re-entering the
loop. Every requirement except `unimplemented` also names the `appliedSections` it followed, and each
one must appear in what preparation actually delivered to this session; a whole-file delivery covers
its own headings, so a sibling section nobody prepared cannot become the source of a claim. The check
compares delivery, not comprehension: naming a section is not evidence that its rule was understood.

Reconcile the final output with the original request and the discovered actions, not just each screen's
latest checklist. Verify cross-screen input/identity transfer, navigation, cancellation and refresh when
in scope. Record real observations under the owning requirement; API-disconnected request logs do not
prove server success or post-success transitions. List omitted requirements and unverified connections
in the final result. Passing separate task reviews is not proof that the combined workflow works.

Run `node scripts/agents/cli.mjs review SESSION_ID .ai-work/task/review.json`. It runs `contracts:check`
repository-wide, then ESLint and `vitest related` **over the paths this session actually wrote**, and records
the report against those paths; further edits to them invalidate it. Scoping the code checks keeps a
concurrent session's unfinished work from failing — or silently passing — this review. Typecheck, browser
checks and `pnpm verify` still apply and are not run here. Text/paths in the report do not prove a test ran
or a design is correct. `unimplemented` can close accountability, never certify task completion.

Stop and review judge only those authored paths. One outside the declared scope blocks with the exit
stated: add it to the scope with the requirement that justifies it and re-run prepare, or revert it.
Paths this session did not write are listed as reported-not-blocking; name them in `limitations`.

## Put a delegation brief in a file only when it must outlive the message

A brief states the goal, the scope, the owned files, the prohibitions and the expected evidence, and it
never hands over authority: one owner keeps the final edit of any shared file or design decision. Keep
the brief in the dispatch message by default. Write it to `.ai-work/<task>/` instead only when one of
these holds, and say which:

- another agent or session must read it **verbatim**, so paraphrasing in a message would change the task
- it carries quoted requirements or measured output that a message would truncate
- it must survive the dispatch, because the work is reviewed or resumed against the original wording

A brief file is a task artifact, so it follows the naming and expiry below and is never the completion
report. It also never widens authority: it repeats the scope the checkpoint already declares.

## Hand off to another session

A handoff is a prompt the next session can use as written: the paths, the requirement IDs with their
recorded changes, the attempts that failed and why, and the first action to take. It does not replace
the completion report that AGENTS §4 requires, and it never widens the scope the checkpoint declares.

## Name and expire workspace artifacts

Name a task directory `YYYY-MM-DD-NN-slug`: the creation date, that day's sequence number, and a
lowercase slug. The name carries the date so `touch` cannot postpone expiry and `ls` sorts by age.

```sh
node scripts/agents/cli.mjs sweep           # classify only; available without preparation
node scripts/agents/cli.mjs sweep --apply   # remove expired entries; gated like any other write
```

Retention is 7 days for task artifacts and 30 days for session states under `agent-checks/`. An
undated name falls back to mtime and is reported as `undated`. `sweep` classifies every entry:

| Status | Meaning |
| --- | --- |
| `pinned` | `agent-checks`, `gates`, `archive`, `transplant-stage`, or a directory holding a `KEEP` file |
| `live` | a session that owes a review still points at this directory |
| `open` | a state with a write capability and no recorded review |
| `recent` | inside retention |
| `expired` | removed by `--apply` |

`KEEP` holds nothing (keep indefinitely) or one `YYYY-MM-DD` line (keep until that date). Use it for
a handoff another session still has to pick up, not to keep finished analysis around.

An `open` state is never expired by age. Deleting one disarms that session's Stop check, because
`checkStop` treats a missing state as nothing to reconcile. Age can only remove a state whose review
was recorded or that never received a write capability; the rest stay listed until their session
closes. Classification is evidence about accountability, not proof that a directory is disposable.

## Runtime adapters and accountability

Which runtimes the hook reaches, what it cannot intercept, and how a session becomes accountable for the
tree is owned by [runtime-adapters.md](runtime-adapters.md), beside the hook it describes.
