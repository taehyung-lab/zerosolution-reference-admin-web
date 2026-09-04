import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'

// React Compiler is the project default.
// @vitejs/plugin-react 6 에서는 babel 경유가 아니라 `compiler` 옵션이며
// oxc-transform-react 설치를 요구한다. 호환 확인 후 기본 활성화한다.
// REACT_COMPILER=0 으로 끄고 회귀를 격리할 수 있다.
const REACT_COMPILER = process.env.REACT_COMPILER !== '0'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routeFileIgnorePattern: '\\.test\\.',
    }),
    react({ compiler: REACT_COMPILER }),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
