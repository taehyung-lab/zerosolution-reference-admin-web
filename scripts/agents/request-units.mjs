const text = value => typeof value === 'string' && value.trim().length > 0
const inside = (path, scope) => path === scope || scope.endsWith('/') && path.startsWith(scope)

export function validateUnits(checkpoint, previous, normalize) {
  const { units, currentUnit, requirements, scope } = checkpoint
  if (units === undefined) {
    if (currentUnit !== undefined || previous?.units) throw new Error('Preserve request units and currentUnit')
    return
  }
  if (!Array.isArray(units) || !units.length || !units.every(unit => text(unit.id) && Array.isArray(unit.requirementIds) && unit.requirementIds.length && unit.requirementIds.every(text) && Array.isArray(unit.scope) && unit.scope.length && unit.scope.every(path => text(path) && !path.startsWith('/') && !path.split('/').includes('..')))) throw new Error('Declare units with id, requirementIds and repository scope')
  if (!units.every(unit => unit.scope.every(path => normalize(path) === path.replace(/\/$/, '')))) throw new Error('Every unit scope must use normalized repository paths')
  if (new Set(units.map(unit => unit.id)).size !== units.length) throw new Error('Duplicate unit ID')
  const assigned = units.flatMap(unit => unit.requirementIds).sort()
  if (JSON.stringify(assigned) !== JSON.stringify(requirements.map(item => item.id).sort())) throw new Error('Every requirement belongs to exactly one unit')
  const current = units.find(unit => unit.id === currentUnit)
  if (!current || JSON.stringify([...scope].sort()) !== JSON.stringify([...current.scope].sort())) throw new Error('checkpoint.scope must equal currentUnit scope')
  for (const original of previous?.units ?? []) {
    const next = units.find(unit => unit.id === original.id)
    const same = (left, right) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort())
    if (!next || !same(next.requirementIds, original.requirementIds) || next.id !== currentUnit && !same(next.scope, original.scope)) throw new Error(`Preserve unit ${original.id} membership and inactive scope; refine scope only when that unit is current`)
  }
  for (let index = 0; index < units.length; index++) {
    if (units.slice(index + 1).some(other => units[index].scope.some(left => other.scope.some(right => inside(left, right) || inside(right, left))))) throw new Error('Unit scopes overlap; put shared edits in one unit')
  }
}

// Future requirements retain identity, but do not demand the next unit's evidence before its turn.
export function activeCheckpoint(checkpoint) {
  if (!checkpoint.units) return checkpoint
  const ids = checkpoint.units.find(unit => unit.id === checkpoint.currentUnit).requirementIds
  return { ...checkpoint, requirements: checkpoint.requirements.filter(item => ids.includes(item.id)) }
}
