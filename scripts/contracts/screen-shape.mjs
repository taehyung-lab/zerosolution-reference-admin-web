import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'

/** Naming/placement and selected source checks; these do not prove workflow correctness.
 * Do not require a file per role: a partial request may legitimately own only a filter, and
 * coherent responsibilities may share a file. Actual state and request boundaries are reviewed.
 */
export const SHAPE_SECTIONS = {
  detailRoute: '.agents/skills/feature-contract/references/router.md#형태',
  sorting: '.agents/skills/feature-contract/references/list-workflow.md#sorting',
  list: '.agents/skills/feature-contract/references/list-workflow.md#형태',
  placement: '.agents/skills/folder-structure-contract/SKILL.md#배치-판단',
}

/** 리허설 운영자 목록은 서버 어휘 ASC/DESC 를 model/manager-sort.ts 에서 옮기므로 headerSortDirection('asc'|'desc') 을 받을 수 없다. */
export const SORT_MAPPING_EXCEPTIONS = [
  { file: 'src/features/managers/screens/list/ui/manager-columns.tsx', until: '리허설 계약이 폐기되거나 서버 어휘가 asc/desc 로 바뀐다' },
]

const withoutComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1')

const TEST_FILE = /\.(test|test-d)\.[jt]sx?$/

// 파일 이름이 말하는 역할과 그 파일이 놓여야 할 segment. 이름이 규칙과 다르면 검사 대상이 아니다.
const UI_NAMES = [/^use\w+Result\.tsx?$/, /-columns\.tsx?$/, /Screen\.tsx$/, /Filters\.tsx$/, /Result\.tsx$/, /Actions\.tsx$/, /Form\.tsx$/, /Section\.tsx$/, /Dialog\.tsx$/]
const MODEL_NAMES = [/search.*\.ts$/, /-policy\.ts$/, /^use\w+Filter\.ts$/, /^use\w+Data\.ts$/, /-requests?\.ts$/, /-schema\.ts$/, /^use\w+Mutation\.ts$/, /^use\w+Actions\.ts$/, /^use\w+Options\.ts$/, /-actions\.ts$/, /-mapper\.ts$/, /-sort\.ts$/, /-defaults\.ts$/, /-history\.ts$/]

const matches = (name, patterns) => patterns.some((pattern) => pattern.test(name))

function listFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && !TEST_FILE.test(entry.name))
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).split('\\').join('/'))
}

function screenDirs(root) {
  const features = resolve(root, 'src/features')
  if (!existsSync(features)) return []
  const dirs = []
  for (const domain of readdirSync(features)) {
    for (const kind of ['screens', 'mechanics']) {
      const parent = join(features, domain, kind)
      if (!existsSync(parent)) continue
      for (const name of readdirSync(parent)) {
        const dir = join(parent, name)
        if (statSync(dir).isDirectory()) dirs.push({ path: `src/features/${domain}/${kind}/${name}`, kind, dir })
      }
    }
  }
  return dirs.sort((a, b) => a.path.localeCompare(b.path))
}

/** segment 아래 어느 깊이든, 파일 이름(basename)으로 대조한다. */
const has = (files, segment, pattern) => files.some((file) => file.startsWith(`${segment}/`) && pattern.test(basename(file)))

