import { defineConfig } from 'orval'

/**
 * 타입과 endpoint 함수만 생성한다. React Query hook, key, mutation policy는 생성하지 않는다.
 * 그것들은 features/{domain}/api 가 소유한다 (`api-contract` 경계).
 *
 * input은 원본 스냅샷이 아니라 검증형 변환 산출물이다. 원본은 증거로 보존한다.
 */
export default defineConfig({
  admin: {
    input: { target: './.openapi-prepared/admin.prepared.json' },
    output: {
      mode: 'single',
      target: './src/api/generated/endpoints.ts',
      schemas: './src/api/generated/models',
      client: 'axios-functions',
      override: {
        mutator: { path: './src/api/http/mutator.ts', name: 'customInstance' },
      },
    },
  },
})
