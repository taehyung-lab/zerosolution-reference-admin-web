import { spawnSync } from 'node:child_process'
import { checkNegativeControlFailures } from './meta.mjs'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, relative, resolve } from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  CI_VERIFY_SCRIPTS,
  claudeAgentsImportFailure,
  ciVerifyStageFailures,
  ciWorkflowConcurrencyFailures,
  ciWorkflowScriptFailures,
  copilotAgentsPointerFailure,
  documentBudgetNotices,
  headingAnchors,
  productNameNotices,
  productTermDisposition,
  productTermsInLine,
  ledgerIndexFailures,
  DOCUMENT_LINE_BUDGET,
  parseReadmeVerifyProjection,
  parseVerifyChain,
  pnpmCommandFailures,
  readLocalLinkFailures,
  citedContractPathFailures,
  prohibitedAbstractionSourceFailures,
  retiredDocumentNameFailures,
  transplantSentinelFailures,
  transplantSentinelOccurrences,
  alwaysLoadedBudgetFailures,
  baselineEntryFailures,
  skillAdapterFailures,
  unclassifiedProductTermFailures,
} from './contracts.mjs'
import {
  collectImportClosure,
  collectTestImportClosure,
  findForbiddenSeedFiles,
  findSeedLeaks,
  findUndeclaredContractExports,
  findUnexpectedSeedTests,
  foundationBundleFailures,
  listSeedFiles,
  listTransplantManifestFiles,
  SEED_BUNDLES,
  SEED_BUNDLE_EXPORTS,
  TRANSPLANT_MANIFEST,
  findBundleExportDrift,
  readExportedNames,
  validateSeedBundles,
  validateTransplantManifest,
} from './seed.mjs'
import {
  findContractPathMismatches,
  findUnregisteredPorts,
  readDeclaredPaths,
} from './api-surface.mjs'

const temporaryRoots = []

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

/** 문서 fixture 를 임시 디렉터리에 쓰고 저장소 상대 경로 목록을 돌려준다. */
function createDocuments(files) {
  const root = mkdtempSync(join(tmpdir(), 'contracts-'))
  temporaryRoots.push(root)
  const written = []
  for (const [name, content] of Object.entries(files)) {
    const path = resolve(root, name)
    mkdirSync(resolve(path, '..'), { recursive: true })
    writeFileSync(path, content)
    written.push(path)
  }
  return written
}

const CHAIN = 'pnpm api:check && pnpm typecheck && pnpm lint'
const PROJECTION = '| `pnpm verify` | **단일 검증 진입점.** api:check → typecheck → lint |'

describe('verify chain projection', () => {
  it('matches when README projects the same ordered steps', () => {
    expect(parseVerifyChain(CHAIN)).toEqual(parseReadmeVerifyProjection(PROJECTION))
  })

  it('detects a reordered pipeline', () => {
    const reordered = '| `pnpm verify` | **단일 검증 진입점.** typecheck → api:check → lint |'

    expect(parseVerifyChain(CHAIN)).not.toEqual(parseReadmeVerifyProjection(reordered))
  })

  it('detects a missing projection row', () => {
    expect(parseReadmeVerifyProjection('| `pnpm build` | 빌드 |')).toBeNull()
  })
})

describe('CI verify stage coverage', () => {
  const completeScripts = {
    verify: 'pnpm api:check && pnpm contracts:check && pnpm test:unit && pnpm test:e2e:smoke',
    'ci:static': 'pnpm api:check && pnpm contracts:check',
    'ci:unit': 'pnpm test:unit',
    'ci:e2e': 'pnpm test:e2e:smoke',
  }

  it('accepts an exact one-owner partition of the verify stages', () => {
    expect(CI_VERIFY_SCRIPTS).toEqual(['ci:static', 'ci:unit', 'ci:e2e'])
    expect(ciVerifyStageFailures(completeScripts)).toEqual([])
  })

  it('reports a stage missing from every CI script', () => {
    const scripts = {
      ...completeScripts,
      'ci:e2e': '',
    }

    expect(ciVerifyStageFailures(scripts)).toEqual([
      expect.stringContaining('CI script 비어 있음: ci:e2e'),
      expect.stringContaining('verify에만 존재: test:e2e:smoke'),
    ])
  })

  it('rejects a missing required CI script even when another script owns its stages', () => {
    const scripts = {
      ...completeScripts,
      'ci:static': 'pnpm api:check && pnpm contracts:check && pnpm test:unit',
    }
    delete scripts['ci:unit']

    expect(ciVerifyStageFailures(scripts)).toEqual([
      'CI script 누락: ci:unit',
    ])
  })

  it('rejects an empty required CI script even when another script owns its stages', () => {
    const scripts = {
      ...completeScripts,
      'ci:static': 'pnpm api:check && pnpm contracts:check && pnpm test:unit',
      'ci:unit': '   ',
    }

    expect(ciVerifyStageFailures(scripts)).toEqual([
      'CI script 비어 있음: ci:unit',
    ])
  })

  it('reports a stage that exists only in CI', () => {
    const scripts = {
      verify: 'pnpm api:check && pnpm contracts:check && pnpm test:unit',
      'ci:static': 'pnpm api:check && pnpm contracts:check',
      'ci:unit': 'pnpm test:unit',
      'ci:e2e': 'pnpm test:e2e:smoke',
    }

    expect(ciVerifyStageFailures(scripts)).toEqual([
      expect.stringContaining('CI에만 존재: test:e2e:smoke'),
    ])
  })

  it('reports a stage owned by more than one CI script', () => {
    const scripts = {
      ...completeScripts,
      'ci:unit': 'pnpm test:unit && pnpm api:check',
    }

    expect(ciVerifyStageFailures(scripts)).toEqual([
      expect.stringContaining('CI에서 중복: api:check'),
    ])
  })

  it('reports a duplicated stage inside verify', () => {
    const scripts = {
      ...completeScripts,
      verify: 'pnpm api:check && pnpm contracts:check && pnpm api:check && pnpm test:unit && pnpm test:e2e:smoke',
    }

    expect(ciVerifyStageFailures(scripts)).toEqual([
      expect.stringContaining('verify에서 중복: api:check'),
    ])
  })
})

