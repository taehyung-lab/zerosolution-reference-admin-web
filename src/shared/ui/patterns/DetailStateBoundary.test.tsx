import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DetailStateBoundary } from './DetailStateBoundary'

describe('DetailStateBoundary', () => {
  it.each([['error', 'Unable to load'], ['notFound', 'Missing detail']] as const)('renders the %s state instead of ready content', (state, label) => {
    render(<DetailStateBoundary state={state} labels={{ error: 'Unable to load', notFound: 'Missing detail' }}><p>Ready detail</p></DetailStateBoundary>)
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.queryByText('Ready detail')).not.toBeInTheDocument()
  })
  it('renders children only for ready state', () => {
    render(<DetailStateBoundary state="ready" labels={{ error: 'Unable to load', notFound: 'Missing detail' }}><p>Ready detail</p></DetailStateBoundary>)
    expect(screen.getByText('Ready detail')).toBeInTheDocument()
  })

  it('announces a recoverable error and exposes retry and diagnostic slots', () => {
    const retry = vi.fn()
    render(
      <DetailStateBoundary
        state="error"
        labels={{ error: 'Safe error', notFound: 'Missing detail' }}
        retryLabel="Retry"
        onRetry={retry}
        trace={<span>Inquiry code req-1</span>}
      >
        <p>Ready detail</p>
      </DetailStateBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Safe error')
    expect(screen.getByRole('alert')).toHaveTextContent('Inquiry code req-1')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
