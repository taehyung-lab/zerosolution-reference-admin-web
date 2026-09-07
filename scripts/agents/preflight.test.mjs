import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { prepare, checkEdit, recordReview, checkStop } from './preflight.mjs'
import { hookDecision } from './hook.mjs'

const roots = []
function setup() {
  const root = mkdtempSync(join(tmpdir(), 'reference-preflight-'))
  roots.push(root)
  mkdirSync(join(root, '.ai-work'), { recursive: true })
  mkdirSync(join(root, 'scripts'), { recursive: true })
  writeFileSync(join(root, 'AGENTS.md'), 'Read the contract. Do not guess policy.')
  writeFileSync(join(root, 'scripts/example.mjs'), 'export const value = 1\n')
  const checkpoint = {
    scope: ['scripts/'],
    requirements: [{ id: 'R1', text: 'Keep one owner for the value.' }],
    references: ['AGENTS.md'], contracts: [], unresolved: [],
  }
  writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(checkpoint))
  return { root, checkpoint }
}
const fingerprint = (root) => ({ 'scripts/example.mjs': readFileSync(join(root, 'scripts/example.mjs'), 'utf8') })
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

describe('repository preflight', () => {
  it('executes the checked-in runtime adapter commands with native payloads', () => {
    const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
    const codex = read('.codex/hooks.json').hooks;
    const claude = read('.claude/settings.json').hooks;
    const copilot = read('.github/hooks/reference.json').hooks;
    const snake = { session_id: 'adapter-command-negative-control', tool_name: 'Write', tool_input: { file_path: 'src/example.ts' } };
    const camel = { sessionId: 'adapter-command-negative-control', toolName: 'create', toolArgs: { path: 'src/example.ts' } };
    const cases = [
      [codex.PreToolUse[0].hooks[0].command, snake, false],
      [claude.PreToolUse[0].hooks[0].command, snake, false],
      [copilot.preToolUse[0].bash, camel, true],
    ];
    for (const [command, payload, native] of cases) {
      const result = JSON.parse(execFileSync('/bin/sh', ['-c', command], {
        input: JSON.stringify(payload), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: process.cwd() },
      }));
      expect(native ? result.permissionDecision : result.hookSpecificOutput.permissionDecision).toBe('deny');
    }
  });
  it('blocks an unprepared session and delivers current reference text when prepared', () => {
    const { root } = setup()
    expect(checkEdit(root, 'one', ['scripts/example.mjs'])).toMatch(/prepare/)
    expect(prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)).toContain('Do not guess policy')
    expect(checkEdit(root, 'one', ['scripts/example.mjs'])).toBeNull()
    expect(checkEdit(root, 'two', ['scripts/example.mjs'])).toMatch(/prepare/)
  })
  it('blocks out-of-scope edits, unresolved policy and stale reference contents', () => {
    const { root, checkpoint } = setup()
    checkpoint.unresolved = [{ question: 'Which wire value?', paths: ['scripts/blocked.mjs'] }]
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(checkpoint))
    prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)
    expect(checkEdit(root, 'one', ['src/new.ts'])).toMatch(/scope/)
    expect(checkEdit(root, 'one', ['scripts/blocked.mjs'])).toMatch(/Which wire value/)
    writeFileSync(join(root, 'AGENTS.md'), 'Contract changed')
    expect(checkEdit(root, 'one', ['scripts/example.mjs'])).toMatch(/changed/)
  })
  it('requires applicable skill and screen evidence before feature editing', () => {
    const { root, checkpoint } = setup()
    checkpoint.scope = ['src/features/members/list/']
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(checkpoint))
    expect(() => prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)).toThrow(/feature-contract/)
  })
  it('requires a workflow decision by default and allows explained infrastructure work', () => {
    const { root, checkpoint } = setup()
    mkdirSync(join(root, '.agents/skills/feature-contract'), { recursive: true })
    writeFileSync(join(root, '.agents/skills/feature-contract/SKILL.md'), 'Feature contract.')
    const feature = {
      ...checkpoint,
      scope: ['src/features/members/list/'],
      references: ['AGENTS.md', '.agents/skills/feature-contract/SKILL.md'],
    }
    // A default build can no longer silently skip product evidence.
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(feature))
    expect(() => prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)).toThrow(/Uncovered/)
    feature.work = { kind: 'infrastructure', reason: 'Change API type plumbing without changing screen workflow.' }
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(feature))
    expect(() => prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)).not.toThrow()
    expect(checkEdit(root, 'one', ['src/features/members/list/screen.tsx'])).toBeNull()

    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify({ ...feature, stage: 'settled' }))
    expect(() => prepare(root, 'two', '.ai-work/checkpoint.json', fingerprint)).not.toThrow()
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify({ ...feature, stage: 'sometime' }))
    expect(() => prepare(root, 'three', '.ai-work/checkpoint.json', fingerprint)).toThrow(/stage/)
  })
  it('lets a session author a reference it also declared as scope, and still catches a foreign edit', () => {
    const { root, checkpoint } = setup()
    writeFileSync(join(root, 'scripts/notes.md'), 'first draft\n')
    const owned = { ...checkpoint, references: ['AGENTS.md', 'scripts/notes.md'] }
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(owned))
    prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)
    // `scripts/notes.md` is inside the declared scope, so rewriting it is authorship, not staleness.
    writeFileSync(join(root, 'scripts/notes.md'), 'second draft\n')
    expect(checkEdit(root, 'one', ['scripts/example.mjs'])).toBeNull()
    expect(checkEdit(root, 'one', ['scripts/notes.md'])).toBeNull()
    // AGENTS.md is outside the scope, so a change there is still someone else moving the ground.
    writeFileSync(join(root, 'AGENTS.md'), 'Contract changed')
    expect(checkEdit(root, 'one', ['scripts/example.mjs'])).toMatch(/changed/)
  })
  it('requires a review of the current output and invalidates it after another edit', () => {
    const { root } = setup()
    prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)
    expect(checkStop(root, 'one', fingerprint)).toBeNull()
    const edit = () => hookDecision(root, { session_id: 'one', hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: join(root, 'scripts/example.mjs') } })
    expect(edit()).toEqual({})
    writeFileSync(join(root, 'scripts/example.mjs'), 'export const value = 2\n')
    expect(checkStop(root, 'one', fingerprint)).toMatch(/review/)
    const report = {
      requirements: [{ id: 'R1', status: 'implemented', evidence: 'Focused value test passed.' }],
      contractReview: 'No shared candidate applies to this script.',
      complexityReview: 'One constant; no wrapper or domain switch.',
      assumptions: [], limitations: ['No browser scope.'],
    }
    recordReview(root, 'one', report, fingerprint)
    expect(checkStop(root, 'one', fingerprint)).toBeNull()
    writeFileSync(join(root, 'scripts/example.mjs'), 'export const value = 3\n')
    expect(checkStop(root, 'one', fingerprint)).toMatch(/review/)
    expect(() => recordReview(root, 'one', { ...report, requirements: [] }, fingerprint)).toThrow(/R1/)
  })
  it('uses the same deny verdict for Codex, Claude and Copilot native edits', () => {
    const { root } = setup()
    const codex = hookDecision(root, { session_id: 'one', hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { command: '*** Begin Patch\n*** Update File: scripts/example.mjs\n@@\n-x\n+y\n*** End Patch' } })
    const claude = hookDecision(root, { session_id: 'one', hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: join(root, 'scripts/example.mjs') } })
    const copilot = hookDecision(root, { sessionId: 'one', toolName: 'edit', toolArgs: JSON.stringify({ path: 'scripts/example.mjs' }) }, 'preToolUse')
    expect(codex.hookSpecificOutput.permissionDecision).toBe('deny')
    expect(claude.hookSpecificOutput.permissionDecision).toBe('deny')
    expect(copilot.permissionDecision).toBe('deny')
  })
  it('keeps inspection and checkpoint bootstrap available, but gates arbitrary shell execution', () => {
    const { root } = setup()
    const event = { session_id: 'one', hook_event_name: 'PreToolUse', tool_name: 'Bash' }
    expect(hookDecision(root, { ...event, tool_input: { command: 'rtk read AGENTS.md' } })).toEqual({})
    expect(hookDecision(root, { ...event, tool_input: { command: 'python3 change.py' } }).hookSpecificOutput.permissionDecision).toBe('deny')
    expect(hookDecision(root, { ...event, tool_name: 'Write', tool_input: { file_path: '.ai-work/checkpoint.json' } })).toEqual({})
    expect(hookDecision(root, { ...event, tool_input: { command: 'rtk read AGENTS.md; python3 change.py' } }).hookSpecificOutput.permissionDecision).toBe('deny')
    expect(hookDecision(root, { ...event, tool_input: { command: 'git diff --output=scripts/example.mjs' } }).hookSpecificOutput.permissionDecision).toBe('deny')
  })
  it('checks the actual edit contract even when a parent directory was prepared', () => {
    const { root, checkpoint } = setup()
    checkpoint.scope = ['src/']
    checkpoint.work = { kind: 'infrastructure', reason: 'Transport-only work still needs actual-path skills.' }
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(checkpoint))
    prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)
    expect(checkEdit(root, 'one', ['src/features/managers/api/queries.ts'])).toMatch(/feature-contract|api-contract/)
  })
  it('detects shell changes outside scope even after they have been committed', () => {
    const { root } = setup()
    const git = (args) => execFileSync('git', args, { cwd: root, stdio: 'ignore' })
    git(['init'])
    writeFileSync(join(root, '.gitignore'), '.ai-work/\n')
    git(['add', '.'])
    git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'baseline'])
    prepare(root, 'one', '.ai-work/checkpoint.json')
    // The shell call is what makes this session accountable for the whole tree.
    hookDecision(root, { session_id: 'one', hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'python3 write.py' } })
    writeFileSync(join(root, 'outside.txt'), 'shell change')
    git(['add', 'outside.txt'])
    git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'shell change'])
    expect(checkStop(root, 'one')).toMatch(/scope/)
  })
  it('lets a session that only inspected finish while another session edits the tree', () => {
    const { root } = setup()
    prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)
    const event = { session_id: 'one', hook_event_name: 'PreToolUse', tool_name: 'Bash' }
    expect(hookDecision(root, { ...event, tool_input: { command: 'wc -c AGENTS.md' } })).toEqual({})
    writeFileSync(join(root, 'scripts/example.mjs'), 'export const value = 9\n')
    expect(checkStop(root, 'one', fingerprint)).toBeNull()
    const report = {
      requirements: [{ id: 'R1', status: 'unimplemented', evidence: 'Read-only review; no edit made.' }],
      contractReview: 'No contract changed.', complexityReview: 'No diff.',
      assumptions: [], limitations: ['Another session changed scripts/example.mjs.'],
    }
    expect(() => recordReview(root, 'one', report, fingerprint)).not.toThrow()
  })
  it('admits read-only inspection argv and still refuses the writing forms of the same commands', () => {
    const { root } = setup()
    const event = { session_id: 'unprepared', hook_event_name: 'PreToolUse', tool_name: 'Bash' }
    const verdict = (command) => hookDecision(root, { ...event, tool_input: { command } })
    for (const command of [
      'wc -c AGENTS.md',
      'grep -rn value scripts',
      'find scripts -type f -name *.mjs',
      "sed -n 1,40p AGENTS.md",
    ]) {
      expect(verdict(command), command).toEqual({})
    }
    for (const command of [
      'find scripts -type f -delete',
      'find scripts -name *.mjs -exec rm {} ;',
      'find scripts -fprint out.txt',
      'sed -i s/a/b/ AGENTS.md',
      'sed -n 1p AGENTS.md w out.txt',
      'sed -f script.sed AGENTS.md',
    ]) {
      expect(verdict(command).hookSpecificOutput?.permissionDecision, command).toBe('deny')
    }
  })
  it('routes every tool name the handler answers through each adapter matcher', () => {
    const handled = ['Bash', 'bash', 'exec_command', 'shell', 'powershell', 'Edit', 'Write', 'MultiEdit', 'edit', 'create', 'apply_patch']
    for (const file of ['.codex/hooks.json', '.claude/settings.json']) {
      const { matcher } = JSON.parse(readFileSync(file, 'utf8')).hooks.PreToolUse[0]
      const names = new Set(matcher.split('|'))
      for (const name of handled) expect(names.has(name), `${file} misses ${name}`).toBe(true)
    }
  })
})
