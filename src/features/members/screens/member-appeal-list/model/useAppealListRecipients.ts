import { useQueryClient } from '@tanstack/react-query';
import { appealListQueryOptions } from '@/features/members/api/queries';
import {
  memberMessageRecipients,
  type MemberMessageChannel,
  type MemberMessageTarget,
} from '@/features/members/model/member';
import { useLocale } from '@/shared/i18n/locale-context';
import { appealListSearch, toAppealListRequest, type AppealListSearch } from './appeal-list-search';

/** 선택한 소명 회원의 발송 수신자를 목록과 같은 Query 응답에서, 발송 의도가 실행되는 순간 읽는다. */
export function useAppealListRecipients(
  sparse: AppealListSearch,
): (channel: MemberMessageChannel, ids: readonly string[]) => readonly MemberMessageTarget[] {
  const { locale } = useLocale();
  const client = useQueryClient();
  return (channel, ids) => {
    const request = toAppealListRequest(appealListSearch.resolve(sparse));
    const page = client.getQueryData(appealListQueryOptions(locale, request).queryKey);
    return memberMessageRecipients(page?.rows ?? [], channel, ids);
  };
}
