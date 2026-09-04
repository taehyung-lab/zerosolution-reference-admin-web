import { mutationOptions } from '@tanstack/react-query'
import { signIn } from '@/api/generated/endpoints'
import { toSession, type SignInResponse } from '../model/session'

export const signInMutationOptions = () =>
  mutationOptions({
    mutationFn: async (request: { id: string; password: string }) => {
      const response: SignInResponse = await signIn(request)
      return toSession(response)
    },
    retry: false,
  })
