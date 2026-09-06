import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AlertDialog } from './AlertDialog'
import { ConfirmDialog } from './ConfirmDialog'

function ConfirmHarness({
  pending = false,
  onConfirm = () => {},
}: {
  readonly pending?: boolean
  readonly onConfirm?: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        open
      </button>
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Confirm"
        description="Are you sure?"
        onConfirm={onConfirm}
        onOpenChange={setOpen}
        open={open}
        pending={pending}
        title="Change status"
      />
    </>
  )
}

describe('shared dialogs', () => {
  it('associates the accessible name and description with the dialog', () => {
    render(<ConfirmHarness />)
    fireEvent.click(screen.getByText('open'))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAccessibleName('Change status')
    expect(dialog).toHaveAccessibleDescription('Are you sure?')
  })

  it('moves initial focus inside the dialog', async () => {
    render(<ConfirmHarness />)
    fireEvent.click(screen.getByText('open'))

    await waitFor(() =>
      expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(
        true,
      ),
    )
  })

  it('restores focus to the external opener after closing', async () => {
    render(<ConfirmHarness />)
    const trigger = screen.getByText('open')
    trigger.focus()
    fireEvent.click(trigger)
    const dialog = screen.getByRole('dialog')

    fireEvent.click(screen.getByText('Cancel'))

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(dialog.contains(document.activeElement)).toBe(false)
    expect(document.body.contains(document.activeElement)).toBe(true)
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('closes on Escape when no action is pending', async () => {
    render(<ConfirmHarness />)
    fireEvent.click(screen.getByText('open'))

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('keeps the dialog open on Escape while an action is pending', async () => {
    render(<ConfirmHarness pending />)
    fireEvent.click(screen.getByText('open'))

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
  })

  it('disables both actions while pending', () => {
    render(<ConfirmHarness pending />)
    fireEvent.click(screen.getByText('open'))

    expect(screen.getByText('Confirm')).toBeDisabled()
    expect(screen.getByText('Cancel')).toBeDisabled()
  })

  it('reports the confirm intent to the caller without closing itself', () => {
    const confirm = vi.fn()
    render(<ConfirmHarness onConfirm={confirm} />)
    fireEvent.click(screen.getByText('open'))

    fireEvent.click(screen.getByText('Confirm'))

    expect(confirm).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('acknowledges and closes an alert', async () => {
    const acknowledge = vi.fn()
    function AlertHarness() {
      const [open, setOpen] = useState(true)
      return (
        <AlertDialog
          acknowledgeLabel="OK"
          description="The change has been saved."
          onAcknowledge={acknowledge}
          onOpenChange={setOpen}
          open={open}
          title="Saved"
        />
      )
    }
    render(<AlertHarness />)

    fireEvent.click(screen.getByText('OK'))

    expect(acknowledge).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })
})
