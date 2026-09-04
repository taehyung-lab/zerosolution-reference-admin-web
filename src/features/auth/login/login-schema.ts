import { z } from 'zod'

export const loginSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(1),
})

export type LoginValues = z.infer<typeof loginSchema>
