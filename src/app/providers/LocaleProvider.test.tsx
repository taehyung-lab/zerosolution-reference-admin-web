import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { readLocale } from '@/api/http/locale'
import { useLocale } from '@/shared/i18n/locale-context'
import { LocaleProvider } from './LocaleProvider'

function LocaleProbe() {
  const { locale, setLocale } = useLocale()
  return (
    <div>
      <span>{locale}</span>
      <button type="button" onClick={() => setLocale('en')}>
        switch
      </button>
    </div>
  )
}

describe('LocaleProvider', () => {
  it('명시적 기본값 ko를 UI와 transport port에 제공한다', () => {
    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    )

    expect(screen.getByText('ko')).toBeInTheDocument()
    expect(readLocale()).toBe('ko')
  })

  it('locale 전환을 UI 상태와 transport port에 함께 반영한다', async () => {
    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'switch' }))

    expect(screen.getByText('en')).toBeInTheDocument()
    await waitFor(() => expect(readLocale()).toBe('en'))
  })
})
