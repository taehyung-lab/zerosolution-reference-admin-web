import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { prepare, checkEdit, recordReview, checkStop, outputSnapshot } from './preflight.mjs'
import { hookDecision } from './hook.mjs'

const roots = []
function setup() {
  const root = mkdtempSync(join(tmpdir(), 'reference-preflight-'))
  roots.push(root)
  mkdirSync(join(root, '.ai-work'), { recursive: true })
  mkdirSync(join(root, 'scripts'), { recursive: true })
  // Attribution enumerates the tree through Git, so the fixture needs a repository to be measured in.
  writeFileSync(join(root, '.gitignore'), '.ai-work/\n')
  execFileSync('git', ['init'], { cwd: root, stdio: 'ignore' })
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
  it('keeps requirement identity across re-preparation while allowing additions and evidence changes', () => {
    const { root, checkpoint } = setup()
    const run = () => {
      writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(checkpoint))
      return prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)
    }
    run()
    const original = { ...checkpoint.requirements[0] }
    checkpoint.requirements = [{ id: 'R2', text: 'A new requirement.' }]
    expect(run).toThrow(/Preserve requirement R1/)
    checkpoint.requirements = [{ ...original, text: 'An easier replacement.' }]
    expect(run).toThrow(/Preserve requirement R1/)
    checkpoint.requirements = [original, { id: 'R2', text: 'A new requirement.' }]
    expect(run).not.toThrow()
    checkpoint.requirements[0].sources = ['user']
    expect(run).not.toThrow()
    checkpoint.requirements.pop()
    expect(run).toThrow(/Preserve requirement R2/)
  })
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
  it('snapshots only files when git lists a nested worktree directory as a path', () => {
    const { root } = setup()
    // A nested repository (what an agent worktree under .claude/worktrees/ looks like to the parent)
    // is listed by `git ls-files --others` as a single directory path.
    mkdirSync(join(root, 'nested'), { recursive: true })
    execFileSync('git', ['init'], { cwd: join(root, 'nested'), stdio: 'ignore' })
    writeFileSync(join(root, 'nested/inner.txt'), 'inner')
    // The real snapshot is what the Stop hook reads; the nested path is present and snapshots as null
    // rather than throwing EISDIR (the second independent review measured that prepare/checkEdit alone
    // never reach this snapshot, so it is asserted directly).
    const snapshot = outputSnapshot(root)
    expect(Object.keys(snapshot).some((path) => path.startsWith('nested'))).toBe(true)
    expect(Object.entries(snapshot).filter(([path]) => path.startsWith('nested')).every(([, value]) => value === null)).toBe(true)
    expect(snapshot['scripts/example.mjs']).toEqual(expect.any(String))
  })
  it('names the screen loop first when a default screen build declares no skill', () => {
    const { root, checkpoint } = setup()
    checkpoint.scope = ['src/features/members/screens/list/']
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(checkpoint))
    // The loop is read before any path-routed contract, so it is the first missing reference reported.
    expect(() => prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)).toThrow(/screen-loop/)
    checkpoint.work = { kind: 'maintenance', reason: 'Copy only.' }
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(checkpoint))
    expect(() => prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)).toThrow(/feature-contract/)
  })
  it('requires the screen loop only for default screen work on feature and route scopes', () => {
    const { root, checkpoint } = setup()
    for (const skill of ['feature-contract', 'screen-loop', 'api-contract']) {
      mkdirSync(join(root, `.agents/skills/${skill}`), { recursive: true })
      writeFileSync(join(root, `.agents/skills/${skill}/SKILL.md`), `${skill}.`)
    }
    const write = (value) => writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(value))
    const contract = ['AGENTS.md', '.agents/skills/feature-contract/SKILL.md']
    // Default screen work: the path-routed contract alone is not enough for a route or a feature screen.
    write({ ...checkpoint, scope: ['src/routes/_app/members/'], references: contract })
    expect(() => prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)).toThrow(/screen-loop/)
    write({ ...checkpoint, scope: ['src/features/members/screens/list/'], references: contract })
    expect(() => prepare(root, 'two', '.ai-work/checkpoint.json', fingerprint)).toThrow(/screen-loop/)
    // Declared maintenance on the same screen is copy/style work, which the loop excludes.
    write({ ...checkpoint, scope: ['src/features/members/screens/list/'], references: contract, work: { kind: 'maintenance', reason: 'Copy only.' } })
    expect(() => prepare(root, 'three', '.ai-work/checkpoint.json', fingerprint)).not.toThrow()
    // Declared infrastructure on a feature API path is contract-only work.
    write({ ...checkpoint, scope: ['src/features/members/api/'], references: [...contract, '.agents/skills/api-contract/SKILL.md'], work: { kind: 'infrastructure', reason: 'Type plumbing only.' } })
    expect(() => prepare(root, 'four', '.ai-work/checkpoint.json', fingerprint)).not.toThrow()
    // An app-shell edit is not a screen request even as default work; only the contract is required.
    write({ ...checkpoint, scope: ['src/app/shell/'], references: contract, work: { kind: 'infrastructure', reason: 'Shell wiring only.' } })
    expect(() => prepare(root, 'five', '.ai-work/checkpoint.json', fingerprint)).not.toThrow()
    expect(checkEdit(root, 'five', ['src/app/shell/Shell.tsx'])).toBeNull()
  })
  it('reports a prefix-loaded reference instead of rendering it, without weakening the reference checks', () => {
    const { root, checkpoint } = setup()
    const write = (value) => writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(value))
    // Negative control: a checkpoint that declares nothing still receives the full reference text.
    expect(prepare(root, 'plain', '.ai-work/checkpoint.json', fingerprint)).toContain('Do not guess policy')

    const declared = { ...checkpoint, prefixLoaded: ['AGENTS.md'] }
    write(declared)
    // Negative control: with no runtime pointer in the repository, the declaration proves nothing.
    expect(() => prepare(root, 'pointerless', '.ai-work/checkpoint.json', fingerprint)).toThrow(/verified against this repository's runtime pointers/)
    writeFileSync(join(root, 'CLAUDE.md'), '@AGENTS.md\n\nProject pointer.\n')
    const first = prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)
    expect(first).not.toContain('Do not guess policy')
    expect(first).toMatch(/AGENTS\.md — declared as already loaded/)
    // The whole-file hash is still recorded, so scope and staleness behave exactly as before.
    expect(checkEdit(root, 'one', ['scripts/example.mjs'])).toBeNull()
    writeFileSync(join(root, 'AGENTS.md'), 'Contract changed')
    expect(checkEdit(root, 'one', ['scripts/example.mjs'])).toMatch(/changed/)
    // The runtime prefix cannot reload mid-session, so a changed file is delivered in full.
    expect(prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)).toContain('Contract changed')

    // The declaration cannot stand in for the required reference itself.
    write({ ...declared, references: [] })
    expect(() => prepare(root, 'two', '.ai-work/checkpoint.json', fingerprint)).toThrow(/Required reference: AGENTS\.md/)
    // Nor can it name a document this checkpoint never declared in full.
    write({ ...declared, prefixLoaded: ['scripts/example.mjs'] })
    expect(() => prepare(root, 'three', '.ai-work/checkpoint.json', fingerprint)).toThrow(/prefixLoaded/)
  })
  it('sends an insufficient requirement back into the loop instead of closing on it', () => {
    const { root, checkpoint } = setup()
    const two = { ...checkpoint, requirements: [checkpoint.requirements[0], { id: 'R2', text: 'The replacement scope.' }] }
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(two))
    prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)
    hookDecision(root, { session_id: 'one', hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'node build.mjs' } })
    writeFileSync(join(root, 'scripts/example.mjs'), 'export const value = 4\n')
    const base = {
      contractReview: 'No contract changed.', complexityReview: 'One constant.',
      assumptions: [], limitations: [],
    }
    const gap = (extra) => ({
      ...base,
      requirements: [
        { id: 'R1', status: 'different', evidence: 'Implemented as a narrower constant.', appliedSections: ['AGENTS.md'], ...extra },
        { id: 'R2', status: 'implemented', evidence: 'Covered.', appliedSections: ['AGENTS.md'] },
      ],
    })
    // A gap that points nowhere would close the task on it.
    expect(() => recordReview(root, 'one', gap({}), fingerprint)).toThrow(/name a replacement requirement ID/)
    // Pointing at itself is not a replacement either.
    expect(() => recordReview(root, 'one', gap({ replacement: 'R1' }), fingerprint)).toThrow(/replacement requirement ID/)
    expect(() => recordReview(root, 'one', gap({ replacement: 'R7' }), fingerprint)).toThrow(/replacement requirement ID/)
    // Either the successor requirement or the blocking condition re-opens it.
    expect(() => recordReview(root, 'one', gap({ replacement: 'R2' }), fingerprint)).not.toThrow()
    expect(() => recordReview(root, 'one', gap({ blocked: 'Waiting on the wire value.' }), fingerprint)).not.toThrow()
  })
  it('refuses a review that leaves a written path unclaimed by any requirement', () => {
    const { root, checkpoint } = setup()
    // `unimplemented` skips the per-requirement file check, so the claim check is what accounts for writes.
    const flow = {
      ...checkpoint, work: { kind: 'workflow' }, surfaces: [],
      requirements: [{ ...checkpoint.requirements[0], surfaces: [], sources: ['user'], contracts: [], contractReason: 'No seed bundle applies.' }],
      evidenceGaps: [{ paths: ['scripts/'], requirements: ['R1'], reason: 'Unindexed fixture surface.', references: ['AGENTS.md'] }],
    }
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(flow))
    prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)
    hookDecision(root, { session_id: 'one', hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'node build.mjs' } })
    writeFileSync(join(root, 'scripts/example.mjs'), 'export const value = 5\n')
    const base = { contractReview: 'No contract changed.', complexityReview: 'One constant.', assumptions: [], limitations: [] }
    const report = (requirement) => ({ ...base, requirements: [{ id: 'R1', evidence: 'Reported.', ...requirement }] })
    // Negative: the write happened and nothing accounts for it.
    expect(() => recordReview(root, 'one', report({ status: 'unimplemented', blocked: 'Waiting on the wire value.' }), fingerprint))
      .toThrow(/wrote paths no requirement claims/)
    // Naming an unrelated file does not account for it either.
    expect(() => recordReview(root, 'one', report({ status: 'unimplemented', blocked: 'Waiting.', files: ['scripts/other.mjs'] }), fingerprint))
      .toThrow(/scripts\/example\.mjs/)
    // Positive: the requirement that the write serves names it, with the evidence that status already requires.
    expect(() => recordReview(root, 'one', report({
      status: 'implemented', appliedSections: ['AGENTS.md'], files: ['scripts/example.mjs'],
      verification: [{ method: 'node build.mjs', result: 'exit 0' }],
    }), fingerprint)).not.toThrow()
  })
  it('refuses a review that cites a convention section this session never received', () => {
    const { root, checkpoint } = setup()
    writeFileSync(join(root, 'scripts/notes.md'), '# Owned\n\nA rule.\n\n# Other\n\nAnother rule.\n')
    const cited = { ...checkpoint, references: ['AGENTS.md', { file: 'scripts/notes.md', heading: 'Owned' }] }
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(cited))
    prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)
    hookDecision(root, { session_id: 'one', hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'node build.mjs' } })
    writeFileSync(join(root, 'scripts/example.mjs'), 'export const value = 5\n')
    const review = (appliedSections) => ({
      requirements: [{ id: 'R1', status: 'implemented', evidence: 'Done.', appliedSections }],
      contractReview: 'No contract changed.', complexityReview: 'One constant.',
      assumptions: [], limitations: [],
    })
    // The delivered section, and the whole file that contains it, both count.
    expect(() => recordReview(root, 'one', review([{ file: 'scripts/notes.md', heading: 'Owned' }]), fingerprint)).not.toThrow()
    expect(() => recordReview(root, 'one', review(['AGENTS.md']), fingerprint)).not.toThrow()
    // A sibling section was never delivered, so it cannot be the source of a claim.
    expect(() => recordReview(root, 'one', review([{ file: 'scripts/notes.md', heading: 'Other' }]), fingerprint)).toThrow(/never received|not delivered/)
    // Neither can a document this session was never given.
    writeFileSync(join(root, 'scripts/undelivered.md'), '# Elsewhere\n\nA rule nobody prepared.\n')
    expect(() => recordReview(root, 'one', review(['scripts/undelivered.md']), fingerprint)).toThrow(/not delivered/)
    expect(() => recordReview(root, 'one', review([]), fingerprint)).toThrow(/appliedSections/)
    // A whole-file delivery covers its headings, so an invented one must still be rejected.
    expect(() => recordReview(root, 'one', review([{ file: 'AGENTS.md', heading: 'No Such Rule' }]), fingerprint)).toThrow(/heading must exist/)
  })
  it('attributes a large whole-file delivery to the input that requested it', () => {
    const { root, checkpoint } = setup()
    writeFileSync(join(root, 'scripts/ledger.md'), `# Ledger\n\n${'A rule sentence for the ledger. '.repeat(300)}\n`)
    const wide = { ...checkpoint, references: ['AGENTS.md', 'scripts/ledger.md'] }
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(wide))
    const output = prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)
    expect(output).toMatch(/Whole-file deliveries over 4096 bytes/)
    expect(output).toMatch(/scripts\/ledger\.md — requested whole by checkpoint\.references/)
    expect(output).toMatch(/bytes delivered \(\d+ in whole files\)/)
    // Below the threshold there is no decision to prompt, so the report stays quiet.
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(checkpoint))
    expect(prepare(root, 'two', '.ai-work/checkpoint.json', fingerprint)).not.toMatch(/Whole-file deliveries over/)
  })
  it('routes an app error-boundary edit to the shared UI contract', () => {
    const { root, checkpoint } = setup()
    const write = (value) => writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(value))
    for (const skill of ['feature-contract', 'shared-ui-contract']) {
      mkdirSync(join(root, `.agents/skills/${skill}`), { recursive: true })
      writeFileSync(join(root, `.agents/skills/${skill}/SKILL.md`), `${skill}.`)
    }
    const routed = {
      ...checkpoint,
      scope: ['src/app/error-boundary/'],
      references: ['AGENTS.md', '.agents/skills/feature-contract/SKILL.md'],
      work: { kind: 'infrastructure', reason: 'Boundary presentation only; no screen workflow changes.' },
    }
    write(routed)
    expect(() => prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)).toThrow(/shared-ui-contract/)
    write({ ...routed, references: [...routed.references, '.agents/skills/shared-ui-contract/SKILL.md'] })
    expect(() => prepare(root, 'two', '.ai-work/checkpoint.json', fingerprint)).not.toThrow()
    expect(checkEdit(root, 'two', ['src/app/error-boundary/ui/Boundary.tsx'])).toBeNull()
  })
  it('requires a workflow decision by default and allows explained infrastructure work', () => {
    const { root, checkpoint } = setup()
    for (const skill of ['feature-contract', 'screen-loop']) {
      mkdirSync(join(root, `.agents/skills/${skill}`), { recursive: true })
      writeFileSync(join(root, `.agents/skills/${skill}/SKILL.md`), `${skill}.`)
    }
    const feature = {
      ...checkpoint,
      scope: ['src/features/members/screens/list/'],
      references: ['AGENTS.md', '.agents/skills/feature-contract/SKILL.md', '.agents/skills/screen-loop/SKILL.md'],
    }
    // A default build can no longer silently skip product evidence.
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(feature))
    expect(() => prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)).toThrow(/Uncovered/)
    feature.work = { kind: 'infrastructure', reason: 'Change API type plumbing without changing screen workflow.' }
    writeFileSync(join(root, '.ai-work/checkpoint.json'), JSON.stringify(feature))
    expect(() => prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)).not.toThrow()
    expect(checkEdit(root, 'one', ['src/features/members/screens/list/ui/screen.tsx'])).toBeNull()

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
      requirements: [{ id: 'R1', status: 'implemented', evidence: 'Focused value test passed.', appliedSections: ['AGENTS.md'] }],
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
  it('names the operator that stopped read-only recognition instead of only asking for preparation', () => {
    const { root } = setup()
    const event = { session_id: 'unprepared', hook_event_name: 'PreToolUse', tool_name: 'Bash' }
    const reason = (command) => hookDecision(root, { ...event, tool_input: { command } })
      .hookSpecificOutput.permissionDecisionReason
    // The cause is the pipe, not a missing preparation, so the denial must say so first.
    expect(reason('ls src | head')).toMatch(/^Not recognized as a read-only command because of the shell operator \|/)
    expect(reason('cat AGENTS.md 2>&1')).toMatch(/Not recognized as a read-only command/)
    // A backtick inside double quotes is command substitution; single quotes keep it literal.
    expect(reason('grep -n "a `b` c" AGENTS.md')).toMatch(/inside double quotes/)
    expect(hookDecision(root, { ...event, tool_input: { command: "grep -n 'a `b` c' AGENTS.md" } })).toEqual({})
    // A parsable command that is simply not allowlisted keeps the preparation message alone.
    expect(reason('python3 change.py')).not.toMatch(/Not recognized as a read-only command/)
    expect(reason('python3 change.py')).toMatch(/prepare/)
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
    // No post-tool event fired, so the still-open bracket is closed by the stop check itself.
    expect(checkStop(root, 'one')).toMatch(/wrote outside its declared scope/)
    expect(checkStop(root, 'one')).toMatch(/outside\.txt/)
    expect(checkStop(root, 'one')).toMatch(/re-run prepare/)
  })
  it('reports a concurrent session change without blocking, and still blocks its own out-of-scope write', () => {
    const { root } = setup()
    prepare(root, 'one', '.ai-work/checkpoint.json')
    const call = (event) => hookDecision(root, { session_id: 'one', hook_event_name: event, tool_name: 'Bash', tool_input: { command: 'python3 write.py' } })
    call('PreToolUse'); call('PostToolUse')
    // Written while this session held no write capability: someone else's change to answer for.
    writeFileSync(join(root, 'concurrent.txt'), 'another session')
    expect(checkStop(root, 'one')).toBeNull()
    call('PreToolUse')
    writeFileSync(join(root, 'outside.txt'), 'this session')
    call('PostToolUse')
    const blocked = checkStop(root, 'one')
    expect(blocked).toMatch(/wrote outside its declared scope: outside\.txt/)
    expect(blocked).toMatch(/Reported, not blocking: 1 path\(s\).*concurrent\.txt/)
  })
  it('lets a session that only inspected finish while another session edits the tree', () => {
    const { root } = setup()
    prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)
    const event = { session_id: 'one', hook_event_name: 'PreToolUse', tool_name: 'Bash' }
    expect(hookDecision(root, { ...event, tool_input: { command: 'wc -c AGENTS.md' } })).toEqual({})
    writeFileSync(join(root, 'scripts/example.mjs'), 'export const value = 9\n')
    expect(checkStop(root, 'one', fingerprint)).toBeNull()
    const report = {
      requirements: [{ id: 'R1', status: 'unimplemented', evidence: 'Read-only review; no edit made.', blocked: 'Nothing was implemented, so there is no output to own.' }],
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
      "find scripts -type f -name '*.mjs'",
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
  it('admits Git inspection with directory options without granting write accountability', () => {
    const { root } = setup()
    prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)
    for (const session of ['unprepared', 'one']) {
      const event = { session_id: session, hook_event_name: 'PreToolUse', tool_name: 'Bash' }
      for (const command of [
        'git -C ../dt-admin-web status --short',
        'rtk git -C ../dt-admin-web diff --stat',
        "rtk proxy git -C '../a project' -C nested log -1",
        'git -C../dt-admin-web show HEAD:AGENTS.md',
      ]) {
        expect(hookDecision(root, { ...event, tool_input: { command } }), command).toEqual({})
      }
    }
    writeFileSync(join(root, 'scripts/example.mjs'), 'export const value = 10\n')
    expect(checkStop(root, 'one', fingerprint)).toBeNull()
  })
  it('keeps Git writes, execution options and incomplete directory arguments behind preparation', () => {
    const { root } = setup()
    const event = { session_id: 'unprepared', hook_event_name: 'PreToolUse', tool_name: 'Bash' }
    for (const command of [
      'git -C ../dt-admin-web reset --hard',
      'git -C ../dt-admin-web diff --output=out.patch',
      'git -C ../dt-admin-web diff --ext-diff',
      'git -C ../dt-admin-web show --textconv HEAD:file',
      'git -C ../dt-admin-web -c alias.inspect=status inspect',
      'git -c core.pager=sh -C ../dt-admin-web log',
      'git -C',
      'git -C status',
      'git -C ../dt-admin-web status && python3 change.py',
      'rtk proxy python3 -c "print(1)"',
    ]) {
      expect(hookDecision(root, { ...event, tool_input: { command } }).hookSpecificOutput?.permissionDecision, command).toBe('deny')
    }
  })
  it('admits orchestration RPC without preparation and still gates the calls that touch the checkout', () => {
    const { root } = setup()
    const event = { session_id: 'unprepared', hook_event_name: 'PreToolUse', tool_name: 'Bash' }
    const verdict = (command) => hookDecision(root, { ...event, tool_input: { command } })
    for (const command of [
      'orca orchestration send --type worker_done --subject done --body "read-only review complete"',
      'orca orchestration check --wait --types worker_done --timeout-ms 60000 --json',
      'orca orchestration reply --id msg_1 --body answer --json',
      'orca orchestration ask --question "which value" --options yes,no --json',
      'orca-ide orchestration task-list --json',
      'orca-dev orchestration worker-read --dispatch ctx_1 --limit 5 --json',
    ]) {
      expect(verdict(command), command).toEqual({})
    }
    for (const command of [
      // `--setup run` executes project scripts, so launching a worker stays a declared change.
      'orca orchestration worker-start --task task_1 --worktree current --agent codex --json',
      'orca orchestration dispatch --task task_1 --to term_1 --inject --json',
      'orca orchestration reset --all --json',
      'orca terminal send --terminal term_1 --text edit --enter --json',
      'orca worktree create --name x --agent codex --json',
      // Chaining and substitution stay refused even on an admitted prefix.
      'orca orchestration send --subject x --body y | sh',
      'orca orchestration check --json && python3 change.py',
    ]) {
      expect(verdict(command).hookSpecificOutput?.permissionDecision, command).toBe('deny')
    }
  })
  it('does not make a coordinator accountable for the tree just by sending orchestration mail', () => {
    const { root } = setup()
    prepare(root, 'one', '.ai-work/checkpoint.json', fingerprint)
    const event = { session_id: 'one', hook_event_name: 'PreToolUse', tool_name: 'Bash' }
    expect(hookDecision(root, { ...event, tool_input: { command: 'orca orchestration check --json' } })).toEqual({})
    writeFileSync(join(root, 'scripts/example.mjs'), 'export const value = 10\n')
    expect(checkStop(root, 'one', fingerprint)).toBeNull()
  })
  it('routes every tool name the handler answers through each adapter matcher', () => {
    const handled = ['Bash', 'bash', 'exec_command', 'shell', 'powershell', 'Edit', 'Write', 'MultiEdit', 'edit', 'create', 'apply_patch']
    for (const file of ['.codex/hooks.json', '.claude/settings.json']) {
      const { hooks } = JSON.parse(readFileSync(file, 'utf8'))
      // A bracket that opens on more tools than it closes on would attribute the difference to the
      // next call, so both events must answer the same names.
      for (const event of ['PreToolUse', 'PostToolUse']) {
        const names = new Set(hooks[event][0].matcher.split('|'))
        for (const name of handled) expect(names.has(name), `${file} ${event} misses ${name}`).toBe(true)
      }
      expect(Boolean(hooks.Stop), `${file} has no Stop handler`).toBe(true)
    }
  })
})
