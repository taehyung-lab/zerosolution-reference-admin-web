import { expect, it } from 'vitest'
import { selectedDocuments } from './document-context.mjs'
import { readSurfaceIndex, workflowContext } from './surface-context.mjs'

// Integration assertions for this reference product. The transplant manifest excludes this file.
it('routes content actions and preserves unresolved entry policy without importing manager API judgments', () => {
  const index=readSurfaceIndex(process.cwd())
  const content=index.surfaces.find(surface=>surface.id==='performance-content')
  expect(content.related).toEqual(expect.arrayContaining(['content-bulk','content-edit','content-preview']))
  const bulk=index.surfaces.find(surface=>surface.id==='content-bulk')
  const output=selectedDocuments(process.cwd(),[...index.judgment,...content.references,...bulk.references]).map(doc=>doc.selected).join('\n')
  expect(output).toContain('Send stable IDs, not row objects.')
  expect(output).toContain('다른 화면의 답으로 확장하지 않는다.')
  expect(output).not.toContain('members/managers API 책임 재대조')
  expect(output).not.toContain('코드 결함 후보')
})

it('routes shared feature API paths to an edit consumer without inventing a list requirement', () => {
  const checkpoint = {
    scope: ['src/features/performances/api/'],
    surfaces: [{ id: 'performance-edit', decision: 'include' }, { id: 'performance-language', decision: 'exclude', reason: 'Only the edit API boundary is under review.' }],
    requirements: [{ id: 'R1', text: 'Review edit API boundary.', surfaces: ['performance-edit'], sources: ['user'], contracts: [], contractReason: 'Discovery only.' }],
    contracts: [],
  }
  expect(workflowContext(process.cwd(), checkpoint).included.map((surface) => surface.id)).toEqual(['performance-edit'])
})
