import { useMutation } from '@tanstack/react-query'
import { signInMutationOptions } from '../api/mutations'

export function useSignInMutation() {
  return useMutation(signInMutationOptions())
}
