#!/usr/bin/env node
/**
 * **어디로 들어가서 무엇까지 판정할 수 있는지**를 저장소에 묻는다.
 *
 * 이 값들은 문서에 손으로 적히면 즉시 낡는다. 포트는 실행할 때 정해지고(vite 는 점유된 포트를
 * 비켜 간다), 실측 상한은 실 API·실 세션이 붙었는지에 달려 있다. 둘 다 **지금 확인할 수 있는
 * 사실**이므로 문서가 아니라 여기서 답한다.
 *
 *   node scripts/observe/entry.mjs [--port <n>…]
 *
 * 이 스크립트는 브라우저를 열지 않는다. 무엇을 열어야 하고 그 결과로 무엇을 주장할 수 있는지만
 * 말한다. 실제 관찰은 저장소가 선언한 브라우저 수단으로 사람이(또는 에이전트가) 한다.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const DEFAULT_PORTS = [5173, 5174, 5175, 5176, 4173]

/** 응답한 포트만 돌려준다. 응답하지 않은 포트는 "없다"가 아니라 "이 순간 안 떠 있다"이다. */
export async function respondingPorts(ports, fetchImpl = fetch) {
  const hits = []
  for (const port of ports) {
    const url = `http://localhost:${port}/`
    try {
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(1500) })
      hits.push({ port, url, status: response.status })
    } catch {
      // 연결 거부·타임아웃. 그 포트에 서버가 없다는 뜻일 뿐이다.
    }
  }
  return hits
}

/**
 * 실측으로 무엇까지 주장할 수 있는가. **코드가 지금 어떤 상태인지**로 판정하며,
 * 문서의 선언을 읽지 않는다.
 *
 * @returns `{ ceiling, reasons }` — `ceiling` 은 도달 상태의 한 단어
 */
export function observationCeiling(
  root = process.cwd(),
  read = (file) => readFileSync(resolve(root, file), 'utf8'),
  exists = (file) => existsSync(resolve(root, file)),
  list = (dir) => readdirSync(resolve(root, dir)),
) {
  const reasons = []
  let real = true

  const envExample = exists('.env.example') ? read('.env.example') : ''
  const base = /^VITE_API_BASE_URL=("?)(.*)\1$/m.exec(envExample)
  if (base && base[2].trim() === '') {
    real = false
    reasons.push('`VITE_API_BASE_URL` 이 비어 있다 — 요청이 나갈 곳이 선언돼 있지 않다')
  }

  if (exists('src/api/scenario.ts')) {
    real = false
    reasons.push('`src/api/scenario.ts` 가 있다 — 서버 계약이 없는 쓰기는 이름 붙은 요청 함수가 성공으로 끝낸다')
  }

  const fixtures = exists('src/features')
    ? list('src/features').filter((name) => exists(join('src/features', name, 'fixtures')))
    : []
  if (fixtures.length > 0) {
    real = false
    reasons.push(`feature ${fixtures.length}개가 \`fixtures/\` 로 화면 데이터를 낸다 (${fixtures.join(' · ')})`)
  }

  return {
    ceiling: real ? '완료' : '경계까지 확인됨',
    reasons,
  }
}

if (process.argv[1]?.endsWith('entry.mjs')) {
  const args = process.argv.slice(2)
  const given = args.includes('--port')
    ? args.slice(args.indexOf('--port') + 1).filter((value) => /^\d+$/.test(value)).map(Number)
    : []
  const ports = given.length > 0 ? given : DEFAULT_PORTS
  const hits = await respondingPorts(ports)

  if (hits.length === 0) {
    console.log(`  ✗ ${ports.join(' · ')} 에서 응답이 없다. dev 서버를 먼저 띄운다 — \`pnpm dev\``)
    console.log('    (포트를 직접 아는 경우: --port <n>)')
  } else {
    console.log('  응답한 진입점:')
    for (const hit of hits) console.log(`    ${hit.url}  (HTTP ${hit.status})`)
    if (hits.length > 1) console.log('    ⚠ 둘 이상이 떠 있다. 어느 저장소의 서버인지 확인하고 들어간다.')
  }

  const { ceiling, reasons } = observationCeiling()
  console.log(`\n  이 저장소에서 브라우저 실측이 주장할 수 있는 상한: **${ceiling}**`)
  for (const reason of reasons) console.log(`    · ${reason}`)
  if (ceiling === '경계까지 확인됨') {
    console.log('    → 볼 수 있는 것은 렌더·상호작용·내부 전이·URL 까지다. 서버가 그 입력을 받아들이는지는')
    console.log('      여기서 관찰되지 않는다. 보고에 인증 경계를 통과하지 않았고 어떤 응답이 fixture 였는지 적는다.')
  }
}
