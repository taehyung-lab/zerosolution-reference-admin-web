import { useQueryClient } from '@tanstack/react-query';
import { memberListQueryOptions } from '@/features/members/api/queries';
import {
  memberMessageRecipients,
  type MemberMessageChannel,
  type MemberMessageTarget,
} from '@/features/members/model/member';
import { useLocale } from '@/shared/i18n/locale-context';
import type { MemberListDefinition } from './member-list-definition';
import { memberListSearch, toMemberListRequest, type MemberListSearch } from './member-list-search';

/**
 * 목록에서 선택한 회원의 발송 수신자를 목록과 같은 Query 응답에서 만든다. 표시 행은 마스킹된 값이라 발송 주소로
 * 쓸 수 없고, 선택은 표시된 페이지에서만 생기므로 같은 페이지 응답이 곧 연락처의 출처다.
 * 값이 아니라 조회 함수를 돌려준다 — 발송 의도가 실행되는 순간의 캐시를 읽어야 낡은 연락처를 붙들지 않는다.
 */
export function useMemberListRecipients(
  sparse: MemberListSearch,
  definition: MemberListDefinition,
): (channel: MemberMessageChannel, ids: readonly string[]) => readonly MemberMessageTarget[] {
  const { locale } = useLocale();
  const client = useQueryClient();
  return (channel, ids) => {
    const request = toMemberListRequest(memberListSearch.resolve(sparse), definition);
    const page = client.getQueryData(memberListQueryOptions(locale, request).queryKey);
    return memberMessageRecipients(page?.rows ?? [], channel, ids);
  };
}
