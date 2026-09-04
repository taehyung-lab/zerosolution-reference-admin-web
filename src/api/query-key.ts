/**
 * 서버의 locale별 응답군이 미확인이라 모든 API cache family를 UI locale로 격리한다.
 * 폐기 조건은 ADR 0005가 소유한다.
 */
export function localizedQueryKey(locale: string, ...segments: readonly string[]) {
  return ['api', locale, ...segments] as const
}
