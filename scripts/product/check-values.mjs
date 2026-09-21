#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function declaredVerifierPaths(entries) {
  const { paths, errors } = declaredVerifierResult(entries)
  if (errors.length > 0) throw new Error(errors.join('\n'))
  return paths
}

function verifierPathsFromChecks(text) {
  if (!text.startsWith('---\n')) return { paths: [] }
  const end = text.indexOf('\n---\n', 4)
  if (end === -1) return { paths: [] }

  const paths = []
  let inChecks = false
  let itemIndent = null
  for (const line of text.slice(4, end).split('\n')) {
    if (!inChecks) {
      const checks = /^checks:\s*(.*)$/.exec(line)
      if (checks) {
        if (checks[1] !== '' && !checks[1].startsWith('#')) {
          return { paths, error: 'checks 선언 형식을 해석할 수 없다' }
        }
        inChecks = true
      }
      continue
    }
    if (/^\s*(?:#.*)?$/.test(line)) continue
    if (/^\S/.test(line)) break

    const item = /^(\s*)-\s+([A-Za-z][A-Za-z0-9_-]*):\s*(.*?)\s*$/.exec(line)
    if (item) {
      if (itemIndent !== null && item[1].length !== itemIndent) {
        return { paths, error: 'checks 항목 들여쓰기가 일치하지 않는다' }
      }
      itemIndent = item[1].length
      if (item[2] === 'verify') paths.push(item[3])
      continue
    }

    const property = /^(\s+)([A-Za-z][A-Za-z0-9_-]*):\s*(.*?)\s*$/.exec(line)
    if (property) {
      if (itemIndent === null) return { paths, error: 'checks 항목은 목록이어야 한다' }
      if (property[2] === 'verify') {
        if (property[1].length !== itemIndent + 2) {
          return { paths, error: 'verify field 들여쓰기를 해석할 수 없다' }
        }
        paths.push(property[3])
      }
    }
  }
  if (!inChecks) return { paths }
  if (itemIndent === null) return { paths, error: 'checks 항목은 목록이어야 한다' }
  if (paths.length === 0) return { paths, error: 'checks 에 verify 선언이 없다' }
  return { paths }
}

function declaredVerifierResult(entries) {
  const paths = []
  const errors = []
  for (const { file, text } of entries) {
    const parsed = verifierPathsFromChecks(text)
    if (parsed.error) {
      errors.push(`${file}: checks 선언을 해석할 수 없다 → ${parsed.error}`)
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
