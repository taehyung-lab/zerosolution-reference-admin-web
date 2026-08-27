import { useEffect, type ReactNode } from 'react'
import {
  subscribeIncident,
  type ForbiddenIncident,
  type SessionTerminatedIncident,
} from '@/api/http/incident'

interface IncidentBoundaryProps {
  readonly children: ReactNode
  readonly onSessionTerminated?: ((incident: SessionTerminatedIncident) => void) | undefined
  readonly onForbidden?: ((incident: ForbiddenIncident) => void) | undefined
}

/** transport incident의 표시·이동 결정을 소유하는 app 경계. Phase 1에서는 주입 seam만 제공한다. */
export function IncidentBoundary({
  children,
  onSessionTerminated,
  onForbidden,
}: IncidentBoundaryProps) {
  useEffect(
    () =>
      subscribeIncident((incident) => {
        if (incident.type === 'session-terminated') onSessionTerminated?.(incident)
        else onForbidden?.(incident)
      }),
    [onForbidden, onSessionTerminated],
  )

  return children
}
