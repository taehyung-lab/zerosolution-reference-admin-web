import { spawnSync } from 'node:child_process'
import { expect, it } from 'vitest'
import { readSurfaceIndex } from '../../scripts/evidence/context.mjs'
import { selectedDocuments } from '../../scripts/evidence/documents.mjs'

it('routes each implemented manager result to a surface-sized evidence contract', () => {
  for (const id of ['manager-list', 'manager-detail', 'manager-create', 'manager-edit']) {
    const result = spawnSync(process.execPath, ['scripts/evidence/cli.mjs', 'context', id], { encoding: 'utf8' })
    expect(result.status, result.stderr).toBe(0)
    const context = JSON.parse(result.stdout)
    expect(context.id).toBe(id)
    expect(context.coverage).toBe('surface')
    expect(context.paths.length).toBeGreaterThan(0)
    expect(context.contract.rows.length).toBeGreaterThan(0)
    expect(context.contract.rows.every((row) => row.id.startsWith(`${id}.`))).toBe(true)
    expect(context.contract.rows.every((row) => row.pointerState === 'present')).toBe(true)
  }
})

it('keeps each manager surface evidence body isolated from sibling surfaces', () => {
  const ids = ['manager-list', 'manager-detail', 'manager-create', 'manager-edit']
  const index = readSurfaceIndex(process.cwd())

  for (const id of ids) {
    const surface = index.surfaces.find((candidate) => candidate.id === id)
    const references = [surface.inventory, ...surface.scenarios, ...surface.references]
    const body = selectedDocuments(process.cwd(), references).map((document) => document.selected).join('\n')

    expect(body).toContain(`surface: \`${id}\``)
    for (const sibling of ids.filter((candidate) => candidate !== id)) {
      expect(body).not.toContain(`surface: \`${sibling}\``)
    }
  }
})
