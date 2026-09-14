import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

export const WORKSPACE = '.ai-work'
export const STATE_DIRECTORY = 'agent-checks'
export const TASK_RETENTION_DAYS = 7
export const STATE_RETENTION_DAYS = 30

/** Runtime workspaces and the manual archive: a script or a person owns their lifetime, not age. */
const PINNED = new Set([STATE_DIRECTORY, 'agent-attempts', 'agent-receipts', 'gates', 'archive', 'transplant-stage'])
/** `YYYY-MM-DD-NN-slug`. The date is the entry's own claim, so `touch` cannot postpone expiry. */
const NAMED = /^(\d{4}-\d{2}-\d{2})-\d{2}-[a-z0-9][a-z0-9-]*$/
const KEEP_UNTIL = /^\d{4}-\d{2}-\d{2}$/
const DAY = 86_400_000

const days = (from, now) => Math.floor((now - from) / DAY)

/**
 * A session that was granted a write capability and never recorded a review still owes that
 * reconciliation. Deleting its state silently disarms Stop, so age never expires it.
 */
const owesReview = (state) => state.wrote === true && !state.review || state.checkpoint?.units?.some(unit => !state.unitReviews?.[unit.id])

function readStates(root) {
  const directory = resolve(root, WORKSPACE, STATE_DIRECTORY)
  if (!existsSync(directory)) return []
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const path = `${WORKSPACE}/${STATE_DIRECTORY}/${name}`
      // An unreadable state cannot prove it owes a review, so it ages out like any other file.
      const state = (() => { try { return JSON.parse(readFileSync(resolve(root, path), 'utf8')) } catch { return {} } })()
      return { path, name, state, modified: statSync(resolve(root, path)).mtimeMs }
    })
}

/** `KEEP` holds either nothing (keep indefinitely) or the last date to keep the entry. */
function keepUntil(root, path) {
  const file = resolve(root, path, 'KEEP')
  if (!existsSync(file) || !statSync(file).isFile()) return null
  const content = readFileSync(file, 'utf8').trim()
  if (!content) return { indefinite: true }
  if (!KEEP_UNTIL.test(content)) return { indefinite: true, malformed: content }
  return { until: Date.parse(`${content}T23:59:59Z`) }
}

function classifyTask(root, entry, now, states) {
  const { name } = entry
  const path = `${WORKSPACE}/${name}`
  const named = NAMED.exec(name)
  const declared = named ? Date.parse(`${named[1]}T00:00:00Z`) : null
  const age = days(declared ?? statSync(resolve(root, path)).mtimeMs, now)
  const base = { path, name, age, dated: Boolean(named) }

  if (PINNED.has(name)) return { ...base, status: 'pinned', note: 'runtime workspace' }
  const keep = entry.directory ? keepUntil(root, path) : null
  if (keep?.indefinite) return { ...base, status: 'pinned', note: keep.malformed ? `KEEP unreadable: ${keep.malformed}` : 'KEEP' }
  if (keep?.until >= now) return { ...base, status: 'pinned', note: 'KEEP until' }

  const open = states.find((entry) => owesReview(entry.state) && String(entry.state.checkpointPath ?? '').startsWith(`${path}/`))
  if (open) return { ...base, status: 'live', note: `session owes a review: ${open.name.slice(0, 12)}` }
  if (age <= TASK_RETENTION_DAYS) return { ...base, status: 'recent' }
  return { ...base, status: 'expired' }
}

function classifyState(entry, now) {
  const age = days(entry.modified, now)
  const target = entry.state.checkpointPath ?? '(unknown checkpoint)'
  if (owesReview(entry.state)) return { path: entry.path, name: entry.name, age, status: 'open', note: target }
  if (age > STATE_RETENTION_DAYS) return { path: entry.path, name: entry.name, age, status: 'expired', note: target }
  return { path: entry.path, name: entry.name, age, status: 'recent', note: target }
}

export function sweepPlan(root, now = Date.now()) {
  const directory = resolve(root, WORKSPACE)
  if (!existsSync(directory)) return { tasks: [], states: [] }
  const states = readStates(root)
  const tasks = readdirSync(directory, { withFileTypes: true })
    .map((entry) => classifyTask(root, { name: entry.name, directory: entry.isDirectory() }, now, states))
    .sort((left, right) => right.age - left.age)
  return { tasks, states: states.map((entry) => classifyState(entry, now)).sort((left, right) => right.age - left.age) }
}

export function applySweep(root, plan) {
  const removed = [...plan.tasks, ...plan.states].filter((entry) => entry.status === 'expired')
  for (const entry of removed) {
    if (!entry.path.startsWith(`${WORKSPACE}/`)) throw new Error(`Refusing to remove outside ${WORKSPACE}: ${entry.path}`)
    rmSync(resolve(root, entry.path), { recursive: true, force: true })
  }
  return removed.map((entry) => entry.path)
}

export function describeSweep(plan) {
  // The undated note only matters where age decides the outcome, so pinned entries omit it.
  const line = (entry) => `  ${entry.status.padEnd(8)} ${String(entry.age).padStart(3)}d  ${entry.path}${entry.dated === false && entry.status !== 'pinned' ? '  (undated)' : ''}${entry.note ? `  — ${entry.note}` : ''}`
  const counts = (entries) => Object.entries(entries.reduce((totals, entry) => ({ ...totals, [entry.status]: (totals[entry.status] ?? 0) + 1 }), {})).map(([status, count]) => `${status}=${count}`).join(' ')
  return [
    `Task artifacts (retention ${TASK_RETENTION_DAYS}d) — ${counts(plan.tasks) || 'none'}`,
    ...plan.tasks.map(line),
    `Session states (retention ${STATE_RETENTION_DAYS}d) — ${counts(plan.states) || 'none'}`,
    ...plan.states.map(line),
    'Age comes from a YYYY-MM-DD-NN-slug name, else mtime. KEEP (empty, or a YYYY-MM-DD date) pins a directory.',
    'Only expired entries are removed; open states and their task directories are reported, never swept.',
    '',
  ].join('\n')
}
