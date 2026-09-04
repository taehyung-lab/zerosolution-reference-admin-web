import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/app/providers/AuthProvider'
import { LoginScreen } from '@/features/auth/login/LoginScreen'

export const Route = createFileRoute('/login')({ component: LoginRoute })

function LoginRoute() {
  const { setAccessToken } = useAuth()
  return <LoginScreen onAuthenticated={setAccessToken} />
}
