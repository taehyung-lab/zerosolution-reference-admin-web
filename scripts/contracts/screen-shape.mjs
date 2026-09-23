import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'

/** Source-level structural checks only. Naming and placement are not checked: a name heuristic
 * exempts every file that ignores the convention, so a passing run guarantees nothing about the
 * files it skipped. What remains reads the source itself — shared sort reuse, detail-route
 * loaders, list-route e2e joins. These do not prove workflow correctness; state and request
 * boundaries are reviewed.
 */
export const SHAPE_SECTIONS = {
  detailRoute: '.agents/skills/route-composition/SKILL.md#형태',
  sorting: '.agents/skills/list-contract/SKILL.md#sorting',
  list: '.agents/skills/list-contract/SKILL.md#형태',
}

/** 서버 정렬 어휘가 asc/desc 가 아니라 headerSortDirection 을 바로 받을 수 없는 컬럼 파일. 지금은 없다. */
export const SORT_MAPPING_EXCEPTIONS = [] // { file: 'src/features/<domain>/screens/<entity>-list/ui/<entity>-list-columns.tsx', until: '<해소 조건>' }

const withoutComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1')

const TEST_FILE = /\.(test|test-d)\.[jt]sx?$/



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
    for (const kind of ['screens', 'shared']) {
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
    // 빠뜨려 활성 컬럼이 표시 없이 렌더됐다(2026-09-11 두 목록 화면). 주석은 벗기고 코드만 본다.
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

/** 기존 역할 파일에서 자동화 가능한 정렬 계약만 본다. 파일 배치와 소유권은 계약 문서와 리뷰가 판단한다. */
export function screenShapeFailures(root) {
  const failures = []
  for (const entry of screenDirs(root)) {
    const files = listFiles(entry.dir)
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
