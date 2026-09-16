/**
 * A write the product needs but this repository has no server contract for yet.
 *
 * Every such mutation gets one named function here as its `mutationFn`. Until the endpoint exists it
 * only logs that the confirmed request reached this boundary and resolves, so the screen runs the
 * same success path it will run against the real server (saved alert, cache invalidation,
 * navigation). Connecting the API means replacing the body of that one function; the screen,
 * the confirm flow, and the tests that press through it do not change.
 *
 * The log never carries the input — it may hold passwords or personal data.
 */
export function scenarioRequest<TInput = void, TResult = void>(
  label: string,
): (input: TInput) => Promise<TResult> {
  return () => {
    console.log(`[시나리오] ${label}: 요청 입력 확인 → API 연결 대기`)
    return Promise.resolve(undefined as TResult)
  }
}
