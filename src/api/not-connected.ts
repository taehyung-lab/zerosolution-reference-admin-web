/**
 * A write the product needs but this repository has no server contract for yet. Every such
 * mutation rejects with this error instead of pretending to succeed, so the form or action shows
 * its shared failure line and nothing downstream (saved alert, navigation, cache update) runs.
 * Connecting the real endpoint replaces the `mutationFn`; the screen does not change.
 */
export class ApiNotConnectedError extends Error {
  readonly operation: string

  constructor(operation: string) {
    super(`API not connected: ${operation}`)
    this.name = 'ApiNotConnectedError'
    this.operation = operation
  }
}

/** A `mutationFn` for `operation` that accepts the declared input and always rejects. */
export function notConnected<TInput = void>(operation: string): (input: TInput) => Promise<never> {
  return () => Promise.reject(new ApiNotConnectedError(operation))
}
