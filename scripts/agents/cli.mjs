import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { authoredChanges, prepare, recordReview, localPath } from './preflight.mjs'
import { hookDecision, hookRoot } from './hook.mjs'
import { describeContext, contextReport } from './surface-context.mjs'
import { applySweep, describeSweep, sweepPlan } from './workspace.mjs'
import { SEED_BUNDLES } from '../contracts/seed.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const [command, sessionOrEvent, file] = process.argv.slice(2)
try {
  if (command === 'context-report') {
    if (sessionOrEvent && sessionOrEvent !== '--summary') throw new Error('Usage: context-report [--summary]')
    process.stdout.write(JSON.stringify(contextReport(root, { summary: sessionOrEvent === '--summary' }), null, 2) + '\n')
  } else if (command === 'bundle') {
    if (!sessionOrEvent) process.stdout.write(SEED_BUNDLES.map((bundle) => bundle.id).join('\n') + '\n')
    else {
      const bundle = SEED_BUNDLES.find((candidate) => candidate.id === sessionOrEvent)
      if (!bundle) throw new Error(`Unknown seed bundle: ${sessionOrEvent}. Run node scripts/agents/cli.mjs bundle.`)
      process.stdout.write(JSON.stringify(bundle, null, 2) + '\n')
    }
  } else if (command === 'context') {
    process.stdout.write(describeContext(root, sessionOrEvent))
  } else if (command === 'sweep') {
    if (sessionOrEvent !== undefined && sessionOrEvent !== '--apply') throw new Error('Usage: sweep [--apply]')
    const plan = sweepPlan(root)
    process.stdout.write(describeSweep(plan))
    if (sessionOrEvent === '--apply') {
      const removed = applySweep(root, plan)
      process.stdout.write(removed.length ? `Removed ${removed.length}:\n${removed.map((path) => `  ${path}`).join('\n')}\n` : 'Nothing expired.\n')
    }
  } else if (command === 'prepare') {
    process.stdout.write(prepare(root, sessionOrEvent, file))
  } else if (command === 'review') {
    const reportPath = localPath(root, file)
    if (!reportPath.startsWith('.ai-work/')) throw new Error('Keep review evidence in .ai-work/')
    const run = (args) => execFileSync(process.execPath, args, { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] })
    // Declaration checks stay repository-wide; code checks follow this session's own writes so that a
    // concurrent session's unfinished work cannot fail, or silently pass, this review.
    const { mine, external } = authoredChanges(root, sessionOrEvent)
    const present = mine.filter((path) => existsSync(resolve(root, path)))
    const lintable = present.filter((path) => /\.(?:m|c)?[jt]sx?$/.test(path))
    run(['scripts/contracts/check.mjs'])
    // Authored paths can include generated files that eslint.config.js ignores (for example src/routeTree.gen.ts); the
    // "file ignored" warning is not a lint finding, so it must not fail the review under --max-warnings 0.
    if (lintable.length) run(['node_modules/eslint/bin/eslint.js', ...lintable, '--max-warnings', '0', '--no-warn-ignored'])
    if (present.length) run(['node_modules/vitest/vitest.mjs', 'related', ...present, '--run', '--passWithNoTests'])
    recordReview(root, sessionOrEvent, JSON.parse(readFileSync(resolve(root, reportPath), 'utf8')))
    process.stdout.write(`Review recorded over ${mine.length} authored path(s); contracts, lint and related tests passed for them. This records evidence; it does not certify its truth or replace verify.\n`)
    if (external.length) process.stdout.write(`Changed outside this session's writes (${external.length}, not judged here): ${external.join(', ')}\n`)
  } else if (command === 'hook') {
    const payload = JSON.parse(readFileSync(0, 'utf8'))
    // The gate judges the checkout the call acts on, which is not always the checkout this script lives in.
    const actedOn = hookRoot(root, payload)
    if (sessionOrEvent === 'Stop' || payload.hook_event_name === 'Stop' || payload.hook_event_name === 'SubagentStop') {
      // A session can hold state in two checkouts (a parent and a nested worktree); Stop reconciles both.
      const blocked = [...new Set([actedOn, root])]
        .map((candidate) => hookDecision(candidate, payload, 'Stop'))
        .find((decision) => decision.decision === 'block')
      process.stdout.write(JSON.stringify(blocked ?? {}))
    } else {
      process.stdout.write(JSON.stringify(hookDecision(actedOn, payload, sessionOrEvent)))
    }
  } else {
    throw new Error('Usage: node scripts/agents/cli.mjs context [surface-id] | context-report [--summary] | bundle [bundle-id] | sweep [--apply] | prepare|review <session-id> .ai-work/<task>/<file>.json | hook [event]')
  }
} catch (error) {
  process.stderr.write(`Repository preflight: ${error.message}\n`)
  process.exitCode = command === 'hook' ? 2 : 1
}
