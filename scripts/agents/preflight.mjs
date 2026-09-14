import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { SEED_BUNDLES, currentBundleExportNames } from '../contracts/seed.mjs'
import { claudeAgentsImportFailure, copilotAgentsPointerFailure } from '../contracts/contracts.mjs'
import { referenceOf, referenceCovers, selectedDocuments } from './document-context.mjs'
import { SURFACE_INDEX, workKind, workflowContext, loopApplies, independentReviewRequired, loopDeclarationFailures, entryResolutionFailure } from './surface-context.mjs'

const hash = (value) => createHash('sha256').update(value).digest('hex')
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const text = (value) => typeof value === 'string' && value.trim().length > 0
const within = (path, scope) => scope.some((entry) => path === entry || (entry.endsWith('/') && path.startsWith(entry)))

export function localPath(root, file) {
  const path = relative(root, resolve(root, file)).replaceAll('\\', '/')
  if (!path || path.startsWith('../') || path === '..') throw new Error(`Path outside repository: ${file}`)
  return path
}

function stateFile(root, session) {
  if (!text(session)) throw new Error('A runtime session ID is required')
  return resolve(root, '.ai-work/agent-checks', `${hash(session)}.json`)
}
function load(root, session) {
  const file = stateFile(root, session)
  return existsSync(file) ? readJson(file) : null
}
function save(root, session, state) {
  const file = stateFile(root, session)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(state, null, 2))
}

/** Without Git there is nothing to enumerate; the hook reports no output rather than failing the call. */
function trackedPaths(root) {
  try {
    const listing = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, maxBuffer: 32 * 1024 * 1024 })
    return [...new Set(listing.toString().split('\0').filter(Boolean))].filter((path) => !path.startsWith('.ai-work/')).sort()
  } catch { return [] }
}

// Include untracked source and deletions; ignored build artifacts and session notes are excluded by Git.
// Git lists a nested checkout (an agent worktree created inside the repository) as one directory path;
// reading it as a file threw EISDIR and killed the Stop hook on 2026-09-10. A directory snapshots as
// null, the same as an absent file, so the union in changedPaths still sees a file replaced by one.
export function outputSnapshot(root) {
  return Object.fromEntries(trackedPaths(root).map((path) => [path, fileHash(resolve(root, path))]))
}

function fileHash(path) {
  try { return statSync(path).isFile() ? hash(readFileSync(path)) : null } catch { return null }
}

/**
 * Attribution probe: size and mtime, ~2ms against ~70ms for content hashes, because it runs on both
 * sides of every granted tool call. A write always moves mtime, so a missed attribution would need a
 * same-size rewrite inside one millisecond; that only demotes a path to `external`, which reports
 * instead of blocking, and the content snapshot still sees the change.
 */
function traceSnapshot(root) {
  return Object.fromEntries(trackedPaths(root).map((path) => {
    try {
      const stats = statSync(resolve(root, path))
      return [path, stats.isFile() ? `${stats.size}:${stats.mtimeMs}` : null]
    } catch { return [path, null] }
  }))
}

/** Closes an open write bracket: whatever moved while this session held the capability is its own. */
function settle(root, session, state, probe = traceSnapshot) {
  if (!state?.trace) return state
  const authored = [...new Set([...(state.authored ?? []), ...changedPaths(state.trace, probe(root))])].sort()
  const settled = { ...state, authored, trace: null }
  save(root, session, settled)
  return settled
}

export function settleWrite(root, session, probe = traceSnapshot) {
  settle(root, session, load(root, session), probe)
}

/**
 * Opens a write bracket. Shell text never reveals its write target, so the session is measured by
 * what moves while it holds the capability rather than by what its command line says. Opening also
 * closes any previous bracket, which keeps attribution working on runtimes without a post-tool event
 * — the window then widens from one tool call to the gap between two of this session's calls.
 */
export function noteWrite(root, session, probe = traceSnapshot) {
  const state = load(root, session)
  if (!state) return
  save(root, session, { ...settle(root, session, state, probe), wrote: true, trace: probe(root) })
}

