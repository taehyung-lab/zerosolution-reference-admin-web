import type { ApiError } from '../error'
import {
  ACCESS_TOKEN_STORAGE_KEY,
  applyCredentialChangeFromStorage,
  clearAccessToken,
  readCredentialGeneration,
} from './credential'

/**
 * transport에서 app으로만 흐르는 단방향 incident 사실.
 * 인터셉터는 사실만 발행하고 표시·이동은 app 경계가 결정한다(`transport.md` §Auth and incidents).
 *
 * 세션 만료 타이머·연장·자동 로그아웃은 현재 범위 밖이다(ADR 0006).
 * 여기서는 인증 실패(401)와 권한 없음(403) 사실만 다룬다.
 */
export type Incident =
  | {
      readonly type: 'unauthorized'
      readonly source: 'api' | 'refresh' | 'cross-tab'
      /**
       * 사실이 발행될 때 살아 있던 자격증명의 세대. 발행 지점은 자격증명을 지우기 전에 읽는다.
       * 소비자는 이 숫자로 중복 로그인 요구를 억제하고, 재로그인이 세대를 올리면 억제가 풀린다.
       */
      readonly credentialGeneration: number
      readonly status?: number | undefined
      readonly code?: string | undefined
      readonly requestId?: string | undefined
      readonly error?: ApiError | undefined
    }
  | {
      readonly type: 'forbidden'
      readonly status?: number | undefined
      readonly code?: string | undefined
      readonly requestId?: string | undefined
      readonly error?: ApiError | undefined
    }

export type UnauthorizedIncident = Extract<Incident, { type: 'unauthorized' }>
export type ForbiddenIncident = Extract<Incident, { type: 'forbidden' }>

type IncidentSubscriber = (incident: Incident) => void

const subscribers = new Set<IncidentSubscriber>()

export function subscribeIncident(subscriber: IncidentSubscriber): () => void {
  subscribers.add(subscriber)
  return () => subscribers.delete(subscriber)
}

/**
 * 중복 억제를 여기서 하지 않는다.
 * 이전 구현은 "세션 epoch당 1회"로 눌렀는데 reset을 호출하는 프로덕션 코드가 없어
 * 첫 401 이후의 모든 401이 영구히 삼켜졌다. 억제는 로그인 이동을 실제로 실행하는
 * 소비자(`IncidentBoundary`)가 자기 맥락에서 소유한다.
 */
export function publishIncident(incident: Incident): void {
  for (const subscriber of subscribers) subscriber(incident)
}

/**
 * 세션이 끝난 것이 확정된 자리에서 죽은 자격증명을 지우고 로그인 요구 사실을 발행한다.
 * transport 에는 이 자리가 둘이다(HTTP 401 replay 실패와 HTTP 200 봉투가 선언한 세션 만료).
 * 각자 발행하면 세대를 읽는 순서가 갈라져 소비자의 중복 억제가 깨지므로 한 helper 만 쓴다.
 *
 * 세대는 자격증명을 지우기 전에 읽는다. 지운 뒤에 읽는 값은 어떤 만료에서도 같아
 * 소비자의 중복 억제가 두 번째 만료를 영구히 삼킨다.
 */
export function publishTerminalUnauthorized(
  source: 'api' | 'refresh',
  terminal: ApiError,
): void {
  const credentialGeneration = readCredentialGeneration()
  clearAccessToken()
  publishIncident({
    type: 'unauthorized',
    source,
    credentialGeneration,
    status: terminal.status,
    code: terminal.code,
    requestId: terminal.requestId,
    error: terminal,
  })
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === ACCESS_TOKEN_STORAGE_KEY && event.oldValue && event.newValue === null) {
      applyCredentialChangeFromStorage(null)
      publishIncident({
        type: 'unauthorized',
        source: 'cross-tab',
        credentialGeneration: readCredentialGeneration(),
      })
    } else if (event.key === ACCESS_TOKEN_STORAGE_KEY && event.newValue) {
      applyCredentialChangeFromStorage(event.newValue)
    }
  })
}
