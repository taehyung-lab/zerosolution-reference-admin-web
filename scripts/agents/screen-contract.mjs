import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * The inventory's section tables own what a screen must be. This reads the rows that declare an `id`
 * so gates can compare against product facts instead of only checking declaration shape. A table
 * without an `id` column, or a row with an empty one, is simply not migrated yet.
 *
 * Ownership stays where `docs/reference/zero-sol/README.md` puts it: these rows are the denominator
 * of completeness, scenario cards own verification, and `현재 코드` is a discovery pointer. Nothing
 * here reports implementation completeness.
 */
export const ROW_KINDS = ['열거', '서술', 'ref', 'n/a']
/** Cells the ledger uses for "nothing here"; any of them reads as empty. */
const EMPTY = new Set(['', '—', '-', '없음'])
const OBSERVATION_PENDING = '(미판독)'
const POLICY_PENDING = '(대기)'

const cell = (value) => value.trim()
const blank = (value) => EMPTY.has(cell(value))
const strip = (value) => cell(value).replace(/^`|`$/g, '')

function tableRows(content) {
  const tables = []
  let header = null
  let rows = null
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) {
      if (header) tables.push({ header, rows })
      header = null
      rows = null
      continue
    }
    const cells = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|')
    if (!header) {
      header = cells.map(cell)
      rows = []
      continue
    }
    if (cells.every((value) => /^-+$/.test(cell(value)))) continue
    rows.push(cells)
  }
  if (header) tables.push({ header, rows })
  return tables
}

/** Reads one section file. Unmigrated tables contribute nothing rather than failing. */
export function screenRows(root, file) {
  const path = resolve(root, file)
  if (!existsSync(path)) throw new Error(`Missing inventory section: ${file}`)
  const content = readFileSync(path, 'utf8')
  const collected = []
  for (const { header, rows } of tableRows(content)) {
    const index = Object.fromEntries(header.map((name, position) => [name, position]))
    if (index.id === undefined) continue
    for (const cells of rows) {
      const id = strip(cells[index.id] ?? '')
      if (blank(id)) continue
      const kind = cell(cells[index['종류']] ?? '')
      if (!ROW_KINDS.includes(kind)) throw new Error(`${file}: row ${id} needs 종류 ${ROW_KINDS.join(' / ')}`)
      const observation = cell(cells[index['Figma 관찰']] ?? '')
      const policy = cell(cells[index['Notion 동작·정책']] ?? '')
      const unresolved = cell(cells[index['미확인']] ?? '')
      const pointer = cell(cells[index['현재 코드']] ?? '')
      const reasons = []
      if (!blank(unresolved)) reasons.push(unresolved)
      if (observation.includes(OBSERVATION_PENDING)) reasons.push('Figma 관찰 미판독')
      if (policy.includes(POLICY_PENDING)) reasons.push('Notion 정책 미수집')
      collected.push({
        id,
        kind,
        file,
        screen: cell(cells[index['화면']] ?? ''),
        surface: cell(cells[index['surface']] ?? ''),
        // Free text on purpose: a machine compares enumerations, a reader judges descriptions.
        observation,
        policy,
        unresolved: reasons.length ? reasons.join(' / ') : null,
        questions: [...new Set([...unresolved.matchAll(/\bQ(\d+)\b/g)].map((match) => match[1]))],
        pointer: blank(pointer) ? null : pointer,
      })
    }
  }
  const duplicate = collected.find((row, position) => collected.findIndex((other) => other.id === row.id) !== position)
  if (duplicate) throw new Error(`${file}: duplicate row id ${duplicate.id}`)
  return collected
}

/**
 * Which rows a surface owns. The `id` prefix is the surface's own contract name, so a screen that has
 * not been migrated returns nothing and the caller reports an unmigrated screen rather than zero rows.
 */
export function rowsForSurface(root, surface) {
  if (!surface?.inventory) return []
  return screenRows(root, surface.inventory).filter((row) => row.id.startsWith(`${surface.id}.`))
}

/**
 * A pointer names where to look, never that the work is done. Resolution is checked so a stale pointer
 * is visible; an unresolved pointer is reported as such and never as missing implementation.
 */
export function pointerState(root, row) {
  if (row.kind === 'n/a') return 'n/a'
  if (!row.pointer) return 'none'
  const candidates = [...row.pointer.matchAll(/`([^`]+)`/g)].map((match) => match[1])
  const paths = candidates.filter((value) => value.includes('/') || /\.[jt]sx?$/.test(value))
  if (!paths.length) return 'unverifiable'
  return paths.every((value) => existsSync(resolve(root, value)) || tracked(root, value)) ? 'present' : 'stale'
}

/**
 * The ledger writes pointers the way a reader looks things up — a bare file name or a path fragment —
 * so resolution matches against tracked paths instead of assuming a repository-root path. Without this
 * a correct pointer such as `screens/detail/` would be reported stale.
 */
function tracked(root, value) {
  const fragment = value.replace(/\/$/, '')
  try {
    const found = execFileSync('git', ['ls-files', `*${fragment}`, `*${fragment}/*`], { cwd: root, encoding: 'utf8' })
    return found.trim().length > 0
  } catch { return false }
}

export function summarize(rows, root) {
  const counted = rows.filter((row) => !['n/a', 'ref'].includes(row.kind))
  const excluded = rows.filter((row) => ['n/a', 'ref'].includes(row.kind))
  return {
    total: rows.length,
    denominator: counted.length,
    unresolved: counted.filter((row) => row.unresolved).map((row) => row.id),
    // Leaving a row out of the denominator must not hide that its original is unread or its policy
    // uncollected: "nothing here is confirmed" and "nobody has looked" are different facts.
    unresolvedOutsideDenominator: excluded.filter((row) => row.unresolved).map((row) => row.id),
    enumerations: counted.filter((row) => row.kind === '열거').map((row) => row.id),
    pointers: Object.fromEntries(rows.map((row) => [row.id, pointerState(root, row)])),
  }
}
