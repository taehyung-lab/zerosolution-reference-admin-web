import { describe, expect, it } from 'vitest'
import { ApiError } from './error'
import { classifyFormError } from './form-error'

const fields = ['name', 'email'] as const

describe('classifyFormError', () => {
  it.each(['unauthorized', 'forbidden', 'cancelled'] as const)(
    'returns undefined for %s so the form shows nothing (incident boundary or no surface)',
    (kind) => {
      const error = new ApiError({ kind, message: 'diagnostic only', fieldErrors: [{ field: 'name', code: 'invalid' }] })
      expect(classifyFormError(error, fields)).toBeUndefined()
    },
  )

  it('maps validation issues onto declared fields in declared order and drops unknown fields', () => {
    const error = new ApiError({
      kind: 'validation',
      message: 'diagnostic only',
      fieldErrors: [
        { field: 'email', code: 'taken' },
        { field: 'unknown', code: 'x' },
        { field: 'name', code: 'short' },
      ],
    })
    expect(classifyFormError(error, fields)).toEqual({ fields: ['name', 'email'] })
  })

  it('reports validation without a matching field as a root failure', () => {
    const error = new ApiError({ kind: 'validation', message: 'diagnostic only', fieldErrors: [{ field: 'other', code: 'x' }] })
    expect(classifyFormError(error, fields)).toEqual({ fields: [], root: 'validation' })
  })

  it.each(['network', 'timeout'] as const)('reports %s as a connection failure', (kind) => {
    expect(classifyFormError(new ApiError({ kind, message: 'diagnostic only' }), fields)).toEqual({
      fields: [],
      root: 'connection',
    })
  })

  it.each(['business', 'conflict', 'server-error', 'contract'] as const)('reports %s as a general failure', (kind) => {
    expect(classifyFormError(new ApiError({ kind, message: 'diagnostic only' }), fields)).toEqual({
      fields: [],
      root: 'general',
    })
  })

  it('reports a non-ApiError as a general failure', () => {
    expect(classifyFormError(new Error('boom'), fields)).toEqual({ fields: [], root: 'general' })
  })
})
