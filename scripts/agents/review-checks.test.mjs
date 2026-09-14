import { afterEach, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runReviewCommand, receiptFailure } from './review-checks.mjs'

const roots = []
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })))
it('records the actual exit and output of successful and failed checks against the source fingerprint', () => {
  const root = mkdtempSync(join(tmpdir(), 'review-receipt-'))
  roots.push(root)
  const success = runReviewCommand(root, 'source-diff-1', ['-e', 'console.log("checked")'])
  expect(success).toMatchObject({ fingerprint: 'source-diff-1', exitCode: 0 })
  expect(readFileSync(join(root, success.stdout), 'utf8')).toBe('checked\n')
  const failure = runReviewCommand(root, 'source-diff-2', ['-e', 'console.error("bad contract"); process.exit(3)'])
  expect(failure).toMatchObject({ fingerprint: 'source-diff-2', exitCode: 3 })
  expect(readFileSync(join(root, failure.stderr), 'utf8')).toBe('bad contract\n')
  expect(JSON.parse(readFileSync(join(root, failure.artifact), 'utf8')).exitCode).toBe(3)
  expect(receiptFailure(root, [success], 'source-diff-1')).toBeNull()
  writeFileSync(join(root, success.stdout), 'rewritten success\n')
  expect(receiptFailure(root, [success], 'source-diff-1')).toMatch(/output.*changed/)
})
