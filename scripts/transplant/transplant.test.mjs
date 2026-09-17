import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { listTransplantManifestFiles, productLedgerManifest, TRANSPLANT_MANIFEST } from '../contracts/seed.mjs'
import {
  applyTransplant,
  delinkUntravelled,
  findRetiredAdrCitations,
  limitSeedCatalog,
  planTransplant,
  rewriteAgentsForTarget,
  rewriteMarkdownLinks,
  restoreSourcePaths,
  rewriteProductPaths,
  rewriteText,
  stageTransplant,
} from './transplant.mjs'

const temporaryRoots = []
afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})
function temporaryDirectory(prefix) {
  const root = mkdtempSync(join(tmpdir(), prefix))
  temporaryRoots.push(root)
  return root
}
function write(root, file, content) {
  mkdirSync(join(root, file, '..'), { recursive: true })
  writeFileSync(join(root, file), content)
}

const SOURCE_POINTER = {
  inventory: 'docs/reference/zero-sol',
  judgment: 'docs/reference/zero-sol-figma-analysis.md',
  scenarios: 'docs/reference/scenarios',
  index: 'docs/reference/zero-sol/context.json',
}
const NEUTRAL_POINTER = {
  inventory: 'docs/reference/product',
  judgment: 'docs/reference/product/judgment.md',
  scenarios: 'docs/reference/scenarios',
  index: 'docs/reference/product/context.json',
}
const CUSTOM_POINTER = {
  inventory: 'docs/product',
  judgment: 'docs/product/judgment.md',
  scenarios: 'docs/events',
  index: 'docs/product/index.json',
}

describe('rewriteText', () => {
  it('renumbers ADR file names, citations, and headings atomically', () => {
    const text = [
      '# 0008. 공용 primitive 구현 선택',
      'see docs/decisions/0014-single-screen-shape.md and ADR 0008, ADR0014',
      '(`useSaveForm`, ADR 0014)',
      'runtime pin: ADR 0004',
    ].join('\n')

    expect(rewriteText(text)).toBe([
      '# 0004. 공용 primitive 구현 선택',
      'see docs/decisions/0005-single-screen-shape.md and ADR 0004, ADR 0005',
      '(`useSaveForm`, ADR 0005)',
      'runtime pin: ADR 0007',
    ].join('\n'))
  })

  it('marks citations of ADRs that are not transplanted instead of renumbering them', () => {
    expect(rewriteText('리허설 계약은 ADR 0001 참고, 화면 형태는 ADR 0014')).toBe(
      '리허설 계약은 ADR(레퍼런스 0001, 미이관) 참고, 화면 형태는 ADR 0005',
    )
    expect(findRetiredAdrCitations('x\nsee docs/decisions/0001-rehearsal-api-contract.md\n')).toEqual([
      { line: 2, number: '0001', text: 'see docs/decisions/0001-rehearsal-api-contract.md' },
    ])
  })

  it('treats an ADR left out of this transplant like a retired one, without renaming its path', () => {
    const out = rewriteText('see ADR 0013 and docs/decisions/0013-agent-implementation-workflow.md', {
      retired: ['0001', '0007', '0013'],
      renumber: [['0014-single-screen-shape', '0005-single-screen-shape']],
    })
    expect(out).toContain('ADR(레퍼런스 0013, 미이관)')
    expect(out).toContain('docs/decisions/0013-agent-implementation-workflow.md')
  })

  it('replaces reference consumer example symbols with the {Domain} placeholder', () => {
    expect(rewriteText('`list/useManagerListData`, `ManagerForm`')).toBe('`list/use{Domain}ListData`, `{Domain}Form`')
  })
})

describe('rewriteProductPaths', () => {
  it('rewrites every source ledger path to the target pointer, longest path first, keeping relative prefixes and anchors', () => {
    const text = [
      '[a](../../../docs/reference/zero-sol/README.md#표-형식)',
      '`docs/reference/zero-sol-figma-analysis.md#5-미확인`',
      'docs/reference/zero-sol/context.json',
      '[c](docs/reference/scenarios/session-lifetime.md)',
      'unrelated docs/reference/other.md',
    ].join('\n')

    expect(rewriteProductPaths(text, SOURCE_POINTER, CUSTOM_POINTER)).toBe([
      '[a](../../../docs/product/README.md#표-형식)',
      '`docs/product/judgment.md#5-미확인`',
      'docs/product/index.json',
      '[c](docs/events/session-lifetime.md)',
      'unrelated docs/reference/other.md',
    ].join('\n'))
  })

  it('is the identity when source and target pointers are equal', () => {
    const text = 'see docs/reference/zero-sol/README.md'
    expect(rewriteProductPaths(text, SOURCE_POINTER, SOURCE_POINTER)).toBe(text)
  })
})

