import type { ApiError } from '../error'
import { ACCESS_TOKEN_STORAGE_KEY, syncAccessTokenFromStorage } from './credential'

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
 * 첫 401 이후의 모든 401이 영구히 삼켜졌다. 소비자가 실제 요구를 확인한 뒤
 * 자기 맥락에서 억제 정책을 갖는다.
 */
export function publishIncident(incident: Incident): void {
  for (const subscriber of subscribers) subscriber(incident)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === ACCESS_TOKEN_STORAGE_KEY && event.oldValue && event.newValue === null) {
      syncAccessTokenFromStorage(null)
      publishIncident({ type: 'unauthorized', source: 'cross-tab' })
    } else if (event.key === ACCESS_TOKEN_STORAGE_KEY && event.newValue) {
      syncAccessTokenFromStorage(event.newValue)
    }
  })
}
