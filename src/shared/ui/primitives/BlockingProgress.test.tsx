import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BlockingProgress } from './BlockingProgress'

describe('BlockingProgress', () => {
  it('makes the covered surface inert and cannot be dismissed with Escape', () => {
    render(<BlockingProgress open message="Loading"><button>Covered action</button></BlockingProgress>)
    const status = screen.getByRole('status')
    const surface = screen.getByText('Covered action').parentElement
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveAttribute('aria-atomic', 'true')
    expect(surface).toHaveAttribute('inert')
    expect(surface).toHaveAttribute('aria-busy', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
