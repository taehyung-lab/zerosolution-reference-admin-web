import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import importX from 'eslint-plugin-import-x'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import tanstackQuery from '@tanstack/eslint-plugin-query'

const projectRoot = process.env.ESLINT_PROJECT_ROOT ?? import.meta.dirname
const resolverProject = process.env.ESLINT_PROJECT_TSCONFIG

/**
 * 레이어 import 경계를 실제 import graph 위에서 검사한다.
 * 키워드나 파일 이름 검사가 아니다 (`folder-structure-contract`의 의존 방향 계약).
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

/** 도메인 내부 소유권은 실제 디렉터리에서 읽는다. 새 화면에도 같은 경계가 적용된다. */
function featureInternalZones() {
  const directories = (dir) => existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    : []
  return directories('./src/features').flatMap((domain) => {
    const root = `./src/features/${domain}`
    const zones = ['api', 'model', 'lib', 'config', 'fixtures', 'mechanics'].map((owner) => ({
      target: `${root}/${owner}`, from: `${root}/screens`,
      message: '하위 소유자는 screens를 역참조하지 않는다. 공통 값 또는 mechanic의 소유권을 확인한다.',
    }))
    for (const owner of ['api', 'model', 'lib', 'config', 'fixtures']) zones.push({
      target: `${root}/${owner}`, from: `${root}/mechanics`,
      message: '도메인 계약과 fixture는 mechanic 실행·UI를 역참조하지 않는다.',
    })
    for (const screen of directories(`${root}/screens`)) zones.push({
      target: `${root}/screens/${screen}`, from: `${root}/screens`, except: [`./${screen}`],
      message: '화면끼리 내부를 import하지 않는다. 실제 공유 기능은 mechanics가 소유한다.',
    })
    const owners = ['screens', 'mechanics'].flatMap((kind) => directories(`${root}/${kind}`).map((name) => `${root}/${kind}/${name}`))
    for (const owner of [root, ...owners]) {
      for (const segment of ['model', 'lib', 'config']) for (const presentation of owners) zones.push({
        target: `${owner}/${segment}`, from: `${presentation}/ui`,
        message: 'model/lib/config는 feature UI를 역참조하지 않는다. 렌더 조립은 ui가 소유한다.',
      })
    }
    return zones
  })
}

