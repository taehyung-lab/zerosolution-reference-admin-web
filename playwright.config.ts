import { defineConfig } from '@playwright/test'

const baseURL = 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './tests/e2e',
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
    command: 'pnpm dev --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
