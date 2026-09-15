import type { ReactNode } from 'react'
import { EmptyState } from '../feedback/EmptyState'

export function DetailStateBoundary({ state, labels, children, retryLabel, onRetry, trace }: { readonly state: 'ready' | 'error' | 'notFound'; readonly labels: { readonly error: string; readonly notFound: string }; readonly children: ReactNode; readonly retryLabel?: string; readonly onRetry?: () => void; readonly trace?: ReactNode }) {
  if (state === 'error') return <div role="alert"><EmptyState><p>{labels.error}</p>{onRetry && retryLabel ? <button className="mt-3 rounded border px-3 py-2" type="button" onClick={onRetry}>{retryLabel}</button> : null}{trace}</EmptyState></div>
  if (state === 'notFound') return <EmptyState>{labels.notFound}</EmptyState>
  return children
}
