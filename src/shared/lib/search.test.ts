import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  canonicalizeRouteSearch,
  nonEmptyArray,
  resolveSearchDefaults,
  toTotalPages,
} from './search';

interface SparseSearch {
  readonly required?: string;
  readonly optional?: string;
}

const completeDefaults = {
  required: 'default',
  optional: undefined as string | undefined,
};
const sparseSearch: SparseSearch = {};
const resolved = resolveSearchDefaults(sparseSearch, completeDefaults);

expectTypeOf(resolved.required).toEqualTypeOf<string>();
expectTypeOf(resolved.optional).toEqualTypeOf<string | undefined>();

// @ts-expect-error every sparse key must be declared by the defaults object
resolveSearchDefaults(sparseSearch, { required: 'default' });

describe('search utilities', () => {
  it('resolves only declared default keys without leaking sparse extras', () => {
    const sparseWithUnknown = {
      required: 'applied',
      optional: 'kept',
      unknown: 'drop',
    };
    expect(
      resolveSearchDefaults<SparseSearch, typeof completeDefaults>(
        sparseWithUnknown,
        completeDefaults,
      ),
    ).toEqual({ required: 'applied', optional: 'kept' });
  });

  it('canonicalizes parsed search and compares JSON-like values structurally', () => {
    const schema = {
      parse: () => ({ types: ['AGENCY'], page: undefined }),
    };

    expect(
      canonicalizeRouteSearch(schema, { page: undefined, types: ['AGENCY'] }),
    ).toEqual({ search: { types: ['AGENCY'] }, changed: true });
    expect(
      canonicalizeRouteSearch(schema, { types: ['AGENCY'] }),
    ).toEqual({ search: { types: ['AGENCY'] }, changed: false });
  });

  it('returns a copy for non-empty arrays and undefined for empty arrays', () => {
    const values = ['AGENCY'] as const;
    expect(nonEmptyArray(values)).toEqual(['AGENCY']);
    expect(nonEmptyArray([])).toBeUndefined();
  });

  it('derives at least one total page from the feature-selected page size', () => {
    expect(toTotalPages(0, 100)).toBe(1);
    expect(toTotalPages(201, 100)).toBe(3);
  });
});
