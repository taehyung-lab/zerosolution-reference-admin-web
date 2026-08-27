/**
 * transport가 app을 역-import하지 않도록 하는 좁은 port.
 *
 * credential lifecycle의 소유자는 app auth boundary이며, transport는 여기에 등록된
 * getter로 현재 토큰을 읽기만 한다. 세션 응답을 복제하지 않는다.
 */
type TokenGetter = () => string | null

let getToken: TokenGetter = () => null

export function registerTokenGetter(getter: TokenGetter): void {
  getToken = getter
}

export function readAccessToken(): string | null {
  return getToken()
}

/** 인증이 필요 없는 경로. 여기에는 Authorization 헤더를 붙이지 않는다. */
const PRE_AUTH_PATHS = ['/auth/sign-in', '/auth/reissue', '/auth/2fa/']

export function isPreAuthPath(url: string | undefined): boolean {
  if (!url) return false
  return PRE_AUTH_PATHS.some((p) => url.includes(p))
}
