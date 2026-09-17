#!/usr/bin/env node
/**
 * 문서를 옮길 때 **판단이 따라왔는지**를 대조한다.
 *
 * 이 저장소는 문서 체계를 바꾸면서 의미를 세 번 흘렸다. 세 번 다 같은 방식이었다 — 사람이 눈으로
 * 옮기고, 옮긴 뒤에 무엇이 남았는지 아무도 세지 않았다. 그대로 복사한 문서는 하나도 잃지 않았고
 * 손으로 다시 쓴 문서에서만 잃었다.
 *
 * 그래서 이사할 때마다 짐 목록을 만든다. 규칙이 아니라 도구다 — 사람 규율에 기대지 않는다.
 *
 *   node scripts/transition/port-audit.mjs --from <옛 디렉터리> --to <새 디렉터리…> [--json]
 *
 * 블록은 빈 줄로 나눈 문단이고, 비교 전에 링크 URL·강조·표 구분자를 지우고 소문자로 만든다.
 * 옮기면서 문장을 다듬는 것은 정상이므로 **완전 일치가 아니라 낱말 겹침**으로 본다.
 * 이 도구는 "없다"를 증명하지 않는다 — **어디를 확인해야 하는지** 목록을 줄 뿐이다.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** 이 비율 미만으로 겹치면 "옮겨졌는지 확인해야 할 블록"으로 본다. */
export const MATCH_THRESHOLD = 0.45
/** 이 낱말 수 미만의 블록은 제목·구분자라 비교하지 않는다. */
const MIN_WORDS = 8

/** 디렉터리면 재귀, 파일이면 그 파일 하나. 루트 문서 한 장도 대상이 될 수 있다. */
function walk(target) {
  if (!statSync(resolve(target)).isDirectory()) return target.endsWith('.md') ? [target] : []
  return readdirSync(resolve(target)).flatMap((name) => walk(join(target, name)))
}

export function normalize(text) {
  return text
    .toLowerCase()
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>|#\-–—·]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function blocksOf(text) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => normalize(block).split(' ').filter(Boolean).length >= MIN_WORDS)
}

/**
 * 2글자 낱말을 버리면 한국어 문서에서 의미의 대부분이 사라진다(`추적`·`비용`·`계층`).
 * 한 글자는 조사·어미가 섞여 신호가 되지 않으므로 2글자부터 센다.
 */
const wordsOf = (text) => new Set(normalize(text).split(' ').filter((word) => word.length >= 2))

/** 한 블록이 대상 블록 집합 어딘가와 얼마나 겹치는가(0~1). */
export function bestOverlap(block, targets) {
  const source = wordsOf(block)
  if (source.size === 0) return 1
  let best = 0
  for (const target of targets) {
    let hit = 0
    for (const word of source) if (target.has(word)) hit += 1
    best = Math.max(best, hit / source.size)
  }
  return best
}

/**
 * @returns `[{ file, total, missing, samples }]` — 대상에서 찾지 못한 블록이 있는 원본 파일만
 */
export function portAudit(fromFiles, toText, threshold = MATCH_THRESHOLD) {
  const targets = blocksOf(toText).map(wordsOf)
  const report = []
  for (const { file, content } of fromFiles) {
    const blocks = blocksOf(content)
    const missing = blocks.filter((block) => bestOverlap(block, targets) < threshold)
    if (missing.length > 0) {
      report.push({
        file,
        total: blocks.length,
        missing: missing.length,
        samples: missing.slice(0, 2).map((block) => normalize(block).slice(0, 100)),
      })
    }
  }
  return report.sort((a, b) => b.missing - a.missing || a.file.localeCompare(b.file))
}

if (process.argv[1]?.endsWith('port-audit.mjs')) {
  const args = process.argv.slice(2)
  const from = args[args.indexOf('--from') + 1]
  const to = args.slice(args.indexOf('--to') + 1).filter((value) => !value.startsWith('--'))
  if (args.indexOf('--from') === -1 || to.length === 0) {
    console.error('usage: port-audit.mjs --from <dir> --to <dir…> [--json]')
    process.exit(2)
  }
  const fromFiles = walk(from).map((file) => ({
    file: file.slice(from.length + 1),
    content: readFileSync(resolve(file), 'utf8'),
  }))
  const toText = to.flatMap((dir) => walk(dir)).map((file) => readFileSync(resolve(file), 'utf8')).join('\n\n')
  const report = portAudit(fromFiles, toText)
  if (args.includes('--json')) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    for (const row of report) {
      console.log(`\n${row.missing}/${row.total}  ${row.file}`)
      for (const sample of row.samples) console.log(`    · ${sample}…`)
    }
    const total = report.reduce((sum, row) => sum + row.missing, 0)
    console.log(`\n확인이 필요한 블록 ${total}개 (원본 ${fromFiles.length}파일 중 ${report.length}파일)`)
  }
}
