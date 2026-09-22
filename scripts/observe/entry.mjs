#!/usr/bin/env node
/** 소유한 Vite 서버만 관측 주소로 제공한다. 다른 포트의 HTTP 응답은 이 작업의 증거가 아니다. */
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL, URL } from 'node:url'
import { parseArgs } from 'node:util'

const projectRoot = () => fileURLToPath(new URL('../../', import.meta.url))

/** port 0은 OS가 빈 포트를 배정한다. 명시한 포트는 충돌 시 변경·재사용하지 않는다. */
export async function startObservation({ root = projectRoot(), port = 0 } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('port는 0~65535 정수여야 한다')
  }
  const { createServer } = await import('vite')
  const server = await createServer({
    root: realpathSync(root),
    server: { host: '127.0.0.1', port, strictPort: true, open: false },
  })
  try {
    await server.listen()
    const url = server.resolvedUrls?.local[0]
    if (!url) throw new Error('관측 서버의 주소를 확인할 수 없다')
    return { root: server.config.root, url, close: () => server.close() }
  } catch (error) {
    await server.close()
    throw error
  }
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

async function main() {
  const args = process.argv.slice(2)
  if (args[0] === '--') args.shift()
  const { values } = parseArgs({ args, options: { port: { type: 'string' } } })
  const { ceiling, reasons } = observationCeiling(projectRoot())
  const session = await startObservation({
    port: values.port === undefined ? 0 : Number(values.port),
  })
  let closing
  const stop = () => {
    closing ??= session.close().catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
    return closing
  }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
  console.log(`\n  관측 워크트리: ${session.root}`)
  console.log(`  관측 주소: ${session.url}`)
  console.log('  이 터미널을 유지하고 aside-browser로 위 주소를 연다. 종료는 Ctrl+C로 이 서버만 닫는다.')

  console.log(`\n  코드 기준 실측 상한: **${ceiling}** (실 인증·API 수용의 증거는 별도)`)
  for (const reason of reasons) console.log(`    · ${reason}`)
  if (ceiling === '경계까지 확인됨') {
    console.log('    → 볼 수 있는 것은 렌더·상호작용·내부 전이·URL 까지다. 서버가 그 입력을 받아들이는지는')
    console.log('      여기서 관찰되지 않는다. 보고에 인증 경계를 통과하지 않았고 어떤 응답이 fixture 였는지 적는다.')
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(`관측 서버 시작 실패: ${error.message}`)
    process.exitCode = 1
  })
}
