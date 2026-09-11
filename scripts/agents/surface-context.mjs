import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { readReference, referenceCovers, referenceOf, selectedDocuments } from './document-context.mjs'
import { pointerState, rowsForSurface, summarize } from './screen-contract.mjs'

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

const LOOP_GRAINS = ['screen', 'slice', 'component', 'structure']
const LOOP_MODES = ['implement', 'drill']

/** Workflow implement/drill must name grain, entry, mode and the four design facts. Other kinds skip this. */
export function loopDeclarationFailures(checkpoint) {
  if (workKind(checkpoint) !== 'workflow') return []
  const failures = []
  if (!LOOP_GRAINS.includes(checkpoint.grain)) failures.push('Declare checkpoint.grain (screen|slice|component|structure)')
  if (!text(checkpoint.entry)) failures.push('Declare checkpoint.entry (context id, bundle id, or role 형태 path)')
  if (!LOOP_MODES.includes(checkpoint.mode)) failures.push('Declare checkpoint.mode (implement|drill)')
  const design = checkpoint.design
  if (!design || typeof design !== 'object' || !text(design.flow) || !text(design.ownership) || !text(design.reuse) || !text(design.simplicity)) {
    failures.push('Declare checkpoint.design.flow, ownership, reuse and simplicity')
  }
  return failures
}

export function workflowContext(root, checkpoint, paths = checkpoint.scope) {
  if (workKind(checkpoint) !== 'workflow') return { references: [], included: [], indexed: false }
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
  return { references, included, indexed: existsSync(resolve(root, SURFACE_INDEX)) }
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
