import { checkEdit, checkStop, localPath, noteWrite } from './preflight.mjs'

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
    if (char === '\n' || char === '\r') return null
    if (quote === "'") {
      if (char === quote) quote = null
      else word += char
      continue
    }
    if (quote === '"') {
      if (char === quote) quote = null
      else if ('\\$`'.includes(char)) return null
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
      if ('\\;&|<>`$(){}*?[]~'.includes(char)) return null
      word += char
      started = true
    }
  }
  if (quote) return null
  if (started) words.push(word)
  return words
}

function inspection(command) {
  const words = literalArguments(command)
  if (!words?.length) return false
  if (words[0] === 'rtk') {
    words.shift()
    if (words[0] === 'proxy') words.shift()
  }
  if (words.some((word) => /^--(?:output|ext-diff|textconv|pre|hostname-bin)(?:=|$)/.test(word))) return false
  const [executable, ...args] = words
  // `grep` and `wc` have no write option, so their argv needs no allowlist; `find` and `sed` do.
  if (['read', 'cat', 'ls', 'rg', 'grep', 'wc', 'pwd'].includes(executable)) return true
  if (executable === 'find') {
    return args.every((token) => !token.startsWith('-') || READ_ONLY_FIND.has(token))
  }
  if (executable === 'sed') return args.length === 3 && args[0] === '-n' && READ_ONLY_SED.test(args[1]) && !args[2].startsWith('-')
  if (['orca', 'orca-ide', 'orca-dev'].includes(executable) && args[0] === 'orchestration' &&
      ORCHESTRATION_RPC.exec(words.slice(0, 3).join(' '))?.[0] === words.slice(0, 3).join(' ')) return true
  if (executable === 'node' && args[0] === 'scripts/agents/cli.mjs') {
    if(args[1] === 'context-report') return args.length === 2
    if (['context', 'bundle'].includes(args[1])) return args.length === 2 ||
      (args.length === 3 && /^[a-z0-9-]+$/.test(args[2]))
    return args.length === 4 && ['prepare', 'review'].includes(args[1]) &&
      /^[\w-]+$/.test(args[2]) && /^\.ai-work\/[\w./-]+\.json$/.test(args[3])
  }
  return executable === 'git' && ['status', 'diff', 'log', 'show', 'ls-files', 'rev-parse'].includes(args[0])
}

export function hookDecision(root, payload, eventOverride) {
  const native = payload.sessionId !== undefined
  const session = payload.session_id ?? payload.sessionId
  const event = eventOverride ?? payload.hook_event_name
  const deny = (reason) => native
    ? { permissionDecision: 'deny', permissionDecisionReason: reason }
    : { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }
  if (event === 'Stop' || event === 'agentStop') {
    const reason = checkStop(root, session)
    return reason ? { decision: 'block', reason } : {}
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
    if (inspection(input.command ?? input.cmd ?? '')) return {}
    const reason = checkEdit(root, session, [])
    // A general shell call may write anywhere, so the session becomes accountable for the tree.
    if (!reason) noteWrite(root, session)
    return reason ? deny(reason) : {}
  } else {
    return {}
  }
  if (targets.every((path) => localPath(root, path).startsWith('.ai-work/'))) return {}
  const reason = checkEdit(root, session, targets)
  if (!reason) noteWrite(root, session)
  return reason ? deny(reason) : {}
}
