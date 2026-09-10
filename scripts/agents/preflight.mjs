import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { SEED_BUNDLES } from '../contracts/seed.mjs'
import { claudeAgentsImportFailure, copilotAgentsPointerFailure } from '../contracts/contracts.mjs'
import { referenceOf, selectedDocuments } from './document-context.mjs'
import { SURFACE_INDEX, workKind, workflowContext } from './surface-context.mjs'

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
export function outputSnapshot(root) {
  return Object.fromEntries(trackedPaths(root).map((path) => [
    path, existsSync(resolve(root, path)) ? hash(readFileSync(resolve(root, path))) : null,
  ]))
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
      return [path, `${stats.size}:${stats.mtimeMs}`]
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

/** Paths this session is accountable for, and the concurrent edits it must never be blocked by. */
function partitionChanges(state, current) {
  const changed = changedPaths(state.baseline, current)
  const authored = new Set(state.authored ?? [])
  return { mine: changed.filter((path) => authored.has(path)), external: changed.filter((path) => !authored.has(path)) }
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

function requiredReferences(scope) {
  const paths = scope.join('\n')
  const refs = ['AGENTS.md']
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
  for (const file of requiredReferences(scope)) {
    if (!referenceFiles.includes(file)) throw new Error(`Required reference: ${file}`)
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
  const context = workflowContext(root, checkpoint)
  const bundleRefs = contracts.flatMap(({ id }) => {
    const bundle = SEED_BUNDLES.find((candidate) => candidate.id === id)
    return [...bundle.skills, ...bundle.adrs]
  })
  const inputs = [...references, ...context.references, ...bundleRefs]
  const documents = selectedDocuments(root, inputs)
  const originsOf = (file) => {
    const origins = []
    if (references.some(ref => referenceOf(ref).file === file && referenceOf(ref).heading === undefined)) origins.push('checkpoint.references')
    if (context.references.some(ref => referenceOf(ref).file === file && referenceOf(ref).heading === undefined)) origins.push('surface context or requirement.sources')
    for (const {id} of contracts) {
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
  if (!state) return `Run node scripts/agents/cli.mjs prepare ${session} .ai-work/<task>/checkpoint.json before editing. See scripts/agents/README.md.`
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
    for (const file of requiredReferences([path])) {
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

export function recordReview(root, session, report, snapshot = outputSnapshot) {
  const loaded = load(root, session)
  if (!loaded) throw new Error('Run prepare before review')
  const state = settle(root, session, loaded)
  const current = snapshot(root)
  const { mine, external } = partitionChanges(state, current)
  const failure = state.wrote ? reconcileOutput(root, session, state, mine, external) : null
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
  // covers its own headings, matching how preparation treats a full-file selection.
  const deliveredKeys = new Set(Object.keys(state.rendered ?? {}))
  const covers = (reference) => deliveredKeys.has(JSON.stringify([reference.file, null])) ||
    deliveredKeys.has(JSON.stringify([reference.file, reference.heading ?? null]))
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
    selectedDocuments(root, cited.filter((reference) => reference.heading !== undefined))
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
  save(root, session, { ...state, review: { fingerprint: fingerprintOf(mine, current), report } })
  return external
}

/** The paths a review must account for, for callers that run checks before recording one. */
export function authoredChanges(root, session, snapshot = outputSnapshot) {
  const state = settle(root, session, load(root, session))
  if (!state?.wrote) return { mine: [], external: [] }
  return partitionChanges(state, snapshot(root))
}

export function checkStop(root, session, snapshot = outputSnapshot) {
  const loaded = load(root, session)
  if (!loaded) return null
  // A session that was never granted a write capability owns no tracked change, so a concurrent
  // session's edits must not hold its completion hostage.
  if (!loaded.wrote) return null
  const state = settle(root, session, loaded)
  const current = snapshot(root)
  const { mine, external } = partitionChanges(state, current)
  if (!mine.length) return null
  const stale = reconcileOutput(root, session, state, mine, external)
  if (stale) return stale
  if (state.review?.fingerprint === fingerprintOf(mine, current)) return null
  return `Review this session's ${mine.length} changed path(s) against requirements, evidence, shared ownership and complexity; fix unsupported assumptions. Run node scripts/agents/cli.mjs review ${session} .ai-work/<task>/review.json. Record blocked items honestly; do not claim completion from this check alone.${externalNote(external)}`
}
