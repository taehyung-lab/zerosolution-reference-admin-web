import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applySweep, sweepPlan, STATE_RETENTION_DAYS, TASK_RETENTION_DAYS } from './workspace.mjs'
import { hookDecision } from './hook.mjs'

// Real time: the undated-name case falls back to mtime, which only the filesystem can set.
const NOW = Date.now()
const stamp = (daysAgo) => new Date(NOW - daysAgo * 86_400_000).toISOString().slice(0, 10)

const roots = []
function setup() {
  const root = mkdtempSync(join(tmpdir(), 'reference-workspace-'))
  roots.push(root)
  mkdirSync(join(root, '.ai-work/agent-checks'), { recursive: true })
  return root
}
function task(root, name, files = {}) {
  mkdirSync(join(root, '.ai-work', name), { recursive: true })
  for (const [file, content] of Object.entries(files)) writeFileSync(join(root, '.ai-work', name, file), content)
}
function state(root, name, value) {
  writeFileSync(join(root, `.ai-work/agent-checks/${name}.json`), JSON.stringify(value))
}
const find = (entries, path) => entries.find((entry) => entry.path === path)
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

describe('workspace sweep', () => {
  it('expires a dated task directory past retention and removes only that entry', () => {
    const root = setup()
    task(root, `${stamp(TASK_RETENTION_DAYS + 3)}-01-old-analysis`, { 'BRIEF.md': 'done' })
    task(root, `${stamp(1)}-01-current-work`, { 'BRIEF.md': 'active' })

    const plan = sweepPlan(root, NOW)
    expect(find(plan.tasks, `.ai-work/${stamp(TASK_RETENTION_DAYS + 3)}-01-old-analysis`).status).toBe('expired')
    expect(find(plan.tasks, `.ai-work/${stamp(1)}-01-current-work`).status).toBe('recent')

    expect(applySweep(root, plan)).toEqual([`.ai-work/${stamp(TASK_RETENTION_DAYS + 3)}-01-old-analysis`])
    expect(existsSync(join(root, '.ai-work', `${stamp(TASK_RETENTION_DAYS + 3)}-01-old-analysis`))).toBe(false)
    expect(existsSync(join(root, '.ai-work', `${stamp(1)}-01-current-work`))).toBe(true)
  })

  it('keeps a directory whose session still owes a review, however old the name claims to be', () => {
    const root = setup()
    const name = `${stamp(TASK_RETENTION_DAYS + 30)}-01-unreviewed`
    task(root, name, { 'checkpoint.json': '{}' })
    state(root, 'aaa', { checkpointPath: `.ai-work/${name}/checkpoint.json`, wrote: true, review: null })

    const plan = sweepPlan(root, NOW)
    expect(find(plan.tasks, `.ai-work/${name}`).status).toBe('live')
    expect(find(plan.states, '.ai-work/agent-checks/aaa.json').status).toBe('open')
    expect(applySweep(root, plan)).toEqual([])
    expect(existsSync(join(root, '.ai-work', name))).toBe(true)
  })

  it('keeps pinned runtime workspaces and KEEP-marked directories past retention', () => {
    const root = setup()
    task(root, 'gates')
    task(root, 'archive')
    task(root, `${stamp(TASK_RETENTION_DAYS + 5)}-01-handover`, { KEEP: '' })
    task(root, `${stamp(TASK_RETENTION_DAYS + 5)}-02-until`, { KEEP: stamp(-30) })
    task(root, `${stamp(TASK_RETENTION_DAYS + 5)}-03-lapsed`, { KEEP: stamp(2) })

    const plan = sweepPlan(root, NOW)
    expect(find(plan.tasks, '.ai-work/gates').status).toBe('pinned')
    expect(find(plan.tasks, '.ai-work/archive').status).toBe('pinned')
    expect(find(plan.tasks, '.ai-work/agent-checks').status).toBe('pinned')
    expect(find(plan.tasks, `.ai-work/${stamp(TASK_RETENTION_DAYS + 5)}-01-handover`).status).toBe('pinned')
    expect(find(plan.tasks, `.ai-work/${stamp(TASK_RETENTION_DAYS + 5)}-02-until`).status).toBe('pinned')
    expect(find(plan.tasks, `.ai-work/${stamp(TASK_RETENTION_DAYS + 5)}-03-lapsed`).status).toBe('expired')
  })

  it('falls back to mtime for an undated name and reports that the name carried no date', () => {
    const root = setup()
    task(root, 'search-debate', { 'BRIEF.md': 'no date in the name' })

    const entry = find(sweepPlan(root, NOW).tasks, '.ai-work/search-debate')
    expect(entry.dated).toBe(false)
    // The directory was created now, so mtime keeps it even though the name declares nothing.
    expect(entry.status).toBe('recent')
  })

  it('expires a reviewed session state past its own longer retention but never an open one', () => {
    const root = setup()
    state(root, 'reviewed', { checkpointPath: '.ai-work/x/checkpoint.json', wrote: true, review: { fingerprint: 'abc' } })
    state(root, 'open', { checkpointPath: '.ai-work/y/checkpoint.json', wrote: true, review: null })
    const aged = NOW + (STATE_RETENTION_DAYS + 2) * 86_400_000

    const plan = sweepPlan(root, aged)
    expect(find(plan.states, '.ai-work/agent-checks/reviewed.json').status).toBe('expired')
    expect(find(plan.states, '.ai-work/agent-checks/open.json').status).toBe('open')
    expect(applySweep(root, plan)).toEqual(['.ai-work/agent-checks/reviewed.json'])
  })

  it('refuses to remove an entry outside the workspace', () => {
    const root = setup()
    expect(() => applySweep(root, { tasks: [{ path: 'src/features', status: 'expired' }], states: [] })).toThrow(/Refusing to remove/)
  })

  it('lets the hook classify without preparation but gates the deleting form', () => {
    const root = setup()
    const event = { session_id: 'one', hook_event_name: 'PreToolUse', tool_name: 'Bash' }
    expect(hookDecision(root, { ...event, tool_input: { command: 'node scripts/agents/cli.mjs sweep' } })).toEqual({})
    expect(hookDecision(root, { ...event, tool_input: { command: 'node scripts/agents/cli.mjs sweep --apply' } }))
      .toMatchObject({ hookSpecificOutput: { permissionDecision: 'deny' } })
  })
})
