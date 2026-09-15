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
function sectionRanges(content, heading) {
  const lines = content.split('\n')
  if (heading === undefined) return [[0, lines.length]]
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
  return ranges
}

export function sectionText(content, heading) {
  const lines = content.split('\n')
  return sectionRanges(content, heading).map(([from, to]) => lines.slice(from, to).join('\n')).filter(Boolean).join('\n\n')
}

export function referenceCovers(root, evidence, source) {
  const parent = referenceOf(evidence)
  const child = referenceOf(source)
  if (parent.file !== child.file) return false
  const { content } = readReference(root, parent)
  const [from, to] = sectionRanges(content, parent.heading).at(-1)
  const [start, end] = sectionRanges(content, child.heading).at(-1)
  return from <= start && end <= to
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
  const documents = [...selected.values()]
  const files = [...new Set(documents.map(doc => doc.file))]
  return files.flatMap(file => {
    const covered = new Set()
    const candidates = documents.filter(doc => doc.file === file).map(doc => ({
      ...doc, ranges: sectionRanges(doc.content, doc.heading),
    }))
    // Cover parents before children, independently of which input requested them first.
    candidates.sort((a, b) => a.ranges.at(-1)[0] - b.ranges.at(-1)[0])
    return candidates.flatMap(doc => {
      const lines = doc.content.split('\n')
      const selectedLines = []
      for (const [from, to] of doc.ranges) for (let index = from; index < to; index++) {
        if (!covered.has(index)) selectedLines.push(lines[index])
        covered.add(index)
      }
      return doc.heading === undefined || selectedLines.some(line => line.trim()) ? [{ ...doc, selected: selectedLines.join('\n') }] : []
    })
  })
}