describe('rewriteMarkdownLinks', () => {
  it('relocates relative links into the ledger even without the docs/ prefix, and leaves other links alone', () => {
    const text = [
      '[a](../reference/zero-sol/README.md#표-형식)',
      '[b](../reference/zero-sol-figma-analysis.md)',
      '[c](./0014-single-screen-shape.md) [d](https://example.com/x.md)',
    ].join('\n')
    expect(rewriteMarkdownLinks(text, 'docs/decisions', SOURCE_POINTER, NEUTRAL_POINTER)).toBe([
      '[a](../reference/product/README.md#표-형식)',
      '[b](../reference/product/judgment.md)',
      '[c](./0014-single-screen-shape.md) [d](https://example.com/x.md)',
    ].join('\n'))
    expect(rewriteMarkdownLinks('[a](../reference/zero-sol/11-settings.md)', 'docs/decisions', SOURCE_POINTER, CUSTOM_POINTER))
      .toBe('[a](../product/11-settings.md)')
  })
})

describe('delinkUntravelled', () => {
  const context = {
    sourceFile: 'docs/decisions/0014-single.md',
    targetPath: 'docs/decisions/0005-single.md',
    source: SOURCE_POINTER,
    target: NEUTRAL_POINTER,
    retired: ['0001'],
    staged: new Set(['docs/reference/product/README.md', 'docs/decisions/0005-single-screen-shape.md']),
    targetRoot: '/nowhere',
  }

  it('unlinks a target that does not travel and keeps the reference path out of later rewrites', () => {
    const collected = []
    const text = [
      '[회원 목록](../reference/zero-sol/04-members.md#검색)',
      '[읽기 범위](../reference/zero-sol/README.md)',
      '[ADR 0001](0001-rehearsal-api-contract.md)',
      '[filter](../../src/features/members/model/useMemberListFilter.ts)',
      '[web](https://example.com/a.md)',
    ].join('\n')

    const out = delinkUntravelled(text, { ...context, collect: collected })
    const renumbered = rewriteText(out, { retired: context.retired })
    const linked = rewriteMarkdownLinks(renumbered, 'docs/decisions', SOURCE_POINTER, NEUTRAL_POINTER)
    const restored = restoreSourcePaths(rewriteProductPaths(linked, SOURCE_POINTER, NEUTRAL_POINTER), collected)

    expect(restored).toContain('회원 목록 (레퍼런스 저장소 docs/reference/zero-sol/04-members.md#검색)')
    expect(restored).not.toContain('docs/reference/product/04-members.md')
    expect(restored).toContain('[읽기 범위](../reference/product/README.md)')
    expect(restored).toContain('ADR(레퍼런스 0001, 미이관) (레퍼런스 저장소 docs/decisions/0001-rehearsal-api-contract.md)')
    expect(restored).toContain('filter (레퍼런스 저장소 src/features/members/model/useMemberListFilter.ts)')
    expect(restored).toContain('[web](https://example.com/a.md)')
    expect(collected.map((item) => item.link)).toEqual([
      'docs/reference/zero-sol/04-members.md#검색',
      'docs/decisions/0001-rehearsal-api-contract.md',
      'src/features/members/model/useMemberListFilter.ts',
    ])
  })

  it('keeps a link the target repository already owns', () => {
    const target = temporaryDirectory('delink-target-')
    write(target, 'openapi/README.md', '# 대상 계약\n')
    const collected = []
    const out = delinkUntravelled('[계약](../../openapi/README.md)', { ...context, targetRoot: target, collect: collected })
    expect(out).toBe('[계약](../../openapi/README.md)')
    expect(collected).toEqual([])
  })

  it('does not relabel source product evidence when the target has a same-named file', () => {
    const target = temporaryDirectory('delink-collision-')
    write(target, 'docs/reference/product/04-members.md', '# Different product\n')
    const collected = []
    const out = delinkUntravelled('[관찰](../reference/zero-sol/04-members.md)', { ...context, targetRoot: target, collect: collected })
    expect(restoreSourcePaths(out, collected)).toBe('관찰 (레퍼런스 저장소 docs/reference/zero-sol/04-members.md)')
  })

  it('does not disguise a missing normative skill dependency as source provenance', () => {
    expect(() => delinkUntravelled('[계약](../../contracts/api-contract/SKILL.md)', { ...context, collect: [] }))
      .toThrow(/normative/)
  })
})

