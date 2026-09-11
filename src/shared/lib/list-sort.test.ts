import { describe, expect, it } from 'vitest';
import { headerSortDirection } from './list-sort';

describe('headerSortDirection', () => {
  it('gives the active key its aria direction and every other key undefined', () => {
    const active = { type: 'registeredAt', direction: 'desc' } as const;
    expect(headerSortDirection(active, 'registeredAt')).toBe('descending');
    expect(headerSortDirection({ ...active, direction: 'asc' }, 'registeredAt')).toBe('ascending');
    expect(headerSortDirection(active, 'name')).toBeUndefined();
  });
});
