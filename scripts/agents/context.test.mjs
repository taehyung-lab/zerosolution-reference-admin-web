import { afterEach, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { selectedDocuments, sectionText } from './document-context.mjs'
import { hookDecision } from './hook.mjs'
import { workflowContext, surfaceIndexFailures, contextReport, readSurfaceIndex } from './surface-context.mjs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { prepare, recordReview, checkEdit } from './preflight.mjs'

const roots = []
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'surface-context-'))
  roots.push(root)
  const write = (file, value) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), value) }
  const inventory = 'docs/reference/zero-sol/05-performances.md'
  const scenario = 'docs/reference/scenarios/performance.md'
  write('AGENTS.md', '# Root\nGlobal constraints.\n')
  write('.agents/skills/feature-contract/SKILL.md', '# Feature\nOwnership.\n')
  write(inventory, '# Performance\nCommon policy.\n## List\nNo selection column.\n## Edit\nSection-owned save.\n')
  write(scenario, '# Scenario\nEntry loads; reset clears.\n')
  write('docs/reference/zero-sol/context.json', JSON.stringify({ judgment: [], surfaces: [
    { id: 'performance-list', title: 'Performance list', inventory: { file: inventory, heading: 'List' }, scenarios: [scenario], references: [], paths: ['src/features/performances/screens/list/'], related: ['performance-venue'], coverage: 'surface' },
    { id: 'performance-venue', title: 'Venue picker', inventory: { file: inventory, heading: 'List' }, scenarios: [scenario], references: [], paths: [], related: [], coverage: 'surface' },
    { id: 'performance-edit', title: 'Performance edit', inventory: { file: inventory, heading: 'Edit' }, scenarios: [scenario], references: [], paths: ['src/features/performances/form/'], related: [], coverage: 'surface' },
  ] }))
  const checkpoint = {
    scope: ['src/features/performances/screens/list/'],
    requirements: [{ id: 'R1', text: 'Implement list.', surfaces: ['performance-list'], sources: [{ file: inventory, heading: 'List' }], contracts: [], contractReason: 'No new shared behavior in this test.' }],
    references: ['AGENTS.md', '.agents/skills/feature-contract/SKILL.md'], contracts: [], unresolved: [],
    surfaces: [{ id: 'performance-list', decision: 'include' }, { id: 'performance-venue', decision: 'exclude', reason: 'Result-only change.' }],
  }
  const run = (session = 'one') => { write('.ai-work/checkpoint.json', JSON.stringify(checkpoint)); return prepare(root, session, '.ai-work/checkpoint.json', () => ({})) }
  return { root, write, checkpoint, run, inventory }
}
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })))

it('delivers the actual selected surface evidence without requiring hand-copied references', () => {
  const { run } = fixture()
  const output = run()
  expect(output).toContain('No selection column.')
  expect(output).toContain('Entry loads; reset clears.')
  expect(output).not.toContain('Section-owned save.')
})
it('rejects a different screen, missing inner-surface decision, and default-build bypass', () => {
  const { checkpoint, run } = fixture()
  checkpoint.surfaces = [{ id: 'performance-edit', decision: 'include' }]
  expect(() => run()).toThrow(/performance-list|Uncovered/)
  checkpoint.surfaces = [{ id: 'performance-list', decision: 'include' }]
  expect(() => run()).toThrow(/performance-venue/)
  delete checkpoint.surfaces
  expect(() => run()).toThrow(/surface/)
})
it('allows explained maintenance while leaving the decision reviewable', () => {
  const { checkpoint, run } = fixture()
  delete checkpoint.surfaces
  checkpoint.work = { kind: 'maintenance', reason: 'Only correct one existing label, no workflow change.' }
  expect(() => run()).not.toThrow()
  checkpoint.work.reason = ''
  expect(() => run()).toThrow(/reason/)
})
it('requires explicit evidence gaps for unknown workflows and forbids them as a known-screen bypass', () => {
  const { checkpoint, run, inventory } = fixture()
  checkpoint.scope = ['src/features/new-product/']
  checkpoint.surfaces = []
  checkpoint.requirements[0].surfaces = []
  checkpoint.evidenceGaps = [{ paths: checkpoint.scope, reason: 'New product has no indexed inventory yet.', references: [inventory] }]
  expect(() => run()).not.toThrow()
  checkpoint.stage = 'settled'
  expect(() => run()).toThrow(/settled/)
  delete checkpoint.stage
  checkpoint.scope = ['src/features/performances/screens/list/']
  checkpoint.evidenceGaps[0].paths = checkpoint.scope
  expect(() => run()).toThrow(/performance-list|surface/)
})
it('rejects unknown requirement sources and contracts instead of accepting empty trace declarations', () => {
  const { checkpoint, run } = fixture()
  checkpoint.requirements[0].sources = []
  expect(() => run()).toThrow(/sources/)
  checkpoint.requirements[0].sources = ['user']
  checkpoint.requirements[0].contracts = ['unreviewed-bundle']
  expect(() => run()).toThrow(/contract/)
})
it('requires concrete implementation paths and verification results for completed workflow requirements', () => {
  const { root, run, write } = fixture()
  run()
  const report = { requirements: [{ id: 'R1', status: 'implemented', evidence: 'Looks good.' }], contractReview: 'Checked.', complexityReview: 'Checked.', assumptions: [], limitations: [] }
  expect(() => recordReview(root, 'one', report, () => ({}))).toThrow(/files|verification/)
  write('src/features/performances/screens/list/ui/Screen.tsx', 'export const Screen = 1')
  report.requirements[0].files = ['src/features/performances/screens/list/ui/Screen.tsx']
  report.requirements[0].verification = [{ method: 'Focused scenario test', result: 'passed' }]
  expect(() => recordReview(root, 'one', report, () => ({}))).not.toThrow()
  report.requirements[0].files = ['src/features/elsewhere/Screen.tsx']
  expect(() => recordReview(root, 'one', report, () => ({}))).toThrow(/scope|exist/)
})
it('delivers a newly requested section even when the whole file hash was already seen', () => {
  const { checkpoint, run, inventory } = fixture()
  expect(run()).not.toContain('Section-owned save.')
  checkpoint.references.push({ file: inventory, heading: 'Edit' })
  expect(run()).toContain('Section-owned save.')
  expect(run()).not.toContain('Section-owned save.')
})

