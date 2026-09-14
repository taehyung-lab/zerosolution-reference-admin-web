import { describe, expect, it } from 'vitest'
import { categorySettingsSchema } from './category-settings-schema'

describe('categorySettingsSchema', () => {
  const schema = categorySettingsSchema('required')

  it('requires one named category', () => {
    expect(schema.safeParse({ categories: [] }).success).toBe(false)
    expect(schema.safeParse({
      categories: [{ id: 'a', name: '   ', usage: 'IN_USE' }],
    }).success).toBe(false)
  })

  it('accepts an ordered category row', () => {
    expect(schema.parse({
      categories: [{ id: 'a', name: '안내', usage: 'NOT_IN_USE' }],
    }).categories).toHaveLength(1)
  })
})
