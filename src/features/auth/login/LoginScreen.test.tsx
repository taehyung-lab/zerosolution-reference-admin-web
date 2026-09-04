import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LoginScreen } from './LoginScreen'
import { ApiError } from '@/api/error'
import { i18n } from '@/shared/i18n/i18n'

const navigate = vi.fn()
const mutateAsync = vi.fn()
const onAuthenticated = vi.fn()

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))
vi.mock('./useSignInMutation', () => ({ useSignInMutation: () => ({ mutateAsync, isPending: false }) }))

function renderScreen(redirectTo?: string) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>
        <LoginScreen onAuthenticated={onAuthenticated} redirectTo={redirectTo} />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

function getLoginForm(): HTMLFormElement {
  const submit = screen.getByRole('button', { name: '로그인' })
  if (!(submit instanceof HTMLButtonElement) || submit.form === null) {
    throw new Error('login submit button must belong to a form')
  }
  return submit.form
}

afterEach(() => {
  navigate.mockReset()
  mutateAsync.mockReset()
  onAuthenticated.mockReset()
})

describe('LoginScreen', () => {
  it('passes the submitted credential to the app boundary and navigates after a successful sign-in', async () => {
    mutateAsync.mockResolvedValue({ accessToken: 'token-1', requirePasswordChange: false })
    renderScreen()
    fireEvent.change(screen.getByLabelText('아이디*'), { target: { value: 'operator' } })
    fireEvent.change(screen.getByLabelText('비밀번호*'), { target: { value: 'password' } })
    fireEvent.submit(getLoginForm())
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/' }))
    expect(onAuthenticated).toHaveBeenCalledWith({ accessToken: 'token-1', loginId: 'operator' })
  })

  it('returns to the guarded destination the auth guard preserved', async () => {
    mutateAsync.mockResolvedValue({ accessToken: 'token-1', requirePasswordChange: false })
    renderScreen('/managers?periodType=UPDATED_AT')
    fireEvent.change(screen.getByLabelText('아이디*'), { target: { value: 'operator' } })
    fireEvent.change(screen.getByLabelText('비밀번호*'), { target: { value: 'password' } })
    fireEvent.submit(getLoginForm())
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/managers?periodType=UPDATED_AT' }),
    )
  })

  it('shows an explicit unsupported-flow error without navigating when a password change is required', async () => {
    mutateAsync.mockResolvedValue({ accessToken: 'token-1', requirePasswordChange: true })
    renderScreen()
    fireEvent.change(screen.getByLabelText('아이디*'), { target: { value: 'operator' } })
    fireEvent.change(screen.getByLabelText('비밀번호*'), { target: { value: 'password' } })
    fireEvent.submit(getLoginForm())
    expect(await screen.findByRole('alert')).toHaveTextContent('이 흐름은 아직 구현되지 않았습니다')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('preserves values and shows the generic credential message for resultCode 2100', async () => {
    mutateAsync.mockRejectedValue(new ApiError({ kind: 'business', message: 'rejected', code: '2100' }))
    renderScreen()
    const id = screen.getByLabelText('아이디*')
    fireEvent.change(id, { target: { value: 'operator' } })
    fireEvent.change(screen.getByLabelText('비밀번호*'), { target: { value: 'password' } })
    fireEvent.submit(getLoginForm())
    expect(await screen.findByRole('alert')).toHaveTextContent('아이디 또는 비밀번호를 확인해주세요')
    expect(id).toHaveValue('operator')
  })

  it('shows an inline credential error when the server rejects the submitted password', async () => {
    mutateAsync.mockRejectedValue(
      new ApiError({ kind: 'unauthorized', message: 'http 401', status: 401, code: '401' }),
    )
    renderScreen()
    fireEvent.change(screen.getByLabelText('아이디*'), { target: { value: 'operator' } })
    fireEvent.change(screen.getByLabelText('비밀번호*'), { target: { value: 'wrong' } })
    fireEvent.submit(getLoginForm())
    expect(await screen.findByRole('alert')).toHaveTextContent('아이디 또는 비밀번호를 확인해주세요')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('maps confirmed field errors to their matching fields', async () => {
    mutateAsync.mockRejectedValue(new ApiError({
      kind: 'validation',
      message: 'invalid input',
      fieldErrors: [{ field: 'id', code: 'required' }, { field: 'password', code: 'required' }],
    }))
    renderScreen()
    fireEvent.change(screen.getByLabelText('아이디*'), { target: { value: 'operator' } })
    fireEvent.change(screen.getByLabelText('비밀번호*'), { target: { value: 'password' } })
    fireEvent.submit(getLoginForm())
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThanOrEqual(2)
  })

  it.each([
    ['network', '연결 문제'],
    ['server-error', '서버 오류'],
  ] as const)('shows a non-credential message for %s failures', async (kind, expectedMessage) => {
    mutateAsync.mockRejectedValue(new ApiError({ kind, message: 'failure' }))
    renderScreen()
    fireEvent.change(screen.getByLabelText('아이디*'), { target: { value: 'operator' } })
    fireEvent.change(screen.getByLabelText('비밀번호*'), { target: { value: 'password' } })
    fireEvent.submit(getLoginForm())
    expect(await screen.findByRole('alert')).toHaveTextContent(expectedMessage)
    expect(screen.queryByText('아이디 또는 비밀번호를 확인해주세요')).not.toBeInTheDocument()
  })
})