const RESTRICTED = {
  paths: [
    {
      name: 'react',
      importNames: ['forwardRef'],
      message:
        'React 19에서 ref는 일반 prop이다. @types/react 가 forwardRef 에 @deprecated 를 달면 이 규칙을 제거한다.',
    },
  ],
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

/**
 * 규범 문서가 exact 이름으로 금지한 추상화. 이름 회귀만 잡는 좁은 tripwire이며
 * "사전 카탈로그 금지" 전반을 집행한다고 주장하지 않는다. 의미 판정은 여전히 리뷰가 소유한다.
 * 이름을 추가할 때는 skill/ADR이 그 exact 문자열로 금지한 근거가 있어야 한다.
 */
const PROHIBITED_ABSTRACTION_BINDINGS = new Map([
  ['ResourcePage', 'feature-contract SKILL.md, list-workflow.md, screen-composition.md'],
  ['UniversalList', 'ADR 0009'],
  ['useCrud', 'feature-contract SKILL.md'],
  ['useListPageController', 'ADR 0009'],
  ['useListTable', 'list-workflow.md, react-performance.md'],
  ['usePagedTable', 'list-workflow.md'],
  ['useResourceQuery', 'ADR 0011'],
])

/** 금지된 추상화 이름을 선언하거나 import 하면 실패한다. 문자열·주석 속 언급은 대상이 아니다. */
const noProhibitedAbstraction = {
  meta: {
    type: 'problem',
    messages: { prohibited: "'{{name}}' is a prohibited abstraction ({{source}})." },
  },
  create(context) {
    const report = (node, name) => {
      const source = PROHIBITED_ABSTRACTION_BINDINGS.get(name)
      if (source !== undefined) context.report({ node, messageId: 'prohibited', data: { name, source } })
    }
    const reportPattern = (pattern) => {
      if (pattern?.type === 'Identifier') report(pattern, pattern.name)
    }
    return {
      FunctionDeclaration: (node) => reportPattern(node.id),
      ClassDeclaration: (node) => reportPattern(node.id),
      TSTypeAliasDeclaration: (node) => reportPattern(node.id),
      TSInterfaceDeclaration: (node) => reportPattern(node.id),
      VariableDeclarator: (node) => reportPattern(node.id),
      ImportSpecifier: (node) => report(node, node.imported.name ?? node.local.name),
      ImportDefaultSpecifier: (node) => reportPattern(node.local),
    }
  },
}

const USER_VISIBLE_ATTRIBUTES = new Set(['aria-label', 'placeholder', 'title'])
const hasUserFacingText = (value) => /[\p{L}\p{N}]/u.test(value.trim())

/** User-visible JSX text must come from the caller/i18n. */
const noUserFacingLiteral = {
  meta: { type: 'problem', messages: { literal: 'User-facing JSX text must be supplied by i18n/caller.' } },
  create(context) {
    return {
      JSXText(node) {
        if (hasUserFacingText(node.value)) context.report({ node, messageId: 'literal' })
      },
      JSXAttribute(node) {
        if (
          USER_VISIBLE_ATTRIBUTES.has(node.name.name) &&
          node.value?.type === 'Literal' &&
          typeof node.value.value === 'string' &&
          hasUserFacingText(node.value.value)
        ) context.report({ node, messageId: 'literal' })
      },
      JSXExpressionContainer(node) {
        const expression = node.expression
        if (
          expression.type === 'Literal' &&
          typeof expression.value === 'string' &&
          hasUserFacingText(expression.value)
        ) context.report({ node, messageId: 'literal' })
        if (
          expression.type === 'TemplateLiteral' &&
          expression.expressions.length === 0 &&
          hasUserFacingText(expression.quasis[0]?.value.cooked ?? '')
        ) context.report({ node, messageId: 'literal' })
      },
    }
  },
}

// API 훅은 요청 실행만 소유한다. 캐시 후속 처리·전역 진행 집계는 workflow/app의 책임이다.
const FEATURE_API_FORBIDDEN_HOOKS = [
  'useQueryClient',
  'useMutationState',
  'useIsFetching',
  'useIsMutating',
]

// 완화 대상은 레이어별 모듈 허용 범위뿐이다. paths 규칙은 어느 레이어에서도 유지한다.
const relaxed = (drop) => ({
  paths: RESTRICTED.paths,
  patterns: RESTRICTED.patterns.filter((p) => !p.group.some((g) => drop.some((d) => g.includes(d)))),
})

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.ai-work/**', // 임시 세션과 격리 작업 트리는 현재 제품의 검사 대상이 아니다.
      // 저장소 안의 checkout(격리 worktree). 아래 루트 고정 패턴은 그 안까지 닿지 않아 트리가 통째로 검사 대상이 되고,
      // 2026-09-10 실측으로 본체 3.06GB + .worktrees 3.33GB + .claude/worktrees 3.13GB 가 heap 상한 4.1GB 를 넘겼다.
      '.worktrees/**',
      '.claude/worktrees/**',
      '.openapi-prepared/**',
      'src/api/generated/**', // 생성물은 편집·검사 대상이 아니다
      'src/routeTree.gen.ts',
      'tests/gates/fixtures/**', // 부정 대조군은 gates:negative가 --no-ignore로 개별 실행한다.
      'openapi/**',
      'public/mockServiceWorker.js', // MSW가 생성한다
    ],
  },

  // local 플러그인은 한 번만 정의한다. 각 룰의 적용 범위는 아래 블록들이 정한다.
  {
    plugins: {
      local: {
        rules: {
          'no-user-facing-literal': noUserFacingLiteral,
          'no-prohibited-abstraction': noProhibitedAbstraction,
        },
      },
    },
  },
  {
    files: [
      'src/app/**/*.tsx',
      'src/features/**/*.tsx',
      'src/routes/**/*.tsx',
      'src/shared/ui/**/*.tsx',
    ],
    ignores: ['**/*.test.tsx'],
    rules: {
      'local/no-user-facing-literal': 'error',
    },
  },

  // 금지된 추상화 이름은 UI 파일에 한정되지 않는다. hook·model 은 .ts 이므로 소스 전체를 본다.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: { 'local/no-prohibited-abstraction': 'error' },
  },

  // --- 설정/스크립트: 타입 정보 없는 기본 검사 ---
  {
    files: ['*.{js,ts}', 'scripts/**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node, ecmaVersion: 2023, sourceType: 'module' },
  },
  {
    files: ['vite.config.ts', 'vitest.config.ts', 'orval.config.ts', 'playwright.config.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['tests/e2e/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: projectRoot },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
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
      parserOptions: { projectService: true, tsconfigRootDir: projectRoot },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          ...(resolverProject === undefined ? {} : { project: [resolve(resolverProject)] }),
        }),
      ],
    },
    rules: {
      // recommendedTypeChecked 에는 없고 strictTypeChecked 에만 있다. 라이브러리가 표시한
      // deprecation 은 타입·테스트가 잡지 못하므로 lint 가 소유한다.
      '@typescript-eslint/no-deprecated': 'error',
      'no-restricted-imports': ['error', RESTRICTED],
      'import-x/no-restricted-paths': ['error', { zones: [...LAYER_ZONES, ...crossFeatureZones(), ...featureInternalZones()] }],
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
    // API-only 훅을 허용하되 URL·폼 상태와 캐시 후속 처리는 workflow가 소유한다.
    files: ['src/features/*/api/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...RESTRICTED.paths,
            {
              name: '@tanstack/react-query',
              importNames: FEATURE_API_FORBIDDEN_HOOKS,
              message: 'API는 캐시 후속 처리·전역 진행 집계를 소유하지 않는다. workflow/app에 둔다(ADR 0011).',
            },
          ],
          patterns: [...relaxed(['api/generated']).patterns, { group: ['@tanstack/react-router', '@tanstack/react-form'], message: 'API는 URL·폼 workflow를 소유하지 않는다.' }],
        },
      ],
    },
  },
  {
    // src/api/http 는 추가로 Axios를 직접 소유한다. 위 항목보다 뒤에 와야 한다.
    files: ['src/api/http/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', relaxed(['axios', 'api/generated'])] },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { paths: RESTRICTED.paths, patterns: [...RESTRICTED.patterns, { group: ['@tanstack/react-router'], message: 'shared는 Router를 모른다. UnsavedChangesGuard만 좁은 dirty-navigation 예외다.' }, { group: ['@tanstack/react-query'], message: 'shared는 Query를 모른다. feature가 Query를 plain facts로 바꿔 넘긴다(ADR 0009).' }] }] },
  },
  {
    files: ['src/shared/ui/primitives/**/*.tsx'],
    rules: { 'no-restricted-imports': ['error', { paths: RESTRICTED.paths, patterns: [...relaxed(['radix']).patterns, { group: ['@tanstack/react-router'], message: 'shared는 Router를 모른다. UnsavedChangesGuard만 좁은 dirty-navigation 예외다.' }, { group: ['@tanstack/react-query'], message: 'shared는 Query를 모른다. feature가 Query를 plain facts로 바꿔 넘긴다(ADR 0009).' }] }] },
  },
  {
    // 런타임 예외는 UnsavedChangesGuard 하나. shared 테스트는 그 guard 계약을 실제 Router(memory history)로
    // 증명해야 하므로 Router import를 허용한다 — 테스트는 shared 런타임에 Router 지식을 새지 않는다.
    files: ['src/shared/ui/form/UnsavedChangesGuard.tsx', 'src/shared/**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', RESTRICTED] },
  },

  // --- 테스트 ---
  {
    files: ['src/features/**/lib/**/*.{ts,tsx}', 'src/features/**/config/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', {
      paths: RESTRICTED.paths,
      patterns: [...RESTRICTED.patterns, { group: ['react', 'react/*', 'react-dom', 'react-dom/*', '@tanstack/react-*'], message: 'lib/config는 실행 훅을 소유하지 않는다. 상태·업무 전이는 model, 서버 실행은 api에 둔다.' }],
    }] },
  },
  {
    files: ['src/features/*/model/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', {
      paths: RESTRICTED.paths,
      patterns: [...RESTRICTED.patterns, { group: ['react', 'react/*', 'react-dom', 'react-dom/*', '@tanstack/react-*'], message: 'domain model은 React와 실행 훅을 모르는 순수 값·규칙이다.' }],
    }] },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { '@typescript-eslint/no-unsafe-assignment': 'off' },
  },
)
