#!/usr/bin/env node
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { CASES, FIXTURE_ROOT, diffFixtureSets, listFixtureFiles } from './gates/fixture-manifest.mjs'

const repositoryRoot = resolve('.')
const fixtureRoot = resolve(repositoryRoot, FIXTURE_ROOT)
const cases = CASES

// manifest 와 실제 fixture 집합이 어긋나면 검사 자체가 신뢰할 수 없다. 실행 전에 먼저 확인한다.
const { unregistered, missing } = diffFixtureSets(
  cases.map(({ fixture }) => fixture),
  listFixtureFiles(fixtureRoot),
)
if (unregistered.length > 0 || missing.length > 0) {
  for (const file of unregistered) console.error(`  \u2717 ${file}: fixture exists but is never executed`)
  for (const file of missing) console.error(`  \u2717 ${file}: declared in manifest but missing on disk`)
  console.error('\n  manifest 와 fixture 집합이 일치해야 한다.')
  process.exit(1)
}
console.log(`  manifest=${cases.length} fixtures, set matched`)

const workspaceParent = resolve(repositoryRoot, '.ai-work/gates')
mkdirSync(workspaceParent, { recursive: true })
const workspaceRoot = mkdtempSync(resolve(workspaceParent, 'run-'))
const workspaceConfig = resolve(workspaceRoot, 'tsconfig.json')
let workspaceRemoved = false

function removeWorkspace() {
  if (workspaceRemoved) return
  rmSync(workspaceRoot, { recursive: true, force: true })
  workspaceRemoved = true
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    removeWorkspace()
    process.kill(process.pid, signal)
  })
}

console.log(`  workspace=${relative(repositoryRoot, workspaceRoot)}/`)

try {
  writeFileSync(
    workspaceConfig,
    JSON.stringify({
      extends: resolve(repositoryRoot, 'tsconfig.base.json'),
      compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] } },
      include: ['src'],
    }),
  )
  mkdirSync(resolve(workspaceRoot, 'src/features/gate-b/api'), { recursive: true })
  writeFileSync(resolve(workspaceRoot, 'src/features/gate-b/api/keys.ts'), 'export const gateKey = "gate"\n')
  mkdirSync(resolve(workspaceRoot, 'src/api'), { recursive: true })
  cpSync(resolve(repositoryRoot, 'src/api/error.ts'), resolve(workspaceRoot, 'src/api/error.ts'))

  for (const { fixture, target } of cases) {
    const destination = resolve(workspaceRoot, target)
    mkdirSync(dirname(destination), { recursive: true })
    cpSync(resolve(fixtureRoot, fixture), destination)
  }

  let failed = false
  for (const { fixture, target, expectedRule } of cases) {
    const result = spawnSync(
      process.execPath,
      [
        resolve(repositoryRoot, 'node_modules/eslint/bin/eslint.js'),
        '--no-ignore',
        '--format',
        'json',
        '--config',
        resolve(repositoryRoot, 'eslint.config.js'),
        target,
      ],
      {
        cwd: workspaceRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          ESLINT_PROJECT_ROOT: workspaceRoot,
          ESLINT_PROJECT_TSCONFIG: workspaceConfig,
        },
      },
    )
    const reports = result.stdout === '' ? [] : JSON.parse(result.stdout)
    const ruleIds = reports.flatMap((report) =>
      report.messages.map((message) => message.ruleId).filter((ruleId) => ruleId !== null),
    )

    if (expectedRule === null) {
      if (result.status !== 0) {
        failed = true
        console.error(`  ✗ ${fixture}: expected-pass, exit ${result.status}, rules=${ruleIds.join(',')}`)
      } else {
        console.log(`  ✓ ${fixture}: expected-pass (exit 0)`)
      }
    } else if (result.status === 0 || !ruleIds.includes(expectedRule)) {
      failed = true
      console.error(`  ✗ ${fixture}: expected-failure ${expectedRule}, exit ${result.status}, rules=${ruleIds.join(',')}`)
    } else {
      console.log(`  ✓ ${fixture}: expected-failure ${expectedRule} (exit ${result.status})`)
    }
  }

  if (failed) process.exitCode = 1
} finally {
  removeWorkspace()
}
