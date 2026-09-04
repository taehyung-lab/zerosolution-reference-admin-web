import { eachOperation, summarizeSpec } from './_shared.mjs'

function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized)
  if (typeof value !== 'object' || value === null) return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, normalized(value[key])]),
  )
}

function equal(left, right) {
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right))
}

function without(object, omittedKeys) {
  return Object.fromEntries(Object.entries(object).filter(([key]) => !omittedKeys.has(key)))
}

function changedNames(before, after) {
  const names = new Set([...Object.keys(before), ...Object.keys(after)])
  return [...names].filter((name) => !equal(before[name], after[name]))
}

function operationMap(spec) {
  return Object.fromEntries(
    [...eachOperation(spec)].map(({ path, method, op }) => [`${method.toUpperCase()} ${path}`, op]),
  )
}

function parameterIdentity(parameter) {
  const name = parameter.name ?? parameter.$ref ?? '(anonymous)'
  const location = String(parameter.in ?? 'ref').toLowerCase()
  return `${name}@${location}`
}

function parameterMap(operation) {
  return Object.fromEntries(
    (operation.parameters ?? []).map((parameter) => [parameterIdentity(parameter), parameter]),
  )
}

function analyzeSchemaDeltas(snapshotSchemas, remoteSchemas) {
  const names = new Set([...Object.keys(snapshotSchemas), ...Object.keys(remoteSchemas)])
  return [...names]
    .filter((name) => !equal(snapshotSchemas[name], remoteSchemas[name]))
    .map((name) => {
      if (!(name in snapshotSchemas)) return { name, status: 'remote-only', properties: [] }
      if (!(name in remoteSchemas)) return { name, status: 'snapshot-only', properties: [] }
      const snapshotProperties = snapshotSchemas[name]?.properties ?? {}
      const remoteProperties = remoteSchemas[name]?.properties ?? {}
      return {
        name,
        status: 'changed',
        properties: changedNames(snapshotProperties, remoteProperties),
      }
    })
}

export function analyzeSpecDiff(snapshot, remote) {
  const snapshotOperations = operationMap(snapshot)
  const remoteOperations = operationMap(remote)
  const operationNames = new Set([
    ...Object.keys(snapshotOperations),
    ...Object.keys(remoteOperations),
  ])
  const parameterGroupMap = new Map()
  const groupedOperationIdChanges = []
  const operationIdChanges = []
  const snapshotOnlyOperations = []
  const remoteOnlyOperations = []
  const remainingOperations = []

  for (const operation of operationNames) {
    const before = snapshotOperations[operation]
    const after = remoteOperations[operation]
    if (before === undefined) {
      remoteOnlyOperations.push(operation)
      continue
    }
    if (after === undefined) {
      snapshotOnlyOperations.push(operation)
      continue
    }
    if (equal(before, after)) continue

    const beforeParameters = parameterMap(before)
    const afterParameters = parameterMap(after)
    const snapshotOnly = Object.keys(beforeParameters)
      .filter((name) => !(name in afterParameters))
      .sort()
    const remoteOnly = Object.keys(afterParameters)
      .filter((name) => !(name in beforeParameters))
      .sort()
    const changedParameters = Object.keys(beforeParameters).filter(
      (name) => name in afterParameters && !equal(beforeParameters[name], afterParameters[name]),
    )
    const baseEqual = equal(
      without(before, new Set(['parameters', 'operationId'])),
      without(after, new Set(['parameters', 'operationId'])),
    )
    const operationIdChanged = before.operationId !== after.operationId
    const parameterOnly =
      baseEqual && changedParameters.length === 0 && (snapshotOnly.length > 0 || remoteOnly.length > 0)
    const operationIdOnly =
      baseEqual &&
      changedParameters.length === 0 &&
      snapshotOnly.length === 0 &&
      remoteOnly.length === 0 &&
      operationIdChanged

    if (parameterOnly) {
      const signature = JSON.stringify({ snapshotOnly, remoteOnly })
      const group = parameterGroupMap.get(signature) ?? {
        count: 0,
        snapshotOnly,
        remoteOnly,
      }
      group.count += 1
      parameterGroupMap.set(signature, group)
    }
    if (parameterOnly && operationIdChanged) {
      groupedOperationIdChanges.push({
        operation,
        snapshot: before.operationId ?? '(none)',
        remote: after.operationId ?? '(none)',
      })
    }
    if (operationIdOnly) {
      operationIdChanges.push({
        operation,
        snapshot: before.operationId ?? '(none)',
        remote: after.operationId ?? '(none)',
      })
    }
    if (!parameterOnly && !operationIdOnly) remainingOperations.push(operation)
  }

  const snapshotSchemas = snapshot.components?.schemas ?? {}
  const remoteSchemas = remote.components?.schemas ?? {}

  return {
    snapshotSummary: summarizeSpec(snapshot),
    remoteSummary: summarizeSpec(remote),
    changedPaths: changedNames(snapshot.paths ?? {}, remote.paths ?? {}).length,
    changedOperations: changedNames(snapshotOperations, remoteOperations).length,
    schemaDeltas: analyzeSchemaDeltas(snapshotSchemas, remoteSchemas),
    parameterGroups: [...parameterGroupMap.values()].sort((left, right) => right.count - left.count),
    groupedOperationIdChanges,
    operationIdChanges,
    snapshotOnlyOperations,
    remoteOnlyOperations,
    remainingOperations,
  }
}

