import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { prepare, recordReview, localPath } from './preflight.mjs'
import { hookDecision } from './hook.mjs'
import { describeContext, contextReport } from './surface-context.mjs'
import { SEED_BUNDLES } from '../contracts/seed.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const [command, sessionOrEvent, file] = process.argv.slice(2)
try {
  if (command === 'context-report') {
    process.stdout.write(JSON.stringify(contextReport(root), null, 2) + '\n')
  } else if (command === 'bundle') {
    if (!sessionOrEvent) process.stdout.write(SEED_BUNDLES.map((bundle) => bundle.id).join('\n') + '\n')
    else {
      const bundle = SEED_BUNDLES.find((candidate) => candidate.id === sessionOrEvent)
      if (!bundle) throw new Error(`Unknown seed bundle: ${sessionOrEvent}. Run node scripts/agents/cli.mjs bundle.`)
      process.stdout.write(JSON.stringify(bundle, null, 2) + '\n')
    }
  } else if (command === 'context') {
    process.stdout.write(describeContext(root, sessionOrEvent))
  } else if (command === 'prepare') {
    process.stdout.write(prepare(root, sessionOrEvent, file))
  } else if (command === 'review') {
    const reportPath = localPath(root, file)
    if (!reportPath.startsWith('.ai-work/')) throw new Error('Keep review evidence in .ai-work/')
    execFileSync(process.execPath, ['scripts/contracts/check.mjs'], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] })
    execFileSync(process.execPath, ['node_modules/eslint/bin/eslint.js', '.', '--max-warnings', '0'], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] })
    recordReview(root, sessionOrEvent, JSON.parse(readFileSync(resolve(root, reportPath), 'utf8')))
    process.stdout.write('Current output review recorded. This records evidence; it does not certify its truth or replace verify.\n')
  } else if (command === 'hook') {
    process.stdout.write(JSON.stringify(hookDecision(root, JSON.parse(readFileSync(0, 'utf8')), sessionOrEvent)))
  } else {
    throw new Error('Usage: node scripts/agents/cli.mjs context [surface-id] | context-report | bundle [bundle-id] | prepare|review <session-id> .ai-work/<task>/<file>.json | hook [event]')
  }
} catch (error) {
  process.stderr.write(`Repository preflight: ${error.message}\n`)
  process.exitCode = command === 'hook' ? 2 : 1
}