describe('CI workflow script coverage', () => {
  const completeWorkflow = `
jobs:
  static:
    steps:
      - run: pnpm run ci:static
  unit:
    steps:
      - run: pnpm run ci:unit -- --shard=1/2
  e2e:
    steps:
      - run: pnpm run ci:e2e
`

  it('accepts a workflow that calls each CI script', () => {
    expect(ciWorkflowScriptFailures(completeWorkflow)).toEqual([])
  })

  it('reports a CI script missing from the workflow', () => {
    expect(ciWorkflowScriptFailures(completeWorkflow.replace('      - run: pnpm run ci:e2e\n', ''))).toEqual([
      expect.stringContaining('ci:e2e'),
    ])
  })

  it('does not accept a longer script name as a CI script call', () => {
    const workflow = completeWorkflow.replace('pnpm run ci:static', 'pnpm run ci:static-extra')

    expect(ciWorkflowScriptFailures(workflow)).toEqual([
      expect.stringContaining('ci:static'),
    ])
  })

  it('does not accept a comment or echo text as a CI script call', () => {
    const workflow = completeWorkflow.replace(
      '      - run: pnpm run ci:static',
      '      # run: pnpm run ci:static\n      - run: echo pnpm run ci:static',
    )

    expect(ciWorkflowScriptFailures(workflow)).toEqual([
      expect.stringContaining('ci:static'),
    ])
  })
})

describe('CI workflow concurrency', () => {
  const protectedConcurrency = `
concurrency:
  group: \${{ github.workflow }}-\${{ github.event_name == 'pull_request' && github.ref || github.run_id }}
  cancel-in-progress: \${{ github.event_name == 'pull_request' }}
`

  it('accepts stable PR groups and unique non-PR groups with PR-only cancellation', () => {
    expect(ciWorkflowConcurrencyFailures(protectedConcurrency)).toEqual([])
  })

  it('rejects a shared main group and ref-based cancellation', () => {
    const unsafeConcurrency = `
concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: \${{ github.ref != 'refs/heads/main' }}
`

    expect(ciWorkflowConcurrencyFailures(unsafeConcurrency)).toEqual([
      'CI workflow concurrency group은 PR ref와 비-PR run_id를 분리해야 한다.',
      'CI workflow cancel-in-progress는 pull_request에서만 true여야 한다.',
    ])
  })

  it('rejects matching values nested under a job when root concurrency is absent', () => {
    const jobOnlyConcurrency = `
jobs:
  static:
    concurrency:
      group: \${{ github.workflow }}-\${{ github.event_name == 'pull_request' && github.ref || github.run_id }}
      cancel-in-progress: \${{ github.event_name == 'pull_request' }}
`

    expect(ciWorkflowConcurrencyFailures(jobOnlyConcurrency)).toEqual([
      'CI workflow concurrency group은 PR ref와 비-PR run_id를 분리해야 한다.',
      'CI workflow cancel-in-progress는 pull_request에서만 true여야 한다.',
    ])
  })
})

describe('pnpm command existence', () => {
  const scripts = { verify: 'true', lint: 'true' }

  it('accepts declared scripts and pnpm builtins', () => {
    const files = createDocuments({ 'ok.md': '`pnpm lint` 와 `pnpm install` 을 실행한다.\n' })

    expect(pnpmCommandFailures(files, scripts)).toEqual([])
  })

  it('reports an unknown script', () => {
    const files = createDocuments({ 'bad.md': '`pnpm nope:check` 를 실행한다.\n' })

    expect(pnpmCommandFailures(files, scripts)).toHaveLength(1)
    expect(pnpmCommandFailures(files, scripts)[0]).toContain('pnpm nope:check')
  })
})

