#!/usr/bin/env node
/**
 * 생성 전용 변환. 원본 스냅샷은 절대 수정하지 않는다.
 *
 * 하는 일은 정확히 세 가지뿐이다.
 *   1) parameter의 비표준 대문자 `in` 값을 소문자로 정규화한다.
 *   2) 전역/지역 security를 상속하는 operation에서만, 중복 선언된
 *      `Authorization` header parameter를 제거한다.
 *   3) OpenAPI 3 스펙이 금지하는 문자가 들어간 components.schemas 키를 정규화하고
 *      그 키를 가리키는 모든 $ref를 함께 고친다.
 *   4) schema/content가 모두 없는 parameter에, 스펙의 example이 이미 보여주는 타입만 선언한다.
 *   5) securityScheme에서 선언된 type에 유효하지 않은 속성만 제거한다.
 *   6) path template에 선언됐으나 정의가 빠진 path parameter를, 같은 path의 다른
 *      operation이 이미 정의한 값으로 채운다. 형제 정의가 없으면 실패한다.
 *
 * 그 외의 어떤 변경도 허용하지 않으며, 변경 규모가 예상과 다르면 실패한다.
 * 네트워크를 사용하지 않는다.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import {
  readSnapshot, eachOperation, EXPECTED_DEFECTS, PREPARED, PREPARED_DIR, fail,
  VALID_COMPONENT_KEY, normalizeComponentKey, rewriteRefs, countRefs,
} from './_shared.mjs'

const original = readSnapshot()
const spec = structuredClone(original)

const countParams = (s) => [...eachOperation(s)].reduce((n, { op }) => n + (op.parameters?.length ?? 0), 0)
const paramsBefore = countParams(original)
const schemaCountBefore = Object.keys(original.components?.schemas ?? {}).length
const refCountBefore = countRefs(original)

const globalSecurity = Array.isArray(spec.security) && spec.security.length > 0

// ---- (1)(2) parameter 정규화 및 Authorization 중복 제거 ----
let normalized = 0
let removed = 0
let skippedPreAuth = 0
const touched = []

for (const { path, method, op } of eachOperation(spec)) {
  if (!Array.isArray(op.parameters)) continue

  for (const p of op.parameters) {
    if (typeof p.in === 'string' && p.in !== p.in.toLowerCase()) {
      p.in = p.in.toLowerCase()
      normalized++
    }
  }

  // security: [] 는 인증 불필요(pre-auth) 선언이다. 의미가 다르므로 건드리지 않는다.
  const localSecurity = Array.isArray(op.security) ? op.security.length > 0 : undefined
  const inheritsSecurity = localSecurity === undefined ? globalSecurity : localSecurity

  const before = op.parameters.length
  op.parameters = op.parameters.filter((p) => {
    const isAuthHeader = p.name === 'Authorization' && p.in === 'header'
    if (!isAuthHeader) return true
    if (!inheritsSecurity) { skippedPreAuth++; return true }
    return false
  })
  const delta = before - op.parameters.length
  if (delta > 0) { removed += delta; touched.push(`${method.toUpperCase()} ${path}`) }
}

// ---- (3) 스펙 위반 component 키 정규화 + $ref 재작성 ----
const schemas = spec.components?.schemas ?? {}
const rename = new Map()
const takenTargets = new Map()
for (const key of Object.keys(schemas)) {
  if (VALID_COMPONENT_KEY.test(key)) continue
  const next = normalizeComponentKey(key)
  if (takenTargets.has(next)) {
    fail(`component 키 정규화 충돌: "${takenTargets.get(next)}" 와 "${key}" 가 모두 "${next}" 가 된다.`)
  }
  takenTargets.set(next, key)
  rename.set(key, next)
}
// 정규화 결과가 기존의 다른 유효 키와 겹치면 안 된다.
for (const [, next] of rename) {
  if (next in schemas) fail(`component 키 정규화가 기존 키 "${next}" 와 충돌한다.`)
}

if (rename.size > 0) {
  const renamedSchemas = {}
  for (const [key, value] of Object.entries(schemas)) {
    renamedSchemas[rename.get(key) ?? key] = value
  }
  spec.components.schemas = renamedSchemas

  const PREFIX = '#/components/schemas/'
  rewriteRefs(spec, (ref) => {
    if (!ref.startsWith(PREFIX)) return ref
    const raw = ref.slice(PREFIX.length)
    const decoded = decodeURIComponent(raw)
    const next = rename.get(decoded)
    return next ? PREFIX + next : ref
  })
}

// ---- (4) schema/content가 모두 없는 parameter 보정 ----
// 계약을 발명하지 않는다. 스펙의 example이 이미 드러내는 타입만 선언한다.
let schemaFilled = 0
for (const { op } of eachOperation(spec)) {
  for (const p of op.parameters ?? []) {
    if (p.schema || p.content || p.$ref) continue
    if (typeof p.example !== 'string') {
      fail(`schema/content가 없고 example도 문자열이 아닌 parameter는 자동 보정하지 않는다: ${p.name}`)
    }
    p.schema = { type: 'string' }
    schemaFilled++
  }
}

// ---- (5) securityScheme의 type-불일치 속성 제거 ----
// apiKey 에는 scheme / bearerFormat 이 올 수 없다(그 둘은 type: http 전용).
// 런타임 의미(Authorization 헤더)는 그대로 두고 스펙 위반 속성만 제거한다.
let securityPropsRemoved = 0
for (const scheme of Object.values(spec.components?.securitySchemes ?? {})) {
  if (scheme?.type !== 'apiKey') continue
  for (const prop of ['scheme', 'bearerFormat']) {
    if (prop in scheme) { delete scheme[prop]; securityPropsRemoved++ }
  }
}

// ---- (6) 누락된 path parameter를 형제 operation 정의로 보충 ----
// 타입을 추측하지 않는다. 같은 path의 다른 operation이 이미 선언한 정의만 복사한다.
let pathParamsFilled = 0
const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']
for (const [path, item] of Object.entries(spec.paths ?? {})) {
  const template = [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1])
  if (template.length === 0) continue

  const known = new Map()
  const pathLevel = (item.parameters ?? []).filter((p) => String(p.in).toLowerCase() === 'path')
  for (const p of pathLevel) known.set(p.name, p)
  for (const method of METHODS) {
    for (const p of item[method]?.parameters ?? []) {
      if (String(p.in).toLowerCase() === 'path') known.set(p.name, p)
    }
  }

  for (const method of METHODS) {
    const op = item[method]
    if (!op) continue
    const declared = new Set([
      ...pathLevel.map((p) => p.name),
      ...(op.parameters ?? []).filter((p) => String(p.in).toLowerCase() === 'path').map((p) => p.name),
    ])
    for (const name of template) {
      if (declared.has(name)) continue
      const sibling = known.get(name)
      if (!sibling) {
        fail(`${method.toUpperCase()} ${path}: path parameter "${name}" 정의가 없고 형제 operation에도 없다. 타입을 추측하지 않는다.`)
      }
      op.parameters = [...(op.parameters ?? []), structuredClone(sibling)]
      pathParamsFilled++
    }
  }
}

// ---- 불변식 ----
if (pathParamsFilled !== EXPECTED_DEFECTS.missingPathParameters) {
  fail(`path parameter 보충 수가 예상과 다르다 (${pathParamsFilled} != ${EXPECTED_DEFECTS.missingPathParameters}).`)
}
if (schemaFilled !== EXPECTED_DEFECTS.parametersMissingSchema) {
  fail(`schema 보정 수가 예상과 다르다 (${schemaFilled} != ${EXPECTED_DEFECTS.parametersMissingSchema}).`)
}
if (securityPropsRemoved !== EXPECTED_DEFECTS.invalidSecuritySchemeProps) {
  fail(`securityScheme 속성 제거 수가 예상과 다르다 (${securityPropsRemoved} != ${EXPECTED_DEFECTS.invalidSecuritySchemeProps}).`)
}
const paramsAfter = countParams(spec)
if (paramsBefore - paramsAfter !== removed - pathParamsFilled - 0) {
  fail(`parameter 총량 변화(${paramsBefore - paramsAfter})가 제거 ${removed} - 보충 ${pathParamsFilled} 와 다르다.`)
}
if (normalized !== EXPECTED_DEFECTS.uppercaseHeaderParameters) {
  fail(`in 정규화 수가 예상과 다르다 (${normalized} != ${EXPECTED_DEFECTS.uppercaseHeaderParameters}).`)
}
if (removed !== EXPECTED_DEFECTS.duplicateAuthorizationParameters) {
  fail(`Authorization 제거 수가 예상과 다르다 (${removed} != ${EXPECTED_DEFECTS.duplicateAuthorizationParameters}). 스냅샷이 바뀌었다면 ADR과 EXPECTED_DEFECTS를 함께 갱신하라.`)
}
if (rename.size !== EXPECTED_DEFECTS.invalidComponentKeys) {
  fail(`정규화한 component 키 수가 예상과 다르다 (${rename.size} != ${EXPECTED_DEFECTS.invalidComponentKeys}).`)
}

const schemaCountAfter = Object.keys(spec.components.schemas).length
if (schemaCountAfter !== schemaCountBefore) {
  fail(`schema 개수가 변했다 (${schemaCountBefore} -> ${schemaCountAfter}). 변환이 스키마를 잃거나 합치면 안 된다.`)
}
const refCountAfter = countRefs(spec)
if (refCountAfter !== refCountBefore) {
  fail(`$ref 개수가 변했다 (${refCountBefore} -> ${refCountAfter}).`)
}

const stillInvalid = Object.keys(spec.components.schemas).filter((k) => !VALID_COMPONENT_KEY.test(k))
if (stillInvalid.length > 0) fail(`정규화 후에도 스펙 위반 키가 남았다: ${stillInvalid.slice(0, 3).join(', ')}`)

// 모든 $ref가 실제로 해석되는지 최종 확인
const unresolved = new Set()
const check = (node) => {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) return node.forEach(check)
  for (const [k, v] of Object.entries(node)) {
    if (k === '$ref' && typeof v === 'string' && v.startsWith('#/components/schemas/')) {
      const name = decodeURIComponent(v.slice('#/components/schemas/'.length))
      if (!(name in spec.components.schemas)) unresolved.add(v)
    } else check(v)
  }
}
check(spec)
if (unresolved.size > 0) fail(`변환 후 해석되지 않는 $ref ${unresolved.size}개: ${[...unresolved].slice(0, 3).join(', ')}`)

const leftoverAuth = [...eachOperation(spec)].filter(({ op }) =>
  (op.parameters ?? []).some((p) => p.name === 'Authorization' && p.in === 'header'),
).length
if (leftoverAuth !== skippedPreAuth) fail(`잔존 Authorization parameter(${leftoverAuth})가 pre-auth 예외(${skippedPreAuth})와 불일치.`)

mkdirSync(PREPARED_DIR, { recursive: true })
writeFileSync(PREPARED, JSON.stringify(spec, null, 2), 'utf8')

console.log(`  in 값 소문자 정규화          : ${normalized}`)
console.log(`  Authorization parameter 제거 : ${removed} operations (pre-auth 보존 ${skippedPreAuth})`)
console.log(`  스펙 위반 component 키 정규화: ${rename.size} ($ -> _)`)
console.log(`  parameter schema 보정        : ${schemaFilled} (example이 보인 타입만)`)
console.log(`  securityScheme 위반 속성 제거: ${securityPropsRemoved}`)
console.log(`  누락 path parameter 보충     : ${pathParamsFilled} (형제 operation 정의 복사)`)
console.log(`  schema 개수 불변             : ${schemaCountAfter} == ${schemaCountBefore}`)
console.log(`  $ref 개수 불변 / 전부 해석됨 : ${refCountAfter} == ${refCountBefore}`)
console.log(`\n  ✓ ${PREPARED} 작성 (원본 스냅샷 불변)`)