function formatParameterSide(label, names) {
  return names.length === 0 ? null : `${label} parameter [${names.join(', ')}]`
}

function countByPrefix(names, prefixOf) {
  const counts = new Map()
  for (const name of names) {
    const prefix = prefixOf(name)
    counts.set(prefix, (counts.get(prefix) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([prefix, count]) => `${prefix}=${count}`)
    .join(', ')
}

function schemaPrefix(name) {
  return name.split('.')[0] ?? '(none)'
}

function operationPrefix(operation) {
  const path = operation.split(' ')[1] ?? operation
  return path.replace(/^\/api\/v1\//, '').split('/')[0] ?? '(root)'
}

function appendOneSidedSchemas(lines, schemas, status) {
  if (schemas.length === 0) return
  if (schemas.length <= 10) {
    for (const schema of schemas) lines.push(`    ${status} ${schema.name}`)
    return
  }
  lines.push(
    `    ${status} (${schemas.length}): prefixes [${countByPrefix(schemas.map((schema) => schema.name), schemaPrefix)}]`,
  )
}

export function formatSpecDiff(analysis) {
  const lines = [
    `  snapshot ${JSON.stringify(analysis.snapshotSummary)}`,
    `  remote   ${JSON.stringify(analysis.remoteSummary)}`,
    `  changed paths=${analysis.changedPaths} operations=${analysis.changedOperations} schemas=${analysis.schemaDeltas.length}`,
    '',
    `  schema deltas (${analysis.schemaDeltas.length}):`,
  ]

  if (analysis.schemaDeltas.length === 0) lines.push('    none')
  for (const schema of analysis.schemaDeltas.filter((item) => item.status === 'changed')) {
    const properties = schema.properties.length === 0 ? '' : `: properties [${schema.properties.join(', ')}]`
    lines.push(`    ${schema.status} ${schema.name}${properties}`)
  }
  appendOneSidedSchemas(
    lines,
    analysis.schemaDeltas.filter((item) => item.status === 'snapshot-only'),
    'snapshot-only',
  )
  appendOneSidedSchemas(
    lines,
    analysis.schemaDeltas.filter((item) => item.status === 'remote-only'),
    'remote-only',
  )

  lines.push('', '  repeated operation deltas:')
  if (analysis.parameterGroups.length === 0) lines.push('    none')
  for (const group of analysis.parameterGroups) {
    const sides = [
      formatParameterSide('snapshot에만 있는', group.snapshotOnly),
      formatParameterSide('remote에만 있는', group.remoteOnly),
    ].filter((side) => side !== null)
    lines.push(`    ${group.count} operations: ${sides.join(' / ')}`)
  }

  if (analysis.groupedOperationIdChanges.length > 0) {
    const managerExample = analysis.groupedOperationIdChanges.find(
      (change) => change.operation === 'GET /api/v1/managers',
    )
    const example = managerExample ?? analysis.groupedOperationIdChanges[0]
    lines.push(
      `    위 그룹에 함께 접힌 operationId 변화 ${analysis.groupedOperationIdChanges.length}건`,
    )
    if (example !== undefined) {
      lines.push(`    example ${example.operation}: ${example.snapshot} -> ${example.remote}`)
    }
    lines.push('    접힌 변화도 Orval 함수명에 영향을 주므로 generated contract 게이트를 확인한다.')
  }

  if (analysis.operationIdChanges.length > 0) {
    lines.push(
      '',
      `  operationId-only (${analysis.operationIdChanges.length}; 빌드 스캔 순서 잡음일 수 있지만 Orval 함수명이 바뀌므로 주의):`,
    )
    for (const change of analysis.operationIdChanges) {
      lines.push(`    ${change.operation}: ${change.snapshot} -> ${change.remote}`)
    }
    lines.push('    src/api/generated-contract.test.ts 게이트를 함께 확인한다.')
  }

  const remainingCount =
    analysis.snapshotOnlyOperations.length +
    analysis.remoteOnlyOperations.length +
    analysis.remainingOperations.length
  lines.push('', `  remaining operation deltas (${remainingCount}):`)
  if (remainingCount === 0) lines.push('    none')
  if (analysis.snapshotOnlyOperations.length > 0) {
    lines.push(
      `    snapshot-only (${analysis.snapshotOnlyOperations.length}): groups [${countByPrefix(analysis.snapshotOnlyOperations, operationPrefix)}]`,
    )
  }
  if (analysis.remoteOnlyOperations.length > 0) {
    lines.push(
      `    remote-only (${analysis.remoteOnlyOperations.length}): groups [${countByPrefix(analysis.remoteOnlyOperations, operationPrefix)}]`,
    )
  }
  if (analysis.remainingOperations.length > 0) {
    lines.push(`    changed: ${analysis.remainingOperations.slice(0, 20).join(', ')}`)
  }
  lines.push(`  changed paths ${analysis.changedPaths}: 위 operation 델타를 path 단위로 집계한 값`)

  return lines.join('\n')
}
