# Runtime adapters and accountability

Owner: how this repository's hook reaches each agent runtime, what it can and cannot intercept, and how a
session becomes accountable for the tree. The preparation and review procedure lives in
[README.md](README.md); this file is for whoever changes `hook.mjs`, an adapter file, or the trust model.

Checked-in commands require Node 24 and Git on the runtime PATH. Transplant hook files are merge templates:
review runtime availability, repository paths and native trust before enabling them in another environment.

- Codex: `.codex/hooks.json`; inspect and trust the exact hook using `/hooks`. A changed definition needs trust again.
- Claude Code: `.claude/settings.json`; workspace trust and active settings determine whether hooks run.
- Copilot: `.github/hooks/reference.json`; CLI may also discover Claude settings, so handlers are idempotent.
- Other runtimes: use the same prepare/review commands and root instructions. An adapter must be implemented and
  exercised before claiming automatic interception there. “All agents” means one contract, not undocumented hook support.

Native Edit/Write/apply_patch calls check target scope before execution, but only once the tool accepts the
call: an Edit whose `old_string` does not match fails inside the tool first, so that path never reaches the
handler and never reports a scope or unresolved reason. Measure a path boundary with Write. General shell calls require preparation,
but their write targets are not inferred from shell text. Each adapter's `matcher` must list every tool name the
handler answers (`preflight.test.mjs` fails when one drifts); a name the matcher omits is never intercepted.

Read-only inspection stays available without preparation: `read`, `cat`, `ls`, `rg`, `grep`, `wc`, `pwd`,
Git `status`/`diff`/`log`/`show`/`ls-files`/`rev-parse` (including leading `-C <path>` or `-C<path>`),
`find` limited to read-only predicates, and `sed -n <range>p`. `rtk` and `rtk proxy` wrappers are recognized.
Git config/alias options, external diff/text conversion and output-to-file options remain gated.
General Python/Node programs cannot be classified as read-only from their executable name.
The writing forms of the same
commands (`find -exec`/`-delete`/`-fprint`, `sed -i`/`-f`/`w`) require preparation. Literal quoted arguments
are decoded before command/option checks, so `rg 'a|b' file` is inspection while a real pipe,
redirection, separator or substitution requires preparation. Unsupported shell escapes/expansions are
conservatively gated; quote glob patterns such as `find scripts -name '*.mjs'`. This is a limited argv
recognizer, not a shell parser. Writes under `.ai-work/` remain available for preparation.
A filtering wrapper such as `rtk` can truncate a long file without marking the cut (measured 2026-09-10:
a 98-line reference printed as its first five lines). Read anything you will quote or judge through the
runtime's file-read tool or `sed -n <range>p`, not through a wrapped `cat`.

Orchestration RPC is also available without preparation: `orca orchestration` messaging (`send`, `check`,
`reply`, `ask`, `inbox`), run/task bookkeeping (`run-create`, `run-show`, `run-list`, `task-create`,
`task-update`, `task-list`), read-only worker inspection (`dispatch-show`, `worker-show`, `worker-read`,
`worker-list`, `status`) and gates. These reach the runtime, never the checkout, and accountability composes
per session: a message that makes another agent edit files is still gated on that agent's own session. Blocking
them only strands a finished worker that cannot report `worker_done` or read coordinator mail, and it made a
coordinator accountable for the whole tree for merely sending mail. `worker-start` and `dispatch` stay gated
because `--setup run` executes project scripts; every `orca terminal`, `orca worktree` and `orchestration reset`
call stays gated because it acts on the checkout. Quote message bodies and keep active shell expansion
or operators out of the command. A literal metacharacter inside single quotes is ordinary message data.

Shell text never reveals a write target, so a session is measured by what moves while it holds a write
capability rather than by what its command line says. The pre-tool handler opens a bracket when it grants
one — a native edit inside scope, or any general shell call — and the post-tool handler closes it; whatever
changed in between is attributed to that session. Register both events, or attribution widens from a single
tool call to the gap between two of the session's calls, which is the fallback on runtimes without a
post-tool event. The probe is size and mtime, so a same-size rewrite inside one millisecond can be missed;
that only demotes a path to reported-not-blocking, never the reverse.

Review/stop reconciles those authored paths against the preparation snapshot, even after a commit, and
rejects out-of-scope or unresolved ones with the correction stated. A session that only ran recognized
inspection commands received no write capability and owns nothing. Concurrent edits are reported, never
blocking: they belong to another session, and blocking on them previously left a session with no reachable
exit. Mention them in the report's limitations; this is not a gate-exclusion field. Re-preparation preserves
both the baseline and the attribution, so widening scope cannot erase what the session already wrote.
Attribution narrows the window; it is not proof of authorship, and a shared tree still costs review time —
prefer one writing session or an isolated worktree. A worktree that a runtime creates **inside** the
checkout (Claude Code uses `.claude/worktrees/`) is listed by the parent's `git ls-files --others` as one
directory path; until 2026-09-10 the snapshot read it as a file and the Stop hook died with EISDIR, and
`eslint .` walked the second tree too. Register such roots in `.gitignore` and the ESLint ignores; the
snapshot now treats a directory entry as absent. Unsupported MCP/custom write
tools and interactive shell continuations are not a complete interception boundary. Review and Git/CI remain
necessary; do not describe this as a sandbox.
No transcript, prompt, secret or global agent configuration is read or modified by these scripts.
Normal and negative controls live in `preflight.test.mjs`; runtime input fixtures prove adapter decisions,
not installation/trust or every native tool path. Report native runtime measurements separately.
Freeze source while a same-tree preparation rehearsal runs. Even a source-read-only worker becomes
accountable after a general shell command (such as copying a log; recognized inspection/RPC is exempt). Later
coordinator edits can then block its Stop. Use a frozen checkout; do not broaden the worker scope or
reset its baseline to conceal another session’s edits.

Source contracts checked 2026-09-06: [Codex hooks](https://learn.chatgpt.com/docs/hooks),
[Claude hooks](https://code.claude.com/docs/en/hooks),
[Copilot hooks](https://docs.github.com/en/copilot/reference/hooks-reference).
Recheck adapters when the runtime payload, hook coverage or trust model changes.
