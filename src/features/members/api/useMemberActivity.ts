/**
 * 상세 안 활동 목록의 조회. 탭·검색·페이지 상태는 호출 절이 소유하고 여기서는 그 조건으로 조회만 한다.
 * 목록이므로 빈 페이지는 결과이며 오류가 아니다. 판정은 공용 useListQuery 가 소유한다.
 */
import { useListQuery } from '@/api/list-query';
import { useLocale } from '@/shared/i18n/locale-context';
import type { MemberActivityData, MemberActivitySearch } from '../model/member-activity';
import { memberActivityQueryOptions } from './queries';

export function useMemberActivity(memberId: string, search: MemberActivitySearch): MemberActivityData {
  const { locale } = useLocale();
  return useListQuery({
    options: memberActivityQueryOptions(locale, memberId, search),
    searched: true,
    select: (page) => page,
  });
}
