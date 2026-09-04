import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useAuth } from '@/app/providers/AuthProvider'
import { LoginScreen } from '@/features/auth/login/LoginScreen'

/**
 * 인증 가드가 남긴 원래 목적지. URL 로 오는 값이므로 앱 내부 절대 경로만 받고
 * `//host` 같은 프로토콜 상대 주소는 버린다. 잘못된 값은 목적지 없음으로 취급한다.
 */
const loginSearchSchema = z.object({
  redirect: z.string().regex(/^\/(?!\/)/).optional().catch(undefined),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  component: LoginRoute,
})

function LoginRoute() {
  const { startSession } = useAuth()
  const { redirect } = Route.useSearch()
  return <LoginScreen onAuthenticated={startSession} redirectTo={redirect} />
}
