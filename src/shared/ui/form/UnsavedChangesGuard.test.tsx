import { fireEvent, render, screen, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@/shared/i18n/i18n'
import { UnsavedChangesProvider, useUnsavedChangesGuard } from './UnsavedChangesGuard'

const proceed = vi.fn()
const reset = vi.fn()
const navigate = vi.fn()
let blocked = false
let lastBlockerOpts: { disabled?: boolean } | undefined

vi.mock('@tanstack/react-router', () => ({
  useBlocker: (opts: { disabled?: boolean }) => {
    lastBlockerOpts = opts
    return blocked ? { status: 'blocked', proceed, reset } : { status: 'idle' }
  },
}))

/** Stands in for a form: one cancel button that asks the guard to leave, plus the guard's dialog. */
function Harness({ when }: { readonly when: boolean }) {
  const guard = useUnsavedChangesGuard({ when })
  return (
    <>
      <button onClick={() => guard.leave(navigate)} type="button">
        leave
      </button>
      <button onClick={() => guard.close(navigate)} type="button">close</button>
      <button onClick={() => guard.close(navigate, { when: false })} type="button">close clean section</button>
      <button onClick={() => guard.close(navigate, { when: true })} type="button">close dirty section</button>
      {guard.dialog}
    </>
  )
}

const ui = (when: boolean) => (
  <I18nextProvider i18n={i18n}>
    <UnsavedChangesProvider>
      <Harness when={when} />
    </UnsavedChangesProvider>
  </I18nextProvider>
)

const clickLeave = () => fireEvent.click(screen.getByRole('button', { name: 'leave' }))

beforeEach(() => {
  blocked = false
  lastBlockerOpts = undefined
  proceed.mockReset()
  reset.mockReset()
  navigate.mockReset()
})

describe('useUnsavedChangesGuard', () => {
  it('requires the app-level provider', () => {
    expect(() =>
      render(
        <I18nextProvider i18n={i18n}>
          <Harness when={false} />
        </I18nextProvider>,
      ),
    ).toThrow('UnsavedChangesProvider')
  })
  it('scopes local dismissal to its form without disabling the page blocker', () => {
    render(ui(true))
    fireEvent.click(screen.getByRole('button', { name: 'close clean section' }))
    expect(navigate).toHaveBeenCalledOnce()
    expect(lastBlockerOpts?.disabled).toBe(false)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'close dirty section' }))
    expect(navigate).toHaveBeenCalledOnce()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  it('asks before a dirty local dismiss and keeps the form when cancelled', () => {
    render(ui(true))
    fireEvent.click(screen.getByRole('button', { name: 'close' }))
    expect(navigate).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toHaveTextContent('입력을 취소하시겠습니까?')
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '취소' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(navigate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'close' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }))
    expect(navigate).toHaveBeenCalledOnce()
    expect(proceed).not.toHaveBeenCalled()
  })

  it('dismisses a clean local form immediately', () => {
    render(ui(false))
    fireEvent.click(screen.getByRole('button', { name: 'close' }))
    expect(navigate).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('disables the blocker while the form is clean and lets leave() navigate without asking', () => {
    render(ui(false))
    expect(lastBlockerOpts?.disabled).toBe(true)

    clickLeave()
    expect(navigate).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('confirms navigation the user did not start from the form with the 화면 이동 copy', () => {
    blocked = true
    render(ui(true))
    expect(lastBlockerOpts?.disabled).toBe(false)

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: '알림' })).toBeInTheDocument()
    expect(dialog).toHaveTextContent('화면을 이동할 경우 입력된 정보는 모두 삭제됩니다.')
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }))
    expect(proceed).toHaveBeenCalledOnce()
  })

  it('confirms a leave() the form requested with the 취소 copy, then forgets the reason when the user keeps editing', () => {
    const { rerender } = render(ui(true))
    clickLeave()
    expect(navigate).toHaveBeenCalledOnce()
    // The Router blocks in its own tick after navigate(); flip the mocked status the same way.
    blocked = true
    rerender(ui(true))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('취소할 경우 입력된 정보는 모두 삭제됩니다.')
    fireEvent.click(within(dialog).getByRole('button', { name: '취소' }))
    expect(reset).toHaveBeenCalledOnce()
    expect(proceed).not.toHaveBeenCalled()

    // The next blocked navigation did not come from the cancel button.
    expect(screen.getByRole('dialog')).toHaveTextContent('화면을 이동할 경우 입력된 정보는 모두 삭제됩니다.')
  })

  it('proceeds through the blocker after the 취소 copy is confirmed', () => {
    const { rerender } = render(ui(true))
    clickLeave()
    blocked = true
    rerender(ui(true))

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }))
    expect(proceed).toHaveBeenCalledOnce()
    expect(reset).not.toHaveBeenCalled()
  })
})
