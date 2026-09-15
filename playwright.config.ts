import { defineConfig } from '@playwright/test'

const port = process.env.PLAYWRIGHT_PORT ?? '4173'
const baseURL = `http://127.0.0.1:${port}`
const apiMock = process.env.PLAYWRIGHT_API_MOCK === 'true'
const webServerCommand = apiMock
  ? `pnpm dev:mock --host 127.0.0.1 --port ${port} --strictPort`
  : process.env.CI
  ? `pnpm build && pnpm preview --host 127.0.0.1 --port ${port} --strictPort`
  : `pnpm dev --host 127.0.0.1 --port ${port} --strictPort`

export default defineConfig({
  testDir: './tests/e2e',
  ...(apiMock ? { testMatch: 'api-mock.spec.ts' } : { testIgnore: 'api-mock.spec.ts' }),
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    /**
     * `/_app` 가드는 저장된 자격증명을 요구한다. smoke 는 인증된 세션의 화면을 검증하므로
     * 세션을 미리 심는다. 토큰의 유효성은 서버만 판정하고 API 는 route mock 이 대신한다.
     */
    storageState: {
      cookies: [],
      origins: [
        {
          origin: baseURL,
          localStorage: [
            { name: 'accessToken', value: 'e2e-smoke-token' },
            { name: 'loginId', value: 'e2e_smoke' },
          ],
        },
      ],
    },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: webServerCommand,
    url: baseURL,
    // 같은 포트에 다른 작업 트리의 서버가 떠 있으면 재사용은 그 화면을 조용히 검증한다.
    // 충돌은 --strictPort 로 시끄럽게 실패시킨다.
    reuseExistingServer: false,
  },
})
