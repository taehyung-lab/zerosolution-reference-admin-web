#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function declaredVerifierPaths(entries) {
  return entries.flatMap(({ file, text }) => (
    [...text.matchAll(/^\s+verify:\s*([^\n]*?)\s*$/gm)].map(([, path]) => ({ file, path }))
  ))
}

export function resolveVerifierPaths(entries, root = process.cwd()) {
  const errors = []
  const verifyRoot = resolve(root, 'scripts/verify')
  const canonicalRoot = existsSync(verifyRoot) ? realpathSync(verifyRoot) : verifyRoot
  const paths = []

  for (const { file, path } of declaredVerifierPaths(entries)) {
    if (!/^scripts\/verify\/[A-Za-z0-9._/-]+\.mjs$/.test(path) || path.split('/').includes('..')) {
      errors.push(`${file}: 허용되지 않은 verify 경로 → ${path}`)
      continue
    }

    const absolute = resolve(root, path)
    if (!existsSync(absolute)) {
      errors.push(`${file}: verify 파일이 없다 → ${path}`)
      continue
    }

    const canonical = realpathSync(absolute)
    const escaped = relative(canonicalRoot, canonical)
    if (escaped.startsWith('..') || isAbsolute(escaped) || !statSync(canonical).isFile()) {
      errors.push(`${file}: verify가 scripts/verify 밖으로 나간다 → ${path}`)
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
