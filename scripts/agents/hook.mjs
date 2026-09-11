import { homedir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { checkEdit, checkStop, localPath, noteWrite, settleWrite } from './preflight.mjs'

function gitToplevel(dir) {
  try {
    const top = execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    return top || null
  } catch { return null }
}

/**
 * The checkout a tool call acts on. The hook command is installed with the launch directory's script
 * path, so a session working in a nested worktree (`.claude/worktrees/<agent>`) used to be judged
 * against the parent checkout: its writes fell outside that tree and attribution was zero (measured
 * 2026-09-10: the worktree state kept wrote:false, authored:0); the session reported that native edits
 * were denied as out of scope and it wrote through the shell instead.
 * The edited file's toplevel wins, then the payload `cwd`, then the script's own checkout.
 */
export function hookRoot(fallback, payload, toplevelOf = gitToplevel, exists = existsSync) {
  let input = payload?.tool_input ?? payload?.toolArgs ?? {}
  if (typeof input === 'string') { try { input = JSON.parse(input) } catch { input = {} } }
  let file = input?.file_path ?? input?.path
  if (typeof file !== 'string') {
    // Codex edits arrive as a patch; its first absolute target names the checkout.
    const patch = input?.command ?? input?.patch ?? input?.input
    const target = typeof patch === 'string' ? /^\*\*\* (?:Add File|Update File|Delete File|Move to): (\/.+)$/m.exec(patch) : null
    file = target?.[1]
  }
  const candidates = [
    typeof file === 'string' && isAbsolute(file) ? existingAncestor(dirname(file), exists) : null,
    typeof payload?.cwd === 'string' && isAbsolute(payload.cwd) ? payload.cwd : null,
  ]
  for (const dir of candidates) {
    if (dir === null) continue
    const top = toplevelOf(dir)
    if (top) return top
  }
  return fallback
}

/** A new task directory or feature folder does not exist yet; git must be asked from the nearest ancestor that does. */
function existingAncestor(dir, exists) {
  let current = dir
  while (!exists(current) && dirname(current) !== current) current = dirname(current)
  return current
}

/** `find` writes through these; every other leading-dash token must be a read-only predicate. */
const READ_ONLY_FIND = new Set([
  '-maxdepth', '-mindepth', '-depth', '-type', '-name', '-iname', '-path', '-ipath',
  '-regex', '-iregex', '-newer', '-size', '-empty', '-not', '-a', '-and', '-o', '-or',
  '-print', '-print0', '-follow', '-mount', '-xdev',
])
/** Only a numeric-address print. Other sed programs stay behind preparation. */
const READ_ONLY_SED = /^\d+(?:,\d+)?p$/
/**
 * Orchestration RPC that reaches the Orca runtime, never the working tree. Accountability composes
 * per session, so a message that makes another agent edit files is still gated on that agent's own
 * session; blocking these only strands a finished worker that cannot report `worker_done` or read mail.
 * `worker-start` and `dispatch` stay gated because `--setup run` executes project scripts, and every
 * `orca terminal`/`worktree`/`reset` call stays gated because it acts on the checkout.
 */
const ORCHESTRATION_RPC =
  /^orca(?:-ide|-dev)? orchestration (?:send|check|reply|ask|inbox|run-create|run-show|run-list|task-create|task-update|task-list|dispatch-show|worker-show|worker-read|worker-list|gate-create|gate-resolve|gate-list|status)\b/

// This admits a literal argv subset, not arbitrary shell grammar. Unsupported expansion and
// escaping stay behind preparation; quoted regex operators are ordinary argument text.
function literalArguments(command) {
  const words = []
  let word = ''
  let started = false
  let quote = null
  for (const char of command) {
    if (char === '\n' || char === '\r') return { reason: 'a newline' }
    if (quote === "'") {
      if (char === quote) quote = null
      else word += char
      continue
    }
    if (quote === '"') {
      if (char === quote) quote = null
      else if ('\\$`'.includes(char)) return { reason: `${char} inside double quotes, which the shell would treat as an escape or a substitution` }
      else word += char
      continue
    }
    if (char === "'" || char === '"') {
      quote = char
      started = true
    } else if (/\s/.test(char)) {
      if (started) words.push(word)
      word = ''
      started = false
    } else {
      if ('\\;&|<>`$(){}*?[]~'.includes(char)) return { reason: `the shell operator ${char}` }
      word += char
      started = true
    }
  }
  if (quote) return { reason: 'an unclosed quote' }
  if (started) words.push(word)
  return words
}

const NVM_DIR = process.env.NVM_DIR ?? `${homedir()}/.nvm`
const VERIFY_SCRIPTS = new Set(['lint', 'typecheck', 'typecheck:generated', 'test:unit', 'i18n:check', 'contracts:check'])

/**
 * A checkout inside this repository (a worktree under `.claude/worktrees/`): it must carry `.git`, so a
 * `node_modules/<pkg>` with its own `lint` script is not one, and `.ai-work/` (writable without
 * preparation) never is. Paths are compared lexically; a symlink is not resolved.
 */
function insideRepository(root, dir) {
  try {
    const local = localPath(root, dir)
    return !local.startsWith('.ai-work/') && existsSync(resolve(root, local, '.git'))
  } catch { return false }
}

/**
 * Test paths a reviewer may run without preparation: inside the repository's own test roots only. `.ai-work/`
 * is writable without preparation, so a test file there run as inspection would be an unattributed write
 * anywhere in the tree; parent-relative paths and paths outside the repository are refused for the same reason.
 */
function repositoryTestPaths(root, tokens) {
  return tokens.every((token) => {
    if (token.startsWith('-')) return false
    try { return /^(?:src|scripts|tests)(?:\/|$)/.test(localPath(root, token)) } catch { return false }
  })
}

function inspection(command, root) {
  const words = literalArguments(command)
  if (!Array.isArray(words) || !words.length) return false
  if (words[0] === 'rtk') {
    words.shift()
    if (words[0] === 'proxy') words.shift()
  }
  if (words.some((word) => /^--(?:output|ext-diff|textconv|pre|hostname-bin)(?:=|$)/.test(word))) return false
  // The user's nvm binary (`$NVM_DIR/versions/node/v<x.y.z>/bin/node`) is node; the declared engine is not
  // always on PATH. Only that directory is accepted, so a planted `./x/bin/node` or `/tmp/x/.nvm/…` is not.
  if (/^v\d+\.\d+\.\d+$/.test(words[0].replace(`${NVM_DIR}/versions/node/`, '').replace(/\/bin\/node$/, ''))) words[0] = 'node'
  const [executable, ...args] = words
  // `grep` and `wc` have no write option, so their argv needs no allowlist; `find` and `sed` do.
  if (['read', 'cat', 'ls', 'rg', 'grep', 'wc', 'pwd'].includes(executable)) return true
  if (executable === 'find') {
    return args.every((token) => !token.startsWith('-') || READ_ONLY_FIND.has(token))
  }
  if (executable === 'sed') return args.length === 3 && args[0] === '-n' && READ_ONLY_SED.test(args[1]) && !args[2].startsWith('-')
  if (['orca', 'orca-ide', 'orca-dev'].includes(executable) && args[0] === 'orchestration' &&
      ORCHESTRATION_RPC.exec(words.slice(0, 3).join(' '))?.[0] === words.slice(0, 3).join(' ')) return true
  // The repository's own check scripts are read-only by contract (tests write under tmpdir only), and an
  // independent reviewer must be able to measure with them without preparing a checkpoint of its own.
  // `pnpm verify`/`api:check` regenerate files and `vitest -u` rewrites snapshots, so they stay gated.
  if (executable === 'pnpm') {
    // `-C <dir>`/`--dir <dir>` selects a checkout inside this repository (a reviewed worktree), like `git -C`.
    let rest = args
    if (rest[0] === '-C' || rest[0] === '--dir') {
      const dir = rest[1]
      if (dir === undefined || !insideRepository(root, dir)) return false
      rest = rest.slice(2)
    }
    if (rest.length === 1 && VERIFY_SCRIPTS.has(rest[0])) return true
    return rest[0] === 'vitest' && rest[1] === 'run' && repositoryTestPaths(root, rest.slice(2))
  }
  if (executable === 'node' && args[0] === 'node_modules/vitest/vitest.mjs' && args[1] === 'run') {
    return repositoryTestPaths(root, args.slice(2))
  }
  if (executable === 'node' && args[0] === 'scripts/agents/cli.mjs') {
    if (args[1] === 'context-report') return args.length === 2 || (args.length === 3 && args[2] === '--summary')
    // Classification reads the workspace; `--apply` deletes, so it stays behind preparation.
    if (args[1] === 'sweep') return args.length === 2
    if (['context', 'bundle'].includes(args[1])) return args.length === 2 ||
      (args.length === 3 && /^[a-z0-9-]+$/.test(args[2]))
    // A subagent's session id is `<parent>/<agent>` (sessionOf), so the id may carry one `/`.
    return args.length === 4 && ['prepare', 'review'].includes(args[1]) &&
      /^[\w-]+(?:\/[\w-]+)?$/.test(args[2]) && /^\.ai-work\/[\w./-]+\.json$/.test(args[3])
  }
  if (executable !== 'git') return false
  // Directory selection changes where inspection runs, not which operation it performs.
  // Other global options (especially config/aliases) still require preparation.
  let index = 0
  while (args[index]?.startsWith('-C')) {
    if (args[index] === '-C') {
      if (args[index + 1] === undefined) return false
      index += 2
    } else index += 1
  }
  return ['status', 'diff', 'log', 'show', 'ls-files', 'rev-parse'].includes(args[index])
}

/**
 * A denial that only says "prepare" sends an agent to fix the wrong thing when the real cause was a
 * shell operator, so it prepares, fails validation and retries the same shape. Naming the operator and
 * the working alternative is what ends that loop. The recognized subset is deliberately not widened:
 * a backtick inside double quotes is command substitution, while single quotes keep it literal.
 */
function recognitionNote(command) {
  const parsed = literalArguments(command ?? '')
  if (Array.isArray(parsed)) return ''
  return `Not recognized as a read-only command because of ${parsed.reason}. Recognized inspection is a literal argv; put literal text in single quotes to keep characters such as backticks intact. `
}

/**
 * A subagent's payload carries its parent's session id plus its own `agent_id`. Keyed by session alone,
 * a read-only reviewer subagent inherited the parent's write bracket and 18 authored paths (measured
 * 2026-09-11) and could have recorded the parent's review; each agent is its own accountable party.
 */
export function sessionOf(payload) {
  const session = payload.session_id ?? payload.sessionId
  const agent = payload.agent_id ?? payload.agentId
  return session !== undefined && agent !== undefined ? `${session}/${agent}` : session
}

export function hookDecision(root, payload, eventOverride) {
  const native = payload.sessionId !== undefined
  const session = sessionOf(payload)
  const event = eventOverride ?? payload.hook_event_name
  const deny = (reason) => native
    ? { permissionDecision: 'deny', permissionDecisionReason: reason }
    : { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }
  if (event === 'Stop' || event === 'agentStop') {
    const reason = checkStop(root, session)
    return reason ? { decision: 'block', reason } : {}
  }
  // Closes the write bracket so only what moved during the call is attributed to this session.
  if (event === 'PostToolUse' || event === 'postToolUse' || event === 'agentPostTool') {
    settleWrite(root, session)
    return {}
  }
  if (event !== 'PreToolUse' && event !== 'preToolUse') return {}
  const name = payload.tool_name ?? payload.toolName
  let input = payload.tool_input ?? payload.toolArgs ?? {}
  if (typeof input === 'string') input = JSON.parse(input)
  const targets = []
  if (['Edit', 'Write', 'MultiEdit', 'edit', 'create'].includes(name)) {
    const path = input.file_path ?? input.path
    if (typeof path !== 'string') return deny('Unknown edit input: no file path. Use a supported edit tool.')
    targets.push(path)
  } else if (name === 'apply_patch') {
    const patch = input.command ?? input.patch ?? input.input
    if (typeof patch !== 'string') return deny('Unknown apply_patch input')
    for (const match of patch.matchAll(/^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/gm)) targets.push(match[1])
    if (!targets.length) return deny('Cannot identify patch targets')
  } else if (['Bash', 'bash', 'exec_command', 'shell', 'powershell'].includes(name)) {
    const command = input.command ?? input.cmd ?? ''
    if (inspection(command, root)) return {}
    const reason = checkEdit(root, session, [])
    // A general shell call may write anywhere, so the session becomes accountable for the tree.
    if (!reason) noteWrite(root, session)
    return reason ? deny(`${recognitionNote(command)}${reason}`) : {}
  } else {
    return {}
  }
  if (targets.every((path) => localPath(root, path).startsWith('.ai-work/'))) return {}
  const reason = checkEdit(root, session, targets)
  if (!reason) noteWrite(root, session)
  return reason ? deny(reason) : {}
}
