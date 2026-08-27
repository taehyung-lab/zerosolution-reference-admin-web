import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const SNAPSHOT = resolve('openapi/admin.snapshot.json')
export const PREPARED_DIR = resolve('.openapi-prepared')
export const PREPARED = resolve('.openapi-prepared/admin.prepared.json')

/** 리허설 스냅샷의 알려진 결함 규모. 실제 값이 다르면 스냅샷이 바뀐 것이므로 실패시킨다. */
export const EXPECTED_DEFECTS = {
  duplicateAuthorizationParameters: 256,
  uppercaseHeaderParameters: 325,
  invalidComponentKeys: 470,
  parametersMissingSchema: 1,
  invalidSecuritySchemeProps: 2,
  missingPathParameters: 2,
}

/** OpenAPI 3 component key 허용 패턴. 스펙이 정의한 값이며 우리가 고른 값이 아니다. */
export const VALID_COMPONENT_KEY = /^[a-zA-Z0-9.\-_]+$/

export function normalizeComponentKey(key) {
  return key.replace(/[^a-zA-Z0-9.\-_]/g, '_')
}

/** 객체 트리를 돌며 모든 $ref 문자열에 fn을 적용한다. */
export function rewriteRefs(node, fn) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) return node.forEach((n) => rewriteRefs(n, fn))
  for (const [k, v] of Object.entries(node)) {
    if (k === '$ref' && typeof v === 'string') node[k] = fn(v)
    else rewriteRefs(v, fn)
  }
}

/** 트리 안의 $ref 개수를 센다. */
export function countRefs(node) {
  let n = 0
  const walk = (x) => {
    if (!x || typeof x !== 'object') return
    if (Array.isArray(x)) return x.forEach(walk)
    for (const [k, v] of Object.entries(x)) {
      if (k === '$ref' && typeof v === 'string') n++
      else walk(v)
    }
  }
  walk(node)
  return n
}

export const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']

export function readSnapshot() {
  return JSON.parse(readFileSync(SNAPSHOT, 'utf8'))
}

export function* eachOperation(spec) {
  for (const [path, item] of Object.entries(spec.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const op = item?.[method]
      if (op) yield { path, method, op }
    }
  }
}

export function fail(message) {
  console.error(`\n  ✗ ${message}\n`)
  process.exit(1)
}