/**
 * Paths whose working copy differs from the remote default branch (`origin/HEAD`). A path this session
 * moved that now equals it is pulled or merged work, not this session's output: after `git pull` of a
 * merged PR that PR's whole diff otherwise counted as out-of-scope writes (2026-09-11). A local commit
 * stays owned. The tree alone cannot tell a pull from a direct push to the default branch, so the
 * remote-tracking reflog decides: when that ref last moved by `update by push` from this checkout, the
 * content is this checkout's own and nothing is filtered. Without `origin/HEAD`, or when Git fails,
 * `null` leaves every change in play — and nothing is logged, so the filter can be off silently.
 */
export function unsettledPaths(root) {
  const git = (args) => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }).toString()
  try {
    const remote = git(['rev-parse', '--verify', '--quiet', 'refs/remotes/origin/HEAD']).trim()
    const branch = git(['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD']).trim()
    const lastMove = git(['reflog', 'show', '-n', '1', '--format=%gs', branch]).trim()
    // Only the last entry is read: a fetch after the push overwrites it and the pushed paths are filtered
    // again. No reflog (core.logAllRefUpdates off) leaves the question open, so nothing is filtered either.
    if (!lastMove || lastMove.startsWith('update by push')) return null
    const differing = git(['diff', '--name-only', '--no-renames', '-z', remote, '--']).split('\0')
    const untracked = git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0')
    return new Set([...differing, ...untracked].filter(Boolean))
  } catch { return null }
}

/** A subagent's session id is `<parent session>/<agent id>` (hook.mjs sessionOf); the parent is the prefix. */
const parentOf = (session) => session.includes('/') ? session.slice(0, session.lastIndexOf('/')) : undefined

/**
 * States that subagents of this session prepared in this checkout. The one who delegated answers for the
 * result: a subagent's writes join the parent's review set, so a subagent that never reached its own
 * SubagentStop (killed, or a runtime without that event) still leaves nothing unreviewed.
 */
function delegated(root, session) {
  const directory = resolve(root, '.ai-work/agent-checks')
  if (!existsSync(directory)) return []
  return readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .map((file) => { try { return readJson(resolve(directory, file)) } catch { return null } })
    .filter((state) => state?.parent === session)
}

/**
 * Scopes other sessions declared in this checkout (not this session, not its subagents). A write bracket
 * attributes whatever moved while it was open, so a concurrent session's edit lands in this session's
 * `authored` too; when that path is outside this session's scope and inside the other session's, it is
 * that session's write. Measured 2026-09-13: a drill subagent's `prepare` bracket caught its parent's two
 * skill edits, and its Stop check then had no exit (revert or re-scope another session's work).
 */
function otherSessionClaims(root, session) {
  const directory = resolve(root, '.ai-work/agent-checks')
  if (!existsSync(directory)) return []
  const own = stateFile(root, session)
  const descendant = (parent) => parent === session || (typeof parent === 'string' && parent.startsWith(`${session}/`))
  return readdirSync(directory)
    .filter((file) => file.endsWith('.json') && resolve(directory, file) !== own)
    .map((file) => { try { return readJson(resolve(directory, file)) } catch { return null } })
    .filter((state) => state && !descendant(state.parent) && state.wrote === true && Array.isArray(state.checkpoint?.scope))
    .map((state) => ({ scope: state.checkpoint.scope, authored: new Set(state.authored ?? []) }))
}

/**
 * Paths this session is accountable for, and the concurrent edits it must never be blocked by. A path is
 * handed to another session only when that session's own bracket also caught it (`authored`) and it lies
 * inside that session's scope and outside this one's — scope alone would let a shell write into anyone's
 * declared scope escape both sessions (independent review, 2026-09-13).
 */
function partitionChanges(state, current, unsettled, children = [], foreignClaims = []) {
  const changed = changedPaths(state.baseline, current).filter((path) => unsettled === null || unsettled.has(path))
  const authored = new Set([...(state.authored ?? []), ...children.flatMap((child) => child.authored ?? [])])
  const ownScope = state.checkpoint.scope
  const claimedElsewhere = (path) => !within(path, ownScope) && foreignClaims.some((claim) => claim.authored.has(path) && within(path, claim.scope))
  const mine = changed.filter((path) => authored.has(path) && !claimedElsewhere(path))
  return { mine, external: changed.filter((path) => !mine.includes(path)) }
}

