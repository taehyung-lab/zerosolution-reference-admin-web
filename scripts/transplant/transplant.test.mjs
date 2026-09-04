import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  applyTransplant,
  findRetiredAdrCitations,
  planTransplant,
  rewriteAgentsForTarget,
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

describe('rewriteText', () => {
  it('renumbers ADR file names, citations, and headings atomically', () => {
    const text = [
      '# 0008. 공용 primitive 구현 선택',
      'see docs/decisions/0009-shared-boundaries.md and ADR 0008 개정 3, ADR0011',
      '(`useSaveForm`, ADR 0010 2026-09-03)',
      'runtime pin: ADR 0004',
    ].join('\n')

    expect(rewriteText(text)).toBe([
      '# 0004. 공용 primitive 구현 선택',
      'see docs/decisions/0005-shared-boundaries.md and ADR 0004 개정 3, ADR 0007',
      '(`useSaveForm`, ADR 0006 2026-09-03)',
      'runtime pin: ADR 0009',
    ].join('\n'))
  })

  it('marks citations of ADRs that are not transplanted instead of renumbering them', () => {
    expect(rewriteText('리허설 계약은 ADR 0001, 결번은 ADR 0007 참고')).toBe(
      '리허설 계약은 ADR(레퍼런스 0001, 미이관), 결번은 ADR(레퍼런스 0007, 미이관) 참고',
    )
    expect(findRetiredAdrCitations('x\nsee docs/decisions/0001-rehearsal-api-contract.md\n')).toEqual([
      { line: 2, number: '0001', text: 'see docs/decisions/0001-rehearsal-api-contract.md' },
    ])
  })

  it('replaces reference consumer example symbols with the {Domain} placeholder', () => {
    expect(rewriteText('`list/useManagerListData`, `ManagerForm`')).toBe('`list/use{Domain}ListData`, `{Domain}Form`')
  })
})

describe('rewriteAgentsForTarget', () => {
  it('replaces the reference operating mode, the rehearsal snapshot fact, and the seed paragraph', () => {
    const agents = [
      '# 루트',
      '## 0. 저장소 운영 모드: 제품 레퍼런스 설계',
      '레퍼런스 문장 1',
      '레퍼런스 문장 2',
      '## 1. 프로젝트 사실',
      '- 계약 snapshot: `openapi/admin.snapshot.json`. 리허설 계약이다.',
      '- 다국어: ko/en/ja',
      '## 7. 규칙 수명주기',
      '- 신규 프로젝트 seed는 채택 후보마다 bundle로 선언한다.',
      '- 다른 규칙',
    ].join('\n')

    const rewritten = rewriteAgentsForTarget(agents)

    expect(rewritten).toContain('## 0. 저장소 운영 모드: 제품 저장소')
    expect(rewritten).not.toContain('레퍼런스 문장 1')
    expect(rewritten).toContain('TRANSPLANT_PENDING_OPENAPI_URL')
    expect(rewritten).not.toContain('- 계약 snapshot: `openapi/admin.snapshot.json`. 리허설 계약이다.')
    expect(rewritten).toContain('- 다국어: ko/en/ja')
    expect(rewritten).not.toContain('- 신규 프로젝트 seed는')
    expect(rewritten).toContain('contracts:check --mode target')
    expect(rewritten).toContain('- 다른 규칙')
  })
})

describe('plan / stage / apply against a target directory', () => {
  it('classifies files, stages a renumbered copy with a pending list, and never overwrites the target', () => {
    const target = temporaryDirectory('transplant-target-')
    const out = temporaryDirectory('transplant-stage-')
    mkdirSync(join(target, 'src/shared/ui/patterns'), { recursive: true })
    writeFileSync(join(target, 'src/shared/ui/patterns/PageHeader.tsx'), 'export const PageHeader = () => null\n')
    writeFileSync(join(target, 'package.json'), '{"name":"target"}\n')

    const plan = planTransplant(target)
    const byFile = new Map(plan.map((item) => [item.file, item]))
    expect(byFile.get('src/shared/ui/patterns/PageHeader.tsx').action).toBe('merge')
    expect(byFile.get('src/shared/ui/patterns/DetailField.tsx').action).toBe('copy')
    expect(byFile.get('package.json').action).toBe('merge')
    expect(byFile.get('docs/decisions/0009-shared-boundaries.md').targetPath).toBe('docs/decisions/0005-shared-boundaries.md')
    expect(byFile.get('docs/decisions/0002-typescript-version-pin.md').action).toBe('conditional')
    expect(byFile.get('AGENTS.md').action).toBe('template')
    expect(plan.some((item) => item.file.startsWith('src/features/'))).toBe(false)
    expect(plan.some((item) => item.file.startsWith('.agents/skills/api-contract/references/'))).toBe(true)
    expect(plan.some((item) => item.file.startsWith('docs/reference/zero-sol/'))).toBe(true)

    const staged = stageTransplant(target, out)
    expect(existsSync(join(out, 'MANIFEST.json'))).toBe(true)
    expect(existsSync(join(out, 'docs/decisions/0005-shared-boundaries.md'))).toBe(true)
    expect(existsSync(join(out, 'docs/decisions/0009-shared-boundaries.md'))).toBe(false)
    expect(readFileSync(join(out, 'AGENTS.md'), 'utf8')).toContain('TRANSPLANT_PENDING_OPENAPI_URL')
    expect(readFileSync(join(out, 'docs/decisions/0008-typescript-version-pin.md'), 'utf8')).toContain('TRANSPLANT_PENDING_ADR_PIN')
    expect(staged.pending.map((item) => item.id)).toEqual(expect.arrayContaining(['ENVELOPE', 'API_BASE', 'OPENAPI_URL', 'ADR_PIN']))
    expect(readFileSync(join(out, 'PENDING.md'), 'utf8')).toContain('## 조건부')

    const applied = applyTransplant(target, out)
    expect(readFileSync(join(target, 'src/shared/ui/patterns/PageHeader.tsx'), 'utf8')).toBe('export const PageHeader = () => null\n')
    expect(readFileSync(join(target, 'package.json'), 'utf8')).toBe('{"name":"target"}\n')
    expect(existsSync(join(target, 'src/shared/ui/patterns/DetailField.tsx'))).toBe(true)
    expect(existsSync(join(target, 'docs/decisions/0005-shared-boundaries.md'))).toBe(true)
    expect(applied.copied).toContain('src/shared/ui/patterns/DetailField.tsx')
    expect(applied.skipped.map((item) => item.targetPath)).toEqual(expect.arrayContaining(['src/shared/ui/patterns/PageHeader.tsx', 'package.json']))
    expect(existsSync(join(target, 'src/features'))).toBe(false)
    expect(existsSync(join(target, 'openapi/admin.snapshot.json'))).toBe(false)
  })

  it('refuses to apply when the stage copy no longer matches its manifest', () => {
    const target = temporaryDirectory('transplant-target-')
    const out = temporaryDirectory('transplant-stage-')
    stageTransplant(target, out)
    writeFileSync(join(out, 'src/shared/ui/patterns/DetailField.tsx'), '// tampered\n')

    expect(() => applyTransplant(target, out)).toThrow(/MANIFEST/)
  })
})
