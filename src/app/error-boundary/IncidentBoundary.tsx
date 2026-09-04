import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { subscribeIncident, type Incident } from '@/api/http/incident'
import { AlertDialog } from '@/shared/ui/patterns/AlertDialog'

interface IncidentBoundaryProps {
  readonly children: ReactNode
  readonly onLoginRequired: (incident: Extract<Incident, { type: 'unauthorized' }>) => void
  readonly onGoBack: () => void
}

/** Owns terminal auth state; transport only publishes one-way incident facts. */
export function IncidentBoundary({ children, onLoginRequired, onGoBack }: IncidentBoundaryProps) {
  const queryClient = useQueryClient()
  const { t } = useTranslation('shared')
  const [forbidden, setForbidden] = useState<Extract<Incident, { type: 'forbidden' }> | null>(null)

  useEffect(
    () => subscribeIncident((incident) => {
      if (incident.type === 'unauthorized') {
        onLoginRequired(incident)
        return
      }
      window.setTimeout(() => {
        if (incident.error) {
          const query = queryClient.getQueryCache().findAll().find(
            (candidate) => candidate.state.error === incident.error,
          )
          if (query && query.getObserversCount() === 0) return
        }
        setForbidden(incident)
      }, 0)
    }),
    [onLoginRequired, queryClient],
  )

  return (
    <>
      {children}
      <AlertDialog
        open={forbidden !== null}
        onOpenChange={() => undefined}
        title={t('error.access.title')}
        description={t('error.access.description')}
        acknowledgeLabel={t('error.access.back')}
        onAcknowledge={() => {
          setForbidden(null)
          onGoBack()
        }}
      />
    </>
  )
}
