import { describe, expect, it } from 'vitest';
import { compactSearchValues } from './compact-search-values';

describe('compactSearchValues', () => {
  it('removes only undefined values and empty arrays', () => {
    expect(
      compactSearchValues({
        missing: undefined,
        empty: [],
        zero: 0,
        falseValue: false,
        emptyString: '',
        values: ['AGENCY'],
      }),
    ).toEqual({
      zero: 0,
      falseValue: false,
      emptyString: '',
      values: ['AGENCY'],
    });
  });
});
