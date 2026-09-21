import { useState } from 'react'

/**
 * Owns the lifetime of one rejection message for an action that requires a selection.
 * The caller decides what counts as a rejection and what the message says; this hook only
 * keeps the message until it is dismissed, so every precheck fails the same way instead of
 * each action button growing its own inline error state.
 */
export function useSelectionGate(selectedCount: number) {
  const [message, setMessage] = useState<string>()

  return {
    message,
    requireSelection: (missingSelectionMessage: string) => {
      if (selectedCount > 0) return true
      setMessage(missingSelectionMessage)
      return false
    },
    /**
     * A caller's other rules (an unfinished cascade value, for example) reject into the same
     * alert. Returns `false` so a check reads as one `return`.
     */
    reject: (message: string) => {
      setMessage(message)
      return false
    },
    close: () => setMessage(undefined),
  }
}
