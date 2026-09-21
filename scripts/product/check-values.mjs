#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDocument } from 'yaml'

export function declaredVerifierPaths(entries) {
  const { paths, errors } = declaredVerifierResult(entries)
  if (errors.length > 0) throw new Error(errors.join('\n'))
  return paths
}

function verifierPathsFromChecks(text) {
  if (!text.startsWith('---\n')) return { paths: [] }
  const end = text.indexOf('\n---\n', 4)
  if (end === -1) return { paths: [], error: 'frontmatter YAML을 해석할 수 없다' }

  const document = parseDocument(text.slice(4, end), { prettyErrors: false, uniqueKeys: true })
  if (document.errors.length > 0) return { paths: [], error: 'frontmatter YAML을 해석할 수 없다' }

  const frontmatter = document.toJS()
  if (!isMapping(frontmatter) || !Object.hasOwn(frontmatter, 'checks')) return { paths: [] }
  if (!Array.isArray(frontmatter.checks) || frontmatter.checks.length === 0) {
    return { paths: [], error: 'checks 는 비어있지 않은 배열이어야 한다' }
  }

  const paths = []
  for (const [index, check] of frontmatter.checks.entries()) {
    if (!isMapping(check)) return { paths: [], error: `checks[${index}] 은 mapping 이어야 한다` }
    if (!Object.hasOwn(check, 'verify')) continue
    if (typeof check.verify !== 'string' || check.verify.trim() === '') {
      return { paths: [], error: `checks[${index}].verify 는 비어있지 않은 문자열이어야 한다` }
    }
    paths.push(check.verify)
  }
  return { paths }
}

function isMapping(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function declaredVerifierResult(entries) {
  const paths = []
  const errors = []
  for (const { file, text } of entries) {
    const parsed = verifierPathsFromChecks(text)
    if (parsed.error) {
      errors.push(`${file}: ${parsed.error}`)
      continue
    }
    paths.push(...parsed.paths.map((path) => ({ file, path })))
  }
  return { paths, errors: [...new Set(errors)].sort() }
}

export function resolveVerifierPaths(entries, root = process.cwd()) {
  const declared = declaredVerifierResult(entries)
  const errors = [...declared.errors]
  const canonicalRepoRoot = realpathSync(root)
  const verifyRoot = resolve(root, 'scripts/verify')
  const canonicalRoot = existsSync(verifyRoot) ? realpathSync(verifyRoot) : verifyRoot
  const verifyRootEscapesRepo = existsSync(verifyRoot) && (
    relative(canonicalRepoRoot, canonicalRoot).startsWith('..')
    || isAbsolute(relative(canonicalRepoRoot, canonicalRoot))
    || !statSync(canonicalRoot).isDirectory()
  )
  const paths = []

  for (const { file, path } of declared.paths) {
    if (!/^scripts\/verify\/[A-Za-z0-9._/-]+\.mjs$/.test(path) || path.split('/').includes('..')) {
      errors.push(`${file}: 허용되지 않은 verify 경로 → ${path}`)
      continue
    }
    if (verifyRootEscapesRepo) {
      errors.push(`${file}: scripts/verify 가 repository 밖으로 나간다 → ${path}`)
      continue
    }

    const absolute = resolve(root, path)
    if (!existsSync(absolute)) {
      errors.push(`${file}: verify 파일이 없다 → ${path}`)
      continue
    }

    const canonical = realpathSync(absolute)
    const escaped = relative(canonicalRoot, canonical)
    if (escaped.startsWith('..') || isAbsolute(escaped) || !statSync(canonical).isFile() || !canonical.endsWith('.mjs')) {
      errors.push(`${file}: verify가 scripts/verify 안의 .mjs 정본 파일이 아니다 → ${path}`)
      continue
    }

    paths.push(canonical)
  }

  return { paths: [...new Set(paths)], errors: [...new Set(errors)].sort() }
}

export function runVerifierPaths(paths, { root = process.cwd(), spawn = spawnSync } = {}) {
  const errors = []
  for (const absolute of paths) {
    const result = spawn(process.execPath, [absolute], { cwd: root, stdio: 'inherit', shell: false })
    const shown = relative(root, absolute)
    if (result.error) errors.push(`${shown}: verifier 실행 실패 → ${result.error.message}`)
    else if (result.status !== 0) errors.push(`${shown}: verifier exit ${result.status}`)
  }
  return errors
}

export function checkFactValues(root = process.cwd()) {
  const factsDir = resolve(root, 'product/facts')
  const entries = readdirSync(factsDir)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => ({ file, text: readFileSync(join(factsDir, file), 'utf8') }))
  const resolved = resolveVerifierPaths(entries, root)
  return [...resolved.errors, ...runVerifierPaths(resolved.paths, { root })]
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkFactValues()
  for (const error of errors) console.error(`  ✗ ${error}`)
  process.exit(errors.length === 0 ? 0 : 1)
}
