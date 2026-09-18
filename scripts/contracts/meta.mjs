/**
 * 검사가 자기를 검사한다.
 *
 * 이 저장소는 존재만 보는 게이트를 세 번 만들었고 세 번 다 통과하면서 아무것도 못 잡았다. 원인은
 * 같다 — 검사를 등록할 때 **그 검사가 실제로 발화하는지**를 아무도 확인하지 않았다. 그래서 규칙을
 * 하나 둔다: `*Failures` 를 내보내면 **일부러 어긴 입력에서 실패를 내는 테스트**가 있어야 한다.
 *
 * 여기서 보는 것은 "테스트 파일이 있는가"가 아니라 **"그 함수를 부른 자리에서 실패 문자열을
 * 단언하는가"** 다. 파일 존재만 보면 이 검사 자신이 존재 게이트가 된다.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** `*Failures` 를 내보내는 검사 모듈과 그 테스트가 사는 곳. */
const CHECK_ROOT = 'scripts'

function walk(dir) {
  return readdirSync(resolve(dir)).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(resolve(path)).isDirectory()) return walk(path)
    return path.endsWith('.mjs') ? [path] : []
  })
}

/**
 * 대조군으로 인정하는 단언은 **빈 배열이 아닌 결과를 기대하는 것**이다.
 * `toEqual([])` 는 "정상 입력이 통과한다"는 뜻이라 대조군이 아니다 — 검사가 죽어 있어도 통과한다.
 */
const ASSERTS_FAILURE = [
  /toEqual\(\s*\[(?!\s*\])/,          // toEqual([ ...무언가 )
  /toEqual\(expect\.arrayContaining/,
  /toContain\(/,
  /toHaveLength\(\s*[1-9]/,
  /not\.toEqual\(\s*\[\s*\]/,
]

/**
 * @param files `{ file, content }` 목록. 기본값은 `scripts/**.mjs` 전체.
 * @returns 대조군이 없는 검사 함수 이름의 실패 목록
 */
export function checkNegativeControlFailures(files = walk(CHECK_ROOT).map((file) => ({
  file,
  content: readFileSync(resolve(file), 'utf8'),
}))) {
  const sources = files.filter(({ file }) => !file.endsWith('.test.mjs'))
  const tests = files.filter(({ file }) => file.endsWith('.test.mjs'))

  const exported = new Map()
  for (const { file, content } of sources) {
    for (const [, name] of content.matchAll(/export function ([a-zA-Z]+Failures)\s*\(/g)) {
      exported.set(name, file)
    }
  }

  const failures = []
  for (const [name, source] of exported) {
    const covered = tests.some(({ content }) => {
      if (!content.includes(`${name}(`)) return false
      // 테스트가 헬퍼를 거쳐 부르는 것은 정상이다(`const run = (x) => fooFailures(...)`).
      // 그 헬퍼 이름까지 호출로 인정하지 않으면, 잘 만든 대조군을 없다고 판정한다.
      const callers = new Set([name])
      for (const [, alias] of content.matchAll(new RegExp(`const ([a-zA-Z]+)\\s*=(?:(?!\\bconst\\b)[\\s\\S]){0,200}?${name}\\(`, 'g'))) {
        callers.add(alias)
      }
      for (const block of content.split(/\n\s*it\(/)) {
        if (![...callers].some((caller) => block.includes(`${caller}(`))) continue
        if (ASSERTS_FAILURE.some((pattern) => pattern.test(block))) return true
      }
      return false
    })
    if (!covered) {
      failures.push(`${source}: ${name} 에 대조군이 없다 — 일부러 어긴 입력에서 실패를 내는 테스트가 있어야 등록된다`)
    }
  }
  return failures.sort()
}
