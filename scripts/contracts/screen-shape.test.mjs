import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  listRouteCoverageFailures,
  resolvedShapeExceptionFailures,
  screenRoles,
  screenShapeFailures,
  screenShapeNotices,
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
  it('reads roles from the files a screen actually has', () => {
    expect([...screenRoles(['ui/AScreen.tsx', 'ui/AFilters.tsx'])]).toEqual(['list'])
    expect([...screenRoles(['ui/ADetailScreen.tsx', 'ui/AEditScreen.tsx'])]).toEqual(['detail', 'form'])
    // A dialog-hosted form does not follow the screen naming, so it is outside this check by design.
    expect([...screenRoles(['ui/ComposeDialog.tsx', 'model/compose-schema.ts'])]).toEqual([])
  })

  it('accepts a list screen that carries the whole shape and rejects one missing its policy', () => {
    const complete = fixture(list())
    expect(screenShapeFailures(complete, [])).toEqual([])
    const files = list()
    delete files['src/features/things/screens/list/model/thing-list-policy.ts']
    const missing = fixture(files)
    expect(screenShapeFailures(missing, [])).toEqual([
      expect.stringMatching(/screens\/list 에 model\/\*-policy\.ts 이 없다 → .*list-workflow\.md#형태/),
    ])
  })

  it('rejects a columns file that writes aria-sort vocabulary by hand or declares meta.sort without the shared mapping', () => {
    const files = list()
    const columns = 'src/features/things/screens/list/ui/thing-columns.tsx'
    files[columns] = "meta: { sort: { direction: sort === key ? (dir === 'asc' ? 'ascending' : 'descending') : undefined, onSort: () => go(key) } }"
    expect(screenShapeFailures(fixture(files), [])).toEqual([
      expect.stringMatching(/ui\/thing-columns\.tsx 이 aria-sort 어휘를 직접 쓴다 → headerSortDirection.*list-workflow\.md#sorting/),
      expect.stringMatching(/ui\/thing-columns\.tsx 이 meta\.sort 를 선언하면서 headerSortDirection.*import 하지 않는다/),
    ])
    // Comments do not count; a columns file without sortable headers owes no import.
    files[columns] = "/** direction is 'ascending' | 'descending' */\n// 'descending'\nconst plain = 1"
    expect(screenShapeFailures(fixture(files), [])).toEqual([])
    files[columns] = "import { headerSortDirection } from '@/shared/lib/list-sort'\nmeta: { sort: { direction: headerSortDirection(active, key), onSort: () => go(key) } }"
    expect(screenShapeFailures(fixture(files), [])).toEqual([])
  })
  it('rejects a list search contract whose sortDirection default is undefined', () => {
    const files = list()
    files['src/features/things/screens/list/model/thing-search.ts'] = "sortType: { defaultValue: 'a', kind: 'view' },\n  sortDirection: {\n    schema: s,\n    defaultValue: undefined,\n    kind: 'view',\n  },"
    expect(screenShapeFailures(fixture(files), [])).toEqual([
      expect.stringMatching(/model\/thing-search\.ts 의 sortDirection 기본값이 undefined 다 → .*list-workflow\.md#sorting/),
    ])
    files['src/features/things/screens/list/model/thing-search.ts'] = "sortDirection: { schema: s, defaultValue: 'desc', kind: 'view' },"
    expect(screenShapeFailures(fixture(files), [])).toEqual([])
  })
  it('delegates the model set only when a screen imports a mechanic model, not on a comment or a ui import', () => {
    const screen = 'src/features/things/screens/recent'
    const ui = {
      [`${screen}/ui/RecentThingListFilters.tsx`]: '',
      [`${screen}/ui/useRecentThingListResult.ts`]: '',
      [`${screen}/ui/recent-thing-columns.tsx`]: '',
    }
    const delegated = fixture({ ...ui, [`${screen}/ui/RecentThingListScreen.tsx`]: "import { useThingRecordFilter } from '../../../mechanics/record-list/model/useThingRecordFilter'\n" })
    expect(screenShapeFailures(delegated, [])).toEqual([])
    const comment = fixture({ ...ui, [`${screen}/ui/RecentThingListScreen.tsx`]: '// see ../../../mechanics/record-list/model later\n' })
    expect(screenShapeFailures(comment, [])).toHaveLength(4)
    const uiOnly = fixture({ ...ui, [`${screen}/ui/RecentThingListScreen.tsx`]: "import { ThingRecordResult } from '../../../mechanics/record-list/ui/ThingRecordResult'\n" })
    expect(screenShapeFailures(uiOnly, [])).toHaveLength(4)
  })

  it('reports ui/model confusion at any depth and leaves lib and config to the placement table', () => {
    const root = fixture({
      ...list(),
      'src/features/things/screens/list/model/nested/ThingListActions.tsx': '',
      'src/features/things/mechanics/record-list/ui/thing-record-policy.ts': '',
      'src/features/things/screens/list/lib/format-date-mapper.ts': '',
      'src/features/things/screens/list/config/thing-columns.tsx': '',
    })
    expect(screenShapeFailures(root, [])).toEqual([
      expect.stringMatching(/mechanics\/record-list\/ui\/thing-record-policy\.ts 는 model\/ 에 있어야 한다/),
      expect.stringMatching(/screens\/list\/model\/nested\/ThingListActions\.tsx 는 ui\/ 에 있어야 한다/),
    ])
  })

  it('requires a request boundary only for a detail with actions, and schema plus request for a form', () => {
    const readOnly = fixture({
      'src/features/things/screens/detail/ui/ThingDetailScreen.tsx': '',
      'src/features/things/screens/detail/ui/BulkActionBar.ts': '',
    })
    expect(screenShapeFailures(readOnly, [])).toEqual([])
    const acting = fixture({
      'src/features/things/screens/detail/ui/ThingDetailScreen.tsx': '',
      'src/features/things/screens/detail/ui/ThingActionForm.tsx': '',
    })
    expect(screenShapeFailures(acting, [])).toEqual([expect.stringMatching(/model\/\*-requests\.ts 이 없다 → .*detail-workflow\.md#형태/)])
    const form = fixture({
      'src/features/things/screens/form/ui/ThingCreateScreen.tsx': '',
      'src/features/things/screens/form/ui/ThingForm.tsx': '',
      'src/features/things/screens/form/model/thing-form-schema.ts': '',
    })
    expect(screenShapeFailures(form, [])).toEqual([expect.stringMatching(/model\/\*-request\(s\)\.ts 또는 model\/use\*Mutation\.ts 가 없다/)])
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
  })

  it('reports an open exception as a notice, a closed one and a vanished screen as failures', () => {
    const exceptions = [{ screen: 'src/features/things/screens/list', missing: 'model/*-policy.ts', until: 'split the inline transition' }]
    const files = list()
    delete files['src/features/things/screens/list/model/thing-list-policy.ts']
    const open = fixture(files)
    expect(screenShapeFailures(open, exceptions)).toEqual([])
    expect(screenShapeNotices(open, exceptions)).toEqual([expect.stringMatching(/^화면 형태 예외: .* 해소 조건: split/)])
    expect(resolvedShapeExceptionFailures(open, exceptions)).toEqual([])
    const closed = fixture(list())
    expect(resolvedShapeExceptionFailures(closed, exceptions)).toEqual([expect.stringMatching(/예외 해소됨 — SHAPE_EXCEPTIONS 에서 지운다/)])
    const gone = fixture({})
    expect(resolvedShapeExceptionFailures(gone, exceptions)).toEqual([expect.stringMatching(/화면이 없다 — SHAPE_EXCEPTIONS 에서 지운다/)])
  })
})
