import { describe, expect, it } from 'vitest'
import { ApiError, type ApiErrorKind } from '@/api/error'
import { isFeatureError, resolveErrorOutcome } from './error-outcome'

const recoverable: readonly ApiErrorKind[] = [
  'network', 'timeout', 'business', 'validation', 'not-found', 'conflict',
  'rate-limited', 'server-error', 'contract',
]

describe('operation context + ApiError kind outcome', () => {
  it.each(recoverable)('recognizes %s as a feature-handled ApiError', (kind) => {
    expect(isFeatureError(new ApiError({ kind, message: 'diagnostic' }))).toBe(true)
  })

  it.each(['cancelled', 'unauthorized', 'forbidden'] as const)(
    'keeps %s out of feature error surfaces',
    (kind) => expect(isFeatureError(new ApiError({ kind, message: 'diagnostic' }))).toBe(false),
  )

  it.each(recoverable)('keeps %s in-place for an observed feature operation', (kind) => {
    expect(resolveErrorOutcome('feature', kind)).toBe('feature')
  })

  it('suppresses cancelled requests and forbidden prefetch failures', () => {
    expect(resolveErrorOutcome('feature', 'cancelled')).toBe('none')
    expect(resolveErrorOutcome('prefetch', 'forbidden')).toBe('none')
  })

  it.each(['unauthorized', 'forbidden'] as const)('routes %s to the app incident boundary', (kind) => {
    expect(resolveErrorOutcome('feature', kind)).toBe('incident')
  })

  it.each(['render', 'route-loader', 'fatal', 'route-not-found'] as const)(
    'routes %s failures to root',
    (context) => expect(resolveErrorOutcome(context, 'contract')).toBe('root'),
  )
})
