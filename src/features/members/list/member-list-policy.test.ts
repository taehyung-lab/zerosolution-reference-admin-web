import { describe, expect, it } from 'vitest';
import {
  changeMemberListPage,
  changeMemberListView,
  pruneSelectedMemberIds,
  toggleMemberPageSelection,
} from './member-list-policy';
import { resolveMemberSearch } from './search-schema';

describe('member list policy', () => {
  it('resets page for view changes and preserves filters for paging', () => {
    const search = resolveMemberSearch({ periodType: 'joinedAt', page: 7 });

    expect(changeMemberListView(search, { pageSize: 200 })).toMatchObject({
      page: 1,
      pageSize: 200,
      periodType: 'joinedAt',
    });
    expect(changeMemberListPage(search, 3)).toMatchObject({
      page: 3,
      periodType: 'joinedAt',
    });
  });

  it('selects the current selectable page and prunes stale or disabled ids', () => {
    expect(toggleMemberPageSelection(new Set(), ['a', 'b'], true)).toEqual(
      new Set(['a', 'b']),
    );
    expect(
      pruneSelectedMemberIds(new Set(['a', 'b', 'stale']), ['b', 'c']),
    ).toEqual(new Set(['b']));
  });
});