describe('limitSeedCatalog', () => {
  const catalog = [
    'const location = (file, heading, marker) => ({ file, heading, marker })',
    '',
    'export const SEED_BUNDLES = [',
    '  {',
    "    id: 'ascii-triplet',",
    "    code: ['src/shared/lib/ascii-triplet.ts'],",
    '  },',
    '  {',
    "    id: 'data-table',",
    "    code: ['src/shared/ui/list/DataTable.tsx'],",
    '  },',
    ']',
    '',
    'export const SEED_BUNDLE_EXPORTS = {',
    "  'ascii-triplet': ['hasRepeatedOrSequentialAsciiTriplet'],",
    "  'data-table': ['DataTable'],",
    '}',
    '',
  ].join('\n')

  it('keeps only the selected bundles in both the catalog and the export table', () => {
    const limited = limitSeedCatalog(catalog, ['ascii-triplet'])
    expect(limited).toContain("id: 'ascii-triplet'")
    expect(limited).not.toContain("id: 'data-table'")
    expect(limited).toContain("'ascii-triplet': ['hasRepeatedOrSequentialAsciiTriplet']")
    expect(limited).not.toContain("'data-table': ['DataTable']")
  })

  it('is the identity for a full selection and refuses an id the catalog does not declare', () => {
    expect(limitSeedCatalog(catalog, ['ascii-triplet', 'data-table'])).toBe(catalog)
    expect(() => limitSeedCatalog(catalog, ['no-such-bundle'])).toThrow(/no-such-bundle/)
  })
})

describe('rewriteAgentsForTarget', () => {
  it('switches the current compact root from reference mode to product mode', () => {
    const compact = [
      '# 프로젝트 에이전트 실행 기준',
      '',
      '## 이 저장소의 함정',
      '',
      '이 저장소는 다른 제품으로 옮길 레퍼런스다. 현재 제품의 도메인 값을 새 제품 사실로 복사하지 않는다.',
      '',
      '상태는 한 곳만 소유한다.',
    ].join('\n')

    const rewritten = rewriteAgentsForTarget(compact, { source: SOURCE_POINTER, target: NEUTRAL_POINTER })

    expect(rewritten).toContain('이 저장소는 제품 저장소다.')
    expect(rewritten).not.toContain('이 저장소는 다른 제품으로 옮길 레퍼런스다.')
    expect(rewritten).toContain('상태는 한 곳만 소유한다.')
  })

  it('fails instead of silently staging when the source mode contract drifts', () => {
    expect(() => rewriteAgentsForTarget('# no source mode', { source: SOURCE_POINTER, target: NEUTRAL_POINTER })).toThrow(/정확히 하나/)
  })
})

describe('transplant manifest', () => {
  it('rejects a source root different from cwd before computing an import closure', () => {
    const target = temporaryDirectory('transplant-target-')
    const sourceRoot = temporaryDirectory('transplant-source-')
    expect(() => planTransplant(target, { sourceRoot, bundles: ['ascii-triplet'] })).toThrow(/reference repository root/)
  })
  it('does not carry the active product ledger or any runtime hook config, but does carry both entry points', () => {
    const files = Object.values(TRANSPLANT_MANIFEST).flat()
    expect(files.some((file) => file === 'docs/reference' || file.startsWith('docs/reference/'))).toBe(false)
    expect(TRANSPLANT_MANIFEST.entrypoints).toEqual(expect.arrayContaining(['CLAUDE.md', '.github/copilot-instructions.md']))
    expect(TRANSPLANT_MANIFEST.runtime).toBeUndefined()
    expect(files.some((file) => file.endsWith('hooks.json') || file === '.claude/settings.json')).toBe(false)
    expect(TRANSPLANT_MANIFEST.templates).toContain('package.json')
    expect(TRANSPLANT_MANIFEST.templates).not.toContain('.claude/settings.json')
    expect(listTransplantManifestFiles()).not.toContain('tests/reference/manager-evidence.test.mjs')
  })

  it('제품 사실 manifest 는 fact·정책·생성 색인 셋이다', () => {
    // 옛 체계는 포인터 파일이 네 경로를 가리켰다. 지금은 경로가 상수라 포인터가 없고,
    // scenarios 가 fact 로 합쳐져 중복이 제거된다.
    const root = temporaryDirectory('ledger-root-')
    expect(productLedgerManifest(root)).toEqual({
      ledger: ['product/generated-index.md', 'product/facts'],
    })
  })
})

