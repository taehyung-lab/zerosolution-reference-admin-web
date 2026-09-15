import { afterEach, describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pointerState, renderRows, rowsForSurface, screenRows, summarize } from './screen-rows.mjs'

const roots = []
const HEADER = '| id | 종류 | 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n'

function setup(table) {
  const root = mkdtempSync(join(tmpdir(), 'screen-contract-'))
  roots.push(root)
  mkdirSync(join(root, 'docs'), { recursive: true })
  mkdirSync(join(root, 'src/features/demo'), { recursive: true })
  writeFileSync(join(root, 'src/features/demo/DemoTable.tsx'), 'export const DemoTable = 1\n')
  writeFileSync(join(root, 'docs/demo.md'), `# Demo\n\n${table}\n`)
  execFileSync('git', ['init'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['add', '.'], { cwd: root, stdio: 'ignore' })
  return root
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

describe('screen contract rows', () => {
  it('reads only migrated rows and leaves an unmigrated table alone', () => {
    const root = setup(
      `${HEADER}| \`demo.table\` | 열거 | 1.1 | table | 컬럼 A·B | (대기) | — | \`DemoTable.tsx\` |\n` +
      '|  |  | 1.1 | 기간 | 아직 승격 전 | (대기) | — | — |\n' +
      '\n' +
      '| 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |\n| --- | --- | --- | --- | --- | --- |\n' +
      '| 1.2 | table | id 열이 없는 표 | (대기) | — | — |\n',
    )
    const rows = screenRows(root, 'docs/demo.md')
    // The blank-id row and the whole table without an id column contribute nothing.
    expect(rows.map((row) => row.id)).toEqual(['demo.table'])
    expect(rows[0].kind).toBe('열거')
    // A row can be handed over as written: its own header, a separator, the raw line.
    expect(renderRows(rows).split('\n')).toEqual([
      '| id | 종류 | 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |',
      '| --- | --- | --- | --- | --- | --- | --- | --- |',
      '| `demo.table` | 열거 | 1.1 | table | 컬럼 A·B | (대기) | — | `DemoTable.tsx` |',
    ])
    expect(renderRows([])).toBe('')
  })
  it('derives the unresolved state from three columns, not the 미확인 column alone', () => {
    const root = setup(
      `${HEADER}| \`demo.confirmed\` | 서술 | 1.1 | a | 관찰됨 | 정책 확정 | — | \`DemoTable.tsx\` |\n` +
      '| `demo.stated` | 서술 | 1.1 | b | 관찰됨 | 정책 확정 | 서버 식별자 (`Q7`), 정렬([질문 3](../x.md#질문-3)) | `DemoTable.tsx` |\n' +
      '| `demo.unread` | 서술 | 1.1 | c | 상세 (미판독) | 정책 확정 | — | `DemoTable.tsx` |\n' +
      '| `demo.nopolicy` | 서술 | 1.1 | d | 관찰됨 | (대기) | — | `DemoTable.tsx` |\n' +
      '| `demo.frameonly` | 서술 | 1.1 | e | 조회·등록 frame 존재 | 정책 확정 | — | `DemoTable.tsx` |\n',
    )
    const rows = screenRows(root, 'docs/demo.md')
    const byId = Object.fromEntries(rows.map((row) => [row.id, row]))
    expect(byId['demo.confirmed'].unresolved).toBeNull()
    // A cell that only says the frame exists enumerates no composition, so the row is not implementation evidence.
    expect(byId['demo.frameonly'].unresolved).toBe('Figma 구성 미열거')
    expect(byId['demo.stated'].unresolved).toBe('서버 식별자 (`Q7`), 정렬([질문 3](../x.md#질문-3))')
    expect(byId['demo.stated'].questions).toEqual(['7', '3'])
    // A row whose 미확인 cell is empty is still unresolved when the observation or policy is pending.
    expect(byId['demo.unread'].unresolved).toBe('Figma 관찰 미판독')
    expect(byId['demo.nopolicy'].unresolved).toBe('Notion 정책 미수집')
  })
  it('excludes n/a and ref rows from the denominator and reports enumerations', () => {
    const root = setup(
      `${HEADER}| \`demo.one\` | 열거 | 1.1 | a | 관찰 | 정책 | — | \`DemoTable.tsx\` |\n` +
      '| `demo.two` | 서술 | 1.1 | b | 관찰 | 정책 | — | `DemoTable.tsx` |\n' +
      '| `demo.none` | n/a | 1.1 | c | **없음** | 정책 | — | — |\n' +
      '| `demo.elsewhere` | ref | 1.1 | d | 관찰 | 정책 | — | — |\n',
    )
    const summary = summarize(screenRows(root, 'docs/demo.md'), root)
    expect(summary.total).toBe(4)
    expect(summary.denominator).toBe(2)
    expect(summary.enumerations).toEqual(['demo.one'])
  })
  it('resolves a pointer by tracked path and reports a stale one without calling it unimplemented', () => {
    const root = setup(
      `${HEADER}| \`demo.present\` | 열거 | 1.1 | a | 관찰 | 정책 | — | \`DemoTable.tsx\` |\n` +
      '| `demo.fragment` | 열거 | 1.1 | b | 관찰 | 정책 | — | `features/demo/` |\n' +
      '| `demo.stale` | 열거 | 1.1 | c | 관찰 | 정책 | — | `GoneScreen.tsx` |\n' +
      '| `demo.words` | 열거 | 1.1 | d | 관찰 | 정책 | — | `DemoTable` |\n' +
      '| `demo.empty` | 열거 | 1.1 | e | 관찰 | 정책 | — | — |\n' +
      '| `demo.route` | 열거 | 1.1 | f | 관찰 | 정책 | — | `DemoTable.tsx`(→ `/demo/new`) |\n',
    )
    const byId = Object.fromEntries(screenRows(root, 'docs/demo.md').map((row) => [row.id, row]))
    expect(pointerState(root, byId['demo.present'])).toBe('present')
    // A navigation target beside the file is a URL, not a second path to resolve.
    expect(pointerState(root, byId['demo.route'])).toBe('present')
    // A path fragment is how a reader writes it, so it must resolve rather than read as stale.
    expect(pointerState(root, byId['demo.fragment'])).toBe('present')
    expect(pointerState(root, byId['demo.stale'])).toBe('stale')
    // A component name is not a path, so the ledger cannot be checked against disk here.
    expect(pointerState(root, byId['demo.words'])).toBe('unverifiable')
    expect(pointerState(root, byId['demo.empty'])).toBe('none')
  })
  it('rejects an unknown kind and a duplicate id', () => {
    const bad = setup(`${HEADER}| \`demo.one\` | 미정 | 1.1 | a | 관찰 | 정책 | — | — |\n`)
    expect(() => screenRows(bad, 'docs/demo.md')).toThrow(/종류/)
    const twice = setup(
      `${HEADER}| \`demo.one\` | 열거 | 1.1 | a | 관찰 | 정책 | — | — |\n` +
      '| `demo.one` | 서술 | 1.1 | b | 관찰 | 정책 | — | — |\n',
    )
    expect(() => screenRows(twice, 'docs/demo.md')).toThrow(/duplicate row id/)
  })
  it('returns nothing for a surface whose section declares no matching row id', () => {
    const root = setup(`${HEADER}| \`other.table\` | 열거 | 1.1 | table | 관찰 | 정책 | — | — |\n`)
    const surface = { id: 'demo', inventory: 'docs/demo.md' }
    expect(rowsForSurface(root, surface)).toEqual([])
    expect(rowsForSurface(root, { id: 'demo' })).toEqual([])
  })
})
