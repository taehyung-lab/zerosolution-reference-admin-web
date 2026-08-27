export type Incident =
  | {
      readonly type: 'session-terminated'
      readonly status?: number | undefined
      readonly code?: string | undefined
      readonly requestId?: string | undefined
    }
  | {
      readonly type: 'forbidden'
      readonly status?: number | undefined
      readonly code?: string | undefined
      readonly requestId?: string | undefined
    }

export type SessionTerminatedIncident = Extract<Incident, { type: 'session-terminated' }>
export type ForbiddenIncident = Extract<Incident, { type: 'forbidden' }>

type IncidentSubscriber = (incident: Incident) => void

const subscribers = new Set<IncidentSubscriber>()
let sessionTerminatedPublished = false

/** 인증 경계가 새 세션을 확정할 때 호출하는 epoch reset seam. */
export function beginSessionEpoch(): void {
  sessionTerminatedPublished = false
}

export function subscribeIncident(subscriber: IncidentSubscriber): () => void {
  subscribers.add(subscriber)
  return () => subscribers.delete(subscriber)
}

/** transport에서 app으로만 흐르는 incident 사실 발행. UI와 navigation은 여기서 하지 않는다. */
export function publishIncident(incident: Incident): void {
  if (incident.type === 'session-terminated') {
    if (sessionTerminatedPublished) return
    sessionTerminatedPublished = true
  }
  for (const subscriber of subscribers) subscriber(incident)
}
