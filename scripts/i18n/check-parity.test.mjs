import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'

const temporaryRoots = []

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function createLocaleRoot(resources) {
  const root = mkdtempSync(join(tmpdir(), 'i18n-parity-'))
  temporaryRoots.push(root)
  for (const [locale, namespaces] of Object.entries(resources)) {
    for (const [namespace, value] of Object.entries(namespaces)) {
      const directory = resolve(root, locale)
      mkdirSync(directory, { recursive: true })
      writeFileSync(resolve(directory, `${namespace}.json`), JSON.stringify(value))
    }
  }
  return root
}

function runCheck(root) {
  return spawnSync(process.execPath, [resolve('scripts/i18n/check-parity.mjs'), '--root', root], {
    encoding: 'utf8',
  })
}

describe('i18n parity CLI', () => {
  it('passes when every locale declares the same namespaces and keys', () => {
    const root = createLocaleRoot({
      ko: { common: { title: '제목', status: { active: '활성' } } },
      en: { common: { title: 'Title', status: { active: 'Active' } } },
      ja: { common: { title: 'タイトル', status: { active: '有効' } } },
    })

    const result = runCheck(root)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('i18n key parity 통과')
  })

  it('fails on missing and extra keys inside a shared namespace', () => {
    const root = createLocaleRoot({
      ko: { common: { title: '제목', nested: { label: '이름' } } },
      en: { common: { title: 'Title', extra: 'Extra' } },
      ja: { common: { title: 'タイトル', nested: { label: 'ラベル' } } },
    })

    const result = runCheck(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('en/common: missing=nested.label extra=extra')
  })

  it('fails when a namespace exists outside the canonical locale', () => {
    const root = createLocaleRoot({
      ko: { common: { title: '제목' } },
      en: { common: { title: 'Title' }, extra: { title: 'Extra' } },
      ja: { common: { title: 'タイトル' } },
    })

    const result = runCheck(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('ko/extra: namespace missing')
    expect(result.stderr).toContain('ja/extra: namespace missing')
  })
})
