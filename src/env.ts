import { z } from 'zod'

/**
 * 환경변수 계약. 앱 부팅 시 한 번 검증하고, 실패하면 조용히 넘어가지 않고 즉시 실패한다.
 *
 * 신규 제품의 실제 배포 환경은 미확인이다(AGENTS.md §2). 여기에 특정 호스트를
 * 기본값으로 박아두면 확인되지 않은 사실을 코드에 새기는 것이므로 하지 않는다.
 *
 * VITE_API_BASE_URL 은 **origin 까지만** 담는다. 생성된 endpoint 가 이미
 * `/api/v1/...` 경로를 포함하므로 여기에 `/api` 를 넣으면 `/api/api/v1` 이 된다.
 * 기본값은 빈 문자열(same-origin)이며 어떤 제품 주장도 담지 않는다.
 */
export const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('ZERO PLUS+ Admin'),
  VITE_API_BASE_URL: z
    .string()
    .default('')
    .refine((v) => !/\/api\/?$/.test(v), {
      message: 'baseURL 에 /api 를 넣지 마라. 생성된 endpoint 가 이미 /api/v1 을 포함한다.',
    }),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
})

export type Env = z.infer<typeof envSchema>

export function parseEnv(raw: unknown): Env {
  const result = envSchema.safeParse(raw)
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n')
    throw new Error(`환경변수 검증 실패\n${detail}`)
  }
  return result.data
}

export const env: Env = parseEnv(import.meta.env)
