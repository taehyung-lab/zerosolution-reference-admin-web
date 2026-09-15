import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { readReference, referenceOf, selectedDocuments } from './documents.mjs'
import { pointerState, rowsForSurface, summarize } from './screen-rows.mjs'
import { PRODUCT_POINTER, productPaths } from '../contracts/product-paths.mjs'

const text = (value) => typeof value === 'string' && value.trim().length > 0
const list = (value) => Array.isArray(value)
const safePath = (path) => text(path) && !path.startsWith('/') && !path.includes('\\') && !path.split('/').some((part) => part === '..' || part === '.')
const SHAPE_HEADING = '형태'

/** A cited skill file that has a unique `형태` heading must deliver that heading (or the whole file). */
function missingShapeHeadingRefs(root, references) {
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

function withShapeHeadings(root, references) {
  const extra = missingShapeHeadingRefs(root, references)
  return extra.length ? [...references, ...extra] : references
}

export function readSurfaceIndex(root) {
  const file = productPaths(root).index
  if (!existsSync(resolve(root, file))) {
    if (existsSync(resolve(root, PRODUCT_POINTER))) throw new Error(`Product pointer index does not exist: ${file}`)
    return { judgment: [], surfaces: [] }
  }
  const index = JSON.parse(readFileSync(resolve(root, file), 'utf8'))
  if (!list(index.surfaces) || !list(index.judgment)) throw new Error('Surface index needs surfaces and judgment references')
  return index
}

export function surfaceIndexFailures(root) {
  const failures = []
  try {
    const paths = productPaths(root)
    const index = readSurfaceIndex(root)
    const ids = new Set()
    for (const surface of index.surfaces) {
      if (!text(surface.id) || ids.has(surface.id)) throw new Error(`Duplicate or empty surface id: ${surface.id}`)
      ids.add(surface.id)
      if (!text(surface.title) || !['group', 'surface'].includes(surface.coverage) || !list(surface.paths) || !surface.paths.every(safePath) || !list(surface.related) || !list(surface.scenarios) || !list(surface.references)) throw new Error(`Invalid surface: ${surface.id}`)
      if (!referenceOf(surface.inventory).file.startsWith(`${paths.inventory}/`)) throw new Error(`Inventory location required: ${surface.id}`)
      if (!surface.scenarios.length && !text(surface.gap)) throw new Error(`Scenario or explicit gap required: ${surface.id}`)
      if (!surface.scenarios.every((ref) => referenceOf(ref).file.startsWith(`${paths.scenarios}/`))) throw new Error(`Scenario location required: ${surface.id}`)
      if (surface.parentReferences !== undefined && (!list(surface.parentReferences) || !surface.parentReferences.length)) throw new Error(`parentReferences must name relevant parent policies: ${surface.id}`)
      for (const ref of [surface.inventory, ...surface.scenarios, ...surface.references, ...(surface.parentReferences ?? [])]) readReference(root, ref)
      for (const miss of missingShapeHeadingRefs(root, surface.references)) {
        failures.push(`${surface.id} cites ${miss.file} without heading ${miss.heading}`)
      }
    }
    for (const surface of index.surfaces) {
      for (const id of surface.related) if (!ids.has(id) || id === surface.id) throw new Error(`Dangling related surface: ${surface.id} → ${id}`)
    }
    for (const ref of index.judgment) {
      if (referenceOf(ref).file !== paths.judgment) throw new Error(`Judgment location must match ${PRODUCT_POINTER}: ${referenceOf(ref).file}`)
      readReference(root, ref)
    }
    const directory = resolve(root, paths.inventory)
    if (existsSync(directory)) for (const file of readdirSync(directory).filter((name) => /^\d{2}-.+\.md$/.test(name))) {
      if (!index.surfaces.some((surface) => referenceOf(surface.inventory).file === `${paths.inventory}/${file}`)) failures.push(`Inventory without context entry: ${file}`)
    }
  } catch (error) { failures.push(error.message) }
  return failures
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
    const refs = [...index.judgment, surface.inventory, ...surface.scenarios, ...withShapeHeadings(root, surface.references), ...(surface.parentReferences ?? [])]
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
  const notion=resolve(root,productPaths(root).inventory,'notion')
  const supporting=existsSync(notion)?readdirSync(notion,{recursive:true,withFileTypes:true}).filter(entry=>entry.isFile()&&entry.name.endsWith('.md')).map(entry=>{
    const file=relative(root,resolve(entry.parentPath,entry.name)).replaceAll('\\','/')
    return {file,route:direct.has(file)?'direct':reachable.has(file)?'linked':'unlinked',bytes:Buffer.byteLength(readFileSync(resolve(root,file)))}
  }):[]
  return {note:'Surface evidence only; implementation also reads required instructions and applicable contract references. Linked means Markdown reachability, not semantic coverage. Unlinked support is a review notice, not a failure.',surfaces,supporting}
}
