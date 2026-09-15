import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describeContext, contextReport } from './context.mjs'
import { SEED_BUNDLES } from '../contracts/seed.mjs'

/** Read-only evidence selection. This process never writes: it only says where the evidence is. */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const [command, argument] = process.argv.slice(2)

try {
  if (command === 'context') {
    process.stdout.write(describeContext(root, argument))
  } else if (command === 'context-report') {
    if (argument && argument !== '--summary') throw new Error('Usage: context-report [--summary]')
    process.stdout.write(JSON.stringify(contextReport(root, { summary: argument === '--summary' }), null, 2) + '\n')
  } else if (command === 'bundle') {
    if (!argument) process.stdout.write(SEED_BUNDLES.map((bundle) => bundle.id).join('\n') + '\n')
    else {
      const bundle = SEED_BUNDLES.find((candidate) => candidate.id === argument)
      if (!bundle) throw new Error(`Unknown seed bundle: ${argument}. Run bundle without an id to list them.`)
      process.stdout.write(JSON.stringify(bundle, null, 2) + '\n')
    }
  } else {
    throw new Error('Usage: node scripts/evidence/cli.mjs context [surface-id] | context-report [--summary] | bundle [bundle-id]')
  }
} catch (error) {
  process.stderr.write(`Evidence: ${error.message}\n`)
  process.exitCode = 1
}