describe('local markdown links', () => {
  it('accepts links whose target exists and ignores external URLs', () => {
    const files = createDocuments({
      'index.md': '## s\n[peer](peer.md) [anchor](#s) [web](https://example.com/x.md)\n',
      'peer.md': 'peer\n',
    })

    expect(readLocalLinkFailures([files[0]])).toEqual([])
  })

  it('reports a broken local link', () => {
    const files = createDocuments({ 'index.md': '[gone](missing.md)\n' })

    expect(readLocalLinkFailures(files)).toHaveLength(1)
    expect(readLocalLinkFailures(files)[0]).toContain('missing.md')
  })

  it('resolves anchors the way GitHub slugs headings, in the same file and across files', () => {
    const files = createDocuments({
      'index.md': [
        '## 5. 실행·협업 모델',
        '## API 호출 계층 (조회·목록·mutation 공통)',
        '## Read the migrated rows',
        '## Read the migrated rows',
        '```',
        '# not a heading',
        '```',
        '[a](#5-실행협업-모델) [b](#api-호출-계층-조회목록mutation-공통) [c](peer.md#형태) [d](#read-the-migrated-rows-1)',
        '[gone](#not-a-heading) [typo](peer.md#형식) [file](peer.md)',
      ].join('\n') + '\n',
      'peer.md': '# Peer\n\n## 형태\n',
    })

    const failures = readLocalLinkFailures([files[0]])
    expect(failures).toEqual([
      expect.stringMatching(/index\.md:9: link 앵커 없음 → #not-a-heading/),
      expect.stringMatching(/index\.md:9: link 앵커 없음 → peer\.md#형식/),
    ])
    expect([...headingAnchors('## 근거의 수명과 읽기 범위\n## `code` in heading\n')]).toEqual(['근거의-수명과-읽기-범위', 'code-in-heading'])
  })

  it('slugs the rendered heading text, keeps underscores, and survives a malformed percent anchor', () => {
    // The inventory sections are titled with an inline link; GitHub slugs the link text, not its URL.
    expect([...headingAnchors('## Notion 요점 (원문: [notion/08-promotion.md](notion/08-promotion.md))\n## a_b 형태\n')])
      .toEqual(['notion-요점-원문-notion08-promotionmd', 'a_b-형태'])
    // A ``` fence does not close a ~~~ fence, so the heading inside stays hidden.
    expect([...headingAnchors('~~~\n```\n# hidden\n~~~\n# shown\n')]).toEqual(['shown'])
    const files = createDocuments({ 'index.md': '## 100% 달성\n[ok](#100-달성) [bad](#100%-달성)\n' })
    expect(readLocalLinkFailures(files)).toEqual([expect.stringMatching(/앵커 없음 → #100%-달성/)])
  })
})

describe('product names inside skill rule text', () => {
  it('fails only vocabulary whose target owner is unclassified', () => {
    const classified = {
      file: 'README.md', line: 1, terms: ['회원'], disposition: 'target-decision',
    }
    const unclassified = {
      file: 'docs/portable.md', line: 2, terms: ['manager'], disposition: 'unclassified',
    }

    expect(unclassifiedProductTermFailures([classified, unclassified])).toEqual([
      'docs/portable.md:2: 제품 어휘 소유자 미분류 → manager',
    ])
    expect(productTermDisposition(
      { file: 'docs/generic.md', terms: ['manager'], allowedReason: 'package manager 문맥' },
      { group: 'adrs', action: 'copy' },
    )).toBe('allowed-generic')
  })

  it('notices domain nouns, identifiers and feature directories anywhere in a portable skill', () => {
    // `auth` is filtered out by readFeatureDirectories in production; here the caller passes the list.
    const dirs = ['members', 'managers']
    expect(productTermsInLine('회원 목록은 즉시 조회한다', undefined, dirs)).toEqual(['회원'])
    expect(productTermsInLine('`ManagerListScreen` 은 `members/screens/list` 를 쓴다', undefined, dirs)).toEqual(['ManagerListScreen', 'members', 'members/'])
    // A generic word that happens to be a directory name is not a product name unless written as a path.
    expect(productTermsInLine('auth session refresh keeps the draft; remember it', undefined, dirs)).toEqual([])
    // English prose names the domain too, in any case and plural; `performance` is left out (React performance docs).
    expect(productTermsInLine('the rehearsal manager list and member lists; performance boundaries', undefined, dirs)).toEqual(['rehearsal', 'manager', 'member'])
    // camelCase-embedded identifiers and fenced examples count because examples also become copied instructions.
    expect(productTermsInLine('`usePerformanceDetail` stays in api', undefined, dirs)).toEqual(['PerformanceDetail'])
    const files = createDocuments({
      'rule.md': '# Rule\n\n회원·운영자 목록은 명시 검색이다.\n\n## 이 저장소의 관찰\n\n회원 목록은 `MemberListScreen` 이다.\n\n```md\n# 운영자 fence heading\n```\n\n회원 관찰 계속.\n\n## Another rule\n\n공연 목록은 즉시 조회.\n\n### 게시판 heading\n',
      'clean.md': '# Rule\n\nA list with a `searched` marker waits for the search action.\n',
    })
    const notices = productNameNotices(files, { featureDirs: dirs })
    expect(notices).toHaveLength(1)
    expect(notices[0]).toContain('rule.md')
    expect(notices[0]).toContain('3: 회원·운영자')
    expect(notices[0]).toContain('17: 공연')
    expect(notices[0]).toContain('19: 게시판')
    expect(notices[0]).toContain('7: 회원·MemberListScreen')
    expect(notices[0]).toContain('10: 운영자')
    expect(notices[0]).toContain('13: 회원')
  })
})

describe('agent-facing document line budget', () => {
  it('notices dense documents under the line budget without failing the contract', () => {
    const files = createDocuments({'dense.md': '# Dense\n' + '가'.repeat(12000), 'small.md':'# Small\n'})
    expect(documentBudgetNotices(files)).toEqual([expect.stringContaining('dense.md')])
    expect(documentBudgetNotices(files)[0]).toContain('bytes')
  })
  it('says nothing when every document stays at the recommended length', () => {
    const files = createDocuments({
      'AGENTS.md': 'x\n'.repeat(DOCUMENT_LINE_BUDGET),
      'references/contract.md': 'x\n'.repeat(DOCUMENT_LINE_BUDGET),
    })

    expect(documentBudgetNotices(files)).toEqual([])
  })

  // 권고이므로 실패가 아니다. 넘긴 파일에는 무엇을 볼지 함께 적는다.
  it('advises only the documents over the recommended length, and says what to check', () => {
    const files = createDocuments({
      'ok.md': 'x\n'.repeat(DOCUMENT_LINE_BUDGET),
      'too-long.md': 'x\n'.repeat(DOCUMENT_LINE_BUDGET + 1),
    })

    const notices = documentBudgetNotices(files)
    expect(notices).toEqual([
      expect.stringContaining(`too-long.md 가 ${DOCUMENT_LINE_BUDGET + 1}줄`),
    ])
    expect(notices[0]).toContain('중복')
    expect(notices[0]).toContain('소유자')
    expect(notices[0]).toContain('나눌 수')
  })
})

describe('Claude AGENTS import', () => {
  it('accepts AGENTS.md as the first instruction', () => {
    expect(claudeAgentsImportFailure('\n@AGENTS.md\n\n# Claude Code\n')).toBeNull()
  })

  it('rejects a Markdown link that asks Claude to read AGENTS.md later', () => {
    expect(claudeAgentsImportFailure('# Claude\n\nRead [AGENTS.md](AGENTS.md).\n')).toContain(
      '@AGENTS.md',
    )
  })

  it('rejects a missing AGENTS.md import', () => {
    expect(claudeAgentsImportFailure('# Claude Code\n')).toContain('@AGENTS.md')
  })
})

describe('Copilot AGENTS pointer', () => {
  it('accepts AGENTS.md as the first body instruction', () => {
    expect(
      copilotAgentsPointerFailure(
        '# Copilot instructions\n\nRead [`AGENTS.md`](../AGENTS.md) before changing code.\n',
      ),
    ).toBeNull()
  })

  it('rejects a pointer that appears after another instruction', () => {
    expect(
      copilotAgentsPointerFailure(
        '# Copilot instructions\n\nFollow these local rules first.\n\nRead [`AGENTS.md`](../AGENTS.md).\n',
      ),
    ).toContain('../AGENTS.md')
  })

  it('rejects a missing AGENTS.md pointer', () => {
    expect(copilotAgentsPointerFailure('# Copilot instructions\n')).toContain('../AGENTS.md')
  })
})

describe('contracts check CLI wiring', () => {
  const projectRoot = resolve(import.meta.dirname, '../..')
  const excludedDirectories = new Set([
    '.git',
    '.ai-work',
    '.serena',
    'dist',
    'node_modules',
    'playwright-report',
    'test-results',
  ])
  let fixtureParent
  let fixtureRoot

  beforeAll(() => {
    fixtureParent = mkdtempSync(join(tmpdir(), 'contracts-cli-'))
    fixtureRoot = resolve(fixtureParent, 'repo')
    cpSync(projectRoot, fixtureRoot, {
      recursive: true,
      // `cpSync` 는 기본값에서 심링크를 절대경로로 바꿔 복사한다. 그러면 사본의 `.claude/skills` 가
      // **원본 체크아웃**을 가리키고, 사본을 고쳐도 원본이 읽힌다. 링크는 링크 그대로 옮긴다.
      verbatimSymlinks: true,
      filter: (source) => !excludedDirectories.has(basename(source)),
    })
  })

  beforeEach(() => {
    writeFileSync(resolve(fixtureRoot, 'CLAUDE.md'), '@AGENTS.md\n')
    writeFileSync(
      resolve(fixtureRoot, '.github/copilot-instructions.md'),
      '# Copilot instructions\n\nRead [`AGENTS.md`](../AGENTS.md) before changing code.\n',
    )
  })

  afterAll(() => {
    rmSync(fixtureParent, { recursive: true, force: true })
  })

  function runCheck(args = []) {
    return spawnSync(process.execPath, ['scripts/contracts/check.mjs', ...args], {
      cwd: fixtureRoot,
      encoding: 'utf8',
    })
  }

  it('passes through the real CLI when both runtime pointers are valid', () => {
    const result = runCheck()

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('CLAUDE.md')
    expect(result.stdout).toContain('Copilot')
  })

  it('reports missing merge prerequisites instead of crashing', () => {
    for (const file of ['package.json', '.github/workflows/verify.yml']) {
      const path = resolve(fixtureRoot, file)
      const original = readFileSync(path)
      try {
        rmSync(path)
        const result = runCheck()
        expect(result.status).toBe(1)
        expect(result.stderr).toContain(`${file} 를 먼저 병합한다`)
        expect(result.stderr).not.toContain('ENOENT')
      } finally { writeFileSync(path, original) }
    }
  })

  it('target 모드는 source baseline 없이도 ENOENT로 죽지 않는다', () => {
    const baseline = resolve(fixtureRoot, 'scripts/loop/baseline.json')
    const original = readFileSync(baseline)
    try {
      rmSync(baseline)
      const result = runCheck(['--mode', 'target'])
      expect(result.stderr).not.toContain('ENOENT')
    } finally { writeFileSync(baseline, original) }
  })

  it('fails through the real CLI when the Claude import is invalid', () => {
    writeFileSync(resolve(fixtureRoot, 'CLAUDE.md'), '# Claude\n\nRead AGENTS.md later.\n')

    const result = runCheck()

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('CLAUDE.md')
  })

  it('fails through the real CLI when the Copilot pointer is invalid', () => {
    writeFileSync(
      resolve(fixtureRoot, '.github/copilot-instructions.md'),
      '# Copilot instructions\n\nUse these rules first.\n',
    )

    const result = runCheck()

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Copilot')
  })
})

describe('transplant sentinel', () => {
  it('passes when every transplant decision is resolved', () => {
    const files = createDocuments({ 'ok.md': '배포 환경: https://admin.example.com\n' })

    expect(transplantSentinelFailures(files)).toEqual([])
  })

  it('reports each unresolved decision by id', () => {
    const files = createDocuments({
      'pending.md': '- 배포 환경: TRANSPLANT_PENDING_DEPLOY_ORIGIN\n- 인증: TRANSPLANT_PENDING_AUTH_SESSION\n',
    })

    const failures = transplantSentinelFailures(files)

    expect(failures).toHaveLength(2)
    expect(failures[0]).toContain('DEPLOY_ORIGIN')
    expect(failures[1]).toContain('AUTH_SESSION')
  })
})

describe('seed contract bundles', () => {
  const graph = {
    'src/shared/a.ts': ['src/shared/b.ts'],
    'src/shared/b.ts': [],
    'src/features/x/y.ts': [],
  }

  it('accepts a complete four-part bundle and computes both code and focused-test closure', () => {
    const [code, , skill, adr, test] = createDocuments({
      'src/shared/a.ts': '',
      'src/shared/b.ts': '',
      'contracts/skill.md': '## Contract section\n\nStable contract sentence.\n',
      'docs/decision.md': '## Decision stage\n\n| contract | provisional |\n',
      'src/shared/a.test.ts': '',
      'src/test/helper.ts': '',
    })
    const bundle = {
      id: 'example-contract',
      code: [code],
      skills: [{ file: skill, heading: 'Contract section', marker: 'Stable contract sentence.' }],
      adrs: [{ file: adr, heading: 'Decision stage', marker: '| contract | provisional |' }],
      tests: [test],
      ownership: { shared: 'Owns the stable mechanic.', feature: 'Owns product meaning.' },
    }
    const imports = (file) => new Map([
      ['src/shared/a.ts', ['src/shared/b.ts']],
      ['src/shared/b.ts', []],
      ['src/shared/a.test.ts', ['src/shared/a.ts', 'src/test/helper.ts']],
      ['src/test/helper.ts', []],
    ]).get(file) ?? []

    expect(validateSeedBundles([bundle])).toEqual([])
    expect(collectImportClosure(['src/shared/a.ts', 'src/shared/a.test.ts'], imports)).toEqual(
      ['src/shared/a.test.ts', 'src/shared/a.ts', 'src/shared/b.ts', 'src/test/helper.ts'],
    )
  })

  it('rejects a bundle whose code-root exports drifted from the declared set', () => {
    expect(readExportedNames('export function visible() {}\nconst hidden = 1\n')).toEqual(['visible'])
    // `export default X` is the outer name X; an anonymous default is `default`.
    expect(readExportedNames('const client = 1\nexport default client\n')).toEqual(['client'])
    expect(readExportedNames('export default function () {}\n')).toEqual(['default'])
    expect(findBundleExportDrift()).toEqual([])
    expect(Object.keys(SEED_BUNDLE_EXPORTS).sort()).toEqual(SEED_BUNDLES.map((bundle) => bundle.id).sort())
    const [code] = createDocuments({ 'src/shared/a.ts': 'export function visible() {}\n' })
    const bundle = { id: 'drift-example', code: [code] }
    expect(findBundleExportDrift([bundle], { 'drift-example': ['visible'] })).toEqual([])
    expect(findBundleExportDrift([bundle], { 'drift-example': ['gone'] })).toEqual([
      expect.stringMatching(/미선언 export visible/),
      expect.stringMatching(/코드에 없는 export gone/),
    ])
    expect(findBundleExportDrift([bundle], {})).toEqual([expect.stringMatching(/SEED_BUNDLE_EXPORTS 가 없다/)])
  })

  // A selective transplant leaves most bundles and all feature code behind, so this check builds its own
  // four parts instead of naming a catalog id: the transplanted catalog must still be a valid input here.
  it('validates optional consumption examples without exporting feature code', () => {
    const [code, skill, adr, test, consumer] = createDocuments({
      'src/shared/lib/draft.ts': 'export function draft() {}\n',
      'contracts/skill.md': '## Contract section\n\nStable contract sentence.\n',
      'docs/decision.md': '## Decision stage\n\n| contract | provisional |\n',
      'src/shared/lib/draft.test.ts': "import { draft } from './draft'\ndraft()\n",
      'src/features/consumer/useConsumerFilter.ts': 'export const useConsumerFilter = () => null\n',
    })
    const bundle = {
      id: 'draft-example',
      code: [code],
      skills: [{ file: skill, heading: 'Contract section', marker: 'Stable contract sentence.' }],
      adrs: [{ file: adr, heading: 'Decision stage', marker: '| contract | provisional |' }],
      tests: [test],
      ownership: { shared: 'Holds the draft lifecycle.', feature: 'Owns fields, copy and navigation policy.' },
    }
    const example = {
      files: [consumer],
      useWhen: 'Compare matching filter, period and keyword lifecycles.',
      doNotCopy: 'Consumer defaults and navigation policy.',
    }
    expect(validateSeedBundles([{ ...bundle, examples: [example] }])).toEqual([])
    expect(validateSeedBundles([{ ...bundle, examples: [{ ...example, files: [`${consumer}.missing`] }] }]))
      .toEqual([expect.stringContaining('example')])
    expect(validateSeedBundles([{ ...bundle, examples: [{ ...example, doNotCopy: '' }] }]))
      .toEqual([expect.stringContaining('example')])
    expect(validateSeedBundles([{ ...bundle, examples: [{ ...example, files: [] }] }]))
      .toEqual([expect.stringContaining('example')])
    expect(listSeedFiles([{ ...bundle, examples: [example] }])).not.toContain(relative(resolve('.'), consumer))
  })

  // The live catalog stays under test as a whole: whichever bundles a transplant selects, each one still
  // declares its four parts, owns its code root alone and travels with the example rules above.
  it('keeps every declared bundle in the live catalog valid', () => {
    expect(SEED_BUNDLES.length).toBeGreaterThan(0)
    expect(validateSeedBundles()).toEqual([])
    for (const bundle of SEED_BUNDLES) {
      expect(listSeedFiles([bundle])).toEqual(expect.arrayContaining(bundle.code))
      for (const file of bundle.examples?.flatMap((example) => example.files) ?? []) {
        expect(listSeedFiles([bundle])).not.toContain(file)
      }
    }
  })

  it('rejects missing or repeated Foundation bundle IDs', () => {
    expect(foundationBundleFailures(SEED_BUNDLES, ['list-view', 'list-view', 'missing'])).toEqual([
      'Foundation bundle ID가 중복된다: list-view',
      'Foundation bundle이 없다: missing',
    ])
  })

  it('rejects a bundle when one of the four required parts is missing', () => {
    const [code, skill, adr] = createDocuments({
      'src/shared/a.ts': '',
      'contracts/skill.md': '## Contract section\n\nStable contract sentence.\n',
      'docs/decision.md': '## Decision stage\n\n| contract | provisional |\n',
    })
    const failures = validateSeedBundles([{
      id: 'missing-test',
      code: [code],
      skills: [{ file: skill, heading: 'Contract section', marker: 'Stable contract sentence.' }],
      adrs: [{ file: adr, heading: 'Decision stage', marker: '| contract | provisional |' }],
      tests: [],
      ownership: { shared: 'Owns the mechanic.', feature: 'Owns product meaning.' },
    }])

    expect(failures).toEqual([expect.stringContaining('focused test')])
  })

  it('does not pull a mocked production module into a focused-test closure', () => {
    const imports = (file) => ({
      'src/focused.test.ts': ['src/screen.ts'],
      'src/screen.ts': ['src/live.ts', 'src/api/generated.ts'],
      'src/live.ts': [],
      'src/api/generated.ts': ['src/api/rehearsal-model.ts'],
      'src/api/rehearsal-model.ts': [],
    })[file] ?? []

    expect(collectTestImportClosure(
      ['src/focused.test.ts'],
      imports,
      () => ['src/api/generated.ts'],
    )).toEqual(['src/focused.test.ts', 'src/live.ts', 'src/screen.ts'])
  })

  it('does not pull rehearsal generated barrels into the materialized seed', () => {
    const files = listSeedFiles()

    expect(files.filter((file) => file.startsWith('src/api/generated/'))).toEqual([])
  })

  it('rejects test files that are not declared focused-test roots', () => {
    expect(findUnexpectedSeedTests(
      ['src/declared.test.ts', 'src/transitive.test.ts', 'src/helper.ts'],
      [{ tests: ['src/declared.test.ts'] }],
    )).toEqual(['src/transitive.test.ts'])
  })

  it('reports an import edge that escapes the materialized bundle seed', () => {
    const escaping = { ...graph, 'src/shared/b.ts': ['src/features/x/y.ts'] }

    expect(findSeedLeaks(['src/shared/a.ts', 'src/shared/b.ts'], (f) => escaping[f] ?? [])).toEqual([
      { from: 'src/shared/b.ts', to: 'src/features/x/y.ts' },
    ])
  })

  it('rejects duplicate contract ownership across bundles', () => {
    const [code, skill, adr, test, secondTest] = createDocuments({
      'src/shared/a.ts': '',
      'contracts/skill.md': '## Contract section\n\nStable contract sentence.\n',
      'docs/decision.md': '## Decision stage\n\n| contract | provisional |\n',
      'src/shared/a.test.ts': '',
      'src/shared/other.test.ts': '',
    })
    const base = {
      code: [code],
      skills: [{ file: skill, heading: 'Contract section', marker: 'Stable contract sentence.' }],
      adrs: [{ file: adr, heading: 'Decision stage', marker: '| contract | provisional |' }],
      ownership: { shared: 'Owns the mechanic.', feature: 'Owns product meaning.' },
    }

    expect(validateSeedBundles([
      { ...base, id: 'first', tests: [test] },
      { ...base, id: 'second', tests: [secondTest] },
    ])).toEqual(expect.arrayContaining([expect.stringContaining('중복 소유')]))
  })
})

describe('transplant manifest and seed negative controls', () => {
  it('carries the folder placement contract with the root instructions into a new project', () => {
    expect(listTransplantManifestFiles()).toContain('.agents/skills/source-structure/SKILL.md')
    // 근거의 종류와 수명을 정하는 정책도 함께 나간다; 없으면 대상 프로젝트는 계약만 갖고
    // 그 계약이 무엇을 근거로 삼는지를 잃는다.
    expect(listTransplantManifestFiles()).toContain('product/policies/evidence.md')
  })
  it('대조군 — 시험지와 기준선은 이관되지 않는다. 도메인 낱말과 현재 저장소 관측을 담고 있다', () => {
    expect(findForbiddenSeedFiles([
      'scripts/skills/fixtures.mjs',
      'scripts/loop/baseline.json',
      'scripts/contracts/seed.mjs',
    ])).toEqual([
      'scripts/loop/baseline.json',
      'scripts/skills/fixtures.mjs',
    ])
  })

  it('flags feature code, rehearsal output, and domain translations inside the seed', () => {
    expect(findForbiddenSeedFiles([
      'src/shared/ui/list/ListResult.tsx',
      'src/features/managers/screens/form/ui/ManagerForm.tsx',
      'src/routes/_app/managers/index.tsx',
      'src/api/generated/index.ts',
      'src/features/managers/i18n/locales/ko/managers.json',
      'src/shared/i18n/locales/ko/shared.json',
      'src/app/i18n/locales/en/app.json',
    ])).toEqual([
      'src/api/generated/index.ts',
      'src/features/managers/i18n/locales/ko/managers.json',
      'src/features/managers/screens/form/ui/ManagerForm.tsx',
      'src/routes/_app/managers/index.tsx',
    ])
  })

  // A tsconfig that travels without the projects it references makes the target fail to load tsconfig at
  // all (measured: `Failed to load tsconfig 'tsconfig.e2e.json'` in the applied fixture).
  it('carries every project reference of the tsconfig that travels', () => {
    const references = JSON.parse(readFileSync(resolve('tsconfig.json'), 'utf8')).references ?? []
    for (const { path } of references) {
      expect(TRANSPLANT_MANIFEST.config).toContain(path.replace(/^\.\//, ''))
    }
  })

  it('rejects a manifest entry that does not exist and accepts the real manifest', () => {
    expect(validateTransplantManifest({ gates: ['eslint.config.js', 'scripts/does-not-exist.mjs'], config: [] }))
      .toEqual([
        'transplant manifest config: 항목이 없다',
        'transplant manifest gates: 파일이 없다: scripts/does-not-exist.mjs',
      ])
    expect(validateTransplantManifest()).toEqual([])
    expect(listTransplantManifestFiles()).toEqual(expect.arrayContaining([
      '.agents/skills/form-contract/SKILL.md',
      'eslint.config.js',
      'src/test/setup.ts',
      'tsconfig.base.json',
    ]))
  })

  it('reports a contract file that only a focused test pulls in', () => {
    const graph = {
      'src/shared/a.ts': [],
      'src/shared/a.test.ts': ['src/shared/a.ts', 'src/shared/helper-pattern.ts', 'src/test/locale.tsx'],
      'src/shared/helper-pattern.ts': [],
      'src/test/locale.tsx': [],
    }
    const bundles = [{ code: ['src/shared/a.ts'], tests: ['src/shared/a.test.ts'] }]
    const imports = (file) => graph[file] ?? []

    expect(findUndeclaredContractExports(bundles, [], imports, () => [])).toEqual(['src/shared/helper-pattern.ts'])
    expect(findUndeclaredContractExports(bundles, ['src/shared/helper-pattern.ts'], imports, () => [])).toEqual([])
  })

  it('keeps the real seed free of feature, rehearsal, and undeclared contract files', () => {
    const files = listSeedFiles()

    expect(findForbiddenSeedFiles(files)).toEqual([])
    expect(findUndeclaredContractExports()).toEqual([])
  })
})

describe('sentinel occurrences and citation drift', () => {
  it('lists sentinel occurrences in code files with their line', () => {
    const [code] = createDocuments({
      'src/api/http/envelope.ts': 'const a = 1\n// TRANSPLANT_PENDING_ENVELOPE: 신규 봉투 형식\n',
    })

    expect(transplantSentinelOccurrences([code])).toEqual([{ file: code, line: 2, id: 'ENVELOPE' }])
  })

  it('rejects a retired document name wherever it is cited', () => {
    const [stale, clean] = createDocuments({
      'eslint.config.js': "['useListTable', 'list-detail.md, primitives-and-tokens.md'],\n// docs/design/2026-09-14-reference-document-loop-redesign.md\n",
      'src/ok.ts': '// see catalog.md\n',
    })

    expect(retiredDocumentNameFailures([stale, clean])).toEqual([
      `${stale}:1: 삭제된 문서 이름 → list-detail.md`,
      `${stale}:2: 삭제된 문서 이름 → 2026-09-14-reference-document-loop-redesign.md`,
    ])
  })


  it('requires every prohibited-abstraction source to be a real skill, reference, or ADR', () => {
    const config = `
const PROHIBITED_ABSTRACTION_BINDINGS = new Map([
  ['ResourcePage', 'source-structure.md, form.md'],
  ['useListTable', 'list-detail.md, evidence.md'],
  ['UniversalList', 'ADR 0014'],
])
`
    // `list-detail` 은 skill 로도 reference 로도 없다 — 어느 후보 경로에도 존재하지 않는다.
    const exists = (path) => !path.includes('list-detail')
    // 파일은 있는데 그 금지를 말하지 않는 경우(대조군): evidence.md 에는 useListTable 이 없다.
    const read = (path) => (path.endsWith('source-structure.md') ? 'ResourcePage 를 만들지 않는다' : '무관한 내용')

    expect(prohibitedAbstractionSourceFailures(config, exists, read)).toEqual([
      // 파일은 있으나 그 금지를 말하지 않는다 — 존재 검사로는 통과하던 자리다
      "eslint.config.js: 'ResourcePage' 근거 'form.md' 에 그 이름이 없다 — 근거 문서가 이 금지를 말하지 않는다",
      "eslint.config.js: 'useListTable' 근거 'list-detail.md' 가 실존 규범 파일이 아니다",
      "eslint.config.js: 'useListTable' 근거 'evidence.md' 에 그 이름이 없다 — 근거 문서가 이 금지를 말하지 않는다",
    ])
    // 근거 문서가 실제로 그 이름을 말하면 통과한다.
    expect(prohibitedAbstractionSourceFailures(
      "const PROHIBITED_ABSTRACTION_BINDINGS = new Map([\n  ['ResourcePage', 'source-structure.md'],\n])",
      () => true,
      read,
    )).toEqual([])
  })
})

describe('api surface: ports and contract paths', () => {
  const graph = {
    'src/api/http/credential.ts': 'export function registerReissueTokenReader(reader) {}\nexport function registerLocaleGetter(getter) {}\n',
    'src/api/http/client.ts': 'registerReissueTokenReader\n',
    'src/app/providers/LocaleProvider.tsx': 'registerLocaleGetter(() => locale)\n',
    'src/app/providers/AuthProvider.test.tsx': 'registerReissueTokenReader(() => "x")\n',
  }
  const read = (file) => graph[file] ?? ''
  const list = (root) => Object.keys(graph)
    .filter((file) => file.startsWith(`${root}/`) && !file.includes('.test.'))
    .sort()

  it('reports a port that only tests register, and accepts one the app registers', () => {
    const failures = findUnregisteredPorts('src/api', 'src', read, list)

    expect(failures).toHaveLength(1)
    expect(failures[0]).toContain('registerReissueTokenReader')
    expect(failures.join(' ')).not.toContain('registerLocaleGetter')
  })

  it('does not count the declaring layer mentioning its own port as a registration', () => {
    const selfOnly = { 'src/api/http/credential.ts': graph['src/api/http/credential.ts'], 'src/api/http/client.ts': 'registerLocaleGetter(() => "ko")\n' }
    const failures = findUnregisteredPorts(
      'src/api',
      'src',
      (file) => selfOnly[file] ?? '',
      (root) => Object.keys(selfOnly).filter((file) => file.startsWith(`${root}/`)),
    )

    expect(failures).toHaveLength(2)
  })

  it('rejects a request path that is only a substring of a declared path', () => {
    const declared = ['/api/v1/auth/reissue', '/api/v1/auth/sign-in', '/api/v1/auth/2fa/email/send']
    const source = {
      'src/api/http/client.ts': "const REISSUE_PATH = '/auth/reissue'\n",
      'src/api/http/credential.ts': "const PRE_AUTH_PATHS = ['/auth/sign-in', '/auth/2fa/']\n",
    }
    const failures = findContractPathMismatches(
      declared,
      'src/api',
      (file) => source[file] ?? '',
      () => Object.keys(source),
    )

    expect(failures).toHaveLength(1)
    expect(failures[0]).toContain('REISSUE_PATH')
    expect(failures[0]).toContain('정확히 일치')
  })

  it('accepts an exact request path and rejects a matcher entry no declared path contains', () => {
    const declared = ['/api/v1/auth/reissue', '/api/v1/auth/sign-in']
    const source = {
      'src/api/http/client.ts': "const REISSUE_PATH = '/api/v1/auth/reissue'\n",
      'src/api/http/credential.ts': "const PRE_AUTH_PATHS = ['/auth/sign-in', '/auth/legacy-sso']\n",
    }
    const failures = findContractPathMismatches(
      declared,
      'src/api',
      (file) => source[file] ?? '',
      () => Object.keys(source),
    )

    expect(failures).toHaveLength(1)
    expect(failures[0]).toContain('legacy-sso')
  })

  it('skips the path check when no contract snapshot is declared', () => {
    expect(findContractPathMismatches(null, 'src/api', () => '', () => ['src/api/http/client.ts'])).toEqual([])
  })

  it('holds for the real repository', () => {
    expect(findUnregisteredPorts()).toEqual([])
    expect(findContractPathMismatches(readDeclaredPaths())).toEqual([])
  })
})

describe('scenario ledger index', () => {
  it('reports a card the index does not link and an index entry with no card', () => {
    const files = ['README.md', 'session-lifetime.md', 'orphan-card.md']
    const index = '| [session-lifetime.md](session-lifetime.md) | 세션 |\n| [ghost.md](ghost.md) | 없는 카드 |\n'

    const failures = ledgerIndexFailures('docs/reference/scenarios', 'README.md', () => files, () => index)

    expect(failures).toEqual([
      'docs/reference/scenarios/README.md: 카드 `orphan-card.md` 가 색인에 없다 (라우팅에서 도달 불가)',
      'docs/reference/scenarios/README.md: 색인이 가리키는 `ghost.md` 가 없다',
    ])
  })

  it('accepts an index and card set that cover each other', () => {
    const files = ['README.md', 'a.md', 'b.md']
    const index = '[a.md](a.md) and [b.md](b.md)\n'

    expect(ledgerIndexFailures('docs/reference/scenarios', 'README.md', () => files, () => index)).toEqual([])
  })

  it('holds for the real ledger', () => {
    expect(ledgerIndexFailures()).toEqual([])
  })
})

describe('현재형 계약·제품 경로 인용', () => {
  const files = [{ file: 'AGENTS.md', content: '읽을 계약은 `.agents/skills/list-contract/SKILL.md` 와 `contracts/contract/gone.md` 다.' }]

  it('가리킨 문서가 없으면 실패한다', () => {
    // 대조군: 링크가 아니라 백틱 표기라 markdown link 검사는 이 자리를 보지 못한다.
    expect(citedContractPathFailures(files, (path) => path !== 'contracts/contract/gone.md')).toEqual([
      'AGENTS.md: 가리킨 계약·제품 문서가 없다 → contracts/contract/gone.md',
    ])
  })

  it('전부 실존하면 통과한다', () => {
    expect(citedContractPathFailures(files, () => true)).toEqual([])
  })

  it('백틱과 평문의 죽은 skill 경로를 모두 실패시킨다', () => {
    const files = [{
      file: 'docs/decisions/x.md',
      content: [
        '현재 소유자는 `.agents/skills/api-contract/references/transport.md`다.',
        '현재 소유자는 .agents/skills/api-contract/references/auth-session.md 다.',
      ].join('\n'),
    }]

    expect(citedContractPathFailures(files, () => false)).toEqual([
      'docs/decisions/x.md: 가리킨 계약·제품 문서가 없다 → .agents/skills/api-contract/references/auth-session.md',
      'docs/decisions/x.md: 가리킨 계약·제품 문서가 없다 → .agents/skills/api-contract/references/transport.md',
    ])
  })

  it('과거 이름만 말하고 구체 경로를 주장하지 않으면 이 검사 대상이 아니다', () => {
    const files = [{ file: 'docs/decisions/x.md', content: '당시 이름은 api-contract였다.' }]

    expect(citedContractPathFailures(files, () => false)).toEqual([])
  })
})

describe('검사가 자기를 검사한다', () => {
  const source = { file: 'scripts/x.mjs', content: 'export function fooFailures(input) { return [] }' }

  it('대조군이 없는 검사 함수를 실패로 낸다', () => {
    const tests = [{ file: 'scripts/x.test.mjs', content: "it('통과한다', () => {\n  expect(fooFailures('ok')).toEqual([])\n})" }]
    expect(checkNegativeControlFailures([source, ...tests])).toEqual([
      'scripts/x.mjs: fooFailures 에 대조군이 없다 — 일부러 어긴 입력에서 실패를 내는 테스트가 있어야 등록된다',
    ])
  })

  it('빈 배열이 아닌 결과를 기대하는 테스트가 있으면 통과한다', () => {
    const tests = [{ file: 'scripts/x.test.mjs', content: "it('어기면 실패한다', () => {\n  expect(fooFailures('bad')).toEqual(['boom'])\n})" }]
    expect(checkNegativeControlFailures([source, ...tests])).toEqual([])
  })
})

describe('항상 로드되는 지시 예산', () => {
  const skill = (description) => `---\nname: fixture\ndescription: ${description}\n---\n\n# body\n`

  it('루트와 skill description의 합계가 상한 이하면 통과한다', () => {
    expect(alwaysLoadedBudgetFailures('root', [skill('short')], 9)).toEqual([])
  })

  it('description이 커져 합계 상한을 넘으면 실패한다', () => {
    const failures = alwaysLoadedBudgetFailures('root', [skill('too long')], 9)
    expect(failures).toHaveLength(1)
    expect(failures[0]).toContain('12자')
  })

  it('YAML block chomping 표기가 있어도 description 전체를 센다', () => {
    const document = '---\nname: fixture\ndescription: >-\n  long description\n---\n'
    expect(alwaysLoadedBudgetFailures('', [document], 5)).toHaveLength(1)
  })

  it.each(['>- # 설명', '>2-', '>-2', '|+ # 설명'])('YAML block header %s 도 본문을 센다', (header) => {
    const document = `---\nname: fixture\ndescription: ${header}\n  long description\n---\n`
    expect(alwaysLoadedBudgetFailures('', [document], 5)).toHaveLength(1)
  })

  it('대조군 — 빈 block description은 0자로 통과시키지 않는다', () => {
    expect(alwaysLoadedBudgetFailures('', ['---\nname: fixture\ndescription: >-\n---\n'], 5)).toHaveLength(1)
  })

  it('대조군 — description을 읽지 못하면 0자로 통과시키지 않는다', () => {
    expect(alwaysLoadedBudgetFailures('', ['---\nname: fixture\n---\n'], 5)).toHaveLength(1)
  })

  it('대조군 — 루트를 줄인 만큼 description을 늘려도 총량이 넘으면 잡힌다', () => {
    expect(alwaysLoadedBudgetFailures('root-root', [skill('x')], 10)).toEqual([])
    expect(alwaysLoadedBudgetFailures('root', [skill('xxxxxxx')], 10)).toHaveLength(1)
  })
})

describe('현재 문서 baseline', () => {
  const lineage = {
    supersedes: {
      revision: 'previous@abc1234',
      comparable: false,
      reason: '측정 기준이 바뀌어 직접 비교할 수 없음',
      note: '이전 값은 Git history가 소유함',
    },
  }
  const transplant = {
    observedAt: '2026-09-21',
    sourceRevision: '7bb3271',
    defaultBundleIds: ['draft-commit', 'search-partition', 'list-query', 'list-view'],
    verificationCeiling: '경계까지 확인됨',
    targetRuntime: 'unconfirmed',
    reason: '실 API·실 auth·대상 UI 수용은 첫 대상 프로젝트에서 확인한다',
  }
  const currentEntry = {
    rootCharacters: 4,
    descriptionCharacters: 5,
    alwaysLoadedCharacters: 9,
    budgetCharacters: 10,
  }

  it('같은 계산으로 잰 현재 값이면 통과한다', () => {
    const baseline = JSON.stringify({ ...lineage, entry: { rootCharacters: 4, descriptionCharacters: 5, alwaysLoadedCharacters: 9, budgetCharacters: 10 } })
    expect(baselineEntryFailures('root', ['---\nname: x\ndescription: short\n---\n'], baseline, 10)).toEqual([])
  })

  it('대조군 — 문서가 바뀌어 baseline이 낡으면 실패한다', () => {
    const baseline = JSON.stringify({ ...lineage, entry: { rootCharacters: 3, descriptionCharacters: 5, alwaysLoadedCharacters: 8, budgetCharacters: 10 } })
    expect(baselineEntryFailures('root', ['---\nname: x\ndescription: short\n---\n'], baseline, 10)).toHaveLength(1)
  })

  it('대조군 — 이전 기준선 계보를 지우면 현재 숫자가 맞아도 실패한다', () => {
    const baseline = JSON.stringify({ entry: { rootCharacters: 4, descriptionCharacters: 5, alwaysLoadedCharacters: 9, budgetCharacters: 10 } })
    expect(baselineEntryFailures('root', ['---\nname: x\ndescription: short\n---\n'], baseline, 10)).toContain('baseline supersedes.revision이 없다.')
  })

  it('대조군 — 비교 불가인데 이유를 지우면 실패한다', () => {
    const baseline = JSON.stringify({
      ...lineage,
      supersedes: { ...lineage.supersedes, reason: '' },
      entry: { rootCharacters: 4, descriptionCharacters: 5, alwaysLoadedCharacters: 9, budgetCharacters: 10 },
    })
    expect(baselineEntryFailures('root', ['---\nname: x\ndescription: short\n---\n'], baseline, 10)).toContain('직접 비교할 수 없는 이유가 없다.')
  })

  it('이관 관측은 Foundation 집합과 경계 검증 상한을 기록한다', () => {
    const baseline = JSON.stringify({ ...lineage, entry: currentEntry, transplant })
    expect(baselineEntryFailures('root', ['---\nname: x\ndescription: short\n---\n'], baseline, 10)).toEqual([])
  })

  it('대조군 — 이관 검증 상한이 없으면 실패한다', () => {
    const { verificationCeiling, ...missingCeiling } = transplant
    void verificationCeiling
    const baseline = JSON.stringify({ ...lineage, entry: currentEntry, transplant: missingCeiling })
    expect(baselineEntryFailures('root', ['---\nname: x\ndescription: short\n---\n'], baseline, 10))
      .toContain('transplant.verificationCeiling이 없다.')
  })

  it('대조군 — Foundation bundle ID가 배열이 아니면 실패한다', () => {
    const baseline = JSON.stringify({
      ...lineage,
      entry: currentEntry,
      transplant: { ...transplant, defaultBundleIds: 'draft-commit' },
    })
    expect(baselineEntryFailures('root', ['---\nname: x\ndescription: short\n---\n'], baseline, 10))
      .toContain('transplant.defaultBundleIds는 비어 있지 않은 문자열 배열이어야 한다.')
  })

  it('대조군 — 실제 대상 근거 없이 target runtime을 passed로 쓰면 실패한다', () => {
    const baseline = JSON.stringify({
      ...lineage,
      entry: currentEntry,
      transplant: { ...transplant, targetRuntime: 'passed' },
    })
    expect(baselineEntryFailures('root', ['---\nname: x\ndescription: short\n---\n'], baseline, 10))
      .toContain('transplant.targetRuntime passed에는 targetEvidence가 필요하다.')
  })
})

describe('skill 어댑터', () => {
  const linked = (target) => () => target

  it('정본을 가리키는 링크면 통과한다', () => {
    expect(skillAdapterFailures('.claude/skills', '.agents/skills', linked('../.agents/skills'), () => true)).toEqual([])
  })

  it('대조군 — 링크가 아니라 디렉터리면 실패한다. 이관이 실제로 22파일을 복제했던 자리다', () => {
    const failures = skillAdapterFailures('.claude/skills', '.agents/skills', linked(null), () => true)
    expect(failures).toHaveLength(1)
    expect(failures[0]).toContain('복사본은 정본과 어긋난다')
  })

  it('대조군 — 엉뚱한 곳을 가리키면 어디를 가리키는지 말한다', () => {
    const failures = skillAdapterFailures('.claude/skills', '.agents/skills', linked('../docs/skills'), () => true)
    expect(failures).toEqual(['.claude/skills 가 docs/skills 를 가리킨다. .agents/skills 이어야 한다'])
  })

  it('대조군 — 정본이 사라지면 그것부터 말한다', () => {
    expect(skillAdapterFailures('.claude/skills', '.agents/skills', linked('../.agents/skills'), () => false))
      .toEqual(['.agents/skills 이 없다 — 계약의 정본이 사라졌다'])
  })

  it('이 저장소의 실제 배치가 통과한다', () => {
    expect(skillAdapterFailures()).toEqual([])
  })
})
