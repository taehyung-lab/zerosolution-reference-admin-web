import { useListQuery } from '@/api/list-query';
import { memberListQueryOptions } from '@/features/members/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import type { MemberListDefinition } from './member-list-definition';
import { toMemberListRequest, type MemberListView } from './member-list-search';

/** 활성 회원 목록의 조회 사실. 검색 전(`searched` 없음)에는 조회하지 않고 안내 문구 상태다. */
export function useMemberListData(search: MemberListView, definition: MemberListDefinition) {
  const { locale } = useLocale();
  const query = useListQuery({
    options: memberListQueryOptions(locale, toMemberListRequest(search, definition)),
    searched: search.searched,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });

  return { ...query, totalPages: toTotalPages(query.total, search.pageSize) };
}
