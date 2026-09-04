import { useCallback, useState } from 'react'

/**
 * Owns one state algebra: which sections are open, and which section and field a rejected
 * submit should reveal first.
 *
 * A closed section would unmount its fields. Validation still runs over the whole values object
 * and submit is still rejected, but the messages render nowhere and focus cannot reach a detached
 * control, so the save fails silently. Every form screen needs the same fix — open the section
 * that holds the first error before moving focus — so leaving the wiring to each screen means one
 * missed screen brings the silent failure back. Form sections therefore stay mounted while closed.
 *
 * This hook knows no schema, no field meaning, and no form library. The caller gives the field
 * order per section and passes in the names that failed; it gets back the field to focus, after
 * the sections holding errors are opened. Sections start open.
 */
export function useFormSections<TSection extends string, TField extends string>(
  sections: Readonly<Record<TSection, readonly TField[]>>,
  options?: {
    /**
     * Names of the fields whose errors the form is currently showing (client or server). The
     * caller selects them from its form store; this hook only counts them per section so the
     * section header can keep saying "오류 N개" while the section is collapsed.
     */
    readonly invalidFields?: readonly string[]
  },
) {
  const invalidFields = options?.invalidFields
  const [openSections, setOpenSections] = useState<ReadonlySet<TSection>>(
    () => new Set(Object.keys(sections) as TSection[]),
  )

  const sectionProps = useCallback(
    (section: TSection) => ({
      open: openSections.has(section),
      onOpenChange: (open: boolean) => {
        setOpenSections((current) => {
          const next = new Set(current)
          if (open) next.add(section)
          else next.delete(section)
          return next
        })
      },
      keepMounted: true,
      errorCount:
        invalidFields === undefined
          ? 0
          : sections[section].filter((field) => invalidFields.includes(field)).length,
    }),
    [openSections, sections, invalidFields],
  )

  /**
   * Opens every section that holds a failed field and returns the first failed field in the
   * order the caller declared, or `undefined` when none of the declared fields failed. The
   * caller moves focus, because only it can reach the form control.
   */
  const revealInvalid = useCallback(
    (invalidFields: readonly string[]): TField | undefined => {
      const failed = new Set(invalidFields)
      const entries = Object.entries(sections) as [TSection, readonly TField[]][]
      const toOpen = entries.filter(([, fields]) => fields.some((field) => failed.has(field)))
      if (toOpen.length > 0) {
        setOpenSections((current) => {
          const next = new Set(current)
          for (const [section] of toOpen) next.add(section)
          return next
        })
      }
      for (const [, fields] of entries) {
        const first = fields.find((field) => failed.has(field))
        if (first !== undefined) return first
      }
      return undefined
    },
    [sections],
  )

  return { sectionProps, revealInvalid }
}
