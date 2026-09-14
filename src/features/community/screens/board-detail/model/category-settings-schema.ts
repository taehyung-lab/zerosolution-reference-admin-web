import { z } from 'zod'
import { BOARD_CATEGORY_NAME_MAX_LENGTH, boardUsages } from '@/features/community/model/board'

export const categorySettingsSchema = (requiredMessage: string) => z.object({
  categories: z.array(z.object({
    id: z.string(),
    name: z.string().trim().min(1, requiredMessage).max(BOARD_CATEGORY_NAME_MAX_LENGTH),
    usage: z.enum(boardUsages),
  })).min(1, requiredMessage),
})

export type CategorySettingsValues = z.input<ReturnType<typeof categorySettingsSchema>>
