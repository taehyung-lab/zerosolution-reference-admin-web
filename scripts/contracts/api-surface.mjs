/**
 * 코드와 선언된 서버 계약 사이의 기계적 정합성만 검사한다.
 *
 * 두 검사 모두 타입·테스트가 통과하는데 런타임에만 죽는 실패를 겨냥한다.
 * 실제로 그 실패가 났기 때문에 넣었다. 설계의 옳고 그름은 리뷰가 소유한다.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const SOURCE_PATTERN = /\.tsx?$/
const TEST_PATTERN = /\.(test|test-d)\.tsx?$/

export function listSourceFiles(root, read = readdirSync) {
  if (!existsSync(resolve(root))) return []
  return read(resolve(root), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && SOURCE_PATTERN.test(entry.name) && !TEST_PATTERN.test(entry.name))
    .map((entry) => resolve(entry.parentPath, entry.name).slice(resolve('.').length + 1))
    .sort()
}

/**
 * transport 는 app 을 역-import 하지 않으려고 `register*` 포트를 노출하고, app 경계가 그것을 채운다.
 * 채우는 쪽을 빠뜨리면 컴파일도 되고 테스트도 통과하지만 그 이음매는 런타임에 죽어 있다.
 * 포트를 선언한 레이어 자신이 채우는 것은 이음매를 없애는 것이므로 호출자에서 제외한다.
 *
 * 이건 tripwire 지 증명이 아니다. 텍스트로 호출 형태만 찾으므로 주석이나 도달 불가능한 함수도 통과하고,
 * alias·namespace 호출은 놓치며, import graph 를 따라가 모듈이 실제로 평가되는지는 확인하지 않는다.
 * 잡으려는 것은 "아무도 안 꽂은 이음매" 하나이고 그 실패가 실제로 났다.
 */
export function findUnregisteredPorts(
  portRoot = 'src/api',
  consumerRoot = 'src',
  read = (file) => readFileSync(resolve(file), 'utf8'),
  list = listSourceFiles,
) {
  const ports = new Map()
  for (const file of list(portRoot)) {
    for (const [, name] of read(file).matchAll(/export function (register[A-Za-z0-9]+)\s*\(/g)) {
      ports.set(name, file)
    }
  }
  const callers = list(consumerRoot).filter((file) => !file.startsWith(`${portRoot}/`))
  const registered = new Set()
  for (const file of callers) {
    const source = read(file)
    for (const name of ports.keys()) {
      if (new RegExp(`\\b${name}\\s*\\(`).test(source)) registered.add(name)
    }
  }
  return [...ports.entries()]
    .filter(([name]) => !registered.has(name))
    .map(([name, file]) => `${file}: 포트 \`${name}\` 를 프로덕션 코드가 등록하지 않는다 (테스트만 등록하면 런타임에 비어 있다)`)
    .sort()
}

/** 선언된 계약의 경로 집합. 스냅샷이 없으면 이 검사는 성립하지 않는다. */
export function readDeclaredPaths(snapshot = 'openapi/admin.snapshot.json') {
  if (!existsSync(resolve(snapshot))) return null
  const document = JSON.parse(readFileSync(resolve(snapshot), 'utf8'))
  return Object.keys(document.paths ?? {})
}

/**
 * transport 가 손으로 쓰는 경로 문자열을 두 종류로 나눠 검사한다.
 *
 * `*_PATH` 는 실제 요청에 쓰는 값이라 선언된 경로와 **정확히** 같아야 한다.
 * `*_PATHS` 는 인증 제외 판정처럼 부분 일치로 쓰는 목록이라 선언된 경로의 **부분 문자열**이면 된다.
 * 이 구분이 없으면 `/auth/reissue` 같은 값이 `/api/v1/auth/reissue` 의 부분 문자열이라는 이유로
 * 통과하면서 실제 요청은 404 가 된다. 실제로 그렇게 났다.
 *
 * 사정거리는 이 이름 규약까지다. inline literal·double quote·template string·조립한 변수·object property 는
 * 보지 못하고, 그 상수가 실제로 요청에 쓰이는지도 확인하지 않는다. 부분 일치 목록은 더 긴 경로나
 * query 를 pre-auth 로 오인할 수 있으므로 목록 자체를 좁게 유지하는 책임은 호출부에 남는다.
 */
export function findContractPathMismatches(
  declaredPaths,
  root = 'src/api',
  read = (file) => readFileSync(resolve(file), 'utf8'),
  list = listSourceFiles,
) {
  if (declaredPaths === null) return []
  const declared = new Set(declaredPaths)
  const failures = []
  for (const file of list(root)) {
    const source = read(file)
    for (const [, name, value] of source.matchAll(/const\s+([A-Z][A-Z0-9_]*_PATH)\s*=\s*'([^']+)'/g)) {
      if (!declared.has(value)) {
        failures.push(`${file}: \`${name}\` 의 '${value}' 는 선언된 계약 경로가 아니다 (요청 경로는 정확히 일치해야 한다)`)
      }
    }
    for (const [, name, body] of source.matchAll(/const\s+([A-Z][A-Z0-9_]*_PATHS)\s*=\s*\[([^\]]*)\]/g)) {
      for (const [, value] of body.matchAll(/'([^']+)'/g)) {
        if (![...declared].some((path) => path.includes(value))) {
          failures.push(`${file}: \`${name}\` 의 '${value}' 가 어떤 선언된 계약 경로에도 나타나지 않는다`)
        }
      }
    }
  }
  return failures.sort()
}