const fingerprintOf = (mine, current) => hash(JSON.stringify(mine.map((path) => [path, current[path]])))
const listed = (paths) => paths.length > 6 ? `${paths.slice(0, 6).join(', ')} and ${paths.length - 6} more` : paths.join(', ')
const externalNote = (external) => external.length
  ? ` Reported, not blocking: ${external.length} path(s) changed outside this session's writes (${listed(external)}); name them in the review's limitations.`
  : ''

/** A whole-file delivery this large is worth a narrowing decision; smaller ones are noise to report. */
const WHOLE_FILE_NOTICE = 4 * 1024
export const BUILD_STAGE = 'build'
export const SETTLED_STAGE = 'settled'

function stageOf(checkpoint) {
  return checkpoint.stage ?? BUILD_STAGE
}

/**
 * What a runtime places in its prefix is decided by the pointer files in this repository, not by a
 * checkpoint's word. Reusing the same pointer facts `scripts/contracts` enforces keeps one owner, so a
 * suppressed delivery rests on something the repository can show rather than on a session's claim.
 */
function rootPointerDocuments(root) {
  const loaded = new Set()
  const pointers = [
    ['CLAUDE.md', claudeAgentsImportFailure],
    ['.github/copilot-instructions.md', copilotAgentsPointerFailure],
  ]
  for (const [file, failureOf] of pointers) {
    const path = resolve(root, file)
    if (existsSync(path) && failureOf(readFileSync(path, 'utf8')) === null) loaded.add('AGENTS.md')
  }
  return loaded
}

