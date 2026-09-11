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

/**
 * `JSON.parse` keeps only the last of two identical keys, so a duplicated block passes parity while one
 * of its copies is dead text (ko/shared.json `bulkAction`, 2026-09-10). Walk the raw text and report a key
 * that repeats inside the same object. Strings are skipped verbatim so a quoted `{` or `"key":` inside a
 * value cannot confuse the walk. Known limits: objects inside arrays report the parent path without an
 * index, and a key written as `\uXXXX` is not unified with its literal spelling.
 */
function duplicateKeys(text) {
  const duplicates = []
  const stack = []
  let index = 0
  const readString = () => {
    let value = ''
    index += 1
    while (index < text.length && text[index] !== '"') {
      if (text[index] === '\\') { value += text[index] + text[index + 1]; index += 2; continue }
      value += text[index]
      index += 1
    }
    index += 1
    return value
  }
  while (index < text.length) {
    const char = text[index]
    if (char === '"') {
      const value = readString()
      const rest = text.slice(index).match(/^\s*:/)
      const frame = stack.at(-1)
      if (rest && frame?.kind === 'object') {
        const path = [...frame.path, value].join('.')
        if (frame.keys.has(value)) duplicates.push(path)
        frame.keys.add(value)
        frame.pending = value
      }
      continue
    }
    if (char === '{' || char === '[') {
      const parent = stack.at(-1)
      const path = parent?.pending !== undefined ? [...parent.path, parent.pending] : parent?.path ?? []
      stack.push({ kind: char === '{' ? 'object' : 'array', keys: new Set(), path, pending: undefined })
    } else if (char === '}' || char === ']') {
      stack.pop()
    }
    index += 1
  }
  return [...new Set(duplicates)]
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
      const text = readFileSync(path, 'utf8')
      const repeated = duplicateKeys(text)
      if (repeated.length > 0) {
        failed = true
        console.error(`  ✗ ${locale}/${namespace}: duplicate keys ${repeated.join(', ')} (only the last copy is used)`)
      }
      return [locale, new Set(flattenKeys(JSON.parse(text)))]
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
