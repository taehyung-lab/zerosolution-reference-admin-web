import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UiLocale } from '@/shared/i18n/locale'
import { managerKeys } from '../api/keys'
import { managerUpdateMutation } from '../api/mutations'

/** 무효화 범위의 근거는 useCreateManagerMutation 과 같다. */
export function useUpdateManagerMutation(locale: UiLocale, id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    ...managerUpdateMutation(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: managerKeys.all(locale) })
    },
  })
}
