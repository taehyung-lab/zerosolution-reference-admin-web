/**
 * 회원 조회의 상담 기록 절. 기록이 없는 것과 아직 도착하지 않은 것, 실패한 것을 구분해야 하므로
 * 조회 사실을 그대로 결과 표면에 넘긴다. 작성·수정·삭제의 입력과 확인은 그 절이 소유한다.
 */
import { useListQuery } from '@/api/list-query';
import { useLocale } from '@/shared/i18n/locale-context';
import type { MemberCounselRecords } from '../model/member-counsel';
import { memberCounselRecordsQueryOptions } from './queries';

export function useMemberCounselRecords(memberId: string): MemberCounselRecords {
  const { locale } = useLocale();
  return useListQuery({
    options: memberCounselRecordsQueryOptions(locale, memberId),
    searched: true,
    select: (records) => ({ rows: records, total: records.length }),
  });
}