function requiredReferences(scope, checkpoint) {
  const paths = scope.join('\n')
  const refs = ['AGENTS.md']
  // Screen work enters through the loop skill before any path-routed contract, so it is listed first and
  // the first missing-reference message names it. Whether the loop applies is one predicate
  // (`loopApplies`); this only narrows it to the paths that are requests: feature, route and shared.
  // App-shell paths and declared maintenance/infrastructure stay on the contracts alone.
  if (loopApplies(checkpoint) && /src\/(features|routes|shared)\//.test(paths)) refs.push('.agents/skills/screen-loop/SKILL.md')
  if (/src\/(features|routes|app)\//.test(paths)) refs.push('.agents/skills/feature-contract/SKILL.md')
  if (/src\/shared\/|src\/app\/error-boundary\//.test(paths)) refs.push('.agents/skills/shared-ui-contract/SKILL.md')
  if (/openapi\/|src\/api\/|src\/features\/[^/]+\/api\/|src\/app\/providers\//.test(paths)) refs.push('.agents/skills/api-contract/SKILL.md')
  return refs
}

export function prepare(root, session, checkpointFile, snapshot = outputSnapshot) {
  const checkpointPath = localPath(root, checkpointFile)
  if (!checkpointPath.startsWith('.ai-work/')) throw new Error('Keep task checkpoints in .ai-work/')
  const checkpoint = readJson(resolve(root, checkpointPath))
  const { scope, requirements, references, contracts, unresolved, prefixLoaded = [] } = checkpoint
  if (!Array.isArray(scope) || !scope.length || !scope.every((path) => text(path) && localPath(root, path) === path.replace(/\/$/, ''))) throw new Error('Declare exact files or directory/ scope')
  if (!Array.isArray(requirements) || !requirements.length || !requirements.every((item) => text(item.id) && text(item.text)) || new Set(requirements.map((item) => item.id)).size !== requirements.length) throw new Error('Declare unique numbered requirements')
  const previous = load(root, session)
  for (const original of previous?.checkpoint.requirements ?? []) {
    if (!requirements.some((item) => item.id === original.id && item.text === original.text)) {
      throw new Error(`Preserve requirement ${original.id} and its text. Add a new ID for changed scope; review the original as unimplemented or different with the reason.`)
    }
  }
  if (!Array.isArray(references)) throw new Error('Declare repository Markdown references')
  const referenceFiles = references.map(referenceOf).filter((reference) => reference.heading === undefined).map((reference) => reference.file)
  for (const file of requiredReferences(scope, checkpoint)) {
    if (referenceFiles.includes(file)) continue
    // The loop is required because nothing declared this as non-request work; say so, or the reader only learns to add a file.
    const exemption = file.endsWith('screen-loop/SKILL.md') ? ' (an implementation request reads it first; copy/style or tooling work instead declares work.kind maintenance|infrastructure with a reason)' : ''
    throw new Error(`Required reference: ${file}${exemption}`)
  }
  if (!Array.isArray(prefixLoaded) || !prefixLoaded.every((file) => text(file) && referenceFiles.includes(file))) {
    throw new Error('prefixLoaded may only name declared full-file references')
  }
  const rootLoaded = rootPointerDocuments(root)
  const unproven = prefixLoaded.filter((file) => !rootLoaded.has(file))
  if (unproven.length) {
    throw new Error(`prefixLoaded is verified against this repository's runtime pointers, not declared: ${unproven.join(', ')} is not one of ${[...rootLoaded].join(', ') || 'none'}`)
  }
  if (![BUILD_STAGE, SETTLED_STAGE].includes(stageOf(checkpoint))) throw new Error(`stage must be "${BUILD_STAGE}" or "${SETTLED_STAGE}"`)
  if (!Array.isArray(contracts) || !contracts.every((item) => SEED_BUNDLES.some((bundle) => bundle.id === item.id) && ['adopt', 'modify', 'exclude'].includes(item.decision) && text(item.reason))) throw new Error('Declare known seed bundle decisions and reasons; discover IDs with node scripts/agents/cli.mjs bundle (contracts may be empty when none apply)')
  if (new Set(contracts.map((item) => item.id)).size !== contracts.length) throw new Error('Duplicate contract decisions')
  if (!Array.isArray(unresolved) || !unresolved.every((item) => text(item.question) && Array.isArray(item.paths) && item.paths.length > 0 && item.paths.every((path) => text(path) && within(path, scope)))) throw new Error('Unresolved questions must name affected paths inside scope')
  const loopFail = loopDeclarationFailures(checkpoint)[0]
  if (loopFail) throw new Error(loopFail)
  const context = workflowContext(root, checkpoint)
  const entryFail = entryResolutionFailure(root, checkpoint)
  if (entryFail) throw new Error(entryFail)
  // An excluded contract was read to be excluded; its skill and ADR sections are not delivered again.
  const bundleRefs = contracts.filter(({ decision }) => decision !== 'exclude').flatMap(({ id }) => {
    const bundle = SEED_BUNDLES.find((candidate) => candidate.id === id)
    return [...bundle.skills, ...bundle.adrs]
  })
  // A slice with named rows receives those rows instead of the promoted surface's inventory reference; a
  // whole-file request the checkpoint itself made still wins, because the author asked for it.
  const refKey = (value) => { const ref = referenceOf(value); return JSON.stringify([ref.file, ref.heading ?? null]) }
  const explicit = new Set(references.map(referenceOf).filter((ref) => ref.heading === undefined).map((ref) => ref.file))
  const inputs = [...references, ...context.references, ...bundleRefs]
    .filter((ref) => !context.rowDelivery.skip.has(refKey(ref)) || explicit.has(referenceOf(ref).file))
  const documents = [...selectedDocuments(root, inputs), ...context.rowDelivery.documents.filter((doc) => !explicit.has(doc.file))]
  const originsOf = (file) => {
    const origins = []
    if (references.some(ref => referenceOf(ref).file === file && referenceOf(ref).heading === undefined)) origins.push('checkpoint.references')
    if (context.references.some(ref => referenceOf(ref).file === file && referenceOf(ref).heading === undefined)) origins.push('surface context or requirement.sources')
    for (const {id} of contracts.filter(({ decision }) => decision !== 'exclude')) {
      const bundle=SEED_BUNDLES.find(bundle=>bundle.id===id)
      if ([...bundle.skills,...bundle.adrs].some(ref=>referenceOf(ref).file===file && referenceOf(ref).heading===undefined)) origins.push(`bundle:${id}`)
    }
    return origins
  }
  const fullOverrides = documents
    .filter(document => document.heading === undefined && inputs.some(ref => referenceOf(ref).file === document.file && referenceOf(ref).heading !== undefined))
    .map(document => `Full-file selection overrides headings: ${document.file} (${originsOf(document.file).join(', ')})`)
  const rendered = Object.fromEntries(documents.map((document) => [document.key, hash(document.selected)]))
  const hashes = Object.fromEntries(documents.map((document) => [document.file, hash(document.content)]))
  if (context.indexed) hashes[SURFACE_INDEX] = hash(readFileSync(resolve(root, SURFACE_INDEX)))
  save(root, session, {
    checkpointPath, checkpointHash: hash(readFileSync(resolve(root, checkpointPath))), checkpoint,
    documents: hashes, rendered,
    baseline: previous?.baseline ?? snapshot(root), review: null, wrote: previous?.wrote ?? false,
    // Attribution survives re-preparation: a wider scope must not erase what this session already wrote.
    authored: previous?.authored ?? [], trace: previous?.trace ?? null,
    // The public export names each bundle's code roots had when this session started; review compares
    // the code again, not the declaration table, so an undeclared change is caught here and not only by check.
    exportsBaseline: previous?.exportsBaseline ?? currentBundleExportNames(root),
    parent: parentOf(session),
  })
  // A `prefixLoaded` file reached the runtime through its root pointer before the first tool call, so
  // rendering it again only adds a second copy. The whole-file hash is still recorded, which keeps the
  // required-reference check, staleness detection and later re-delivery of a changed file unchanged.
  const prefix = new Set(prefixLoaded)
  const entries = documents.map((document) => {
    const label = `${document.file}${document.heading ? ` # ${document.heading}` : ''}`
    const digest = rendered[document.key].slice(0, 12)
    if (previous?.rendered?.[document.key] === rendered[document.key]) {
      return { document, text: `\n--- ${label} — unchanged since this session received it (${digest}) ---\n`, sent: 0 }
    }
    if (!previous && document.heading === undefined && prefix.has(document.file)) {
      return { document, text: `\n--- ${label} — declared as already loaded by this runtime's root pointer (${digest}) ---\n`, sent: 0 }
    }
    return { document, text: `\n--- ${label} ---\n${document.selected}`, sent: Buffer.byteLength(document.selected) }
  })
  const delivered = entries.map((entry) => entry.text).join('')
  // Naming every selection would itself be the bloat, so this reports only the mass worth a decision,
  // with the input that asked for the whole file. Reduction stays a judgment the reader makes.
  const wholeFile = entries.filter((entry) => entry.document.heading === undefined)
  const costNotes = wholeFile
    .filter((entry) => entry.sent >= WHOLE_FILE_NOTICE)
    .sort((left, right) => right.sent - left.sent)
    .map((entry) => `${entry.sent} bytes  ${entry.document.file} — requested whole by ${originsOf(entry.document.file).join(', ') || 'a heading selection widened to the file'}`)
  const surfaceNotes = context.included.map((surface) => `${surface.id} [${surface.coverage}]${surface.gap ? ` — gap: ${surface.gap}` : ''}`).join('\n')
  return delivered + (fullOverrides.length ? `\n${fullOverrides.join('\n')}\n` : '') + (surfaceNotes ? `\nSurface coverage (not completion):\n${surfaceNotes}\n` : '') +
    (costNotes.length ? `\nWhole-file deliveries over ${WHOLE_FILE_NOTICE} bytes — narrow the input or keep it deliberately:\n${costNotes.join('\n')}\n` : '') +
    `\nContext: ${documents.length} selections, ${Buffer.byteLength(delivered)} bytes delivered (${wholeFile.reduce((sum, entry) => sum + entry.sent, 0)} in whole files). Whole-file hashes protect surrounding text too.\n` +
    'Context delivered, not semantically approved. Inspect bundle code/tests and linked rules that affect the decision, publish the checkpoint, and review actual changes before completion.\n'
}

export function checkEdit(root, session, targets) {
  const state = load(root, session)
  // The entry is AGENTS §2 (a screen request reads screen-loop first); the README only owns the checkpoint fields.
  if (!state) return `Read AGENTS.md §2 first (an implementation request starts with screen-loop), then run node scripts/agents/cli.mjs prepare ${session} .ai-work/<task>/checkpoint.json before editing. Checkpoint fields: scripts/agents/README.md#prepare-before-editing.`
  const { checkpointPath, checkpointHash, documents, checkpoint } = state
  const stale = (file) => `Reference/checkpoint changed: ${file}. Re-run prepare; reassess affected decisions.`
  if (!existsSync(resolve(root, checkpointPath)) || hash(readFileSync(resolve(root, checkpointPath))) !== checkpointHash) return stale(checkpointPath)
  // A reference the checkpoint also claims as an edit surface is this session's to write. The hash
  // exists to catch a document changing underneath the session, not to forbid authoring it.
  let rewritten
  for (const [file, digest] of Object.entries(documents)) {
    if (!existsSync(resolve(root, file))) return stale(file)
    const current = hash(readFileSync(resolve(root, file)))
    if (current === digest) continue
    if (!within(file, checkpoint.scope)) return stale(file)
    rewritten = { ...(rewritten ?? documents), [file]: current }
  }
  if (rewritten !== undefined) save(root, session, { ...state, documents: rewritten })
  for (const target of targets) {
    const path = localPath(root, target)
    if (!within(path, checkpoint.scope)) return `Outside declared scope: ${path}. Update the checkpoint with requirements and evidence.`
    for (const file of requiredReferences([path], checkpoint)) {
      if (!(file in documents)) return `Required reference for ${path}: ${file}. Update checkpoint and prepare.`
    }
    try { workflowContext(root, checkpoint, [path]) } catch (error) { return error.message }
    const question = checkpoint.unresolved.find((item) => within(path, item.paths))
    if (question) return `Unresolved product contract for ${path}: ${question.question}. Ask for the fact; do not guess.`
  }
  return null
}

function changedPaths(baseline, current) {
  return [...new Set([...Object.keys(baseline), ...Object.keys(current)])].filter((path) => baseline[path] !== current[path])
}

/**
 * Judges the paths this session actually wrote. Those outside the declared scope block, because the
 * bracket proves the session moved them and the checkpoint can be corrected. Concurrent edits are
 * reported instead: they are someone else's to answer for, and blocking on them left sessions with
 * no reachable exit.
 */
function reconcileOutput(root, session, state, mine, external) {
  const outside = mine.filter((path) => !within(path, state.checkpoint.scope))
  if (outside.length) return `This session wrote outside its declared scope: ${listed(outside)}. Add those paths to the checkpoint scope with the requirements that justify them and re-run prepare, or revert them.${externalNote(external)}`
  return checkEdit(root, session, mine)
}

/**
 * The README's example sentences, past and present. Nine recorded reviews pasted the earlier pair verbatim
 * (measured 2026-09-11), which is the shape of a field that exists without saying anything; the same text
 * is refused as a review. `preflight.test` checks that the README example still lists only these.
 */
export const REVIEW_EXAMPLE_SENTENCES = [
  "Compared the adopted table contract with the caller's sort ownership.",
  'No extra wrapper or replicated state.',
  'data-table adopted unchanged: the column meta and getRowId stay feature-owned; no prop was added for this caller.',
  'Three role files from the 형태 table; the sort transition is one pure policy function, no controller hook.',
]

/**
 * A loop review (workflow, or shared implement/drill) is judged by someone other than its author: N6 is the
 * only check that reads the content of `design` and the review sentences, so its record is required, not
 * optional. AGENTS §5 asks the same of gate, root and skill changes. `contractReview` must speak about every
 * contract the checkpoint declared, by id.
 */
export function loopReviewFailure(checkpoint, report) {
  if (loopApplies(checkpoint)) {
    for (const field of ['contractReview', 'complexityReview']) {
      if (REVIEW_EXAMPLE_SENTENCES.includes(String(report[field]).trim())) return `${field} repeats the README example sentence; write what this diff did to the contracts and the structure`
    }
    const unmentioned = (checkpoint.contracts ?? []).map(({ id }) => id).filter((id) => !String(report.contractReview).includes(id))
    if (unmentioned.length) return `contractReview must say what happened to each declared contract by id: ${unmentioned.join(', ')}`
  }
  if (!independentReviewRequired(checkpoint)) return null
  const independent = report.independentReview
  if (!independent || typeof independent !== 'object' || !text(independent.reviewer) || !text(independent.revision) || !Array.isArray(independent.findings)) {
    return 'This review records independentReview { reviewer, revision, findings[] }: another model or person opened the diff and the owning documents (AGENTS §5; screen-loop N6 for implement/drill, §5 for gate, root and skill scopes). An empty findings array is a recorded verdict; a missing field is not.'
  }
  return null
}

/**
 * A bundle whose public export names changed during this session widened or narrowed a shared contract.
 * That is a `modify` decision on `contracts[]`, taken before the edit, not a table to update afterwards.
 */
export function exportDriftFailure(baseline, current, contracts = []) {
  if (!baseline) return null
  const changed = Object.keys({ ...baseline, ...current })
    .filter((id) => JSON.stringify([...(baseline[id] ?? [])].sort()) !== JSON.stringify([...(current[id] ?? [])].sort()))
  const undeclared = changed.filter((id) => !contracts.some((item) => item.id === id && item.decision === 'modify'))
  return undeclared.length
    ? `Public exports of seed bundle(s) ${undeclared.join(', ')} changed in this session without a contracts[] "modify" decision. Declare the modification with its reason and re-run prepare, or narrow the change back to the existing contract (E6).`
    : null
}

export function recordReview(root, session, report, snapshot = outputSnapshot, unsettled = unsettledPaths) {
  const loaded = load(root, session)
  if (!loaded) throw new Error('Run prepare before review')
  const state = settle(root, session, loaded)
  const current = snapshot(root)
  const children = delegated(root, session)
  const { mine, external } = partitionChanges(state, current, unsettled(root), children, otherSessionClaims(root, session))
  const failure = state.wrote || children.some((child) => child.wrote) ? reconcileOutput(root, session, state, mine, external) : null
  if (failure) throw new Error(failure)
  const expected = state.checkpoint.requirements.map(({ id }) => id).sort()
  const actual = report.requirements?.map(({ id }) => id).sort()
  if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error(`Review every requirement exactly once: ${expected.join(', ')}`)
  if (!report.requirements.every((item) => ['implemented', 'unimplemented', 'different'].includes(item.status) && text(item.evidence)) || !text(report.contractReview) || !text(report.complexityReview) || !Array.isArray(report.assumptions) || !Array.isArray(report.limitations)) throw new Error('Review needs requirement evidence, contract/complexity comparison, assumptions and limitations')
  // A gap has to point somewhere. Naming the requirement that supersedes it re-enters the loop; naming
  // the blocking condition hands it to the reader. Recording neither would close the task on a gap.
  const declared = new Set(state.checkpoint.requirements.map(({ id }) => id))
  for (const item of report.requirements) {
    if (item.status === 'implemented') continue
    const replaced = text(item.replacement) && declared.has(item.replacement) && item.replacement !== item.id
    if (!replaced && !text(item.blocked)) {
      throw new Error(`Requirement ${item.id} is ${item.status}: name a replacement requirement ID declared in this checkpoint, or the blocking condition in "blocked"`)
    }
  }
  // A convention only counts as applied if this session was actually handed it. A whole-file delivery
  // covers its own headings, and a delivered parent heading covers descendant headings.
  const delivered = Object.keys(state.rendered ?? {}).map((key) => {
    const [file, heading] = JSON.parse(key)
    return { file, heading: heading ?? undefined }
  })
  // A `rows: …` delivery is a synthetic heading; it covers nothing but itself.
  const coversSection = (evidence, reference) => {
    try { return referenceCovers(root, evidence, reference) } catch { return false }
  }
  const covers = (reference) => delivered.some((evidence) =>
    evidence.file === reference.file && (
      evidence.heading == null
      || reference.heading != null && (
        evidence.heading === reference.heading
        || coversSection(evidence, reference)
      )
    )
  )
  for (const item of report.requirements) {
    if (item.status === 'unimplemented') continue
    if (!Array.isArray(item.appliedSections) || !item.appliedSections.length) {
      throw new Error(`Requirement ${item.id}: name the convention sections you applied in "appliedSections"`)
    }
    const cited = item.appliedSections.map(referenceOf)
    const missing = cited.filter((reference) => !covers(reference))
    if (missing.length) {
      throw new Error(`Requirement ${item.id}: not delivered to this session, so it cannot be a source: ${missing.map((reference) => reference.heading ? `${reference.file} # ${reference.heading}` : reference.file).join(', ')}. Prepare it or cite what you received.`)
    }
    // A whole-file delivery covers a heading, but only one that exists; selection owns that check.
    // A `rows: …` heading is the slice delivery itself, not a section of the file; it is cited as delivered.
    selectedDocuments(root, cited.filter((reference) => reference.heading !== undefined && !reference.heading.startsWith('rows: ')))
  }
  if (workKind(state.checkpoint) === 'workflow') {
    for (const item of report.requirements) {
      if (item.status === 'unimplemented') continue
      if (!Array.isArray(item.files) || !item.files.length || !item.files.every((file) => text(file) && localPath(root, file) === file && within(file, state.checkpoint.scope) && (existsSync(resolve(root, file)) ? statSync(resolve(root, file)).isFile() : Boolean(state.baseline[file])))) throw new Error(`Requirement ${item.id}: implementation files must exist in scope (or be a baseline deletion)`)
      if (!Array.isArray(item.verification) || !item.verification.length || !item.verification.every((check) => text(check.method) && text(check.result) && (!check.artifact || (localPath(root, check.artifact) === check.artifact && existsSync(resolve(root, check.artifact)) && statSync(resolve(root, check.artifact)).isFile())))) throw new Error(`Requirement ${item.id}: verification needs method, result and an existing artifact when provided`)
    }
    // `unimplemented` skips the file check above, so without this a session could write source, attach it
    // to no requirement, review every requirement as unimplemented and still close the stop gate.
    const claimed = new Set(report.requirements.flatMap((item) => (Array.isArray(item.files) ? item.files : []).filter(text)))
    const unclaimed = mine.filter((path) => !claimed.has(path))
    if (unclaimed.length) throw new Error(`This session wrote paths no requirement claims in "files": ${unclaimed.join(', ')}. Name each in the requirement it serves, or revert it.`)
  }
  // Fingerprinted over this session's own paths so a concurrent edit cannot invalidate the review.
  // Content checks come last: a review that fails on files or claims is fixed there first.
  const loopFail = loopReviewFailure(state.checkpoint, report)
  if (loopFail) throw new Error(loopFail)
  const driftFail = exportDriftFailure(state.exportsBaseline, currentBundleExportNames(root), state.checkpoint.contracts)
  if (driftFail) throw new Error(driftFail)
  save(root, session, { ...state, review: { fingerprint: fingerprintOf(mine, current), report } })
  return external
}

/** The paths a review must account for, for callers that run checks before recording one. */
export function authoredChanges(root, session, snapshot = outputSnapshot, unsettled = unsettledPaths) {
  const state = settle(root, session, load(root, session))
  if (!state) return { mine: [], external: [] }
  const children = delegated(root, session)
  if (!state.wrote && !children.some((child) => child.wrote)) return { mine: [], external: [] }
  return partitionChanges(state, snapshot(root), unsettled(root), children, otherSessionClaims(root, session))
}

export function checkStop(root, session, snapshot = outputSnapshot, unsettled = unsettledPaths) {
  const loaded = load(root, session)
  if (!loaded) return null
  // A session that was never granted a write capability, and delegated to no one who was, owns no
  // tracked change, so a concurrent session's edits must not hold its completion hostage.
  const children = delegated(root, session)
  if (!loaded.wrote && !children.some((child) => child.wrote)) return null
  const state = settle(root, session, loaded)
  const current = snapshot(root)
  const { mine, external } = partitionChanges(state, current, unsettled(root), children, otherSessionClaims(root, session))
  if (!mine.length) return null
  const stale = reconcileOutput(root, session, state, mine, external)
  if (stale) return stale
  if (state.review?.fingerprint === fingerprintOf(mine, current)) return null
  return `Review this session's ${mine.length} changed path(s) against requirements, evidence, shared ownership and complexity; fix unsupported assumptions. Run node scripts/agents/cli.mjs review ${session} .ai-work/<task>/review.json. Record blocked items honestly; do not claim completion from this check alone.${externalNote(external)}`
}
