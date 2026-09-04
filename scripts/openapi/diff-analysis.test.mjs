import { describe, expect, it } from 'vitest'
import { analyzeSpecDiff, formatSpecDiff } from './diff-analysis.mjs'

const sharedResponse = { responses: { 200: { description: 'OK' } } }

const snapshot = {
  paths: {
    '/headers': {
      get: {
        operationId: 'withHeaders',
        parameters: [
          { name: 'Authorization', in: 'HEADER', schema: { type: 'string' } },
          { name: 'X-Client-Path', in: 'HEADER', schema: { type: 'string' } },
        ],
        ...sharedResponse,
      },
    },
    '/renamed': { get: { operationId: 'getList_3', ...sharedResponse } },
  },
  components: {
    schemas: {
      Round: { type: 'object', properties: { time: { type: 'string' } } },
    },
  },
}

const remote = {
  paths: {
    '/headers': { get: { operationId: 'withHeaders', ...sharedResponse } },
    '/renamed': { get: { operationId: 'getList_8', ...sharedResponse } },
    '/api/v1/mobile/one': { get: { operationId: 'mobileOne', ...sharedResponse } },
    '/api/v1/mobile/two': { post: { operationId: 'mobileTwo', ...sharedResponse } },
    '/api/v1/pc-client/one': { get: { operationId: 'pcOne', ...sharedResponse } },
  },
  components: {
    schemas: {
      Round: { type: 'object', properties: { time: { $ref: '#/components/schemas/LocalTime' } } },
      LocalTime: { type: 'object' },
    },
  },
}

describe('OpenAPI diff grouping', () => {
  it('반복 parameter와 operationId-only 델타를 실제 schema 신호와 분리한다', () => {
    const analysis = analyzeSpecDiff(snapshot, remote)
    const output = formatSpecDiff(analysis)

    expect(analysis.parameterGroups).toHaveLength(1)
    expect(analysis.parameterGroups[0]).toMatchObject({ count: 1 })
    expect(analysis.operationIdChanges).toEqual([
      { operation: 'GET /renamed', snapshot: 'getList_3', remote: 'getList_8' },
    ])
    expect(analysis.remainingOperations).toEqual([])
    expect(output).toContain('schema deltas (2)')
    expect(output).toContain('changed Round: properties [time]')
    expect(output).toContain('remote-only LocalTime')
    expect(output).toContain(
      '1 operations: snapshot에만 있는 parameter [Authorization@header, X-Client-Path@header]',
    )
    expect(output).toContain('Orval 함수명이 바뀌므로 주의')
    expect(output).toContain('remote-only (3): groups [mobile=2, pc-client=1]')
  })
})
