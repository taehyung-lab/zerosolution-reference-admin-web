import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { beginSessionEpoch, publishIncident } from '@/api/http/incident'
import { IncidentBoundary } from './IncidentBoundary'

describe('IncidentBoundary', () => {
  it('session-terminated 사실을 주입된 app 이동 seam에 전달한다', () => {
    beginSessionEpoch()
    const onSessionTerminated = vi.fn()
    render(
      <IncidentBoundary onSessionTerminated={onSessionTerminated}>
        <span>child</span>
      </IncidentBoundary>,
    )

    act(() => publishIncident({ type: 'session-terminated', status: 401 }))

    expect(screen.getByText('child')).toBeInTheDocument()
    expect(onSessionTerminated).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'session-terminated', status: 401 }),
    )
  })
})
