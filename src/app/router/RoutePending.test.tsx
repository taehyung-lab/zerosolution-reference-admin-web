import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { LocaleProvider } from '@/app/providers/LocaleProvider'
import { createAppRouter } from './router'
import { RoutePending } from './RoutePending'

it('is the router default pending surface and announces the shared loading copy', () => {
  render(
    <LocaleProvider>
      <RoutePending />
    </LocaleProvider>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('데이터를 불러오는 중입니다. 잠시만 기다려 주세요.')
})

it('is registered as the router default pending component', () => {
  const router = createAppRouter({ queryClient: { getQueryData: () => undefined } as never })
  expect(router.options.defaultPendingComponent).toBe(RoutePending)
})
