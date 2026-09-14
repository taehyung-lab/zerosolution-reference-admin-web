import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { readReference, referenceCovers, referenceOf, selectedDocuments } from './document-context.mjs'
import { pointerState, renderRows, rowsForSurface, summarize } from './screen-contract.mjs'
import { SEED_BUNDLES } from '../contracts/seed.mjs'

export const SURFACE_INDEX = 'docs/reference/zero-sol/context.json'
const text = (value) => typeof value === 'string' && value.trim().length > 0
const list = (value) => Array.isArray(value)
const inside = (path, prefix) => path === prefix || (prefix.endsWith('/') && path.startsWith(prefix))
const overlaps = (left, right) => inside(left, right) || inside(right, left)
const productPath = (path) => ['src/', 'src/app/'].includes(path) || /^src\/(features|routes|app\/shell)\//.test(path)
const safePath = (path) => text(path) && !path.startsWith('/') && !path.includes('\\') && !path.split('/').some((part) => part === '..' || part === '.')
const SHAPE_HEADING = '형태'

/** A cited skill file that has a unique `형태` heading must deliver that heading (or the whole file). */
export function missingShapeHeadingRefs(root, references) {
  const byFile = new Map()
  for (const value of references) {
    const ref = referenceOf(value)
    const entry = byFile.get(ref.file) ?? { whole: false, headings: new Set() }
    if (ref.heading === undefined) entry.whole = true
    else entry.headings.add(ref.heading)
    byFile.set(ref.file, entry)
  }
  const missing = []
  for (const [file, entry] of byFile) {
    if (entry.whole || entry.headings.has(SHAPE_HEADING)) continue
    const path = resolve(root, file)
    if (!existsSync(path)) continue
    const titles = readFileSync(path, 'utf8').split('\n')
      .map((line) => line.match(/^(#{1,6}) +(.+?)\s*#*$/))
      .filter(Boolean)
      .map((match) => match[2])
    if (titles.filter((title) => title === SHAPE_HEADING).length !== 1) continue
    missing.push({ file, heading: SHAPE_HEADING })
  }
  return missing
}

export function withShapeHeadings(root, references) {
  const extra = missingShapeHeadingRefs(root, references)
  return extra.length ? [...references, ...extra] : references
}

export function readSurfaceIndex(root) {
  if (!existsSync(resolve(root, SURFACE_INDEX))) return { judgment: [], surfaces: [] }
  const index = JSON.parse(readFileSync(resolve(root, SURFACE_INDEX), 'utf8'))
  if (!list(index.surfaces) || !list(index.judgment)) throw new Error('Surface index needs surfaces and judgment references')
  return index
}

export function surfaceIndexFailures(root) {
  const failures = []
  try {
    const index = readSurfaceIndex(root)
    const ids = new Set()
    for (const surface of index.surfaces) {
      if (!text(surface.id) || ids.has(surface.id)) throw new Error(`Duplicate or empty surface id: ${surface.id}`)
      ids.add(surface.id)
      if (!text(surface.title) || !['group', 'surface'].includes(surface.coverage) || !list(surface.paths) || !surface.paths.every(safePath) || !list(surface.related) || !list(surface.scenarios) || !list(surface.references)) throw new Error(`Invalid surface: ${surface.id}`)
      if (!referenceOf(surface.inventory).file.startsWith('docs/reference/zero-sol/')) throw new Error(`Inventory location required: ${surface.id}`)
      if (!surface.scenarios.length && !text(surface.gap)) throw new Error(`Scenario or explicit gap required: ${surface.id}`)
      if (!surface.scenarios.every((ref) => referenceOf(ref).file.startsWith('docs/reference/scenarios/'))) throw new Error(`Scenario location required: ${surface.id}`)
      for (const ref of [surface.inventory, ...surface.scenarios, ...surface.references]) readReference(root, ref)
      for (const miss of missingShapeHeadingRefs(root, surface.references)) {
        failures.push(`${surface.id} cites ${miss.file} without heading ${miss.heading}`)
      }
    }
    for (const surface of index.surfaces) {
      for (const id of surface.related) if (!ids.has(id) || id === surface.id) throw new Error(`Dangling related surface: ${surface.id} → ${id}`)
    }
    for (const ref of index.judgment) readReference(root, ref)
    const directory = resolve(root, 'docs/reference/zero-sol')
    if (existsSync(directory)) for (const file of readdirSync(directory).filter((name) => /^\d{2}-.+\.md$/.test(name))) {
      if (!index.surfaces.some((surface) => referenceOf(surface.inventory).file === `docs/reference/zero-sol/${file}`)) failures.push(`Inventory without context entry: ${file}`)
    }
  } catch (error) { failures.push(error.message) }
  return failures
}

export function workKind(checkpoint) {
  const kind = checkpoint.work?.kind ?? (checkpoint.scope.some(productPath) ? 'workflow' : 'infrastructure')
  if (!['workflow', 'maintenance', 'infrastructure'].includes(kind)) throw new Error('Unknown work kind')
  if (checkpoint.work && kind !== 'workflow' && !text(checkpoint.work.reason)) throw new Error('Non-workflow work needs a reason')
  return kind
}

export const LOOP_GRAINS = ['screen', 'slice', 'component', 'logic', 'structure']
export const LOOP_MODES = ['implement', 'drill']
/** Grains that name one part of a screen; their scope is that part's files, never the screen directory. */
const PARTIAL_GRAINS = ['slice', 'component', 'logic']
const SHARED_GRAINS = ['component', 'logic']
const sharedPath = (path) => /^src\/shared\//.test(path)
/**
 * Directory scopes at or above one screen: `src/`, `src/features/`, a domain, its `screens/` or
 * `mechanics/` segment, one screen, and any route directory. Scope directories always end in `/`
 * (prepare normalizes them), so a file path never matches.
 */
const WHOLE_SCREEN_SCOPE = /^src\/(?:(?:features(?:\/[^/]+(?:\/(?:screens|mechanics)(?:\/[^/]+)?)?)?|routes(?:\/[^/]+)*)\/)?$/

/**
 * Workflow always. A `src/shared` scope with no `work.kind` also, whatever `mode` says: the exemption
 * for a one-line primitive fix is the declared `work.kind` with its reason, never an omitted field —
 * a gate that fires only for sessions that already know the loop misses exactly the ones that do not.
 * `work: { reason }` without a kind is still no kind.
 */
export function loopApplies(checkpoint) {
  if (workKind(checkpoint) === 'workflow') return true
  return checkpoint.work?.kind === undefined && checkpoint.scope.some(sharedPath)
}

/** Gate code, root instruction and skill scopes: AGENTS §5 requires an independent review of these. */
const GATE_SCOPE = /^(?:scripts\/(?:agents|contracts)\/|\.agents\/skills\/|AGENTS\.md$|eslint\.config\.js$)/
export function independentReviewRequired(checkpoint) {
  return loopApplies(checkpoint) || checkpoint.scope.some((path) => GATE_SCOPE.test(path))
}

/** Presence of grain, entry, mode and the four design facts, plus the grain–scope shape. Content is N5·N6. */
export function loopDeclarationFailures(checkpoint) {
  if (!loopApplies(checkpoint)) return []
  const failures = []
  const shared = workKind(checkpoint) !== 'workflow'
  if (shared && !LOOP_MODES.includes(checkpoint.mode)) {
    failures.push('A src/shared scope declares checkpoint.mode (implement|drill), or work.kind maintenance|infrastructure with a reason')
  } else if (!LOOP_MODES.includes(checkpoint.mode)) {
    failures.push('Declare checkpoint.mode (implement|drill)')
  }
  if (shared && !SHARED_GRAINS.includes(checkpoint.grain)) {
    failures.push('Shared implement/drill declares checkpoint.grain component|logic (entry is a bundle id)')
  } else if (!LOOP_GRAINS.includes(checkpoint.grain)) {
    failures.push(`Declare checkpoint.grain (${LOOP_GRAINS.join('|')})`)
  }
  if (!text(checkpoint.entry)) failures.push('Declare checkpoint.entry (context id, bundle id, or role 형태 path)')
  if (PARTIAL_GRAINS.includes(checkpoint.grain)) {
    const whole = checkpoint.scope.filter((path) => WHOLE_SCREEN_SCOPE.test(path))
    if (whole.length) failures.push(`grain ${checkpoint.grain} names one part of a screen, so its scope is that part's files, not a screen directory: ${whole.join(', ')}`)
  }
  const design = checkpoint.design
  if (!design || typeof design !== 'object' || !text(design.flow) || !text(design.ownership) || !text(design.reuse) || !text(design.simplicity)) {
    failures.push('Declare checkpoint.design.flow, ownership, reuse and simplicity')
  }
  return failures
}

const shapeHeadingCount = (root, file) => {
  const path = resolve(root, file)
  if (!existsSync(path)) return 0
  return readFileSync(path, 'utf8').split('\n')
    .map((line) => line.match(/^(#{1,6}) +(.+?)\s*#*$/))
    .filter((match) => match && match[2] === SHAPE_HEADING).length
}

/**
 * `entry` must resolve to something the loop can open: a context surface id, a seed bundle id, a
 * reference `file#형태` whose heading exists, or (structure/logic) an existing repository path. Runs after
 * `workflowContext`, so a screen whose paths are uncovered is reported as such before its entry is judged.
 */
export function entryResolutionFailure(root, checkpoint) {
  if (!loopApplies(checkpoint) || !text(checkpoint.entry)) return null
  const entry = checkpoint.entry.trim()
  if (readSurfaceIndex(root).surfaces.some((surface) => surface.id === entry)) return null
  if (SEED_BUNDLES.some((bundle) => bundle.id === entry)) return null
  const [file, heading] = entry.split('#')
  if (heading === SHAPE_HEADING && safePath(file) && shapeHeadingCount(root, file) === 1) return null
  if (['structure', 'logic'].includes(checkpoint.grain) && heading === undefined && safePath(file) && existsSync(resolve(root, file))) return null
  return `checkpoint.entry "${entry}" resolves to no context surface id, seed bundle id, <reference>#형태 heading, or existing path (structure|logic). Run node scripts/agents/cli.mjs context / bundle.`
}

export function workflowContext(root, checkpoint, paths = checkpoint.scope) {
  if (workKind(checkpoint) !== 'workflow') return { references: [], included: [], indexed: false, rowDelivery: { skip: new Set(), documents: [] } }
  const index = readSurfaceIndex(root)
  const decisions = checkpoint.surfaces ?? []
  const gaps = checkpoint.evidenceGaps ?? []
  if (!list(decisions) || !list(gaps)) throw new Error('Declare surface decisions and evidence gaps')
  const byId = new Map(index.surfaces.map((surface) => [surface.id, surface]))
  const chosen = new Map()
  for (const decision of decisions) {
    if (!byId.has(decision.id) || chosen.has(decision.id)) throw new Error(`Unknown or duplicate surface: ${decision.id}`)
    if (!['include', 'exclude'].includes(decision.decision) || (decision.decision === 'exclude' && !text(decision.reason))) throw new Error(`Surface exclusion needs a reason: ${decision.id}`)
    chosen.set(decision.id, decision)
  }
  const included = decisions.filter((decision) => decision.decision === 'include').map((decision) => byId.get(decision.id))
  for (const gap of gaps) {
    if (!text(gap.reason) || !list(gap.paths) || !gap.paths.length || !gap.paths.every((path) => safePath(path) && checkpoint.scope.some((scope) => inside(path, scope))) || !list(gap.references) || !gap.references.length) throw new Error('Evidence gaps need scoped paths, reason and existing references')
    if (!list(gap.requirements) || !gap.requirements.length || new Set(gap.requirements).size !== gap.requirements.length || !gap.requirements.every((id) => checkpoint.requirements.some((requirement) => requirement.id === id))) throw new Error('Evidence gaps need existing requirement IDs')
  }
  if (checkpoint.stage === 'settled' && (gaps.length || included.some((surface) => surface.gap))) throw new Error('A settled workflow cannot have evidence gaps')
  if (checkpoint.stage === 'settled') {
    // Settled means the next task can read this screen by machine: its inventory table carries `id` rows.
    // A group whose rows are promoted under its inner surfaces (`member-list.*` under `members`) passes
    // through an included inner surface that has rows.
    const promoted = new Set(included.filter((surface) => rowsForSurface(root, surface).length > 0).map((surface) => surface.id))
    const unpromoted = included
      .filter((surface) => !promoted.has(surface.id) && !(surface.coverage === 'group' && surface.related.some((id) => promoted.has(id))))
      .map((surface) => surface.id)
    if (unpromoted.length) throw new Error(`A settled workflow needs promoted inventory rows (an id column) for: ${unpromoted.join(', ')}. Promote the section table before settling.`)
  }
  for (const path of paths.filter(productPath)) {
    const known = index.surfaces.filter((surface) => surface.paths.some((prefix) => overlaps(path, prefix)))
    if (known.length) {
      if (!included.some((surface) => known.includes(surface))) throw new Error(`Declare relevant surface context for ${path}: ${known.map((surface) => surface.id).join(', ')}`)
    } else if (!gaps.some((gap) => gap.paths.some((prefix) => inside(path, prefix)))) throw new Error(`Uncovered workflow path: ${path}. Declare evidenceGaps or index its surface.`)
  }
  if (!included.length && !gaps.length) throw new Error('Declare workflow surfaces or evidence gaps')
  for (const surface of included) {
    for (const id of surface.related) if (!chosen.has(id)) throw new Error(`Decide included/excluded inner surface: ${id}`)
  }
  const references = [...index.judgment, ...included.flatMap((surface) => [surface.inventory, ...surface.scenarios, ...withShapeHeadings(root, surface.references)]), ...gaps.flatMap((gap) => gap.references)]
  for (const requirement of checkpoint.requirements) {
    const requirementGaps = gaps.filter((gap) => gap.requirements.includes(requirement.id))
    if (!list(requirement.surfaces) || !requirement.surfaces.every((id) => included.some((surface) => surface.id === id)) || (!requirement.surfaces.length && !requirementGaps.length)) throw new Error(`Requirement ${requirement.id} needs included surfaces or its own evidence gap`)
    if (!list(requirement.sources) || !requirement.sources.length) throw new Error(`Requirement ${requirement.id} needs sources (Markdown locations or user)`)
    if (!list(requirement.contracts) || !requirement.contracts.every((id) => checkpoint.contracts.some((contract) => contract.id === id)) || (!requirement.contracts.length && !text(requirement.contractReason))) throw new Error(`Requirement ${requirement.id} needs declared contracts or contractReason`)
    const evidence = [...included.filter((surface) => requirement.surfaces.includes(surface.id)).flatMap((surface) => [surface.inventory, ...surface.scenarios, ...surface.references]), ...requirementGaps.flatMap((gap) => gap.references)]
    if (!requirement.sources.some((source) => source === 'user' || evidence.some((ref) => referenceCovers(root, ref, source)))) throw new Error(`Requirement ${requirement.id} sources must include its surface evidence or the explicit user request`)
    references.push(...requirement.sources.filter((source) => source !== 'user'))
  }
  for (const surface of included) if (!checkpoint.requirements.some((requirement) => requirement.surfaces.includes(surface.id))) throw new Error(`Included surface needs a requirement: ${surface.id}`)
  return { references, included, indexed: existsSync(resolve(root, SURFACE_INDEX)), rowDelivery: sliceRowDelivery(root, checkpoint, included) }
}

/**
 * A slice reads the rows it covers, not the screen's whole inventory file. When an included surface has
 * promoted rows, the slice checkpoint names them in `rows` (ids from `context <id>`); those rows are
 * delivered as one small table and the inventory file itself is not. An unpromoted surface still gets
 * the whole section (there is nothing narrower to hand over), so promotion is what makes a slice cheap.
 */
export function sliceRowDelivery(root, checkpoint, included) {
  const none = { skip: new Set(), documents: [] }
  if (checkpoint.grain !== 'slice') {
    if (checkpoint.rows !== undefined) throw new Error('checkpoint.rows belongs to grain slice; a screen receives its whole inventory section')
    return none
  }
  const promoted = included.map((surface) => ({ surface, rows: rowsForSurface(root, surface) })).filter((entry) => entry.rows.length)
  if (!promoted.length) return none
  const wanted = checkpoint.rows
  if (!list(wanted) || !wanted.length || !wanted.every(text)) {
    throw new Error(`A slice on a promoted screen names the inventory rows it covers in checkpoint.rows (ids from node scripts/agents/cli.mjs context <id>): ${promoted.flatMap((entry) => entry.rows.map((row) => row.id)).join(', ')}`)
  }
  const known = new Map(promoted.flatMap((entry) => entry.rows.map((row) => [row.id, { row, file: referenceOf(entry.surface.inventory).file }])))
  const unknown = wanted.filter((id) => !known.has(id))
  if (unknown.length) throw new Error(`checkpoint.rows names rows no included surface has: ${unknown.join(', ')}`)
  const byFile = new Map()
  for (const id of wanted) {
    const { row, file } = known.get(id)
    if (!byFile.has(file)) byFile.set(file, [])
    byFile.get(file).push(row)
  }
  const documents = [...byFile].map(([file, rows]) => {
    const heading = `rows: ${rows.map((row) => row.id).join(', ')}`
    return { file, heading, key: JSON.stringify([file, heading]), content: readFileSync(resolve(root, file), 'utf8'), selected: renderRows(rows) }
  })
  // Skip exactly the inventory references of the promoted surfaces, and only when no included unpromoted
  // surface reads its section through the same reference; other references into the same file (a heading
  // the checkpoint lists, another surface's section) are still delivered.
  const promotedIds = new Set(promoted.map((entry) => entry.surface.id))
  const refKey = (value) => { const ref = referenceOf(value); return JSON.stringify([ref.file, ref.heading ?? null]) }
  const sharedByUnpromoted = new Set(included.filter((surface) => !promotedIds.has(surface.id)).map((surface) => refKey(surface.inventory)))
  const skip = new Set(promoted.map((entry) => refKey(entry.surface.inventory)).filter((key) => !sharedByUnpromoted.has(key)))
  return { skip, documents }
}

export function describeContext(root, id) {
  const index = readSurfaceIndex(root)
  if (!id) return index.surfaces.map((surface) => `${surface.id} — ${surface.title} [${surface.coverage}]`).join('\n') + '\n'
  const surface = index.surfaces.find((item) => item.id === id)
  if (!surface) throw new Error(`Unknown surface: ${id}. Run context without an id to list targets.`)
  const rows = rowsForSurface(root, surface)
  const contract = rows.length
    ? {
        rows: rows.map((row) => ({
          id: row.id, kind: row.kind, surface: row.surface,
          unresolved: row.unresolved, questions: row.questions,
          pointer: row.pointer, pointerState: pointerState(root, row),
        })),
        summary: summarize(rows, root),
        note: 'These rows are what has been observed and recorded so far, not the screen\'s full specification. They are the denominator of what this task must cover; covering all of them is not completeness, and a surface absent from this list is found at the source rather than inferred to not exist. Scenario cards own verification, and pointer says where to look, never that the work is done or missing.',
      }
    : { rows: [], note: `Not migrated: ${surface.inventory} declares no row id for ${surface.id}. Read the section table itself; an empty list is not an empty screen.` }
  return JSON.stringify({ ...surface, references: withShapeHeadings(root, surface.references), contract, judgment: index.judgment, related: surface.related.map((related) => {
    const target = index.surfaces.find((item) => item.id === related)
    return { id: related, title: target?.title, instruction: 'Explicitly include or exclude with a reason.' }
  }), note: 'Paths route evidence; they never assign code ownership or prescribe new product architecture. Feature API/model modules can serve several surfaces. Group entries require manual decomposition of their inner surfaces. Read linked facts; this is not a product specification.' }, null, 2) + '\n'
}

/** Diagnostics only: reachable support documents need not be direct surface inventory entries. */
export function contextReport(root, { summary = false } = {}) {
  const index = readSurfaceIndex(root)
  const direct = new Set(index.judgment.map(ref => referenceOf(ref).file))
  const surfaces = index.surfaces.map(surface => {
    const refs = [...index.judgment, surface.inventory, ...surface.scenarios, ...withShapeHeadings(root, surface.references)]
    refs.forEach(ref => direct.add(referenceOf(ref).file))
    const documents = selectedDocuments(root, refs)
    return {
      id: surface.id, coverage: surface.coverage, gap: surface.gap ?? null,
      requiresDecomposition: surface.coverage === 'group',
      bytes: documents.reduce((sum, doc) => sum + Buffer.byteLength(doc.selected), 0),
      fullFiles: documents.filter(doc => doc.heading === undefined).length,
      ...(summary ? {} : { selections: documents.map(doc => ({ file: doc.file, heading: doc.heading ?? null, bytes: Buffer.byteLength(doc.selected) })) }),
    }
  })
  const reachable=new Set(direct)
  const pending=[...direct]
  while(pending.length) {
    const file=pending.pop()
    if(!existsSync(resolve(root,file))) continue
    const content=readFileSync(resolve(root,file),'utf8')
    for(const match of content.matchAll(/\]\(([^\s)#]+\.md)(?:#[^)]*)?\)/g)) {
      if(/^[a-z]+:/i.test(match[1])) continue
      const target=relative(root,resolve(root,dirname(file),match[1])).replaceAll('\\','/')
      if(!safePath(target)||reachable.has(target)) continue
      reachable.add(target)
      pending.push(target)
    }
  }
  const notion=resolve(root,'docs/reference/zero-sol/notion')
  const supporting=existsSync(notion)?readdirSync(notion,{recursive:true,withFileTypes:true}).filter(entry=>entry.isFile()&&entry.name.endsWith('.md')).map(entry=>{
    const file=relative(root,resolve(entry.parentPath,entry.name)).replaceAll('\\','/')
    return {file,route:direct.has(file)?'direct':reachable.has(file)?'linked':'unlinked',bytes:Buffer.byteLength(readFileSync(resolve(root,file)))}
  }):[]
  return {note:'Surface evidence only; prepare also includes required instructions, checkpoint and bundle references. Linked means Markdown reachability, not semantic coverage. Unlinked support is a review notice, not a failure.',surfaces,supporting}
}
