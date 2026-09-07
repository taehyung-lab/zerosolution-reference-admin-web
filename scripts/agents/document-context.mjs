import { readFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'

export function referenceOf(value) {
  const reference = typeof value === 'string' ? { file: value } : value
  if (!reference || typeof reference.file !== 'string' || !reference.file.endsWith('.md') || isAbsolute(reference.file) || reference.file.split(/[\\/]/).some((part) => !part || part === '.' || part === '..') || reference.file.includes('\\')) throw new Error('Declare repository Markdown references')
  if (reference.heading !== undefined && (typeof reference.heading !== 'string' || !reference.heading.trim())) throw new Error('Reference heading must be nonempty')
  return reference
}

function headingsOf(lines) {
  const headings = []
  let fence = null
  for (const [index, line] of lines.entries()) {
    const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (delimiter) {
      if (fence === null) fence = delimiter[1]
      else if (delimiter[1][0] === fence[0] && delimiter[1].length >= fence.length && line.trim() === delimiter[1]) fence = null
      continue
    }
    if (fence !== null) continue
    const match = line.match(/^(#{1,6}) +(.+?)\s*#*$/)
    if (match) headings.push({ index, level: match[1].length, title: match[2] })
  }
  return headings
}

// Include the introduction and ancestor lead-ins. A selected section keeps all of its children;
// linked sibling rules still need an explicit reference when they affect the current decision.
export function sectionText(content, heading) {
  if (heading === undefined) return content
  const lines = content.split('\n')
  const headings = headingsOf(lines)
  const matches = headings.filter((item) => item.title === heading)
  if (matches.length !== 1) throw new Error(`Reference heading must exist exactly once: ${heading}`)
  const start = matches[0]
  const end = headings.find((item) => item.index > start.index && item.level <= start.level)?.index ?? lines.length
  const ancestors = []
  for (const item of headings.filter((item) => item.index < start.index)) {
    while (ancestors.length && ancestors.at(-1).level >= item.level) ancestors.pop()
    ancestors.push(item)
  }
  const ranges = [[0, headings[0]?.index ?? 0]]
  for (const item of ancestors.filter((item) => item.level < start.level)) {
    const next = headings.find((candidate) => candidate.index > item.index)?.index ?? lines.length
    ranges.push([item.index, next])
  }
  ranges.push([start.index, end])
  return ranges.map(([from, to]) => lines.slice(from, to).join('\n')).filter(Boolean).join('\n\n')
}

export function readReference(root, value) {
  const reference = referenceOf(value)
  const content = readFileSync(resolve(root, reference.file), 'utf8')
  const selected = sectionText(content, reference.heading)
  if (reference.marker && !selected.includes(reference.marker)) throw new Error(`Reference marker missing: ${reference.file}#${reference.heading}`)
  return { ...reference, content, selected, key: JSON.stringify([reference.file, reference.heading ?? null]) }
}

export function selectedDocuments(root, references) {
  const normalized = references.map(referenceOf)
  const fullFiles = new Set(normalized.filter((item) => item.heading === undefined).map((item) => item.file))
  const selected = new Map()
  for (const reference of normalized) {
    const document = readReference(root, reference)
    if (reference.heading !== undefined && fullFiles.has(reference.file)) continue
    selected.set(document.key, document)
  }
  return [...selected.values()]
}
