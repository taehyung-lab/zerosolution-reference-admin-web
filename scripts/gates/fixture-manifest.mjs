import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 부정 대조군 manifest. 각 항목은 fixture 파일과 그 fixture 를 배치할 가상 layer 경로,
 * 기대하는 실패 rule 을 선언한다. `expectedRule: null` 은 정상 대조군이다.
 */
export const CASES = [
  { fixture: 'folders/api-cache-client.ts', target: 'src/features/gate-a/api/cache-negative.ts', expectedRule: 'no-restricted-imports' },
  { fixture: 'folders/api-mutation.ts', target: 'src/features/gate-a/api/mutation-valid.ts', expectedRule: null },
  { fixture: 'folders/api-router.ts', target: 'src/features/gate-a/api/router-negative.ts', expectedRule: 'no-restricted-imports' },
  { fixture: 'folders/config-imports-ui.ts', target: 'src/features/gate-a/screens/list/config/ui-negative.ts', expectedRule: 'import-x/no-restricted-paths' },
  { fixture: 'folders/lib-imports-screen.ts', target: 'src/features/gate-a/lib/screen-negative.ts', expectedRule: 'import-x/no-restricted-paths' },
  { fixture: 'folders/config-value.ts', target: 'src/features/gate-a/screens/list/config/value.ts', expectedRule: null },
  { fixture: 'folders/lib-value.ts', target: 'src/features/gate-a/lib/value.ts', expectedRule: null },
  { fixture: 'folders/lib-react.ts', target: 'src/features/gate-a/lib/react-negative.ts', expectedRule: 'no-restricted-imports' },

  { fixture: 'folders/value.ts', target: 'src/features/gate-a/screens/list/model/value.ts', expectedRule: null },
  { fixture: 'folders/presentation.ts', target: 'src/features/gate-a/screens/list/ui/presentation.ts', expectedRule: null },
  { fixture: 'folders/api-imports-screen.ts', target: 'src/features/gate-a/api/screen-negative.ts', expectedRule: 'import-x/no-restricted-paths' },
  { fixture: 'folders/model-imports-ui.ts', target: 'src/features/gate-a/screens/list/model/ui-negative.ts', expectedRule: 'import-x/no-restricted-paths' },
  { fixture: 'folders/sibling-screen.ts', target: 'src/features/gate-a/screens/detail/model/sibling-negative.ts', expectedRule: 'import-x/no-restricted-paths' },
  { fixture: 'folders/mechanic-imports-screen.ts', target: 'src/features/gate-a/shared/selection/model/screen-negative.ts', expectedRule: 'import-x/no-restricted-paths' },
  { fixture: 'folders/fixture-imports-screen.ts', target: 'src/features/gate-a/fixtures/screen-negative.ts', expectedRule: 'import-x/no-restricted-paths' },
  { fixture: 'folders/domain-model-react.ts', target: 'src/features/gate-a/model/react-negative.ts', expectedRule: 'no-restricted-imports' },
  { fixture: 'imports/valid.ts', target: 'src/features/gate-a/api/valid.ts', expectedRule: null },
  { fixture: 'imports/shared-imports-feature.tsx', target: 'src/shared/gate-negative.tsx', expectedRule: 'import-x/no-restricted-paths' },
  { fixture: 'imports/shared-imports-router.ts', target: 'src/shared/gate-router-negative.ts', expectedRule: 'no-restricted-imports' },
  { fixture: 'imports/shared-imports-query.ts', target: 'src/shared/lib/gate-query-negative.ts', expectedRule: 'no-restricted-imports' },
  { fixture: 'imports/feature-api-imports-query-hook.ts', target: 'src/features/gate-a/api/query-hook-valid.ts', expectedRule: null },
  { fixture: 'imports/feature-api-query-options.ts', target: 'src/features/gate-a/api/query-options-valid.ts', expectedRule: null },
  { fixture: 'imports/deprecated-library-api.ts', target: 'src/features/gate-a/api/deprecated.ts', expectedRule: '@typescript-eslint/no-deprecated' },
  { fixture: 'imports/shared-valid.ts', target: 'src/shared/gate-valid.ts', expectedRule: null },
  { fixture: 'imports/shared-hardcoded.tsx', target: 'src/shared/ui/primitives/gate-negative.tsx', expectedRule: 'local/no-user-facing-literal' },
  { fixture: 'imports/feature-hardcoded.tsx', target: 'src/features/gate-a/api/user-facing.tsx', expectedRule: 'local/no-user-facing-literal' },
  { fixture: 'i18n-literal/feature-hardcoded.tsx', target: 'src/features/gate-a/list/user-facing.tsx', expectedRule: 'local/no-user-facing-literal' },
  { fixture: 'i18n-literal/valid.tsx', target: 'src/features/gate-a/list/i18n-valid.tsx', expectedRule: null },
  { fixture: 'i18n-literal/route-expression.tsx', target: 'src/routes/copy-negative.tsx', expectedRule: 'local/no-user-facing-literal' },
  { fixture: 'i18n-literal/shared-placeholder.tsx', target: 'src/shared/ui/list/copy-negative.tsx', expectedRule: 'local/no-user-facing-literal' },
  { fixture: 'imports/route-imports-generated.ts', target: 'src/routes/gate-negative.ts', expectedRule: 'no-restricted-imports' },
  { fixture: 'imports/screen-imports-axios.tsx', target: 'src/features/gate-a/list/screen.tsx', expectedRule: 'no-restricted-imports' },
  { fixture: 'imports/feature-imports-other-feature.ts', target: 'src/features/gate-a/model/cross-feature.ts', expectedRule: 'import-x/no-restricted-paths' },
  { fixture: 'imports/feature-imports-radix.tsx', target: 'src/features/gate-a/list/radix.tsx', expectedRule: 'no-restricted-imports' },
  { fixture: 'abstraction/prohibited-binding.tsx', target: 'src/features/gate-a/list/prohibited.tsx', expectedRule: 'local/no-prohibited-abstraction' },
  { fixture: 'abstraction/prohibited-import.ts', target: 'src/features/gate-a/model/prohibited-import.ts', expectedRule: 'local/no-prohibited-abstraction' },
  { fixture: 'abstraction/prohibited-resource-query.ts', target: 'src/features/gate-a/api/prohibited-resource-query.ts', expectedRule: 'local/no-prohibited-abstraction' },
  { fixture: 'abstraction/valid.tsx', target: 'src/features/gate-a/list/allowed-screen.tsx', expectedRule: null },
]

export const FIXTURE_ROOT = 'tests/gates/fixtures'

/** fixture 디렉터리의 실제 파일 집합을 재귀로 수집한다. */
export function listFixtureFiles(root = FIXTURE_ROOT) {
  return readdirSync(resolve(root), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => `${entry.parentPath.slice(resolve(root).length + 1)}/${entry.name}`)
}

/**
 * manifest 와 디스크 집합의 양방향 차이를 반환한다.
 * `unregistered` 는 존재하지만 실행되지 않는 고아 fixture, `missing` 은 선언됐지만 없는 fixture다.
 */
export function diffFixtureSets(registered, onDisk) {
  const declared = new Set(registered)
  const present = new Set(onDisk)
  return {
    unregistered: [...present].filter((file) => !declared.has(file)).sort(),
    missing: [...declared].filter((file) => !present.has(file)).sort(),
  }
}
