/** 임시 응답을 Query로 실행하는 연결부다. 서버 계약 확인 후 queryFn만 생성 API와 응답 매핑으로 교체한다. */
import { localizedQueryKey } from '@/api/query-key';
import { queryOptions } from '@tanstack/react-query';
import { selectMemberProfilePage } from '../fixtures/members';
import {
  accessData,
  appealData,
  counselData,
  dormantData,
  withdrawnData,
} from '../fixtures/record-pages';
import type { resolveMemberSearch } from '../list/model/search-schema';
import type { MemberRecordSearch } from '../records/member-record-search';

// TRANSPLANT_PENDING_MEMBER_LIST_QUERY: the paged member read is an example response, not a backend contract.
export function memberListQuery(
  locale: string,
  search: ReturnType<typeof resolveMemberSearch>,
  variant: 'all' | 'general' | 'flagged'
) {
  return queryOptions({
    queryKey: [
      ...localizedQueryKey(locale, 'members', 'list'),
      variant,
      search,
    ],
    queryFn: () =>
      Promise.resolve().then(() => selectMemberProfilePage(search, variant)),
  });
}

export function dormantDataQuery(locale: string, search: MemberRecordSearch) {
  return queryOptions({
    queryKey: [...localizedQueryKey(locale, 'members', 'dormant'), search],
    queryFn: () => Promise.resolve().then(() => dormantData(search)),
  });
}

export function withdrawnDataQuery(locale: string, search: MemberRecordSearch) {
  return queryOptions({
    queryKey: [...localizedQueryKey(locale, 'members', 'withdrawn'), search],
    queryFn: () => Promise.resolve().then(() => withdrawnData(search)),
  });
}

export function accessDataQuery(locale: string, search: MemberRecordSearch) {
  return queryOptions({
    queryKey: [...localizedQueryKey(locale, 'members', 'access'), search],
    queryFn: () => Promise.resolve().then(() => accessData(search)),
  });
}

export function counselDataQuery(locale: string, search: MemberRecordSearch) {
  return queryOptions({
    queryKey: [...localizedQueryKey(locale, 'members', 'counsel'), search],
    queryFn: () => Promise.resolve().then(() => counselData(search)),
  });
}

export function appealDataQuery(locale: string, search: MemberRecordSearch) {
  return queryOptions({
    queryKey: [...localizedQueryKey(locale, 'members', 'appeals'), search],
    queryFn: () => Promise.resolve().then(() => appealData(search)),
  });
}
