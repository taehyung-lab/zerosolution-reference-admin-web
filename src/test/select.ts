import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect } from 'vitest'

const CLOSED = () => { expect(screen.queryByRole('listbox')).toBeNull() }

/**
 * Picks an option from a `shared/ui/primitives/Select`.
 *
 * The control is a Radix listbox: options exist only while the trigger is open, they render in a
 * portal, and the rest of the page is hidden from the accessibility tree meanwhile — so a test that
 * continues before it closes cannot find anything else by role.
 *
 * A feature usually loads its options from a query, and a list opened before that query resolves
 * does not pick up the arriving options. So this reopens the list instead of waiting inside it, and
 * only then reports that the option is missing.
 */
export async function chooseOption(trigger: HTMLElement, optionName: string | RegExp) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    fireEvent.keyDown(trigger, { key: 'Enter' })
    const listbox = await screen.findByRole('listbox')
    const option = within(listbox).queryByRole('option', { name: optionName })
    if (option !== null) {
      fireEvent.click(option)
      await waitFor(CLOSED)
      return
    }
    fireEvent.keyDown(listbox, { key: 'Escape' })
    await waitFor(CLOSED)
  }
  throw new Error(`No option named ${String(optionName)} appeared in the select after reopening it.`)
}

/** The same, addressed by the field's accessible name. */
export async function chooseOptionIn(fieldName: string | RegExp, optionName: string | RegExp) {
  await chooseOption(screen.getByRole('combobox', { name: fieldName }), optionName)
}
