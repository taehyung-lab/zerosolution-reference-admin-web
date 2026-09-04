/**
 * transport가 app을 역-import하지 않도록 하는 좁은 port.
 *
 * credential lifecycle의 소유자는 app auth boundary이며, transport는 여기에 등록된
 * getter로 현재 토큰을 읽기만 한다. 세션 응답을 복제하지 않는다.
 */
export const ACCESS_TOKEN_STORAGE_KEY = 'accessToken'

let memoryToken: string | null = null

export function readAccessToken(): string | null {
  try {
    const persisted = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    if (persisted !== null) memoryToken = persisted
  } catch {
    // The in-memory mirror remains authoritative when browser storage is unavailable.
  }
  return memoryToken
}

export function setAccessToken(token: string): void {
  memoryToken = token
  try {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
  } catch {
    // Private browsing and storage policy failures must not break the current document.
  }
}

export function clearAccessToken(): void {
  memoryToken = null
  try {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    // The mirror was cleared even when persisted storage cannot be reached.
  }
}

/** Applies a browser storage event without writing back into storage. */
export function syncAccessTokenFromStorage(token: string | null): void {
  memoryToken = token
}

type ReissueTokenReader = (payload: unknown) => string | undefined

let readReissueToken: ReissueTokenReader = () => undefined

/** The new backend response body is unresolved; its adapter is registered at the contract edge. */
export function registerReissueTokenReader(reader: ReissueTokenReader): void {
  readReissueToken = reader
}

export function readReissuedAccessToken(payload: unknown): string | undefined {
  return readReissueToken(payload)
}

/**
 * 인증이 필요 없는 경로. 여기에는 Authorization 헤더를 붙이지 않는다.
 * TRANSPLANT_PENDING_PRE_AUTH_PATHS: 리허설 경로다. 신규 OpenAPI의 인증 경로로 교체한다.
 */
const PRE_AUTH_PATHS = ['/auth/sign-in', '/auth/reissue', '/auth/2fa/']

export function isPreAuthPath(url: string | undefined): boolean {
  if (!url) return false
  return PRE_AUTH_PATHS.some((p) => url.includes(p))
}