function behaviorFailures(entry, files) {
  const failures = []
  if (has(files, 'ui', /Filters\.tsx$/) || has(files, 'ui', /^use\w+Result\.tsx?$/)) {
    // URL asc/desc → aria 어휘는 shared/lib/list-sort 가 한 곳에서 옮긴다. 손으로 쓴 매핑은 기본 방향을
    // 빠뜨려 활성 컬럼이 표시 없이 렌더됐다(2026-09-11 게시판·공연). 주석은 벗기고 코드만 본다.
    for (const file of files.filter((file) => file.startsWith('ui/') && /-columns\.tsx?$/.test(basename(file)))) {
      const path = `${entry.path}/${file}`
      const code = withoutComments(readFileSync(join(entry.dir, file), 'utf8'))
      if (/['"](?:ascending|descending)['"]/.test(code)) {
        failures.push(`화면 형태: ${path} 이 aria-sort 어휘를 직접 쓴다 → headerSortDirection(shared/lib/list-sort), ${SHAPE_SECTIONS.sorting}`)
      }
      if (/\bonSort\b/.test(code) && !/from\s+['"]@\/shared\/lib\/list-sort['"]/.test(code) && !SORT_MAPPING_EXCEPTIONS.some((item) => item.file === path)) {
        failures.push(`화면 형태: ${path} 이 meta.sort 를 선언하면서 headerSortDirection(shared/lib/list-sort) 을 import 하지 않는다 → ${SHAPE_SECTIONS.sorting}`)
      }
    }
    // 활성 컬럼은 첫 렌더부터 방향을 가져야 하므로 URL 계약이 기본 방향을 선언한다(2026-09-11 사용자 확정 desc).
    for (const file of files.filter((file) => file.startsWith('model/') && /search.*\.ts$/.test(basename(file)))) {
      const code = withoutComments(readFileSync(join(entry.dir, file), 'utf8'))
      if (/\bsortDirection\s*:\s*\{[^}]*defaultValue\s*:\s*undefined/.test(code)) {
        failures.push(`화면 형태: ${entry.path}/${file} 의 sortDirection 기본값이 undefined 다 → ${SHAPE_SECTIONS.sorting}`)
      }
    }
  }
  return failures
}

/** ui 와 model 사이의 착오만 본다. lib·config 같은 다른 segment 는 folder-structure 표가 따로 정한다. */
function placementFailures(entry, files) {
  const failures = []
  for (const file of files) {
    const segment = file.split('/')[0]
    if (segment !== 'ui' && segment !== 'model') continue
    const name = basename(file)
    if (segment === 'model' && matches(name, UI_NAMES)) failures.push(`화면 형태: ${entry.path}/${file} 는 ui/ 에 있어야 한다 → ${SHAPE_SECTIONS.placement}`)
    if (segment === 'ui' && matches(name, MODEL_NAMES)) failures.push(`화면 형태: ${entry.path}/${file} 는 model/ 에 있어야 한다 → ${SHAPE_SECTIONS.placement}`)
  }
  return failures
}

export function screenShapeFailures(root) {
  const failures = []
  for (const entry of screenDirs(root)) {
    const files = listFiles(entry.dir)
    failures.push(...placementFailures(entry, files))
    if (entry.kind === 'screens') failures.push(...behaviorFailures(entry, files))
  }
  return failures
}

/** 주석을 뺀 뒤 `[...]` 리터럴 안의 문자열만 경로로 인정한다. 주석이나 skip 된 문장 속 경로는 합류가 아니다. */
function quotedPathsInArrays(source) {
  const withoutComments = source.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  const paths = new Set()
  for (const [, body] of withoutComments.matchAll(/\[([^\]]*)\]/g)) {
    for (const [, path] of body.matchAll(/["'](\/[^"']*)["']/g)) paths.add(path)
  }
  return paths
}

/** Spec 부재는 실패가 아니라 notice. 대상 저장소는 그 파일을 두거나 합류 규칙을 다시 선언한다. */
export function listRouteCoverageNotices(root, specFile = 'tests/e2e/search-contract.spec.ts') {
  const routesDir = resolve(root, 'src/routes/_app')
  const specPath = resolve(root, specFile)
  if (!existsSync(routesDir) || existsSync(specPath)) return []
  return [`목록 route 합류 검사 생략: ${specFile} 가 없다. 목록 route가 있으면 그 파일을 두거나 합류 규칙을 다시 선언한다 → ${SHAPE_SECTIONS.list}`]
}

/**
 * 목록 route 는 저장소가 소유한 목록 계약 e2e(`tests/e2e/search-contract.spec.ts`)의 경로 배열에 들어간다.
 * 화면별 smoke 는 그 스위트를 대신하지 못한다. 목록 route 판정은 화면 쪽 사실로 한다: mount 하는 화면의
 * 이름이 Detail·Create·Edit 이 아니고 그 디렉터리에 ui/*Filters.tsx 가 있다.
 */
export function listRouteCoverageFailures(root, specFile = 'tests/e2e/search-contract.spec.ts') {
  const routesDir = resolve(root, 'src/routes/_app')
  const specPath = resolve(root, specFile)
  if (!existsSync(routesDir) || !existsSync(specPath)) return []
  const covered = quotedPathsInArrays(readFileSync(specPath, 'utf8'))
  const failures = []
  for (const file of listFiles(routesDir)) {
    const source = readFileSync(join(routesDir, file), 'utf8')
    const route = /createFileRoute\(["'](\/_app[^"']*)["']\)/.exec(source)
    const screen = /@\/features\/([a-z-]+)\/screens\/([a-z-]+)\/ui\/(\w+Screen)/.exec(source)
    if (!route || !screen) continue
    if (/(Detail|Create|Edit)\w*Screen$/.test(screen[3])) continue
    const screenDir = resolve(root, `src/features/${screen[1]}/screens/${screen[2]}`)
    if (!has(listFiles(screenDir), 'ui', /Filters\.tsx$/)) continue
    const path = route[1].replace(/^\/_app/, '').replace(/\/$/, '') || '/'
    if (!covered.has(path)) {
      failures.push(`목록 route ${path} (src/routes/_app/${file}) 가 ${specFile} 의 경로 배열에 없다 → ${SHAPE_SECTIONS.list}`)
    }
  }
  return failures
}

/**
 * A route leaf under `src/routes/_app` with a `$param` segment mounts a record (detail, edit). It
 * awaits that record in `loader` (`loadRequired`), so a missing ID is a route not-found and a 403 is
 * the access cover (2026-09-11 user decision). `route.tsx` layouts are not leaves; test files never
 * reach here (`listFiles` drops them). A list route under a `$param` (a child tab) would be a false
 * positive — none exists today; add it to DETAIL_ROUTE_EXCEPTIONS with the reason when one appears.
 */
export const DETAIL_ROUTE_EXCEPTIONS = [] // { file: 'src/routes/_app/<path>.tsx', until: '<해소 조건>' }

export function detailRouteLoaderFailures(root) {
  const routesDir = resolve(root, 'src/routes/_app')
  if (!existsSync(routesDir)) return []
  const failures = []
  for (const file of listFiles(routesDir)) {
    if (!/\.tsx$/.test(file) || !file.includes('$') || /(^|\/)route\.tsx$/.test(file)) continue
    if (DETAIL_ROUTE_EXCEPTIONS.some((item) => item.file === `src/routes/_app/${file}`)) continue
    const source = withoutComments(readFileSync(join(routesDir, file), 'utf8'))
    if (!/\bloader\s*:/.test(source)) {
      failures.push(`상세 route src/routes/_app/${file} 에 loader 가 없다 → loadRequired 로 레코드를 기다린다, ${SHAPE_SECTIONS.detailRoute}`)
    }
  }
  return failures
}
