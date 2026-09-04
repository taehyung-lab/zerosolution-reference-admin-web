#!/usr/bin/env node
/** 원격 계약과 커밋된 snapshot의 차이를 보고만 하며 파일을 쓰지 않는다. */
import { readSnapshot } from './_shared.mjs'
import { analyzeSpecDiff, formatSpecDiff } from './diff-analysis.mjs'

const url = process.argv.slice(2).find((argument) => argument !== '--') ?? process.env.ADMIN_OPENAPI_URL
if (url === undefined) {
  console.error('  ✗ URL이 필요하다: pnpm api:diff -- <url> 또는 ADMIN_OPENAPI_URL=<url>')
  process.exit(1)
}

const response = await fetch(url)
if (!response.ok) {
  console.error(`  ✗ HTTP ${response.status}`)
  process.exit(1)
}

const analysis = analyzeSpecDiff(readSnapshot(), await response.json())
console.log(formatSpecDiff(analysis))
console.log('\n  ✓ read-only api:diff 완료 (snapshot은 변경하지 않음)')
