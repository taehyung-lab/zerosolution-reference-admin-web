import { checkEdit, checkStop, localPath, noteWrite } from './preflight.mjs'

/** `find` writes through these; every other leading-dash token must be a read-only predicate. */
const READ_ONLY_FIND = new Set([
  '-maxdepth', '-mindepth', '-depth', '-type', '-name', '-iname', '-path', '-ipath',
  '-regex', '-iregex', '-newer', '-size', '-empty', '-not', '-a', '-and', '-o', '-or',
  '-print', '-print0', '-follow', '-mount', '-xdev',
])
/** Only a numeric-address print. `-i`, `-e`, `-f` and the `w` command all write. */
const READ_ONLY_SED = /^sed +-n +(['"]?)\d+(?:,\d+)?p\1 +\S+$/

function inspection(command) {
  if (/[\n;&|<>`$]/.test(command) || /--output\b|--ext-diff\b|--textconv\b/.test(command)) return false
  const plain = command.replace(/^rtk (?:proxy )?/, '')
  // `grep` and `wc` have no write option, so their argv needs no allowlist; `find` and `sed` do.
  if (/^(?:read|cat|ls|rg|grep|wc|pwd)\b/.test(plain)) return !/--pre\b/.test(plain)
  if (/^find\b/.test(plain)) {
    return plain.split(/\s+/).slice(1).every((token) => !token.startsWith('-') || READ_ONLY_FIND.has(token))
  }
  if (/^sed\b/.test(plain)) return READ_ONLY_SED.test(plain)
  if (/^node scripts\/agents\/cli\.mjs (?:context|bundle)(?: [a-z0-9-]+)?$/.test(plain)) return true
  return /^git (?:status|diff|log|show|ls-files|rev-parse)\b/.test(plain) ||
    /^node scripts\/agents\/cli\.mjs (?:prepare|review)\s+[\w-]+\s+\.ai-work\/[\w./-]+\.json$/.test(plain)
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