it('keeps introductions, ancestor constraints, child sections and fenced examples intact', () => {
  const content = '# Root\nGlobal rule.\n## Parent\nParent rule.\n### Selected\nKeep this.\n```md\n## False boundary\n```\n#### Child\nChild rule.\n### Sibling\nDo not deliver.\n'
  const selected = sectionText(content, 'Selected')
  expect(selected).toContain('Global rule.')
  expect(selected).toContain('Parent rule.')
  expect(selected).toContain('## False boundary')
  expect(selected).toContain('Child rule.')
  expect(selected).not.toContain('Do not deliver.')
  expect(() => sectionText(content, 'False boundary')).toThrow(/heading/)
})
it('validates heading and marker references even when another request includes the whole file', () => {
  const { root, inventory } = fixture()
  expect(() => selectedDocuments(root, [inventory, { file: inventory, heading: 'Missing' }])).toThrow(/heading/)
  expect(() => selectedDocuments(root, [inventory, { file: inventory, heading: 'List', marker: 'Nonexistent contract' }])).toThrow(/marker/)
  expect(selectedDocuments(root, [inventory, { file: inventory, heading: 'List' }])).toHaveLength(1)
  expect(() => sectionText('# Root\n## Same\nA\n## Same\nB', 'Same')).toThrow(/exactly once/)
})
it('delivers overlapping sections and their ancestor introductions only once', () => {
  const { root, write, inventory } = fixture()
  write(inventory, '# Root\nGlobal rule.\n## Parent\nParent rule.\n### Child\nChild rule.\n## Sibling\nSibling rule.\n')
  const refs = ['Child', 'Parent', 'Sibling'].map(heading => ({file: inventory, heading}))
  const output = selectedDocuments(root, refs).map(doc => doc.selected).join('\n')
  for (const rule of ['Global rule.', 'Parent rule.', 'Child rule.', 'Sibling rule.']) {
    expect(output.split(rule)).toHaveLength(2)
  }
  expect(() => selectedDocuments(root, [...refs, {file: inventory, heading:'Child', marker:'missing'}])).toThrow(/marker/)
})
it('identifies the input that promotes a section to full-file delivery', () => {
  const {checkpoint,inventory,run}=fixture()
  checkpoint.references.push(inventory)
  expect(run()).toContain(`Full-file selection overrides headings: ${inventory} (checkpoint.references)`)
})
it('reports nested support as direct, linked or unlinked without forcing it into surface inventory', () => {
  const {root,write,inventory}=fixture()
  write(inventory,readFileSync(join(root,inventory),'utf8')+'\n[Policy](notion/nested/policy.md)\n')
  write('docs/reference/zero-sol/notion/nested/policy.md','# Policy\n')
  write('docs/reference/zero-sol/notion/unlinked.md','# Comparison\n')
  const report=contextReport(root)
  expect(report.supporting).toEqual(expect.arrayContaining([
    expect.objectContaining({file:'docs/reference/zero-sol/notion/nested/policy.md',route:'linked'}),
    expect.objectContaining({file:'docs/reference/zero-sol/notion/unlinked.md',route:'unlinked'}),
  ]))
  expect(surfaceIndexFailures(root)).toEqual([])
  expect(hookDecision(root,{session_id:'unprepared',hook_event_name:'PreToolUse',tool_name:'Bash',tool_input:{command:'node scripts/agents/cli.mjs context-report'}})).toEqual({})
})
it('routes content actions and preserves unresolved entry policy without importing manager API judgments', () => {
  const index=readSurfaceIndex(process.cwd())
  const content=index.surfaces.find(surface=>surface.id==='performance-content')
  expect(content.related).toEqual(expect.arrayContaining(['content-bulk','content-edit','content-preview']))
  const bulk=index.surfaces.find(surface=>surface.id==='content-bulk')
  const output=selectedDocuments(process.cwd(),[...index.judgment,...content.references,...bulk.references]).map(doc=>doc.selected).join('\n')
  expect(output).toContain('Send stable IDs, not row objects.')
  expect(output).toContain('다른 화면의 답으로 확장하지 않는다.')
  expect(output).not.toContain('members/managers API 책임 재대조')
  expect(output).not.toContain('코드 결함 후보')
})
it('protects surrounding text and newly uncovered actual edit paths', () => {
  const { root, write, inventory, run } = fixture()
  run()
  write(inventory, readFileSync(join(root, inventory), 'utf8') + '\nNew global policy.\n')
  expect(checkEdit(root, 'one', ['src/features/performances/screens/list/ui/Screen.tsx'])).toMatch(/changed/)
})
it('keeps empty explicit references protected by whole-file hashes', () => {
  const {root,write,checkpoint,run}=fixture()
  const reference='docs/empty.md'
  write(reference,'  \n')
  checkpoint.references.push(reference)
  run()
  expect(selectedDocuments(root,[reference])).toHaveLength(1)
  write(reference,'# New policy\n')
  expect(checkEdit(root,'one',['src/features/performances/screens/list/ui/Screen.tsx'])).toMatch(/changed/)
})
it('rejects index drift with normal and negative controls', () => {
  const { root, write } = fixture()
  expect(surfaceIndexFailures(root)).toEqual([])
  const indexPath = 'docs/reference/zero-sol/context.json'
  const index = JSON.parse(readFileSync(join(root, indexPath), 'utf8'))
  index.surfaces[0].related.push('unknown-dialog')
  write(indexPath, JSON.stringify(index))
  expect(surfaceIndexFailures(root).join()).toMatch(/Dangling/)
  index.surfaces[0].related.pop()
  index.surfaces.push(index.surfaces[0])
  write(indexPath, JSON.stringify(index))
  expect(surfaceIndexFailures(root).join()).toMatch(/Duplicate/)
  index.surfaces.pop()
  write(indexPath, JSON.stringify(index))
  write('docs/reference/zero-sol/13-profile.md', '# Profile')
  expect(surfaceIndexFailures(root).join()).toMatch(/without context entry/)
})
it('requires full root and skill instructions, not just a heading with the same file name', () => {
  const { checkpoint, run } = fixture()
  checkpoint.references[0] = { file: 'AGENTS.md', heading: 'Root' }
  expect(() => run()).toThrow(/full|Required reference/)
})
it('rejects requirement evidence from an unrelated screen unless explicitly based on the user request', () => {
  const { checkpoint, run, write } = fixture()
  write('docs/reference/zero-sol/04-members.md', '# Member facts')
  checkpoint.requirements[0].sources = ['docs/reference/zero-sol/04-members.md']
  expect(() => run()).toThrow(/sources|evidence/)
  checkpoint.requirements[0].sources = ['user']
  expect(() => run()).not.toThrow()
})

