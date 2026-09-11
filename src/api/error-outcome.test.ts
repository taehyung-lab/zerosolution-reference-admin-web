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

  it.each(['unauthorized', 'forbidden'] as const)(
    'keeps a pre-auth %s inline on the screen that asked for the credential',
    (kind) => expect(resolveErrorOutcome('pre-auth', kind)).toBe('feature'),
  )

  it('still suppresses a cancelled pre-auth request', () => {
    expect(resolveErrorOutcome('pre-auth', 'cancelled')).toBe('none')
  })

  it.each(['render', 'route-loader', 'fatal', 'route-not-found'] as const)(
    'routes %s failures to root',
    (context) => expect(resolveErrorOutcome(context, 'contract')).toBe('root'),
  )

  it('keeps a route loader session or access failure with the incident boundary', () => {
    expect(resolveErrorOutcome('route-loader', 'forbidden')).toBe('incident')
    expect(resolveErrorOutcome('route-loader', 'unauthorized')).toBe('incident')
    expect(resolveErrorOutcome('route-loader', 'not-found')).toBe('root')
  })
})
