import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  agentsBudgetFailure,
  AGENTS_LINE_BUDGET,
  claudeAgentsImportFailure,
  copilotAgentsPointerFailure,
  documentBudgetFailures,
  DOCUMENT_LINE_BUDGET,
  parseReadmeVerifyProjection,
  parseVerifyChain,
  pnpmCommandFailures,
  readLocalLinkFailures,
  agentsSectionReferenceFailures,
  prohibitedAbstractionSourceFailures,
  retiredDocumentNameFailures,
  transplantSentinelFailures,
  transplantSentinelOccurrences,
} from './contracts.mjs'
import {
  collectImportClosure,
  collectTestImportClosure,
  findForbiddenSeedFiles,
  findSeedLeaks,
  findUndeclaredContractExports,
  findUnexpectedSeedTests,
  listSeedFiles,
  listTransplantManifestFiles,
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
      'index.md': '[peer](peer.md) [anchor](#s) [web](https://example.com/x.md)\n',
      'peer.md': 'peer\n',
    })

    expect(readLocalLinkFailures([files[0]])).toEqual([])
  })

  it('reports a broken local link', () => {
    const files = createDocuments({ 'index.md': '[gone](missing.md)\n' })

    expect(readLocalLinkFailures(files)).toHaveLength(1)
    expect(readLocalLinkFailures(files)[0]).toContain('missing.md')
  })
})

describe('AGENTS line budget', () => {
  it('passes at the budget', () => {
    expect(agentsBudgetFailure(`${'x\n'.repeat(AGENTS_LINE_BUDGET)}`)).toBeNull()
  })

  it('fails one line over the budget', () => {
    expect(agentsBudgetFailure(`${'x\n'.repeat(AGENTS_LINE_BUDGET + 1)}`)).toContain(
      String(AGENTS_LINE_BUDGET + 1),
    )
  })
})

describe('agent-facing document line budget', () => {
  it('passes when every document stays at the shared budget', () => {
    const files = createDocuments({
      'AGENTS.md': 'x\n'.repeat(DOCUMENT_LINE_BUDGET),
      'references/contract.md': 'x\n'.repeat(DOCUMENT_LINE_BUDGET),
    })

    expect(documentBudgetFailures(files)).toEqual([])
  })

  it('reports only documents over the shared budget', () => {
    const files = createDocuments({
      'ok.md': 'x\n'.repeat(DOCUMENT_LINE_BUDGET),
      'too-long.md': 'x\n'.repeat(DOCUMENT_LINE_BUDGET + 1),
    })

    expect(documentBudgetFailures(files)).toEqual([
      expect.stringContaining(`too-long.md 가 ${DOCUMENT_LINE_BUDGET + 1}줄`),
    ])
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

  function runCheck() {
    return spawnSync(process.execPath, ['scripts/contracts/check.mjs'], {
      cwd: fixtureRoot,
      encoding: 'utf8',
    })
  }

  it('passes through the real CLI when both runtime pointers are valid', () => {
    const result = runCheck()

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('CLAUDE.md')
    expect(result.stdout).toContain('Copilot')
    expect(result.stdout).toContain('16개 4-part bundle')
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
  it('flags feature code, rehearsal output, and domain translations inside the seed', () => {
    expect(findForbiddenSeedFiles([
      'src/shared/ui/patterns/ListResult.tsx',
      'src/features/managers/form/ManagerForm.tsx',
      'src/routes/_app/managers/index.tsx',
      'src/api/generated/index.ts',
      'src/shared/i18n/locales/ko/managers.json',
      'src/shared/i18n/locales/ko/shared.json',
      'src/shared/i18n/locales/en/app.json',
    ])).toEqual([
      'src/api/generated/index.ts',
      'src/features/managers/form/ManagerForm.tsx',
      'src/routes/_app/managers/index.tsx',
      'src/shared/i18n/locales/ko/managers.json',
    ])
  })

  it('rejects a manifest entry that does not exist and accepts the real manifest', () => {
    expect(validateTransplantManifest({ gates: ['eslint.config.js', 'scripts/does-not-exist.mjs'], config: [] }))
      .toEqual([
        'transplant manifest config: 항목이 없다',
        'transplant manifest gates: 파일이 없다: scripts/does-not-exist.mjs',
      ])
    expect(validateTransplantManifest()).toEqual([])
    expect(listTransplantManifestFiles()).toEqual(expect.arrayContaining([
      '.agents/skills/feature-contract/SKILL.md',
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
      'eslint.config.js': "['useListTable', 'list-detail.md, react-performance.md'],\n",
      'src/ok.ts': '// see select.md\n',
    })

    expect(retiredDocumentNameFailures([stale, clean])).toEqual([
      `${stale}:1: 삭제된 문서 이름 → list-detail.md`,
    ])
  })

  it('rejects an AGENTS.md section number that no longer exists', () => {
    const agents = '# root\n\n## 0. 모드\n\n## 3. 아키텍처\n\n## 7. 규칙 수명주기\n'
    const [stale, ok] = createDocuments({
      'docs/decisions/0001.md': '`AGENTS.md` §5의 bootstrap 계약과 §11 판단\n',
      'docs/decisions/0002.md': 'AGENTS.md §3 레이어 경계\n',
    })

    expect(agentsSectionReferenceFailures([stale, ok], agents)).toEqual([
      `${stale}:1: AGENTS.md §5 절이 없다`,
    ])
  })

  it('requires every prohibited-abstraction source to be a real skill, reference, or ADR', () => {
    const config = `
const PROHIBITED_ABSTRACTION_BINDINGS = new Map([
  ['ResourcePage', 'feature-contract SKILL.md, list-workflow.md'],
  ['useListTable', 'list-detail.md, react-performance.md'],
  ['UniversalList', 'ADR 0009'],
])
`
    const exists = (path) => !path.endsWith('list-detail.md')

    expect(prohibitedAbstractionSourceFailures(config, exists)).toEqual([
      "eslint.config.js: 'useListTable' 근거 'list-detail.md' 가 실존 규범 파일이 아니다",
    ])
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