it('allows context discovery before preparation but rejects command chaining and arbitrary script execution', () => {
  const { root } = fixture()
  const call = (command) => hookDecision(root, { session_id: 'unprepared', hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } })
  expect(call('rtk proxy node scripts/agents/cli.mjs context performance-list')).toEqual({})
  expect(call('rtk proxy node scripts/agents/cli.mjs context')).toEqual({})
  expect(call('node scripts/agents/cli.mjs context performance-list; touch changed')).toHaveProperty('hookSpecificOutput.permissionDecision', 'deny')
  expect(call('node scripts/agents/other.mjs context')).toHaveProperty('hookSpecificOutput.permissionDecision', 'deny')
})

it('rechecks actual targets even when a broad preparation scope overlaps a valid screen', () => {
  const { root, checkpoint, run } = fixture()
  checkpoint.scope = ['src/features/']
  run()
  expect(checkEdit(root, 'one', ['src/features/performances/screens/list/ui/Screen.tsx'])).toBeNull()
  expect(checkEdit(root, 'one', ['src/features/performances/form/Edit.tsx'])).toMatch(/performance-edit/)
})
it('does not force an implementation artifact for an honestly unimplemented requirement', () => {
  const { root, run } = fixture()
  run()
  expect(() => recordReview(root, 'one', { requirements: [{ id: 'R1', status: 'unimplemented', evidence: 'Awaiting confirmed server contract.' }], contractReview: 'Not adopted yet.', complexityReview: 'No edits.', assumptions: [], limitations: ['Blocked.'] }, () => ({}))).not.toThrow()
})

