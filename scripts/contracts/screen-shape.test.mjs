import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  detailRouteLoaderFailures,
  listRouteCoverageFailures,
  listRouteCoverageNotices,
  screenShapeFailures,
} from './screen-shape.mjs'

const roots = []
function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'screen-shape-'))
  roots.push(root)
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), content)
  }
  return root
}
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })))

const list = (screen = 'src/features/things/screens/list') => ({
  [`${screen}/ui/ThingListScreen.tsx`]: '',
  [`${screen}/ui/ThingListFilters.tsx`]: '',
  [`${screen}/ui/ThingListResult.tsx`]: '',
  [`${screen}/ui/useThingListResult.ts`]: '',
  [`${screen}/ui/thing-columns.tsx`]: '',
  [`${screen}/model/thing-search.ts`]: '',
  [`${screen}/model/thing-list-policy.ts`]: '',
  [`${screen}/model/useThingListFilter.ts`]: '',
  [`${screen}/model/useThingListData.ts`]: '',
  [`${screen}/model/thing-search.test.ts`]: '',
})

describe('screen shape', () => {
  it('does not demand a whole screen from a partial filter or a separate file for each responsibility', () => {
    for (const name of ['QuickFilters', 'QuickPanel']) {
      const root = fixture({
        [`src/features/things/screens/list/ui/${name}.tsx`]: 'export const Filter = () => <input aria-label="Filter" />',
      })
      expect(screenShapeFailures(root)).toEqual([])
    }
    const files = list()
    delete files['src/features/things/screens/list/model/thing-list-policy.ts']
    expect(screenShapeFailures(fixture(files))).toEqual([])
  })

  it('rejects a columns file that writes aria-sort vocabulary by hand or declares meta.sort without the shared mapping', () => {
    const files = list()
    const columns = 'src/features/things/screens/list/ui/thing-columns.tsx'
    files[columns] = "meta: { sort: { direction: sort === key ? (dir === 'asc' ? 'ascending' : 'descending') : undefined, onSort: () => go(key) } }"
    expect(screenShapeFailures(fixture(files))).toEqual([
      expect.stringMatching(/ui\/thing-columns\.tsx 이 aria-sort 어휘를 직접 쓴다 → headerSortDirection.*list-contract\/SKILL\.md#sorting/),
      expect.stringMatching(/ui\/thing-columns\.tsx 이 meta\.sort 를 선언하면서 headerSortDirection.*import 하지 않는다/),
    ])
    // Comments do not count; a columns file without sortable headers owes no import.
    files[columns] = "/** direction is 'ascending' | 'descending' */\n// 'descending'\nconst plain = 1"
    expect(screenShapeFailures(fixture(files))).toEqual([])
    files[columns] = "import { headerSortDirection } from '@/shared/lib/list-sort'\nmeta: { sort: { direction: headerSortDirection(active, key), onSort: () => go(key) } }"
    expect(screenShapeFailures(fixture(files))).toEqual([])
  })
  it('rejects a list search contract whose sortDirection default is undefined', () => {
    const files = list()
    files['src/features/things/screens/list/model/thing-search.ts'] = "sortType: { defaultValue: 'a', kind: 'view' },\n  sortDirection: {\n    schema: s,\n    defaultValue: undefined,\n    kind: 'view',\n  },"
    expect(screenShapeFailures(fixture(files))).toEqual([
      expect.stringMatching(/model\/thing-search\.ts 의 sortDirection 기본값이 undefined 다 → .*list-contract\/SKILL\.md#sorting/),
    ])
    files['src/features/things/screens/list/model/thing-search.ts'] = "sortDirection: { schema: s, defaultValue: 'desc', kind: 'view' },"
    expect(screenShapeFailures(fixture(files))).toEqual([])
  })
  it('allows detail and form responsibilities without imposing companion filenames', () => {
    const root = fixture({
      'src/features/things/screens/detail/ui/ThingDetailScreen.tsx': '',
      'src/features/things/screens/detail/ui/ThingActions.tsx': '',
      'src/features/things/screens/form/ui/ThingCreateScreen.tsx': '',
    })
    expect(screenShapeFailures(root)).toEqual([])
  })


  it('requires every list route to join the list-contract e2e arrays, counting only array literals', () => {
    const route = "import { ThingListScreen } from '@/features/things/screens/list/ui/ThingListScreen'\nexport const Route = createFileRoute('/_app/things/')({})\n"
    const covered = fixture({ ...list(), 'src/routes/_app/things/index.tsx': route, 'tests/e2e/search-contract.spec.ts': 'for (const path of ["/things"]) {}' })
    expect(listRouteCoverageFailures(covered)).toEqual([])
    const uncovered = fixture({ ...list(), 'src/routes/_app/things/index.tsx': route, 'tests/e2e/search-contract.spec.ts': 'for (const path of ["/others"]) {}' })
    expect(listRouteCoverageFailures(uncovered)).toEqual([expect.stringMatching(/목록 route \/things .* 경로 배열에 없다/)])
    const commented = fixture({ ...list(), 'src/routes/_app/things/index.tsx': route, 'tests/e2e/search-contract.spec.ts': '// todo: "/things" next PR\nfor (const path of ["/others"]) {}' })
    expect(listRouteCoverageFailures(commented)).toHaveLength(1)
    // A detail entry is recognized by the screen it mounts, even under a parameter and beside the list's filters.
    const detail = fixture({
      ...list(),
      'src/features/things/screens/list/ui/ThingDetailScreen.tsx': '',
      'src/routes/_app/things/$id.tsx': "import { ThingDetailScreen } from '@/features/things/screens/list/ui/ThingDetailScreen'\nexport const Route = createFileRoute('/_app/things/$id')({})\n",
      'tests/e2e/search-contract.spec.ts': '',
    })
    expect(listRouteCoverageFailures(detail)).toEqual([])
    // A child list under a parameter is still a list route.
    const child = fixture({
      ...list('src/features/things/screens/sessions'),
      'src/routes/_app/things/$id/sessions.tsx': "import { ThingListScreen } from '@/features/things/screens/sessions/ui/ThingListScreen'\nexport const Route = createFileRoute('/_app/things/$id/sessions')({})\n",
      'tests/e2e/search-contract.spec.ts': '',
    })
    expect(listRouteCoverageFailures(child)).toHaveLength(1)
    const noSpec = fixture({ ...list(), 'src/routes/_app/things/index.tsx': route })
    expect(listRouteCoverageFailures(noSpec)).toEqual([])
    expect(listRouteCoverageNotices(noSpec)).toEqual([expect.stringMatching(/search-contract\.spec\.ts 가 없다/)])
    expect(listRouteCoverageNotices(covered)).toEqual([])
  })

  it('requires every $param route leaf to await its record in a loader', () => {
    const root = fixture({
      'src/routes/_app/things/$thingId/index.tsx': 'export const Route = createFileRoute("/_app/things/$thingId/")({ component: Detail })',
      'src/routes/_app/things/$thingId/edit.tsx': 'export const Route = createFileRoute("/_app/things/$thingId/edit")({ loader: ({ context, params }) => loadRequired(context.queryClient, thingDetailQuery(context.locale, params.thingId)), component: Edit })',
      'src/routes/_app/things/$thingId/route.tsx': 'export const Route = createFileRoute("/_app/things/$thingId")({ component: Layout })',
      'src/routes/_app/things/$thingId/index.test.tsx': 'it("no loader here", () => {})',
      'src/routes/_app/things/new.tsx': 'export const Route = createFileRoute("/_app/things/new")({ component: Create })',
    })
    expect(detailRouteLoaderFailures(root)).toEqual([
      expect.stringMatching(/things\/\$thingId\/index\.tsx 에 loader 가 없다 → loadRequired.*route-composition\/SKILL\.md#형태/),
    ])
  })
})
