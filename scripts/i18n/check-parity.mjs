#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const locales = ['ko', 'en', 'ja']
const rootArgumentIndex = process.argv.indexOf('--root')
const resourceRoot = resolve(
  rootArgumentIndex === -1
    ? 'src/shared/i18n/locales'
    : (process.argv[rootArgumentIndex + 1] ?? ''),
)
const namespacesByLocale = new Map(
  locales.map((locale) => [
    locale,
    new Set(
      readdirSync(resolve(resourceRoot, locale))
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace(/\.json$/, '')),
    ),
  ]),
)
const namespaces = new Set(
  locales.flatMap((locale) => [...(namespacesByLocale.get(locale) ?? [])]),
)

function flattenKeys(value, prefix = '') {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix === '' ? key : `${prefix}.${key}`),
  )
}

let failed = false

for (const namespace of namespaces) {
  const missingLocales = locales.filter(
    (locale) => !namespacesByLocale.get(locale)?.has(namespace),
  )
  if (missingLocales.length > 0) {
    failed = true
    for (const locale of missingLocales) console.error(`  ✗ ${locale}/${namespace}: namespace missing`)
    continue
  }
  const byLocale = new Map(
    locales.map((locale) => {
      const path = resolve(resourceRoot, locale, `${namespace}.json`)
      const resource = JSON.parse(readFileSync(path, 'utf8'))
      return [locale, new Set(flattenKeys(resource))]
    }),
  )
  const canonical = byLocale.get('ko')
  if (canonical === undefined) throw new Error('ko canonical resource is missing')

  for (const locale of locales) {
    const keys = byLocale.get(locale)
    if (keys === undefined) throw new Error(`${locale} resource is missing`)
    const missing = [...canonical].filter((key) => !keys.has(key))
    const extra = [...keys].filter((key) => !canonical.has(key))
    if (missing.length > 0 || extra.length > 0) {
      failed = true
      console.error(`  ✗ ${locale}/${namespace}: missing=${missing.join(', ') || '-'} extra=${extra.join(', ') || '-'}`)
    } else {
      console.log(`  ✓ ${locale}/${namespace}: ${keys.size} keys`)
    }
  }
}

if (failed) process.exit(1)
console.log('\n  ✓ i18n key parity 통과')
