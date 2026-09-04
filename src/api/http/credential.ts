/**
 * transport가 app을 역-import하지 않도록 하는 좁은 port.
 *
 * credential lifecycle의 소유자는 app auth boundary이며, transport는 여기에 등록된
 * getter로 현재 토큰을 읽기만 한다. 세션 응답을 복제하지 않는다.
 */
export const ACCESS_TOKEN_STORAGE_KEY = 'accessToken'

/**
 * reissue 요청 body 가 요구하는 로그인 ID. 비밀이 아니다(sign-in 요청 body 에 이미 평문으로 실린다).
 * access token 과 같은 수명으로 보관해야 새로고침 뒤에도 재발급 요청을 만들 수 있다.
 */
export const LOGIN_ID_STORAGE_KEY = 'loginId'

let memoryToken: string | null = null
let memoryLoginId: string | null = null

/**
 * 자격증명 세대. 새 자격증명이 성립할 때만 올라간다.
 *
 * 토큰 문자열은 비밀이라 incident 에 실을 수 없고, 지운 뒤에 읽으면 언제나 `null` 이라
 * 중복 억제 키가 될 수 없다. 지우기(`clearAccessToken`)에서는 올리지 않는다.
 * 동시 401 N 건이 각각 지우면서 세대가 갈라지면 아무것도 억제되지 않기 때문이다.
 */
let credentialGeneration = 0

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
  credentialGeneration += 1
  try {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
  } catch {
    // Private browsing and storage policy failures must not break the current document.
  }
}

/** 비밀이 아니므로 incident 에 실어 소비자가 중복 억제 키로 쓸 수 있다. */
export function readCredentialGeneration(): number {
  return credentialGeneration
}

export function readLoginId(): string | null {
  try {
    const persisted = localStorage.getItem(LOGIN_ID_STORAGE_KEY)
    if (persisted !== null) memoryLoginId = persisted
  } catch {
    // The in-memory mirror remains authoritative when browser storage is unavailable.
  }
  return memoryLoginId
}

export function setLoginId(loginId: string): void {
  memoryLoginId = loginId
  try {
    localStorage.setItem(LOGIN_ID_STORAGE_KEY, loginId)
  } catch {
    // Private browsing and storage policy failures must not break the current document.
  }
}

/** 토큰과 로그인 ID 는 하나의 자격증명이다. 한쪽만 남으면 재발급을 만들 수 없다. */
export function clearAccessToken(): void {
  memoryToken = null
  memoryLoginId = null
  try {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
    localStorage.removeItem(LOGIN_ID_STORAGE_KEY)
  } catch {
    // The mirror was cleared even when persisted storage cannot be reached.
  }
}

/**
 * 다른 탭이 storage 에 남긴 자격증명 변화를 이 문서에 반영한다. 되쓰지 않는다.
 *
 * 값이 오면 새 자격증명이 성립한 것이므로 세대를 올린다. 출처가 이 문서(`setAccessToken`)든
 * 다른 탭이든 뜻이 같기 때문이다. 올리지 않으면 이전 세대에서 이미 로그인을 요구한 탭이
 * 그 억제에 갇혀 다음 만료의 로그인 요구를 영원히 삼킨다.
 * `null` 은 로그아웃 전파이므로 세대를 올리지 않는다.
 */
export function applyCredentialChangeFromStorage(token: string | null): void {
  memoryToken = token
  if (token === null) {
    memoryLoginId = null
    return
  }
  credentialGeneration += 1
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
