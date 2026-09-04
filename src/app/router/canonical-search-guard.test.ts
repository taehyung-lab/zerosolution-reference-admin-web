import { isRedirect } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { canonicalSearchGuard } from './canonical-search-guard';

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

describe('canonicalSearchGuard', () => {
  it('redirects invalid raw search back into the current pathname', () => {
    const guard = canonicalSearchGuard(searchSchema);
    let thrown: unknown;

    try {
      guard({ location: { pathname: '/managers', search: { page: '2' } } });
    } catch (error) {
      thrown = error;
    }

    expect(isRedirect(thrown)).toBe(true);
    if (!isRedirect(thrown)) throw new Error('Expected a TanStack Router redirect');
    expect(thrown.options).toMatchObject({ to: '/managers', replace: true });
    expect(
      typeof thrown.options.search === 'function'
        ? thrown.options.search({})
        : thrown.options.search,
    ).toEqual({ page: 2 });
  });

  it('does not redirect an already canonical search', () => {
    const guard = canonicalSearchGuard(searchSchema);

    expect(
      guard({ location: { pathname: '/managers', search: { page: 2 } } }),
    ).toBeUndefined();
  });

});
