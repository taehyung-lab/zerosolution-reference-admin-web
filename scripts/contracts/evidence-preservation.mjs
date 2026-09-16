import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tableRows } from '../evidence/screen-rows.mjs'

/**
 * 원장은 새 관찰로만 바뀐다. 구현을 설명하려고 기존 근거를 지우는 변경을 HEAD 대조로 막는다.
 * 허용: `현재 코드` 포인터 교체, 오탈자·링크 수정, 새 관찰 추가, 기존 기록을 남긴 정정.
 * 금지: 날짜 붙은 실측 기록의 삭제, 보호 열의 관찰·정책 표식 삭제, 비어 있지 않던 `미확인`의 제거.
 */
const PROTECTED_COLUMNS = ['Figma 관찰', 'Notion 동작·정책', '미확인']
const KEY_COLUMNS = ['화면', 'surface']
const DATE = /\d{4}-\d{2}-\d{2}/g
const MARKER = /\*\*[^*\n]+\*\*/g
const EMPTY = new Set(['', '—', '-', '없음'])

const blank = (value) => EMPTY.has((value ?? '').trim())
const tokens = (text, pattern) => new Set(text.match(pattern) ?? [])

function headContent(root, file) {
  try {
    return execFileSync('git', ['show', `HEAD:${file}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return null // HEAD 에 없는 새 파일이거나 git 이 없는 실행. 대조할 이전 상태가 없다.
  }
}

function keyedRows(content) {
  const keyed = new Map()
  for (const table of tableRows(content)) {
    if (!KEY_COLUMNS.every((column) => table.header.includes(column))) continue
    const index = (column) => table.header.indexOf(column)
    for (const row of table.rows) {
      const key = KEY_COLUMNS.map((column) => (row.cells[index(column)] ?? '').trim()).join(' | ')
      if (!key.replace(/\|/g, '').trim()) continue
      const cells = {}
      table.header.forEach((column, position) => { cells[column] = (row.cells[position] ?? '').trim() })
      // 같은 키가 둘 이상이면 행 단위 판정을 포기하고 파일 단위 규칙에만 맡긴다.
      keyed.set(key, keyed.has(key) ? null : { cells, raw: row.raw })
    }
  }
  return keyed
}

export function evidencePreservationFailures(root, inventoryDir, read = (file) => readFileSync(resolve(root, file), 'utf8'), head = (file) => headContent(root, file)) {
  const base = resolve(root, inventoryDir)
  if (!existsSync(base)) return []
  const files = []
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const nested of readdirSync(join(base, entry.name))) {
        if (nested.endsWith('.md') && nested !== 'README.md') files.push(`${inventoryDir}/${entry.name}/${nested}`)
      }
      continue
    }
    if (entry.name.endsWith('.md') && entry.name !== 'README.md') files.push(`${inventoryDir}/${entry.name}`)
  }

  const failures = []
  for (const file of files.sort()) {
    const before = head(file)
    if (before === null) continue
    const after = read(file)
    if (before === after) continue

    // 파일 단위: 날짜 붙은 실측 기록은 지우지 않는다. 정정은 남겨 두고 새 기록을 더한다.
    for (const date of tokens(before, DATE)) {
      if (!after.includes(date)) failures.push(`원장 근거 삭제: ${file} 에서 ${date} 실측 기록이 사라졌다. 기존 기록을 남기고 새 관찰을 더한다.`)
    }

    // 행 단위: 보호 열의 관찰·정책 표식과 미확인은 구현 설명으로 대체하지 않는다.
    const rowsBefore = keyedRows(before)
    const rowsAfter = keyedRows(after)
    for (const [key, row] of rowsBefore) {
      if (row === null) continue
      const next = rowsAfter.get(key)
      if (next === undefined || next === null) continue // 행이 사라졌거나 키가 겹치면 여기서 판정하지 않는다.
      for (const column of PROTECTED_COLUMNS) {
        const oldCell = row.cells[column]
        const newCell = next.cells[column]
        if (oldCell === undefined || newCell === undefined) continue
        if (!blank(oldCell) && blank(newCell)) {
          failures.push(`원장 근거 삭제: ${file} 행 "${key}" 의 ${column} 이 비워졌다.`)
          continue
        }
        for (const marker of tokens(oldCell, MARKER)) {
          if (!newCell.includes(marker)) failures.push(`원장 근거 삭제: ${file} 행 "${key}" 의 ${column} 에서 ${marker} 가 사라졌다.`)
        }
      }
    }
  }
  return failures
}
