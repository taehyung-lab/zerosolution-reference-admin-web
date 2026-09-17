/**
 * 아직 fact 로 옮기지 않은 화면들의 **옛 원장**(`docs/reference/zero-sol/context.json`)을 지키는 검사다.
 * 새로 쓰는 색인은 fact frontmatter 에서 생성되므로 `scripts/product/build-index.mjs` 가 소유하고,
 * 여기는 그 이관이 끝날 때까지만 산다. 마지막 화면이 fact 가 되면 이 파일과 `scripts/evidence/` 를
 * `LEGACY_LEDGER` 와 함께 지운다.
 */
import { afterEach, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { selectedDocuments, sectionText } from './documents.mjs'
import { surfaceIndexFailures, readSurfaceIndex } from './context.mjs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { SEED_BUNDLES } from '../contracts/seed.mjs'

const roots = []
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'surface-context-'))
  roots.push(root)
  const write = (file, value) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), value) }
  const inventory = 'docs/reference/zero-sol/05-performances.md'
  const scenario = 'docs/reference/scenarios/performance.md'
  write('scripts/contracts/check.mjs', 'console.log("fixture contract passed")\n')
  write('AGENTS.md', '# Root\nGlobal constraints.\n')
  write('contracts/feature-contract/SKILL.md', '# Feature\nOwnership.\n')
  write('contracts/direct/list.md', '# Loop\nEntry and return points.\n')
  write(inventory, '# Performance\nCommon policy.\n## List\nNo selection column.\n## Edit\nSection-owned save.\n')
  write(scenario, '# Scenario\nEntry loads; reset clears.\n')
  write('docs/reference/zero-sol/context.json', JSON.stringify({ judgment: [], surfaces: [
    { id: 'performance-list', title: 'Performance list', inventory: { file: inventory, heading: 'List' }, scenarios: [scenario], references: [], paths: ['src/features/performances/screens/list/'], related: ['performance-venue'], coverage: 'surface' },
    { id: 'performance-venue', title: 'Venue picker', inventory: { file: inventory, heading: 'List' }, scenarios: [scenario], references: [], paths: [], related: [], coverage: 'surface' },
    { id: 'performance-edit', title: 'Performance edit', inventory: { file: inventory, heading: 'Edit' }, scenarios: [scenario], references: [], paths: ['src/features/performances/form/'], related: [], coverage: 'surface' },
  ] }))
  return { root, write, inventory }
}
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })))

it('delivers only the selected surface section, not a sibling section of the same file', () => {
  const { root, inventory } = fixture()
  const body = selectedDocuments(root, [{ file: inventory, heading: 'List' }])
    .map((doc) => doc.selected).join('\n')
  expect(body).toContain('No selection column.')
  expect(body).not.toContain('Section-owned save.')
})

it('원장 폴더는 있는데 색인만 사라지면 빈 원장으로 읽지 않고 실패한다', () => {
  const { root, write } = fixture()
  expect(readSurfaceIndex(root).surfaces).toHaveLength(3)
  rmSync(join(root, 'docs/reference/zero-sol/context.json'))
  expect(surfaceIndexFailures(root).join()).toMatch(/Ledger index does not exist/)
  // 대조군: 원장 자체가 없는 제품(이관이 끝난 대상)은 실패가 아니라 빈 원장이다.
  const empty = mkdtempSync(join(tmpdir(), 'surface-context-'))
  roots.push(empty)
  void write
  expect(surfaceIndexFailures(empty)).toEqual([])
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

it('계약을 인용하면서 그 계약의 `형태` 절을 빼면 실패한다', () => {
  const { root, write } = fixture()
  const contract = 'contracts/direct/list.md'
  write(contract, '# List\n\n## Confirm\nA.\n\n## 형태\nFiles.\n')
  const indexPath = 'docs/reference/zero-sol/context.json'
  const index = JSON.parse(readFileSync(join(root, indexPath), 'utf8'))
  index.surfaces[0].references = [{ file: contract, heading: 'Confirm' }]
  write(indexPath, JSON.stringify(index))
  expect(surfaceIndexFailures(root).join('\n')).toMatch(/performance-list cites .*list.md without heading 형태/)
  index.surfaces[0].references = [contract]
  write(indexPath, JSON.stringify(index))
  expect(surfaceIndexFailures(root).filter((item) => item.includes('형태'))).toEqual([])
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

it('discovers valid seed bundle IDs and their four roots without reading the declaration source', () => {
  const listing = spawnSync(process.execPath, ['scripts/evidence/cli.mjs', 'bundle'], { encoding: 'utf8' })
  expect(listing.status).toBe(0)
  expect(listing.stdout.trim().split('\n')).toEqual(SEED_BUNDLES.map(bundle => bundle.id))
  const selected = SEED_BUNDLES[0]
  const detail = spawnSync(process.execPath, ['scripts/evidence/cli.mjs', 'bundle', selected.id], { encoding: 'utf8' })
  expect(detail.status).toBe(0)
  const bundle = JSON.parse(detail.stdout)
  expect(bundle.code).toContain(selected.code[0])
  expect(bundle.tests.length).toBeGreaterThan(0)
  expect(bundle.ownership.feature).toBeTruthy()
  const invalid = spawnSync(process.execPath, ['scripts/evidence/cli.mjs', 'bundle', 'invented'], { encoding: 'utf8' })
  expect(invalid.status).toBe(1)
})

