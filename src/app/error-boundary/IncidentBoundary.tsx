import { useEffect, useRef, useState, type ReactNode } from 'react'
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
  /**
   * 로그인 요구를 이미 시작한 자격증명 세대. 토큰 문자열을 다시 읽지 않는다.
   * 사실이 도착할 때 그 자격증명은 이미 지워져 있어 토큰은 언제나 `null` 이고,
   * 그것을 키로 쓰면 두 번째 만료가 영구히 억제된다.
   */
  const requestedLoginForGeneration = useRef<number | null>(null)

  useEffect(
    () => subscribeIncident((incident) => {
      if (incident.type === 'unauthorized') {
        // 동시 401 N 건은 각각 사실을 발행한다. transport 는 억제하지 않으므로 소비자가 억제한다.
        // 억제는 로그인을 요구하게 만든 자격증명에 묶여 있고, 다시 로그인해 새 토큰이 저장되면 풀린다.
        if (requestedLoginForGeneration.current === incident.credentialGeneration) return
        requestedLoginForGeneration.current = incident.credentialGeneration
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
