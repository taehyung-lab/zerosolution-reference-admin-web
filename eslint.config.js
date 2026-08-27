import { existsSync, readdirSync } from 'node:fs'
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import importX from 'eslint-plugin-import-x'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import tanstackQuery from '@tanstack/eslint-plugin-query'

/**
 * 레이어 import 경계를 실제 import graph 위에서 검사한다.
 * 키워드나 파일 이름 검사가 아니다 (설계 §13).
 *
 *   app / routes  ->  features  ->  shared, api  ->  generated
 */
const LAYER_ZONES = [
  // shared는 도메인·서버 계약·라우터를 알 수 없다.
  { target: './src/shared', from: './src/features', message: 'shared는 feature를 알 수 없다.' },
  { target: './src/shared', from: './src/routes', message: 'shared는 route를 알 수 없다.' },
  { target: './src/shared', from: './src/app', message: 'shared는 app을 알 수 없다.' },
  { target: './src/shared', from: './src/api', message: 'shared는 서버 계약을 알 수 없다.' },
  // api는 transport 인프라다. 위 레이어를 역참조하지 않는다.
  { target: './src/api', from: './src/features', message: 'api는 feature를 알 수 없다.' },
  { target: './src/api', from: './src/app', message: 'api는 app을 역참조하지 않는다. 좁은 port를 주입받는다.' },
  { target: './src/api', from: './src/routes', message: 'api는 route를 알 수 없다.' },
  // features는 route/app을 역참조하지 않는다.
  { target: './src/features', from: './src/routes', message: 'feature는 route를 역참조하지 않는다.' },
  { target: './src/features', from: './src/app', message: 'feature는 app을 역참조하지 않는다.' },
]

/** feature 간 직접 import 금지. route가 합성한다. 도메인 목록에서 zone을 생성한다. */
function crossFeatureZones() {
  if (!existsSync('./src/features')) return []
  return readdirSync('./src/features', { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({
      target: `./src/features/${d.name}`,
      from: './src/features',
      except: [`./${d.name}`],
      message: 'feature 간 직접 import 금지. route가 합성한다.',
    }))
}

const RESTRICTED = {
  patterns: [
    {
      group: ['axios', 'axios/*'],
      message: 'Axios는 src/api/http만 사용한다. feature/route/UI는 feature API 모듈을 쓴다.',
    },
    {
      group: ['@/api/generated', '@/api/generated/*', '**/api/generated', '**/api/generated/*'],
      message: 'generated는 features/*/api 와 src/api 만 import 한다.',
    },
    {
      group: ['radix-ui', 'radix-ui/*', '@radix-ui/*'],
      message: 'Radix 직접 import는 shared/ui/primitives 에서만 허용한다.',
    },
  ],
}

const relaxed = (drop) => ({
  patterns: RESTRICTED.patterns.filter((p) => !p.group.some((g) => drop.some((d) => g.includes(d)))),
})

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.openapi-prepared/**',
      'src/api/generated/**', // 생성물은 편집·검사 대상이 아니다
      'src/routeTree.gen.ts',
      'openapi/**',
      'public/mockServiceWorker.js', // MSW가 생성한다
    ],
  },

  // --- 설정/스크립트: 타입 정보 없는 기본 검사 ---
  {
    files: ['*.{js,ts}', 'scripts/**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node, ecmaVersion: 2023, sourceType: 'module' },
  },
  {
    files: ['vite.config.ts', 'vitest.config.ts', 'orval.config.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },

  // --- 애플리케이션 소스: 타입 정보 기반 검사 ---
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
      tanstackQuery.configs['flat/recommended'],
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver({ alwaysTryTypes: true })],
    },
    rules: {
      'no-restricted-imports': ['error', RESTRICTED],
      'import-x/no-restricted-paths': ['error', { zones: [...LAYER_ZONES, ...crossFeatureZones()] }],
      'import-x/no-cycle': 'error',
      // 넓은 barrel import 제한
      'import-x/no-namespace': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },

  // --- 소유 레이어에서만 경계 완화 (뒤에 오는 항목이 이긴다: 넓은 것 -> 좁은 것 순서) ---
  {
    // features/*/api 와 src/api 는 generated를 import 할 수 있다.
    files: ['src/features/*/api/**/*.ts', 'src/api/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', relaxed(['api/generated'])] },
  },
  {
    // src/api/http 는 추가로 Axios를 직접 소유한다. 위 항목보다 뒤에 와야 한다.
    files: ['src/api/http/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', relaxed(['axios', 'api/generated'])] },
  },
  {
    files: ['src/shared/ui/primitives/**/*.tsx'],
    rules: { 'no-restricted-imports': ['error', relaxed(['radix'])] },
  },

  // --- 테스트 ---
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { '@typescript-eslint/no-unsafe-assignment': 'off' },
  },
)
