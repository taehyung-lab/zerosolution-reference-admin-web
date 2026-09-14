# Repository preparation and recorded review

일반 작업의 실행 정본은 AGENTS와 screen-loop다. 요구사항·설계·검증 결과는 대화에 남기며,
checkpoint·review·QA 파일을 만들기 위해 이 안내 전체를 읽지 않는다.

이 문서는 문맥 탐색 도구와 **선택한 기록 절차**의 필드·명령·검사 범위를 소유한다.
아래 checkpoint·prepare·review·receipt 의무는 명시적으로 `prepare`한 세션에만 적용된다.
기록 세션의 하위 작업은 별도 준비 없이 일반 모드로 우회할 수 없다. 일반 모드에서는
hook이 범위·미확인·독립 검토 기록을 강제하지 않으며, AGENTS의 판단·검증·안전 의무는 그대로다.

기록 절차는 드릴·감사·재현이 필요한 경우 작업 전에 시작한다. 중간에 시작하면 그 이전 변경은
baseline에 포함되어 해당 receipt의 검토 대상이 아니다. 최초 prepare가 기존 scope 내 변경을
표시하며, 이전 변경은 별도로 검토해야 한다. 동시 쓰기가 있는 공유 트리 대신 분리된 워크트리를 쓴다.
자세한 귀속 한계는 [runtime-adapters.md](runtime-adapters.md)가 소유한다.

## Know which entry the request is

