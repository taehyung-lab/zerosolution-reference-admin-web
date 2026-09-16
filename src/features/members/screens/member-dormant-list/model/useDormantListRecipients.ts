import { useQueryClient } from '@tanstack/react-query';
import { dormantListQueryOptions } from '@/features/members/api/queries';
import {
  memberMessageRecipients,
  type MemberMessageChannel,
  type MemberMessageTarget,
} from '@/features/members/model/member';
import { useLocale } from '@/shared/i18n/locale-context';
import { dormantListSearch, toDormantListRequest, type DormantListSearch } from './dormant-list-search';

/** 선택한 휴면회원의 발송 수신자를 목록과 같은 Query 응답에서, 발송 의도가 실행되는 순간 읽는다. */
export function useDormantListRecipients(
  sparse: DormantListSearch,
): (channel: MemberMessageChannel, ids: readonly string[]) => readonly MemberMessageTarget[] {
  const { locale } = useLocale();
  const client = useQueryClient();
  return (channel, ids) => {
    const request = toDormantListRequest(dormantListSearch.resolve(sparse));
    const page = client.getQueryData(dormantListQueryOptions(locale, request).queryKey);
    return memberMessageRecipients(page?.rows ?? [], channel, ids);
  };
}
