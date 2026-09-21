import { describe, expect, it } from 'vitest'
import { standardPageSizeOptions, standardPeriodPresetValues } from './list-options'

/**
 * These presets are the transplant contract, not a constant to re-type: a new product decides its
 * own defaults, and these tests pin what the shared config does and does not promise.
 */
describe('standard list config', () => {
  it('offers page sizes in ascending order with no default among them', () => {
    expect([...standardPageSizeOptions].sort((a, b) => a - b)).toEqual([...standardPageSizeOptions])
    expect(new Set(standardPageSizeOptions).size).toBe(standardPageSizeOptions.length)
    // The config declares choices only; 목록 100 / 등록 200 / 통계 1개월 전 stay feature defaults.
    expect(standardPageSizeOptions).not.toHaveProperty('default')
  })

  it('offers period presets without CUSTOM, which is a control state rather than a range', () => {
    expect(standardPeriodPresetValues).not.toContain('CUSTOM')
    expect(new Set(standardPeriodPresetValues).size).toBe(standardPeriodPresetValues.length)
  })

  it('carries plain transferable values, so a new product can re-decide them without reading code', () => {
    for (const size of standardPageSizeOptions) {
      expect(Number.isInteger(size)).toBe(true)
      expect(size).toBeGreaterThan(0)
    }
    for (const preset of standardPeriodPresetValues) {
      expect(typeof preset).toBe('string')
      expect(preset).not.toBe('')
    }
  })
})