In the recorded protocol, classify **grain** then kind before loading path skills. A whole screen, one component, one hook or
utility, and one file-structure request share the loop and differ in entry, truth, and scope. Put
`grain`, `entry`, and `mode` on the workflow checkpoint — `prepare` rejects if they are missing. Drill is
`mode`, not `work.kind` (opt-in: the user says 드릴, or this repository's document loop is under test).
An existing route does not force drill. A `src/shared` scope is in the loop unless the checkpoint declares
`work.kind` maintenance/infrastructure with a reason; leaving `mode` out is rejected, not exempted.

| grain | kind | entry | truth source | scope |
| --- | --- | --- | --- | --- |
| screen | screen | `context <surface id>`; a screen the index lacks (E0) enters through its outer role's `<reference>#형태` with `surfaces: []` and an `evidenceGaps` observation | inventory, scenario, judgment | that screen's workflow |
| slice | screen | `context` of the parent screen + `rows: [<row ids>]` when the screen is promoted | those rows as one small table, plus the parent policies the index names in that surface's `parentReferences`; without `parentReferences` the whole inventory section still arrives beside the rows, because a row table cannot tell which surrounding prose is relevant. The surface's other references still arrive | the role's files, not the rest of the screen |
| component | shared | `bundle <contract id>` | bundle `skills` and `adrs` | `ownership.shared` only |
| component | feature | parent `context` + feature-contract | consuming screen inventory plus the role section | that component's owner files |
| logic | shared | `bundle <contract id>` + logic-promotion | bundle `tests` are the contract | the mechanic or pure utility's files under `src/shared/lib` |
| logic | feature | parent `context` + the role section | the consuming screen's rows for that behavior | one hook or pure function and its test |
| structure | — | the role `형태` section + folder-structure-contract | file roles and placement, not product values | the file set the `형태` table names |
| (화면 grain) | feature API | 그 화면의 `context` | 해당 화면 inventory | `src/features/*/api` — 화면 workflow의 일부라 grain이 필요하다 |
| — | api (`src/api`) | api-contract (`work.kind` infrastructure) | snapshot plus owning ADR | transport/query/error. grain 없음 |
| mixed | — | every requirement ID in the first checkpoint, split into `units[]`; one `currentUnit` at a time enters through its own grain's row above | each unit's grain source; a future unit's surfaces and sources are checked when that unit becomes current | `scope` equals the current unit's scope; edits in another unit's scope are denied until that unit is prepared |
| — | maintenance | the path skill | the owning document | declared paths |

A screen never copies another screen's implementation. A shared contract never copies `examples.doNotCopy`.
Walk the **route**, not just the screen, because one route entry can compose another feature and
the same file name can mean opposite roles in two of them.

## Find the task context

For a screen/workflow task, first read AGENTS and the applicable skill, then discover the target:

```sh
node scripts/agents/cli.mjs context
node scripts/agents/cli.mjs context <surface-id>
node scripts/agents/cli.mjs context-report
node scripts/agents/cli.mjs context-report --summary
node scripts/agents/cli.mjs bundle
node scripts/agents/cli.mjs bundle <bundle-id>
```

These commands are discovery helpers in both modes. In recorded sessions, exact literal inspection
commands avoid opening a write-attribution bracket. A recorded descendant that has not prepared can
still inspect, but a general shell call requires its own preparation. Ordinary sessions have no such
preparation requirement. The recognizer and its diagnostic limits are owned by
[runtime-adapters.md](runtime-adapters.md). A shell-operator diagnostic explains why a call was not
recognized as inspection; it does not mean preparation can never admit that command.

The `context`, `context-report`, `bundle` and `sweep` (without `--apply`) commands above are read-only, available before prepare. `bundle` lists the valid IDs; an ID returns its code,
reference sections, ADRs, focused tests, ownership split and any scoped consumption examples from the
existing seed declaration ([example semantics](../contracts/README.md#consumption-examples)). The scripts find the product's documents through one
pointer, `docs/reference/product.json` — `{ inventory, judgment, scenarios, index }`, repository-relative
paths, read by `scripts/contracts/product-paths.mjs` for `context`, `prepare` and `contracts:check` alike;
`prepare` hashes the pointer so a change to it is a staleness event. The `index` it names (here
`docs/reference/zero-sol/context.json`) is owned by the
inventory and contains pointers, not copied policies. It connects targets to inventory/scenario
locations, related inner surfaces, applicable references, existing code paths and, per surface, optional
`parentReferences`: the parent policy sections a slice on that surface needs beside its rows. Declare
them only when the relevant policies are known; an empty list is rejected, and an absent field keeps the
whole section. It is not the skill
set: after grain/kind, load that role's `형태` section from the path skill even when the index omitted
it. A surface that cites a skill file which has `형태` must include that heading (or the whole file);
`contracts:check` fails the index otherwise. Paths are discovery
hints, never code ownership or a folder template. Feature API/model files can serve several surfaces;
index those consumers rather than forcing an unrelated screen requirement just to satisfy a path match. Unimplemented paths are left empty. New product paths need explicit
`evidenceGaps` until their own inventory is indexed; replace this product's pointer and index on transplant.

### Read the migrated rows

`context <id>` also returns a `contract` block when that screen's inventory section has rows carrying an
`id`. The row columns and their meaning are owned by
[the inventory table format](../../docs/reference/zero-sol/README.md#표-형식); this section owns only what
the parser derives from them.

- A row is **unresolved** when its `미확인` cell is filled, its `Figma 관찰` contains `(미판독)` or only
  says a frame exists (`frame 존재`, so the composition is unenumerated), or its `Notion 동작·정책` is
  `(대기)`. Reading the `미확인` column alone misses the others and reports a row with an unread original
  as confirmed. `Q<n>` tokens and `질문 <n>` link texts both name the judgment ledger's questions.
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
contributes nothing, so one screen can be promoted without migrating the product. It is not optional for
a finished screen: `stage: settled` is rejected while an included surface has no promoted rows, because
the next task's slice entry reads this screen by machine and an unpromoted table gives it nothing.

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

**Recorded protocol only.** Ordinary work publishes the same relevant reasoning in conversation; it does not create this schema. Selecting prepare activates the existing recorded checks for the session.

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
Applicable SKILL files follow the actual paths in AGENTS §2; work on a feature, route or `src/shared`
path with no declared `work.kind` (or `kind: workflow`) also needs screen-loop, the request-shaped entry
that decides mode, entry and return points — declared maintenance/infrastructure work does not; an API
path also needs api-contract, and an app error-boundary path also needs shared-ui-contract.
For file creation, relocation or ownership changes, also declare/read folder-structure-contract.
The path-only hook cannot distinguish a behavioral edit from a placement decision; review owns that distinction.
A workflow checkpoint must declare `grain` (`screen|slice|component|logic|structure`), `entry`, `mode`
(`implement|drill`), and `design.flow` / `ownership` / `reuse` / `simplicity`. A `src/shared` scope without
`work.kind` uses the same cells with `grain` component or logic and a bundle `entry`. `prepare` rejects the
task if any is missing, and checks three shapes: `entry` must resolve — a context surface id, a seed bundle
id, `<reference file>#형태` whose heading exists, or (structure/logic) an existing path; a `<file>#heading`
entry must also be **delivered**, through `references` or the surface context, or the task is rejected
(an entry nobody reads is not an entry); and a partial grain
(slice, component, logic) may not name a screen or feature directory as scope, only that part's files.
A slice on a promoted screen also names `rows: ["<surface>.<row>", …]` from the `context` output; `prepare`
then delivers those rows as one small table and rejects an id no included surface has. The promoted
surface's own inventory section is dropped only when the index gives that surface `parentReferences`,
which are delivered instead; otherwise the section stays beside the rows. A heading of the same file the
checkpoint lists, and the section of an included unpromoted surface, always arrive, and a whole-file
reference the checkpoint itself lists wins. An unpromoted screen still delivers the whole section, so
promotion plus `parentReferences` is what makes a slice cheap. In the review, cite the delivery as
`{ "file": "<inventory>", "heading": "rows: <ids>" }`, the label prepare printed. `rows` on any other
grain is rejected.

A mixed request keeps every requirement in the first checkpoint and adds
`units: [{ "id", "requirementIds", "scope" }]` with `currentUnit`. `prepare` rejects the task unless every
requirement belongs to exactly one unit, unit scopes are disjoint, `scope` equals the current unit's scope,
and every future scope is already a canonical repository path. On re-preparation, requirement membership
and inactive scopes stay fixed; the active scope may be refined before editing. `grain`, `entry`,
`references` and surface selections describe the current unit: `mixed` is a request classification, not
a `grain` value. Surface, source and contract connections are checked for the current unit's requirements only;
bundle documents are delivered only for contracts those requirements name. Keep explicit references local
to this unit as well; an explicit whole-file request still delivers the whole file.
a future unit is neither approved nor complete, and edits inside its scope are denied until it becomes
current. Each `prepare` call, accepted or rejected, is appended to `.ai-work/agent-attempts/<session hash>.jsonl`
with the checkpoint path, outcome, delivered bytes or error; `review-context <session-id>` prints the
authored paths (`mine`), current-unit authored paths (`active`), external paths, the active fingerprint and
that history without closing the author's open write bracket. Counts alone are not a quality verdict.
It still does not score the *quality* of the design sentences; a reuse, ownership or simplicity defect
found later returns to N3. `design.reuse` is feature-mechanic reuse outside seed bundles; seed
adopt/modify/exclude stays on `contracts[]`.
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
  Paths may belong to any declared unit; retain the question and its affected paths across units. Native
  edits on those paths remain blocked until `resolution: { status: resolved | irrelevant, evidence, sources }`
  records the answer or why it does not affect this work. Sources are Markdown references under the product
  pointer's inventory, scenarios or judgment locations, or `user`; root/skill prose cannot clear this block.
  Only active-unit resolution sources load now. Surface selections and evidence gaps describe
  the active unit, whereas full requirements and unanswered questions persist. An indexing gap does not
  resolve a product unknown. Review must verify that the cited fact actually resolves the question.

`prepare` adds the target's evidence and the adopted or modified seeds' skill/ADR sections automatically;
an excluded contract's sections are not delivered, since the exclusion was decided before preparing. References
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

Use a status that says what was actually verified; do not turn it into another artifact requirement.

- **시나리오 확정됨** — the relevant interactions, inputs, outcomes and failure/recovery conditions are
  grounded in confirmed product evidence. Keep the comparison in the current request; an issue or
  separate scenario file is not mandatory for every task.
- **시나리오 구현 완료** — the implemented interactions and internal transitions were exercised with
  real rendered state and URL changes where applicable. State explicitly if the API was mocked or
  disconnected; a business-function log proves only the call that was observed.
- **완료** — the request's actual acceptance criteria, including required visual and real API behavior,
  passed. Missing product facts, a mock-only result or an unexecuted check cannot be reported as verified.
- **이관 검증됨** — the target product's first real consumer and required execution checks establish
  adoption there; source fixtures and a staged copy alone do not.

Read the environment and unresolved API facts through AGENTS §1 and the product evidence pointer.
A source rehearsal without the real server cannot prove real-server acceptance. Earlier workflow
trials that excluded visual work do not remove visual acceptance from a new request. Components,
logic and structure use their own requirement evidence; do not impose screen status machinery on them.

### Loop acceptance trials

A loop is judged by an actual fresh-session request and its implementation and evidence, not by
receipt creation. Ordinary trials need no checkpoint/review/DRILL files. Keep a reproducible record only
when it will be reused; recorded trials use the optional prepare/review protocol.

- **Normal trials** cover screen, slice, component, logic, structure and a mixed request. Give a fresh
  session one sentence without a tailored brief and examine the resulting code, requirement coverage,
  ownership and actual checks. A genuine product unknown is a valid stop, not a successful implementation.
  Existing source scripted fixtures and partial fresh-session trials do not prove this whole set or
  another product's acceptance. Exact historical scope is in screen-loop
  [observations](../../.agents/skills/screen-loop/references/observations.md).
- **Negative trials** the independent reviewer must catch, planted deliberately: a consumer-only policy
  added to a shared prop under an unchanged export name; a guessed enum reported as a `matched` row; a
  URL, Query or Form value duplicated into a local store; the same responsibility repeated through a
  controller or wrapper; a mixed request whose remaining units were dropped from the final reconciliation.
  These semantic claims can pass the mechanical checks; a reviewer must reject the planted defect using
  actual code and product evidence. Report which command was exercised, not a blanket all-gates-pass claim.
- **Transplant** is judged in the target repository with a real requirement, first consumer and executed verification, never
  by a hash mismatch or an empty-checkpoint rejection ([bundle application](../contracts/README.md#applying-a-bundle-to-a-new-product)).

## Review the actual output

**Recorded protocol only:** the JSON fields and CLI receipt below apply after prepare. Ordinary work reconciles requirements, actual diff and execution results in its final report, with independent review where AGENTS §5 requires it.

Compare the diff with every requirement and its evidence: target and inner-surface coverage, existing
shared candidates, invented product facts, single state ownership, necessary complexity and actual
failure/recovery behavior. Record each original requirement exactly once as `implemented`,
`unimplemented` or `different` (with `units`, the current unit's requirements). Every path this session
wrote must appear in some requirement's `files`, whatever the work kind; loop requirements (workflow, or a
`src/shared` implement/drill) that are implemented/different also need non-empty in-scope `files` and
`verification` methods/results. When the prepared state holds selected inventory rows (a screen's promoted
rows, or a slice's `rows`), the review also carries `rows[]`:

```json
{
  "requirements": [{
    "id": "R1", "status": "implemented", "evidence": "Observed both sort directions on repeated clicks.",
    "appliedSections": [{ "file": ".agents/skills/feature-contract/references/list-workflow.md", "heading": "Composition index" }],
    "files": ["src/features/performances/screens/list/ui/PerformanceListResult.tsx"],
    "verification": [{ "method": "Browser interaction", "result": "ascending → descending → ascending", "artifact": ".ai-work/task/browser-report.md" }]
  }],
  "rows": [{
    "id": "performance-list.sort", "verdict": "matched", "requirementIds": ["R1"],
    "files": ["src/features/performances/screens/list/ui/PerformanceListResult.tsx"],
    "evidence": "Seven sort keys in the row, seven in the schema and the header set."
  }, {
    "id": "performance-list.venue", "verdict": "blocked", "requirementIds": ["R1"], "files": [],
    "evidence": "The venue option list is not enumerated.",
    "unresolved": { "status": "blocked", "evidence": "Q7 has no answer.", "sources": [{ "file": "docs/reference/zero-sol-figma-analysis.md", "heading": "질문 7" }] }
  }],
  "contractReview": "data-table adopted unchanged: the column meta and getRowId stay feature-owned; no prop was added for this caller.",
  "complexityReview": "The sort transition stays with its state owner; no controller or duplicated state was added.",
  "independentReview": { "reviewer": "Codex (fresh context)", "revision": "3f2a9c1", "fingerprint": "<review-context fingerprint of the reviewed diff>", "findings": ["policy test missed the same-column click; added"] },
  "assumptions": [], "limitations": ["No real API connection."]
}
```

These sentences illustrate the fields. Explain this diff’s actual contract and complexity decisions.
The gate does not score prose quality or blacklist example wording: punctuation alone bypassed the old
exact-string rejection without improving evidence. Independent review compares the claims with code
and results; requirement/contract coverage, source fingerprints and execution receipts remain checked.

Artifacts are optional; when supplied they must exist. Files must exist in scope or be a recorded
baseline deletion. Unimplemented requirements keep their reason in `evidence`; they need no fabricated
implementation file. Maintenance reviews keep the smaller requirement status/evidence shape, but a path
they wrote still has to be claimed in `files`. Explicit infrastructure reviews claiming executable code
also need structured `verification`, even with no mode; relabeling the work is not evidence of its correctness.
all reviews still require top-level `contractReview`, `complexityReview`, `assumptions` and `limitations`.

`rows[]` lists every selected row exactly once — the denominator is this unit's selection, never the
screen's full specification. Each row names `verdict` (`matched` | `different` | `blocked`), `evidence`,
the `requirementIds` it affects (current-unit ids) and `files` drawn from the files those requirements
claim (empty only when `blocked`). A row whose inventory cell is unresolved also names
`unresolved: { status: blocked | resolved | irrelevant, evidence, sources, requirementIds? }` with sources this session was
actually delivered from that row's inventory, scenarios, parent references or product judgment, or `user`.
Root instructions and skill prose cannot resolve a product question. A `blocked` disposition forces
`verdict: blocked` and none of the affected requirements may be `implemented`. `unresolved.requirementIds`
may identify the nonempty affected subset of the row's ids; omit it to affect the whole row. Explain why
the other requirements are independent of the question, and have the reviewer check that distinction.
This binds rows to implementation locations and unresolved facts to requirements; it does
not check that a `matched` row is true, which is the independent reviewer's negative task.
When no contract changes apply, say so with the reason; do not omit those fields.
A reuse, ownership or simplicity defect names the return node (`N3`, `N4`, `E6`) in `contractReview` or
`complexityReview`. The gate checks that the fields exist and three shapes of saying nothing, not whether
the judgment is right:

- A loop review (workflow, or a `src/shared` implement/drill), and any review whose scope touches
  `scripts/agents/`, `scripts/contracts/`, `.agents/skills/`, `AGENTS.md` or `eslint.config.js`, records
  `independentReview` `{ reviewer, revision, fingerprint, findings[] }`: someone other than the author — another model
  in a fresh context or a person — opened the diff and the owning documents (AGENTS §5, screen-loop N6).
  `fingerprint` is the value `review-context <session-id>` prints for this unit's authored paths at
  the time of the review; a review whose fingerprint differs from the current one is refused, so a
  verdict on an older diff cannot close a newer one. The reviewer's identity is provenance, not proof of
  understanding. The drills measured that this is the only check that reads judgment content; an empty `findings` array
  is a recorded verdict, a missing field is not. A scope declared wider than those roots (`scripts/`)
  escapes the regex and is a review finding, not a gate result.
- `contractReview` names every `contracts[]` id the checkpoint declared and says what happened to it.
- A seed bundle whose code roots export a different set of names than when this session prepared must
  carry a `modify` decision on `contracts[]`; otherwise the review is rejected with E6. The comparison
  reads the code, not `SEED_BUNDLE_EXPORTS`, so forgetting the table does not hide the change (the table
  itself is `contracts:check`'s job). Same names with a widened prop or argument type is not caught here
  and stays with the reviewer.

A gap must point somewhere. An `unimplemented` or `different` requirement names either `replacement`,
another requirement ID declared in the same checkpoint, or `blocked`, the condition that stops it.
Recording neither is rejected, because that would close the task on the gap instead of re-entering the
loop. Every requirement except `unimplemented` also names the `appliedSections` it followed, and each
one must appear in what preparation actually delivered to this session; a whole-file delivery covers
its own headings, and a delivered parent heading covers its descendant headings, so a sibling section nobody prepared cannot become the source of a claim. The check
compares delivery, not comprehension: naming a section is not evidence that its rule was understood.

Reconcile the final output with the original request and the discovered actions, not just each screen's
latest checklist. Verify cross-screen input/identity transfer, navigation, cancellation and refresh when
in scope. Record real observations under the owning requirement; API-disconnected request logs do not
prove server success or post-success transitions. List omitted requirements and unverified connections
in the final result. Passing separate task reviews is not proof that the combined workflow works.

Run `node scripts/agents/cli.mjs review SESSION_ID .ai-work/task/review.json`. It runs `contracts:check`
repository-wide, then ESLint and `vitest related` **over the active unit's authored paths**, as child
processes whose receipts — command, start/end, exit code, signal, stdout/stderr files and digests — are written under
`.ai-work/agent-receipts/<id>/` and stored in the recorded review. Each receipt carries the fingerprint of
the active authored paths at that moment. Independent-review work requires an executed contracts-check
receipt even when calling `recordReview` directly. A failed check, changed receipt/output or different
fingerprint refuses review and Stop; further source edits invalidate the recorded review. Scoping the code checks keeps a
concurrent session's unfinished work from failing — or silently passing — this review. Typecheck, browser
checks and `pnpm verify` still apply and are not run here; cite them in `verification` with their artifact.
Prose in the report does not prove a test ran or a design is correct; the receipt proves the process ran
and how it exited. `unimplemented` can close accountability, never certify task completion.

With `units`, a review records the current unit only: requirements, delivered document digests, claimed
files (including unchanged adopted files), authored files and check receipts are kept. The
next unit is prepared with a new `currentUnit`, and Stop reports `Request units pending` until every unit
has a recorded review. Changed inputs invalidate that unit at Stop, but do not prevent another unit from
being re-prepared and reviewed: repair affected units one at a time, including when a shared reference changed.
Writes belonging to another declared unit remain accountable to that unit; writes outside all unit scopes
are rejected. Whole-request accountability is closed only when every original requirement is implemented,
replaced or blocked with its condition — not when the last unit's review passes.

Stop and review judge only those authored paths. One outside the declared scope blocks with the exit
stated: add it to the scope with the requirement that justifies it and re-run prepare, or revert it.
Paths this session did not write are listed as reported-not-blocking; name them in `limitations`. A path
that moved while this session held a shell write bracket, but lies outside its scope and inside another
prepared session's declared scope **and that session's own bracket caught it too**, is that session's
write and is reported the same way, when this session has writes of its own to report (a drill subagent's
`prepare` bracket caught its parent's edits and had no exit, 2026-09-13). Scope alone is not a claim: a
shell write into a path another session declared but never touched stays this session's to revert or
re-scope.

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

Retention is 7 days for task artifacts and 30 days for session states under `agent-checks/`. Pending mixed
units keep their state and task artifacts live even if the current unit has a review. Attempt history and
check receipts are pinned; this sweep does not garbage-collect them automatically. An
undated name falls back to mtime and is reported as `undated`. `sweep` classifies every entry:

| Status | Meaning |
| --- | --- |
| `pinned` | `agent-checks`, `agent-attempts`, `agent-receipts`, `gates`, `archive`, `transplant-stage`, or a directory holding a `KEEP` file |
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
