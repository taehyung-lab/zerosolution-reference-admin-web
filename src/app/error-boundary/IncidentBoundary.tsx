import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeIncident, type Incident } from '@/api/http/incident'
import { AccessDeniedPage } from './StatusPage'

interface IncidentBoundaryProps {
  readonly children: ReactNode
  readonly onLoginRequired: (incident: Extract<Incident, { type: 'unauthorized' }>) => void
  readonly onGoBack: () => void
}

/** How long a forbidden incident waits for Query to record the rejection it belongs to. */
const FORBIDDEN_LOOKUP_GRACE_MS = 200

/** Owns terminal auth state; transport only publishes one-way incident facts. */
export function IncidentBoundary({ children, onLoginRequired, onGoBack }: IncidentBoundaryProps) {
  const queryClient = useQueryClient()
  const [forbidden, setForbidden] = useState<Extract<Incident, { type: 'forbidden' }> | null>(null)
  /**
   * 로그인 요구를 이미 시작한 자격증명 세대. 토큰 문자열을 다시 읽지 않는다.
   * 사실이 도착할 때 그 자격증명은 이미 지워져 있어 토큰은 언제나 `null` 이고,
   * 그것을 키로 쓰면 두 번째 만료가 영구히 억제된다.
   */
  const requestedLoginForGeneration = useRef<number | null>(null)
  // The subscription lives for the boundary's lifetime. Re-subscribing on every callback identity change
  // opens a gap (cleanup → child effects start fetches → resubscribe) in which an incident is lost.
  const latestOnLoginRequired = useRef(onLoginRequired)
  useEffect(() => {
    latestOnLoginRequired.current = onLoginRequired
  }, [onLoginRequired])

  useEffect(
    () => subscribeIncident((incident) => {
      if (incident.type === 'unauthorized') {
        // 동시 401 N 건은 각각 사실을 발행한다. transport 는 억제하지 않으므로 소비자가 억제한다.
        // 억제는 로그인을 요구하게 만든 자격증명에 묶여 있고, 다시 로그인해 새 토큰이 저장되면 풀린다.
        if (requestedLoginForGeneration.current === incident.credentialGeneration) return
        requestedLoginForGeneration.current = incident.credentialGeneration
        latestOnLoginRequired.current(incident)
        return
      }
      /**
       * Fail closed. A forbidden incident covers the screen only when a navigation asked for the
       * record (`origin: 'route-loader'`, see `loadRequired`) or when a mounted screen observes the
       * refused query. Anything else — a preload on link hover, a query nobody watches — stays silent.
       * A refused mutation always covers: a user action started it. The transport publishes before
       * Query records the rejection (and a retried failure lands in `fetchFailureReason`, not `error`),
       * so the lookup waits for the caches to catch up instead of deciding on a single tick, and gives
       * up silently after the grace window.
       */
      if (incident.origin === 'route-loader') {
        setForbidden(incident)
        return
      }
      if (incident.error === undefined) return
      const queries = queryClient.getQueryCache()
      const mutations = queryClient.getMutationCache()
      const decide = () => {
        const mutation = mutations.findAll().find((candidate) => candidate.state.error === incident.error)
        if (mutation) {
          window.setTimeout(() => setForbidden(incident), 0)
          return true
        }
        const query = queries.findAll().find(
          (candidate) => candidate.state.error === incident.error || candidate.state.fetchFailureReason === incident.error,
        )
        if (!query) return false
        if (query.getObserversCount() > 0) window.setTimeout(() => setForbidden(incident), 0)
        return true
      }
      if (decide()) return
      const stopQueries = queries.subscribe(() => { if (decide()) stop() })
      const stopMutations = mutations.subscribe(() => { if (decide()) stop() })
      const stop = () => { stopQueries(); stopMutations() }
      window.setTimeout(stop, FORBIDDEN_LOOKUP_GRACE_MS)
    }),
    [queryClient],
  )

  // Figma 1.4.3 is a full grey screen. It is a modal over the still-mounted screen (queries keep their
  // observers; focus and aria-hidden are Radix's); acknowledging goes back and lifts the cover.
  return (
    <>
      {children}
      {forbidden === null ? null : (
        <AccessDeniedPage
          onBack={() => {
            setForbidden(null)
            onGoBack()
          }}
        />
      )}
    </>
  )
}
