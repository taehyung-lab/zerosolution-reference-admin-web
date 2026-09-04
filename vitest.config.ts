import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    env: { TZ: "Asia/Seoul", VITE_API_BASE_URL: "" },
    environment: "jsdom",
    // 절대 URL 단언으로 baseURL 조립 오류를 잡기 위해 origin을 고정한다.
    environmentOptions: { jsdom: { url: "http://localhost:3000" } },
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
  },
});
