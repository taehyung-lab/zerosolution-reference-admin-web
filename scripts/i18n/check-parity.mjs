#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'

const locales = ['ko', 'en', 'ja']
const rootArgumentIndex = process.argv.indexOf('--root')

/**
 * Locale resources live next to the owner of their namespace: `shared` under `src/shared/i18n`,
 * `app` under `src/app/i18n`, each feature namespace under `src/features/<domain>/i18n`.
 * Parity is a property of the namespace set as a whole, so the default run discovers every
 * `i18n/locales` root under `src` and checks their union. `--root` keeps the single-root form
 * the CLI tests drive.
 */
function discoverRoots() {
  const found = []
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const child = resolve(directory, entry.name)
      if (entry.name === 'locales' && directory.endsWith(`${sep}i18n`)) found.push(child)
      else walk(child)
    }
  }
  walk(resolve('src'))
  return found.sort()
}

const resourceRoots =
  rootArgumentIndex === -1
    ? discoverRoots()
    : [resolve(process.argv[rootArgumentIndex + 1] ?? '')]

/** namespace -> locale -> absolute file path. A namespace owned by two roots is a conflict. */
const pathsByNamespace = new Map()
let discoveryFailed = false
for (const root of resourceRoots) {
  for (const locale of locales) {
    const localeDirectory = resolve(root, locale)
    if (!existsSync(localeDirectory)) continue
    for (const file of readdirSync(localeDirectory)) {
      if (!file.endsWith('.json')) continue
      const namespace = file.replace(/\.json$/, '')
      const byLocale = pathsByNamespace.get(namespace) ?? new Map()
      const existing = byLocale.get(locale)
      if (existing !== undefined) {
        discoveryFailed = true
        console.error(`  ✗ ${locale}/${namespace}: namespace declared twice (${existing}, ${resolve(localeDirectory, file)})`)
      }
      byLocale.set(locale, resolve(localeDirectory, file))
      pathsByNamespace.set(namespace, byLocale)
    }
  }
}

/**
 * A namespace belongs to the owner it is stored under, so a feature namespace may not reappear under
 * `src/shared`. Checking the stored resource rather than a declaration keeps the shared boundary
 * true instead of merely documented.
 */
function expectedNamespaceOf(root) {
  const segments = relative(resolve('src'), root).split(sep)
  if (segments.length === 3 && segments[1] === 'i18n' && segments[2] === 'locales') {
    return segments[0] === 'shared' || segments[0] === 'app' ? segments[0] : null
  }
  if (segments.length === 4 && segments[0] === 'features' && segments[2] === 'i18n' && segments[3] === 'locales') {
    return segments[1]
  }
  return null
}

if (rootArgumentIndex === -1) {
  for (const root of resourceRoots) {
    const expected = expectedNamespaceOf(root)
    for (const locale of locales) {
      const localeDirectory = resolve(root, locale)
      if (!existsSync(localeDirectory)) continue
      for (const file of readdirSync(localeDirectory)) {
        if (!file.endsWith('.json')) continue
        const namespace = file.replace(/\.json$/, '')
        if (namespace === expected) continue
        discoveryFailed = true
        const shown = relative(resolve('.'), resolve(localeDirectory, file))
        console.error(
          expected === null
            ? `  \u2717 ${shown}: no namespace owner for this location`
            : `  \u2717 ${shown}: namespace '${namespace}' belongs to its own owner, not '${expected}'`,
        )
      }
    }
  }
}

const namespacesByLocale = new Map(
  locales.map((locale) => [
    locale,
    new Set([...pathsByNamespace].filter(([, byLocale]) => byLocale.has(locale)).map(([namespace]) => namespace)),
  ]),
)
const namespaces = new Set(pathsByNamespace.keys())

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

let failed = discoveryFailed

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
      const path = pathsByNamespace.get(namespace)?.get(locale)
      if (path === undefined) throw new Error(`${locale}/${namespace} resource path is missing`)
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
