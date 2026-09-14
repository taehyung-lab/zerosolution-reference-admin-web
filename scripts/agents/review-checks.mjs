import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const digest = value => createHash('sha256').update(value).digest('hex')

// The CLI owns which checks run. This records their actual process result, not report prose.
export function runReviewCommand(root, fingerprint, args) {
  const directory = `.ai-work/agent-receipts/${randomUUID()}`
  mkdirSync(resolve(root, directory), { recursive: true })
  const started = new Date().toISOString()
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  const receipt = {
    fingerprint, command: [process.execPath, ...args], started, ended: new Date().toISOString(),
    exitCode: result.status, signal: result.signal, error: result.error?.message ?? null,
    stdoutDigest: digest(result.stdout ?? ''), stderrDigest: digest(result.stderr ?? ''),
    stdout: `${directory}/stdout.txt`, stderr: `${directory}/stderr.txt`, artifact: `${directory}/receipt.json`,
  }
  writeFileSync(resolve(root, receipt.stdout), result.stdout ?? '')
  writeFileSync(resolve(root, receipt.stderr), result.stderr ?? '')
  writeFileSync(resolve(root, receipt.artifact), JSON.stringify(receipt, null, 2) + '\n')
  return receipt
}

export function receiptFailure(root, checks, fingerprint, required = false) {
  if (!Array.isArray(checks) || required && !checks.some(check => check.command?.[1] === 'scripts/contracts/check.mjs')) return 'Review needs an executed contracts check receipt; use the review CLI'
  for (const check of checks) {
    if (check.fingerprint !== fingerprint || check.exitCode !== 0 || check.error) return 'Review check receipts failed or refer to a different source fingerprint; rerun review'
    try {
      for (const path of [check.artifact, check.stdout, check.stderr]) if (typeof path !== 'string' || !path.startsWith('.ai-work/agent-receipts/') || path.includes('..') || path.includes('\\')) return 'Review receipt paths must stay in .ai-work/agent-receipts/'
      if (JSON.stringify(JSON.parse(readFileSync(resolve(root, check.artifact), 'utf8'))) !== JSON.stringify(check)) return 'Review receipt changed; rerun the check'
      if (digest(readFileSync(resolve(root, check.stdout))) !== check.stdoutDigest || digest(readFileSync(resolve(root, check.stderr))) !== check.stderrDigest) return 'Review receipt output changed; rerun the check'
    } catch { return 'Review receipt or its output is missing; rerun the check' }
  }
  return null
}
