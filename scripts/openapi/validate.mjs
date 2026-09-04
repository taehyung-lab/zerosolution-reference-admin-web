#!/usr/bin/env node
/**
 * 스냅샷 구조 검증 + 알려진 리허설 결함 리포트.
 * 결함을 allowlist로 "성공" 처리하지 않는다. 규모가 예상과 다르면 실패한다.
 * 네트워크를 사용하지 않는다.
 */
import {
  readSnapshot,
  readSnapshotMeta,
  summarizeSpec,
  eachOperation,
  EXPECTED_DEFECTS,
  VALID_COMPONENT_KEY,
  fail,
} from './_shared.mjs'

const spec = readSnapshot()
const meta = readSnapshotMeta()

if (!/^3\.\d+\.\d+$/.test(spec.openapi ?? '')) fail(`openapi 버전이 3.x가 아니다: ${spec.openapi}`)
if (!spec.paths || Object.keys(spec.paths).length === 0) fail('paths가 비어 있다')
if (!spec.components?.schemas) fail('components.schemas가 없다')

const summary = summarizeSpec(spec)
if (typeof meta.source !== 'string' || meta.source.length === 0) fail('snapshot meta source가 없다')
if (typeof meta.pulledAt !== 'string' || !Number.isFinite(Date.parse(meta.pulledAt))) {
  fail('snapshot meta pulledAt이 유효한 instant가 아니다')
}
if (meta.infoVersion !== (spec.info?.version ?? null)) fail('snapshot과 meta의 info.version이 다르다')
for (const key of ['paths', 'operations', 'schemas']) {
  if (meta.counts?.[key] !== summary[key]) {
    fail(`snapshot과 meta의 ${key} count가 다르다 (${meta.counts?.[key]} != ${summary[key]})`)
  }
}

// --- 참조 무결성: 모든 로컬 $ref가 실제로 해석되는지 ---
const schemas = spec.components.schemas
const missingRefs = new Set()
const walk = (node) => {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) return node.forEach(walk)
  for (const [k, v] of Object.entries(node)) {
    if (k === '$ref' && typeof v === 'string') {
      if (v.startsWith('#/components/schemas/')) {
        const name = decodeURIComponent(v.slice('#/components/schemas/'.length))
        if (!(name in schemas)) missingRefs.add(v)
      } else if (v.startsWith('#/')) {
        missingRefs.add(v)
      }
    } else walk(v)
  }
}
walk(spec.paths)
walk(spec.components)
if (missingRefs.size > 0) {
  fail(`해석되지 않는 $ref ${missingRefs.size}개: ${[...missingRefs].slice(0, 5).join(', ')}`)
}

// --- 알려진 결함 실측 ---
let duplicateAuth = 0
let uppercaseHeader = 0
let operations = 0
for (const { op } of eachOperation(spec)) {
  operations++
  for (const p of op.parameters ?? []) {
    if (String(p.in) !== String(p.in).toLowerCase()) uppercaseHeader++
    if (p.name === 'Authorization' && String(p.in).toLowerCase() === 'header') duplicateAuth++
  }
}

console.log(`  스냅샷: ${spec.info?.title} ${spec.info?.version} (openapi ${spec.openapi})`)
console.log(`  paths ${Object.keys(spec.paths).length} / operations ${operations} / schemas ${Object.keys(schemas).length}`)
console.log(`  source ${meta.source} / pulledAt ${meta.pulledAt}`)
console.log(`  $ref 무결성: OK`)
console.log('')
console.log('  알려진 리허설 결함 (숨기지 않고 보고):')
console.log(`    - Authorization 중복 parameter : ${duplicateAuth} (예상 ${EXPECTED_DEFECTS.duplicateAuthorizationParameters})`)
console.log(`    - 비표준 대문자 in 값          : ${uppercaseHeader} (예상 ${EXPECTED_DEFECTS.uppercaseHeaderParameters})`)
const invalidKeys = Object.keys(schemas).filter((k) => !VALID_COMPONENT_KEY.test(k))
console.log(`    - 스펙 위반 component 키       : ${invalidKeys.length} (예상 ${EXPECTED_DEFECTS.invalidComponentKeys})`)
if (invalidKeys.length !== EXPECTED_DEFECTS.invalidComponentKeys) {
  fail(`스펙 위반 component 키 수가 예상과 다르다 (${invalidKeys.length} != ${EXPECTED_DEFECTS.invalidComponentKeys}).`)
}

if (duplicateAuth !== EXPECTED_DEFECTS.duplicateAuthorizationParameters) {
  fail(`Authorization 중복 수가 예상과 다르다 (${duplicateAuth} != ${EXPECTED_DEFECTS.duplicateAuthorizationParameters}). 스냅샷이 바뀌었다면 ADR과 EXPECTED_DEFECTS를 함께 갱신하라.`)
}
if (uppercaseHeader !== EXPECTED_DEFECTS.uppercaseHeaderParameters) {
  fail(`비표준 in 값 수가 예상과 다르다 (${uppercaseHeader} != ${EXPECTED_DEFECTS.uppercaseHeaderParameters}).`)
}
let missingSchema = 0
for (const { op } of eachOperation(spec)) {
  for (const p of op.parameters ?? []) if (!p.schema && !p.content && !p.$ref) missingSchema++
}
let badSecurityProps = 0
for (const sc of Object.values(spec.components?.securitySchemes ?? {})) {
  if (sc?.type === 'apiKey') badSecurityProps += ['scheme', 'bearerFormat'].filter((k) => k in sc).length
}
console.log(`    - schema/content 없는 parameter: ${missingSchema} (예상 ${EXPECTED_DEFECTS.parametersMissingSchema})`)
console.log(`    - securityScheme type 불일치 속성: ${badSecurityProps} (예상 ${EXPECTED_DEFECTS.invalidSecuritySchemeProps})`)
if (missingSchema !== EXPECTED_DEFECTS.parametersMissingSchema) fail(`schema 없는 parameter 수 불일치 (${missingSchema}).`)
if (badSecurityProps !== EXPECTED_DEFECTS.invalidSecuritySchemeProps) fail(`securityScheme 위반 속성 수 불일치 (${badSecurityProps}).`)

console.log('\n  ✓ api:validate 통과')