describe('plan / stage / apply against a target directory', () => {
  it('classifies files, stages a renumbered product-neutral copy with a pending list, and never overwrites the target', () => {
    const target = temporaryDirectory('transplant-target-')
    const out = temporaryDirectory('transplant-stage-')
    write(target, 'src/shared/ui/layout/PageHeader.tsx', 'export const PageHeader = () => null\n')
    write(target, 'package.json', '{"name":"target"}\n')

    const plan = planTransplant(target)
    const byFile = new Map(plan.map((item) => [item.file, item]))
    expect(byFile.get('src/shared/ui/layout/PageHeader.tsx').action).toBe('merge')
    expect(byFile.get('src/shared/ui/detail/DetailField.tsx').action).toBe('copy')
    expect(byFile.get('package.json').action).toBe('merge')
    expect(byFile.get('CLAUDE.md').action).toBe('copy')
    expect(byFile.has('.claude/settings.json')).toBe(false)
    expect(byFile.has('.codex/hooks.json')).toBe(false)
    expect(byFile.get('docs/decisions/0014-single-screen-shape.md').targetPath).toBe('docs/decisions/0005-single-screen-shape.md')
    expect(byFile.get('docs/decisions/0002-typescript-version-pin.md').action).toBe('conditional')
    expect(byFile.get('AGENTS.md').action).toBe('template')
    expect(plan.some((item) => item.file.startsWith('src/features/'))).toBe(false)
    // Product workflow tests live in the harness directory but import feature screens; they are excluded, not copied.
    expect(byFile.get('src/test/workflows/closed-search.test.ts').action).toBe('exclude')
    expect(byFile.get('src/test/setup.ts').action).toBe('copy')
    expect(plan.some((item) => item.file.startsWith('contracts/'))).toBe(true)
    // The active source-product ledger stays home; the target gets neutral ledger shells at its pointer paths.
    expect(plan.some((item) => item.file.startsWith('docs/reference/zero-sol'))).toBe(false)
    expect(plan.some((item) => item.file.startsWith('docs/reference/scenarios/') && item.file !== 'docs/reference/scenarios/README.md')).toBe(false)
    // 새 구조의 제품 사실 뼈대는 둘뿐이다 — fact 쓰는 법과 빈 생성 색인.
    // 판독 규칙(product/policies)은 절차라 manifest 가 그대로 옮기고 뼈대로 만들지 않는다.
    expect(byFile.get('product/facts/README.md').action).toBe('generate')
    expect(byFile.get('product/generated-index.md').action).toBe('generate')
    expect(byFile.has('docs/reference/product.json')).toBe(false)

    const staged = stageTransplant(target, out)
    expect(existsSync(join(out, 'MANIFEST.json'))).toBe(true)
    expect(existsSync(join(out, 'docs/decisions/0005-single-screen-shape.md'))).toBe(true)
    expect(existsSync(join(out, 'docs/decisions/0014-single-screen-shape.md'))).toBe(false)
    const agents = readFileSync(join(out, 'AGENTS.md'), 'utf8')
    expect(agents).toContain('product/generated-index.md')
    expect(agents).not.toMatch(/ZERO|BOOSTER|zero-sol/)
    expect(agents).toContain('product/generated-index.md')
    expect(readFileSync(join(out, 'CLAUDE.md'), 'utf8').split('\n')[0]).toBe('@AGENTS.md')
    expect(readFileSync(join(out, 'docs/decisions/0006-typescript-version-pin.md'), 'utf8')).toContain('TRANSPLANT_PENDING_ADR_PIN')
    const skill = readFileSync(join(out, 'contracts/direct/list.md'), 'utf8')
    // 계약은 도메인 이름을 담지 않으므로 이관해도 제품 이름이 남지 않는다.
    expect(skill).not.toContain('zero-sol')
    const inventoryReadme = readFileSync(join(out, 'product/facts/README.md'), 'utf8')
    // 뼈대는 fact 쓰는 법과 빈 색인 둘뿐이고, 레퍼런스 제품의 관찰은 하나도 가지 않는다.
    expect(inventoryReadme).toContain('TRANSPLANT_PENDING_FACTS')
    expect(inventoryReadme).toContain('## frontmatter')
    expect(inventoryReadme).toContain('## 본문의 절')
    expect(inventoryReadme).not.toMatch(/BOOSTER|loginId|ZERO|Ogb6WpSpwCVhKggQ1NLRlQ/)
    const scenariosReadme = readFileSync(join(out, 'product/generated-index.md'), 'utf8')
    // 색인은 생성물이라 뼈대가 비어 있고, 채우려면 fact 를 만든 뒤 다시 생성해야 한다.
    expect(scenariosReadme).toContain('TRANSPLANT_PENDING_INDEX')
    expect(scenariosReadme).toContain('총 0개.')
    expect(scenariosReadme).not.toMatch(/ZERO|dt-admin-web/)
    // 판독 규칙은 절차라 뼈대가 아니라 그대로 이관된다.
    expect(readFileSync(join(out, 'product/policies/evidence.md'), 'utf8')).toContain('근거의 종류를 구별한다')
    expect(staged.pending.map((item) => item.id)).toEqual(expect.arrayContaining(['ENVELOPE', 'API_BASE', 'FACTS', 'ADR_PIN', 'INDEX']))
    expect(readFileSync(join(out, 'PENDING.md'), 'utf8')).toContain('## 조건부')
    // ADR 이 가리키는 옛 원장은 집에 남으므로 링크를 끊고 레퍼런스 경로로 표시한다. 옛 체계는 이것을
    // 대상 포인터 경로로 다시 썼지만, 지금은 제품 사실 경로가 상수라 다시 쓸 것이 없다.
    const shared = readFileSync(join(out, 'docs/decisions/0005-single-screen-shape.md'), 'utf8')
    expect(shared).toContain('레퍼런스 저장소 docs/reference/zero-sol/README.md')
    expect(shared).toContain('레퍼런스 저장소 docs/reference/zero-sol-figma-analysis.md')
    expect(shared).not.toMatch(/\]\([^)]*zero-sol/)
    expect(staged.sourceReferences.some((item) => item.file.startsWith('docs/decisions/') && item.link === 'docs/reference/zero-sol-figma-analysis.md')).toBe(true)
    expect(staged.danglingLinks).toEqual([])
    expect(readFileSync(join(out, 'PENDING.md'), 'utf8')).toContain('## 레퍼런스 저장소에만 있는 근거')

    const applied = applyTransplant(target, out)
    expect(readFileSync(join(target, 'src/shared/ui/layout/PageHeader.tsx'), 'utf8')).toBe('export const PageHeader = () => null\n')
    expect(readFileSync(join(target, 'package.json'), 'utf8')).toBe('{"name":"target"}\n')
    expect(existsSync(join(target, 'src/shared/ui/detail/DetailField.tsx'))).toBe(true)
    expect(existsSync(join(target, 'docs/decisions/0005-single-screen-shape.md'))).toBe(true)
    expect(existsSync(join(target, 'CLAUDE.md'))).toBe(true)
    expect(existsSync(join(target, '.claude/settings.json'))).toBe(false)
    // The common root points at product-owned facts, whose unresolved status survives apply.
    const targetAgents = readFileSync(join(target, 'AGENTS.md'), 'utf8')
    expect(targetAgents).toContain('product/generated-index.md')
    expect(targetAgents).toContain('이 저장소는 제품 저장소다.')
    expect(targetAgents).not.toContain('이 저장소는 다른 제품으로 옮길 레퍼런스다.')
    expect(readFileSync(join(target, 'product/facts/README.md'), 'utf8')).toContain('TRANSPLANT_PENDING_FACTS')
    expect(readFileSync(join(target, 'README.md'), 'utf8')).toContain('TRANSPLANT_PENDING_README')
    expect(applied.copied).toEqual(expect.arrayContaining(['src/shared/ui/detail/DetailField.tsx', 'CLAUDE.md', 'product/facts/README.md', 'product/generated-index.md']))
    expect(applied.skipped.map((item) => item.targetPath)).toEqual(expect.arrayContaining(['src/shared/ui/layout/PageHeader.tsx', 'package.json']))
    expect(existsSync(join(target, 'src/features'))).toBe(false)
    expect(existsSync(join(target, 'openapi/admin.snapshot.json'))).toBe(false)
    expect(existsSync(join(target, 'docs/reference/zero-sol'))).toBe(false)
    expect(existsSync(join(target, 'docs/reference/zero-sol-figma-analysis.md'))).toBe(false)
    // 대상에 놓인 것은 **빈 뼈대**다. fact 는 하나도 가지 않았고 색인은 0개에서 시작한다.
    expect(readdirSync(join(target, 'product/facts'))).toEqual(['README.md'])
    expect(readFileSync(join(target, 'product/generated-index.md'), 'utf8')).toContain('총 0개.')
    expect(readFileSync(join(target, 'product/policies/evidence.md'), 'utf8')).toContain('근거의 종류를 구별한다')
  })

  it('대상에 이미 제품 사실이 있으면 뼈대를 만들지 않고 그 파일을 그대로 둔다', () => {
    const target = temporaryDirectory('transplant-target-')
    const out = temporaryDirectory('transplant-stage-')
    write(target, 'product/facts/README.md', '# 대상 제품 사실\n')
    write(target, 'product/facts/ORDER-LIST.md', '---\nid: ORDER-LIST\n---\n')
    write(target, 'product/generated-index.md', '# 대상 색인\n')

    const plan = planTransplant(target)
    const byFile = new Map(plan.map((item) => [item.file, item]))
    expect(byFile.get('product/facts/README.md').action).toBe('merge')
    expect(byFile.get('product/generated-index.md').action).toBe('merge')

    stageTransplant(target, out)
    const applied = applyTransplant(target, out)
    // 대상의 관찰은 레퍼런스가 손대지 않는다. 뼈대는 대상이 아직 아무것도 안 썼을 때만 의미가 있다.
    expect(readFileSync(join(target, 'product/facts/README.md'), 'utf8')).toBe('# 대상 제품 사실\n')
    expect(readFileSync(join(target, 'product/facts/ORDER-LIST.md'), 'utf8')).toBe('---\nid: ORDER-LIST\n---\n')
    expect(readFileSync(join(target, 'product/generated-index.md'), 'utf8')).toBe('# 대상 색인\n')
    expect(applied.skipped.map((item) => item.targetPath)).toEqual(
      expect.arrayContaining(['product/facts/README.md', 'product/generated-index.md']),
    )
  })

  it('carries the active ledger only on explicit request, unchanged in place', () => {
    const target = temporaryDirectory('transplant-target-')
    const out = temporaryDirectory('transplant-stage-')

    const plan = planTransplant(target, { withLedger: true })
    const byFile = new Map(plan.map((item) => [item.file, item]))
    expect(byFile.get('product/facts/PRINTER-LIST.md').action).toBe('copy')
    expect(byFile.get('product/generated-index.md').action).toBe('copy')
    expect(plan.some((item) => item.action === 'generate')).toBe(false)

    stageTransplant(target, out, undefined, { withLedger: true })
    expect(readFileSync(join(out, 'contracts/direct/list.md'), 'utf8')).not.toContain('zero-sol')
    expect(readFileSync(join(out, 'product/facts/PRINTER-LIST.md'), 'utf8')).toContain('스마트프린터 목록')
    expect(existsSync(join(out, 'product/generated-index.md'))).toBe(true)
  })

  it('limits the seed code to the selected bundles while keeping every ADR the travelling skills and gates name', async () => {
    const target = temporaryDirectory('transplant-target-')
    const out = temporaryDirectory('transplant-stage-')

    const plan = planTransplant(target, { bundles: ['ascii-triplet'] })
    const files = new Set(plan.map((item) => item.file))
    expect(files.has('src/shared/lib/ascii-triplet.ts')).toBe(true)
    expect(files.has('src/shared/lib/ascii-triplet.test.ts')).toBe(true)
    expect(files.has('src/shared/ui/list/ListResult.tsx')).toBe(false)
    expect(files.has('contracts/direct/list.md')).toBe(true)
    // The skills and eslint.config.js travel whole and name these decisions, so the decisions travel with them.
    for (const adr of [
      'docs/decisions/0006-auth-token-storage.md',
      'docs/decisions/0014-single-screen-shape.md',
    ]) expect(files.has(adr)).toBe(true)

    const staged = stageTransplant(target, out, undefined, { bundles: ['ascii-triplet'] })
    expect(staged.retired).toEqual(['0001'])
    expect(existsSync(join(out, 'docs/decisions/0005-single-screen-shape.md'))).toBe(true)
    expect(staged.review.some((item) => item.number === '0001')).toBe(true)
    expect(() => planTransplant(target, { bundles: ['no-such-bundle'] })).toThrow(/no-such-bundle/)

    // The staged catalog is what the target's own gates read: it may not claim code that never travelled.
    const catalog = readFileSync(join(out, 'scripts/contracts/seed.mjs'), 'utf8')
    expect(catalog.match(/^\s+id: '[^']+',$/gm).map((line) => line.trim())).toEqual(["id: 'ascii-triplet',"])
    expect(catalog).toContain("'ascii-triplet': ['hasRepeatedOrSequentialAsciiTriplet'],")
    expect(catalog).not.toContain("'data-table': [")
    expect(catalog).toContain("location('docs/decisions/0005-single-screen-shape.md'")

    // The eslint evidence pointer names a decision that travelled, so the target's own check can resolve it.
    expect(readFileSync(join(out, 'eslint.config.js'), 'utf8')).toContain("['useResourceQuery', 'ADR 0005']")
    // The target's verify chain checks itself as a target, not as this reference repository.
    expect(JSON.parse(readFileSync(join(out, 'package.json'), 'utf8')).scripts['contracts:check'])
      .toBe('node scripts/contracts/check.mjs --mode target')
    expect(JSON.parse(readFileSync(join(out, 'package.json'), 'utf8')).transplantReview)
      .toContain('TRANSPLANT_PENDING_SCRIPTS')
    expect(JSON.parse(readFileSync(join(out, 'package.json'), 'utf8')).transplantReview)
      .toContain('scripts/openapi/pull.mjs')
    expect(readFileSync(join(out, 'scripts/contracts/check.mjs'), 'utf8')).toContain("const DEFAULT_MODE = 'target'")
    expect(existsSync(join(out, 'scripts/agents'))).toBe(false)
    // The negative-control harness copies this domain-neutral type into its isolated workspace.
    expect(existsSync(join(out, 'src/api/error.ts'))).toBe(true)
  })

  it('stages source-only evidence as a plain reference path', () => {
    const target = temporaryDirectory('transplant-target-')
    const out = temporaryDirectory('transplant-stage-')
    const staged = stageTransplant(target, out, undefined, { bundles: ['ascii-triplet'] })

    const auth = readFileSync(join(out, 'docs/decisions/0003-auth-token-storage.md'), 'utf8')
    expect(auth).toContain('레퍼런스 저장소 docs/decisions/0001-rehearsal-api-contract.md')
    expect(auth).not.toContain('](0001-rehearsal-api-contract.md)')
    expect(staged.sourceReferences.some((item) => item.link === 'docs/decisions/0001-rehearsal-api-contract.md')).toBe(true)
    expect(staged.productTerms.some((item) => item.file === 'README.md')).toBe(true)
    expect(staged.danglingLinks).toEqual([])
    expect(readFileSync(join(out, 'PENDING.md'), 'utf8')).toContain('## 레퍼런스 저장소에만 있는 근거')
  })

  it('refuses to apply when the stage copy no longer matches its manifest', () => {
    const target = temporaryDirectory('transplant-target-')
    const out = temporaryDirectory('transplant-stage-')
    stageTransplant(target, out)
    writeFileSync(join(out, 'src/shared/ui/detail/DetailField.tsx'), '// tampered\n')

    expect(() => applyTransplant(target, out)).toThrow(/MANIFEST/)
    expect(readdirSync(target)).toEqual([])
  })
})
