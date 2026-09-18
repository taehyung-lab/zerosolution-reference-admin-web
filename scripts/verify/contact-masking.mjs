#!/usr/bin/env node
/**
 * `CONTACT-MASKING` fact 가 말하는 것을 코드에서 확인한다.
 *
 * **이 검사는 정책을 만들지 않는다.** 정책은 fact 가 소유하고, 여기는 그 문장이 지켜지는지만 본다.
 * fact 가 없으면 이 파일도 의미가 없다 — 그래서 fact 의 `checks` 가 이 경로를 가리킬 때만 돈다.
 *
 * 보는 것은 존재가 아니라 결과다: 연락처 필드를 **셀 값으로 내보내는 자리**가 마스킹을 지나는가.
 * 폼의 입력 필드는 대상이 아니다 — 사용자가 그 값을 고치는 자리라고 fact 가 적었다.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const MASK = /maskPhone|maskEmail/
/** 행의 연락처를 **읽어서 화면에 내보내는** 표현. 대입·타입 선언은 해당하지 않는다. */
const READS_CONTACT = /\brow\.(phone|email)\b|\brecord\.(phone|email)\b|\b(manager|member|detail)\.(phone|email)\b/

function walk(dir) {
  return readdirSync(resolve(dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walk(path)
    return /\.tsx?$/.test(path) ? [path] : []
  })
}

/**
 * @param files `{ file, content }` 목록. 기본값은 feature 화면 전체.
 * @returns 연락처를 마스킹 없이 내보내는 파일의 실패 목록
 */
export function contactMaskingFailures(files = defaultFiles()) {
  const failures = []
  for (const { file, content } of files) {
    // 폼은 값을 고치는 자리다. fact 의 정책이 명시적으로 제외한다.
    if (/screens\/[^/]*form\//.test(file)) continue
    const lines = content.split('\n')
    lines.forEach((line, index) => {
      if (!READS_CONTACT.test(line)) return
      if (MASK.test(line)) return
      // 같은 표현식이 여러 줄에 걸칠 수 있다. 앞뒤 한 줄까지 마스킹을 본다.
      const near = [lines[index - 1] ?? '', line, lines[index + 1] ?? ''].join('\n')
      if (MASK.test(near)) return
      failures.push(`${file}:${index + 1}: 연락처를 마스킹 없이 내보낸다 — CONTACT-MASKING`)
    })
  }
  return failures.sort()
}

function defaultFiles() {
  const root = 'src/features'
  return walk(root)
    .filter((file) => /\/(ui|screens)\//.test(file) && !/\.test\.tsx?$/.test(file))
    .map((file) => ({ file, content: readFileSync(resolve(file), 'utf8') }))
}

if (process.argv[1]?.endsWith('contact-masking.mjs')) {
  const failures = contactMaskingFailures()
  for (const message of failures) console.error(`  ✗ ${message}`)
  if (failures.length === 0) console.log('  ✓ 연락처를 내보내는 자리가 모두 마스킹을 지난다')
  process.exit(failures.length === 0 ? 0 : 1)
}
