import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ModalCover } from './ModalCover'

it('renders a labelled alertdialog that owns focus and hides the document behind it', () => {
  render(
    <>
      <button type="button">behind</button>
      <ModalCover labelledBy="cover-title">
        <h1 id="cover-title">Cover</h1>
        <button type="button" autoFocus>
          act
        </button>
      </ModalCover>
    </>,
  )
  const cover = screen.getByRole('alertdialog', { name: 'Cover' })
  expect(cover).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'act' })).toHaveFocus()
  // Radix marks everything outside the modal aria-hidden, so the page behind is not reachable.
  expect(screen.queryByRole('button', { name: 'behind' })).not.toBeInTheDocument()
})
