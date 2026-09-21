#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const declaredChecks = (entries, root) => {
  const byPath = new Map()
  const declarationFailures = []

  for (const { file, text } of entries) {
    for (const [, checker] of text.matchAll(/^\s+verify:\s*(\S+)\s*$/gm)) {
      const resolved = resolve(root, checker)
      const outside = relative(root, resolved).startsWith('..') || isAbsolute(relative(root, resolved))
      if (isAbsolute(checker) || outside) {
        declarationFailures.push({ fact: file, checker, reason: '저장소 상대 경로가 아니다' })
        continue
      }
      const facts = byPath.get(checker) ?? new Set()
      facts.add(file)
      byPath.set(checker, facts)
    }
  }

  const checkers = [...byPath.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, facts]) => ({ path, facts: [...facts].sort() }))

  return { checkers, declarationFailures }
}

const defaultReadFacts = (root) => {
  const factsDir = join(root, 'product/facts')
  return readdirSync(factsDir)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => ({ file, text: readFileSync(join(factsDir, file), 'utf8') }))
}

const defaultRunChecker = (checker, root) => {
  const result = spawnSync(process.execPath, [resolve(root, checker.path)], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return result.status ?? 1
}

export function runFactChecks({
  root = process.cwd(),
  readFacts = () => defaultReadFacts(root),
  runChecker = (checker) => defaultRunChecker(checker, root),
} = {}) {
  const { checkers, declarationFailures } = declaredChecks(readFacts(), root)
  const executionFailures = []

  for (const checker of checkers) {
    const exitCode = runChecker(checker)
    if (exitCode !== 0) executionFailures.push({ facts: checker.facts, checker: checker.path, exitCode })
  }

  return {
    ok: declarationFailures.length === 0 && executionFailures.length === 0,
    checkers,
    declarationFailures,
    executionFailures,
  }
}

if (process.argv[1]?.endsWith('run-checks.mjs')) {
  const result = runFactChecks()
  for (const failure of result.declarationFailures) {
    console.error(`  ✗ ${failure.fact}: ${failure.checker} — ${failure.reason}`)
  }
  for (const failure of result.executionFailures) {
    console.error(`  ✗ ${failure.facts.join(', ')}: ${failure.checker} — exit ${failure.exitCode}`)
  }
  if (result.ok) {
    for (const checker of result.checkers) console.log(`  ✓ ${checker.path} (${checker.facts.join(', ')})`)
    console.log(`  ✓ fact 선언 검사 ${result.checkers.length}개 통과`)
  }
  process.exit(result.ok ? 0 : 1)
}