it('tracks index edits as stale references', () => {
  const { root, run, write } = fixture()
  run()
  const indexPath = 'docs/reference/zero-sol/context.json'
  write(indexPath, readFileSync(join(root, indexPath), 'utf8') + '\n')
  expect(checkEdit(root, 'one', ['src/features/performances/screens/list/ui/Screen.tsx'])).toMatch(/changed/)
})

it('rejects directories as implementation files or verification artifacts', () => {
  const { root, checkpoint, run, write } = fixture()
  checkpoint.scope = ['src/features/performances/']
  run()
  write('src/features/performances/screens/list/ui/Screen.tsx', 'export const value = 1')
  const report = { requirements: [{ id: 'R1', status: 'implemented', evidence: 'Observed.', files: ['src/features/performances/screens/list'], verification: [{ method: 'Scenario test', result: 'passed' }] }], contractReview: 'Reviewed.', complexityReview: 'Reviewed.', assumptions: [], limitations: [] }
  expect(() => recordReview(root, 'one', report, () => ({}))).toThrow(/files/)
  report.requirements[0].files = ['src/features/performances/screens/list/ui/Screen.tsx']
  report.requirements[0].verification[0].artifact = 'src/features/performances/screens/list'
  expect(() => recordReview(root, 'one', report, () => ({}))).toThrow(/artifact|verification/)
})

it('does not treat a broad src scope as script-only infrastructure', () => {
  const { checkpoint, run } = fixture()
  checkpoint.scope = ['src/']
  delete checkpoint.surfaces
  expect(() => run()).toThrow(/surface/)
})

it('discovers valid seed bundle IDs and their four roots without reading the declaration source', () => {
  const listing = spawnSync(process.execPath, ['scripts/agents/cli.mjs', 'bundle'], { encoding: 'utf8' })
  expect(listing.status).toBe(0)
  expect(listing.stdout).toContain('data-table')
  const detail = spawnSync(process.execPath, ['scripts/agents/cli.mjs', 'bundle', 'data-table'], { encoding: 'utf8' })
  expect(detail.status).toBe(0)
  const bundle = JSON.parse(detail.stdout)
  expect(bundle.code).toContain('src/shared/ui/patterns/DataTable.tsx')
  expect(bundle.tests.length).toBeGreaterThan(0)
  expect(bundle.ownership.feature).toBeTruthy()
  const invalid = spawnSync(process.execPath, ['scripts/agents/cli.mjs', 'bundle', 'invented'], { encoding: 'utf8' })
  expect(invalid.status).toBe(1)
})
it('allows read-only bundle discovery before prepare', () => {
  const { root } = fixture()
  expect(hookDecision(root, { session_id: 'unprepared', hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'rtk proxy node scripts/agents/cli.mjs bundle data-table' } })).toEqual({})
})
it('recognizes quoted literal searches without admitting executable shell syntax or hidden options', () => {
  const {root}=fixture()
  const call=command=>hookDecision(root,{session_id:'unprepared',hook_event_name:'PreToolUse',tool_name:'Bash',tool_input:{command}})
  for(const command of ["rtk proxy rg 'a|b' file", 'rg "a|b" file', "r'g' 'a|b' file", "rg '$(touch x)' file", "sed '-n' '1,40p' 'file name.md'"]) expect(call(command), command).toEqual({})
  for(const command of ["rg a file | sh", 'rg "$(touch x)" file', "rg --p're'=script file", "git diff --out'put'=file", "cat'evil' file", "rg --p\\re=script file", "rg 'unterminated", "sed -n 1p --file=script", 'rg a <(touch x)']) expect(call(command), command).toHaveProperty('hookSpecificOutput.permissionDecision','deny')
})

it('routes shared feature API paths to an edit consumer without inventing a list requirement', () => {
  const checkpoint = {
    scope: ['src/features/performances/api/'],
    surfaces: [{ id: 'performance-edit', decision: 'include' }, { id: 'performance-language', decision: 'exclude', reason: 'Only the edit API boundary is under review.' }],
    requirements: [{ id: 'R1', text: 'Review edit API boundary.', surfaces: ['performance-edit'], sources: ['user'], contracts: [], contractReason: 'Discovery only.' }],
    contracts: [],
  }
  expect(workflowContext(process.cwd(), checkpoint).included.map((surface) => surface.id)).toEqual(['performance-edit'])
})
