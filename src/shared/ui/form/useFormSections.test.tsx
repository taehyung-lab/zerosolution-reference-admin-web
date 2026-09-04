import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useFormSections } from './useFormSections'

const sections = {
  account: ['type', 'permission', 'loginId'],
  profile: ['name', 'phone', 'email'],
  organization: ['organization'],
} as const

type Section = keyof typeof sections

function closeAll(result: { current: ReturnType<typeof useFormSections<Section, string>> }) {
  act(() => {
    for (const section of Object.keys(sections) as Section[]) result.current.sectionProps(section).onOpenChange(false)
  })
}

describe('useFormSections with several sections', () => {
  it('counts the invalid fields per section and keeps form sections mounted', () => {
    const { result, rerender } = renderHook(
      ({ invalidFields }: { invalidFields: readonly string[] }) =>
        useFormSections(sections, { invalidFields }),
      { initialProps: { invalidFields: ['loginId', 'type', 'email'] } },
    )
    expect(result.current.sectionProps('account')).toMatchObject({ open: true, keepMounted: true, errorCount: 2 })
    expect(result.current.sectionProps('profile').errorCount).toBe(1)
    expect(result.current.sectionProps('organization').errorCount).toBe(0)

    rerender({ invalidFields: ['email'] })
    expect(result.current.sectionProps('account').errorCount).toBe(0)
    expect(result.current.sectionProps('profile').errorCount).toBe(1)
  })

  it('opens every section that holds a failed field and leaves the others as they were', () => {
    const { result } = renderHook(() => useFormSections(sections))
    closeAll(result)
    act(() => result.current.sectionProps('profile').onOpenChange(true))

    let target: string | undefined
    act(() => {
      target = result.current.revealInvalid(['organization', 'loginId'])
    })

    expect(result.current.sectionProps('account').open).toBe(true)
    expect(result.current.sectionProps('organization').open).toBe(true)
    expect(result.current.sectionProps('profile').open).toBe(true)
    expect(target).toBe('loginId')
  })

  it('does not open a section without errors and returns undefined when nothing failed', () => {
    const { result } = renderHook(() => useFormSections(sections))
    closeAll(result)
    let target: string | undefined
    act(() => {
      target = result.current.revealInvalid(['unknownField'])
    })
    expect(target).toBeUndefined()
    expect(result.current.sectionProps('account').open).toBe(false)
    expect(result.current.sectionProps('profile').open).toBe(false)
    expect(result.current.sectionProps('organization').open).toBe(false)
  })

  it('lets the user close a revealed section again; nothing pins it open', () => {
    const { result } = renderHook(() => useFormSections(sections))
    closeAll(result)
    act(() => {
      result.current.revealInvalid(['name'])
    })
    expect(result.current.sectionProps('profile').open).toBe(true)
    act(() => result.current.sectionProps('profile').onOpenChange(false))
    expect(result.current.sectionProps('profile').open).toBe(false)
  })
})
