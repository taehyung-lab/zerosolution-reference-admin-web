import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CASES, diffFixtureSets, listFixtureFiles } from './gates/fixture-manifest.mjs'

function sourceFiles() {
  return readdirSync(resolve('src'), { recursive: true })
    .filter((entry) => typeof entry === 'string')
    .sort()
}

describe('negative gate manifest', () => {
  it('executes every fixture that exists on disk', () => {
    const declared = CASES.map(({ fixture }) => fixture)

    expect(diffFixtureSets(declared, listFixtureFiles())).toEqual({ unregistered: [], missing: [] })
  })

  it('reports a fixture that exists but is never executed', () => {
    const declared = CASES.map(({ fixture }) => fixture).filter(
      (fixture) => fixture !== 'imports/valid.ts',
    )

    expect(diffFixtureSets(declared, listFixtureFiles()).unregistered).toEqual(['imports/valid.ts'])
  })

  it('reports a fixture that is declared but absent', () => {
    const declared = [...CASES.map(({ fixture }) => fixture), 'imports/never-created.ts']

    expect(diffFixtureSets(declared, listFixtureFiles()).missing).toEqual(['imports/never-created.ts'])
  })
})

describe('negative gate workspace', () => {
  it('runs fixtures outside the application source tree', () => {
    const before = sourceFiles()

    const result = spawnSync(process.execPath, [resolve('scripts/verify-negative-controls.mjs')], {
      encoding: 'utf8',
    })

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('workspace=.ai-work/gates/')
    for (const { fixture } of CASES) expect(result.stdout).toContain(`✓ ${fixture}:`)
    const workspace = /workspace=(\.ai-work\/gates\/run-[^/]+)\//.exec(result.stdout)?.[1]
    expect(workspace).toBeDefined()
    expect(existsSync(resolve(workspace))).toBe(false)
    expect(sourceFiles()).toEqual(before)
  }, 120_000)

  it('removes its exact workspace when interrupted', async () => {
    const startedAt = Date.now()
    const child = spawn(process.execPath, [resolve('scripts/verify-negative-controls.mjs')], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const workspace = await new Promise((resolveWorkspace, reject) => {
      child.once('error', reject)
      child.stdout.setEncoding('utf8')
      child.stdout.on('data', (chunk) => {
        const match = /workspace=(\.ai-work\/gates\/run-[^/]+)\//.exec(chunk)
        if (match?.[1] !== undefined) resolveWorkspace(resolve(match[1]))
      })
    })

    child.kill('SIGTERM')
    await new Promise((resolveExit) => child.once('exit', resolveExit))

    expect(existsSync(workspace)).toBe(false)
    expect(Date.now() - startedAt).toBeLessThan(5_000)
  }, 120_000)
})
