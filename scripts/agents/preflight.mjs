import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { SEED_BUNDLES } from '../contracts/seed.mjs'
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

/**
 * Records that this session was granted a write capability. Shell text never reveals its write
 * target, so accountability is per session, not per path: a session that only ran recognized
 * inspection commands cannot have produced a tracked change, and another session's edits are
 * not its diff to account for.
 */
export function noteWrite(root, session) {
  const state = load(root, session)
  if (!state || state.wrote) return
  save(root, session, { ...state, wrote: true })
}

// Include untracked source and deletions; ignored build artifacts and session notes are excluded by Git.
export function outputSnapshot(root) {
  const git = (args) => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 })
  const paths = [...new Set(git(['ls-files', '--cached', '--others', '--exclude-standard', '-z']).toString().split('\0').filter(Boolean))].sort()
  return Object.fromEntries(paths.filter((path) => !path.startsWith('.ai-work/')).map((path) => [
    path, existsSync(resolve(root, path)) ? hash(readFileSync(resolve(root, path))) : null,
  ]))
}

export const BUILD_STAGE = 'build'
export const SETTLED_STAGE = 'settled'

function stageOf(checkpoint) {
  return checkpoint.stage ?? BUILD_STAGE
}

function requiredReferences(scope) {
  const paths = scope.join('\n')
  const refs = ['AGENTS.md']
  if (/src\/(features|routes|app)\//.test(paths)) refs.push('.agents/skills/feature-contract/SKILL.md')
  if (/src\/shared\//.test(paths)) refs.push('.agents/skills/shared-ui-contract/SKILL.md')
  if (/openapi\/|src\/api\/|src\/features\/[^/]+\/api\/|src\/app\/providers\//.test(paths)) refs.push('.agents/skills/api-contract/SKILL.md')
  return refs
}

export function prepare(root, session, checkpointFile, snapshot = outputSnapshot) {
  const checkpointPath = localPath(root, checkpointFile)
  if (!checkpointPath.startsWith('.ai-work/')) throw new Error('Keep task checkpoints in .ai-work/')
  const checkpoint = readJson(resolve(root, checkpointPath))
  const { scope, requirements, references, contracts, unresolved } = checkpoint
  if (!Array.isArray(scope) || !scope.length || !scope.every((path) => text(path) && localPath(root, path) === path.replace(/\/$/, ''))) throw new Error('Declare exact files or directory/ scope')
  if (!Array.isArray(requirements) || !requirements.length || !requirements.every((item) => text(item.id) && text(item.text)) || new Set(requirements.map((item) => item.id)).size !== requirements.length) throw new Error('Declare unique numbered requirements')
  if (!Array.isArray(references)) throw new Error('Declare repository Markdown references')
  const referenceFiles = references.map(referenceOf).filter((reference) => reference.heading === undefined).map((reference) => reference.file)
  for (const file of requiredReferences(scope)) {
    if (!referenceFiles.includes(file)) throw new Error(`Required reference: ${file}`)
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
  const fullOverrides = documents.filter(document => document.heading === undefined && inputs.some(ref => referenceOf(ref).file === document.file && referenceOf(ref).heading !== undefined)).map(document => {
    const sources = []
    if (references.some(ref => referenceOf(ref).file === document.file && referenceOf(ref).heading === undefined)) sources.push('checkpoint.references')
    if (context.references.some(ref => referenceOf(ref).file === document.file && referenceOf(ref).heading === undefined)) sources.push('surface context or requirement.sources')
    for (const {id} of contracts) {
      const bundle=SEED_BUNDLES.find(bundle=>bundle.id===id)
      if ([...bundle.skills,...bundle.adrs].some(ref=>referenceOf(ref).file===document.file && referenceOf(ref).heading===undefined)) sources.push(`bundle:${id}`)
    }
    return `Full-file selection overrides headings: ${document.file} (${sources.join(', ')})`
  })
  const previous = load(root, session)
  const rendered = Object.fromEntries(documents.map((document) => [document.key, hash(document.selected)]))
  const hashes = Object.fromEntries(documents.map((document) => [document.file, hash(document.content)]))
  if (context.indexed) hashes[SURFACE_INDEX] = hash(readFileSync(resolve(root, SURFACE_INDEX)))
  save(root, session, {
    checkpointPath, checkpointHash: hash(readFileSync(resolve(root, checkpointPath))), checkpoint,
    documents: hashes, rendered,
    baseline: previous?.baseline ?? snapshot(root), review: null, wrote: previous?.wrote ?? false,
  })
  const delivered = documents.map((document) => {
    const label = `${document.file}${document.heading ? ` # ${document.heading}` : ''}`
    return previous?.rendered?.[document.key] === rendered[document.key]
      ? `\n--- ${label} — unchanged since this session received it (${rendered[document.key].slice(0, 12)}) ---\n`
      : `\n--- ${label} ---\n${document.selected}`
  }).join('')
  const surfaceNotes = context.included.map((surface) => `${surface.id} [${surface.coverage}]${surface.gap ? ` — gap: ${surface.gap}` : ''}`).join('\n')
  return delivered + (fullOverrides.length ? `\n${fullOverrides.join('\n')}\n` : '') + (surfaceNotes ? `\nSurface coverage (not completion):\n${surfaceNotes}\n` : '') +
    `\nContext: ${documents.length} selections, ${Buffer.byteLength(delivered)} bytes delivered. Whole-file hashes protect surrounding text too.\n` +
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

function reconcileOutput(root, session, state, current) {
  const changed = changedPaths(state.baseline, current)
  const outside = changed.filter(path => !within(path, state.checkpoint.scope))
  if (outside.length) return `Changes outside this session's scope: ${outside.join(', ')}. Snapshot comparison cannot identify the author. Do not absorb external changes into scope or reset the baseline; use one writing session or an isolated checkout. See scripts/agents/README.md.`
  return checkEdit(root, session, changed)
}

export function recordReview(root, session, report, snapshot = outputSnapshot) {
  const state = load(root, session)
  if (!state) throw new Error('Run prepare before review')
  const current = snapshot(root)
  const failure = state.wrote ? reconcileOutput(root, session, state, current) : null
  if (failure) throw new Error(failure)
  const expected = state.checkpoint.requirements.map(({ id }) => id).sort()
  const actual = report.requirements?.map(({ id }) => id).sort()
  if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error(`Review every requirement exactly once: ${expected.join(', ')}`)
  if (!report.requirements.every((item) => ['implemented', 'unimplemented', 'different'].includes(item.status) && text(item.evidence)) || !text(report.contractReview) || !text(report.complexityReview) || !Array.isArray(report.assumptions) || !Array.isArray(report.limitations)) throw new Error('Review needs requirement evidence, contract/complexity comparison, assumptions and limitations')
  if (workKind(state.checkpoint) === 'workflow') {
    for (const item of report.requirements) {
      if (item.status === 'unimplemented') continue
      if (!Array.isArray(item.files) || !item.files.length || !item.files.every((file) => text(file) && localPath(root, file) === file && within(file, state.checkpoint.scope) && (existsSync(resolve(root, file)) ? statSync(resolve(root, file)).isFile() : Boolean(state.baseline[file])))) throw new Error(`Requirement ${item.id}: implementation files must exist in scope (or be a baseline deletion)`)
      if (!Array.isArray(item.verification) || !item.verification.length || !item.verification.every((check) => text(check.method) && text(check.result) && (!check.artifact || (localPath(root, check.artifact) === check.artifact && existsSync(resolve(root, check.artifact)) && statSync(resolve(root, check.artifact)).isFile())))) throw new Error(`Requirement ${item.id}: verification needs method, result and an existing artifact when provided`)
    }
  }
  save(root, session, { ...state, review: { fingerprint: hash(JSON.stringify(current)), report } })
}

export function checkStop(root, session, snapshot = outputSnapshot) {
  const state = load(root, session)
  if (!state) return null
  // A session that was never granted a write capability owns no tracked change, so a concurrent
  // session's edits must not hold its completion hostage.
  if (!state.wrote) return null
  const current = snapshot(root)
  const changed = changedPaths(state.baseline, current)
  if (!changed.length) return null
  const stale = reconcileOutput(root, session, state, current)
  if (stale) return stale
  if (state.review?.fingerprint === hash(JSON.stringify(current))) return null
  return `Review current diff against requirements, evidence, shared ownership and complexity; fix unsupported assumptions. Run node scripts/agents/cli.mjs review ${session} .ai-work/<task>/review.json. Record blocked items honestly; do not claim completion from this check alone.`
}
