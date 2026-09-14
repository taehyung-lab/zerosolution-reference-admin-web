import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const PRODUCT_POINTER = 'docs/reference/product.json'
const defaults = { inventory: 'docs/reference/product', judgment: 'docs/reference/product/judgment.md', scenarios: 'docs/reference/scenarios', index: 'docs/reference/product/context.json' }

export function productPaths(root) {
  const path = resolve(root, PRODUCT_POINTER)
  if (!existsSync(path)) return defaults
  const paths = JSON.parse(readFileSync(path, 'utf8'))
  for (const key of Object.keys(defaults)) {
    const value = paths[key]
    if (typeof value !== 'string' || !value.length || value.startsWith('/') || value.includes('\\') || value.split('/').some(part => !part || part === '.' || part === '..')) throw new Error(`${PRODUCT_POINTER}: ${key} must be a repository-relative canonical path`)
  }
  return paths
}
