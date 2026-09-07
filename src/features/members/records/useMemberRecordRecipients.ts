/**
 * 기록 목록(휴면·소명)에서 선택한 행의 발송 수신자를 그 목록과 같은 Query 응답에서 만든다.
 * 다섯 기록 목록이 같은 Query 계약(`(locale, search) => 페이지`)을 쓰므로 호출부는 자기 Query만 넘긴다.
 *
 * 값이 아니라 조회 함수를 돌려준다. 발송 의도가 실행되는 순간의 캐시를 읽어야 render 시점의 낡은 연락처를 붙들지 않는다.
 * 필요한 것이 이 한 번의 읽기뿐이라 관찰자를 새로 붙이지 않는다. 조회 실행과 로딩·실패는 목록 화면이 소유한다.
 */
import {
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useLocale } from '@/shared/i18n/locale-context';
import {
  memberMessageRecipients,
  type MemberContact,
  type MemberMessageTarget,
} from '../model/member-message';
import type { MemberRecordSearch } from './member-record-search';

type ContactPage = { readonly rows: readonly MemberContact[] };

export function useMemberRecordRecipients<
  TPage extends ContactPage,
  TKey extends QueryKey,
>(
  search: MemberRecordSearch,
  query: (
    locale: string,
    search: MemberRecordSearch
  ) => UseQueryOptions<TPage, Error, TPage, TKey>
): (
  channel: 'sms' | 'email',
  ids: readonly string[]
) => readonly MemberMessageTarget[] {
  const { locale } = useLocale();
  const client = useQueryClient();
  return (channel, ids) => {
    const page = client.getQueryData<TPage>(query(locale, search).queryKey);
    return memberMessageRecipients(page?.rows ?? [], channel, ids);
  };
}
