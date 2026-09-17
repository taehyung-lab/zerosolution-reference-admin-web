/**
 * 새 문서 체계 시제품 보류: 이 파일은 은퇴한 JSON context 색인과 4경로 원장 모델을 단언한다.
 * 그 역할은 `product/facts/*.md` frontmatter + `scripts/product/build-index.mjs --check` 로 옮겼다.
 * 보류를 통과로 읽지 않는다 — 이 영역의 이관은 남아 있다.
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
  write('docs/reference/product.json', JSON.stringify({ inventory: 'docs/reference/zero-sol', judgment: 'docs/reference/zero-sol-figma-analysis.md', scenarios: 'docs/reference/scenarios', index: 'docs/reference/zero-sol/context.json' }))
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

it('routes another product through its canonical pointer without reading the old product index', () => {
  const { root, write } = fixture()
  write('docs/reference/product.json', JSON.stringify({ inventory: 'docs/product', judgment: 'docs/product/decisions.md', scenarios: 'docs/events', index: 'docs/product/index.json' }))
  write('docs/product/index.json', JSON.stringify({ judgment: [], surfaces: [] }))
  expect(readSurfaceIndex(root).surfaces).toEqual([])
  expect(surfaceIndexFailures(root)).toEqual([])
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

it.skip('rejects index drift with normal and negative controls', () => {
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

it.skip('fails a surface that cites a skill file without its 형태 heading', () => {
  const { root, write } = fixture()
  const skill = 'contracts/feature-contract/references/list.md'
  write(skill, '# List\n\n## Confirm\nA.\n\n## 형태\nFiles.\n')
  const indexPath = join(root, 'docs/reference/zero-sol/context.json')
  const index = JSON.parse(readFileSync(indexPath, 'utf8'))
  index.surfaces[0].references = [{ file: skill, heading: 'Confirm' }]
  write('docs/reference/zero-sol/context.json', JSON.stringify(index))
  expect(surfaceIndexFailures(root).join('\n')).toMatch(/performance-list cites .*list.md without heading 형태/)
  index.surfaces[0].references = [skill]
  write('docs/reference/zero-sol/context.json', JSON.stringify(index))
  expect(surfaceIndexFailures(root).filter((item) => item.includes('형태'))).toEqual([])
})
