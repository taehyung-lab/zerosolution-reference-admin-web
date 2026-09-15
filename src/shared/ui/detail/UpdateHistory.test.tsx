import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UpdateHistory } from './UpdateHistory'

const labels = { date: 'Updated at', change: 'Change', actor: 'Manager' }

describe('UpdateHistory', () => {
  it('renders the empty text instead of a table when there are no entries', () => {
    render(<UpdateHistory entries={[]} labels={labels} emptyText="No history" />)
    expect(screen.getByText('No history')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('renders three headers and one list item per line', () => {
    render(
      <UpdateHistory
        entries={[
          { id: '1', date: '2026-08-28', lines: ['Updated', 'Name: A > B'], actor: 'Admin' },
          { id: '2', date: '2026-08-27', lines: ['Created'], actor: '-' },
        ]}
        labels={labels}
        emptyText="No history"
      />,
    )
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Updated at', 'Change', 'Manager'])
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows).toHaveLength(2)
    expect(within(rows[0]!).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Updated', 'Name: A > B'])
    expect(within(rows[0]!).getByRole('cell', { name: 'Admin' })).toBeInTheDocument()
    expect(within(rows[1]!).getAllByRole('listitem')).toHaveLength(1)
  })
})
