import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TimezoneProvider, useTimezone } from './TimezoneProvider'

function TimezoneConsumer() {
  return <span>{useTimezone()}</span>
}

describe('TimezoneProvider', () => {
  it('브라우저 timezone을 읽지 않고 앱 기준 UTC를 제공한다', () => {
    const resolvedOptions = vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
    render(
      <TimezoneProvider>
        <TimezoneConsumer />
      </TimezoneProvider>,
    )
    expect(screen.getByText('UTC')).toBeInTheDocument()
    expect(resolvedOptions).not.toHaveBeenCalled()
  })
})
