/**
 * 회원 상세의 상담 기록 절을 조회한다. 기록이 없는 것과 아직 도착하지 않은 것, 실패한 것을 구분해야 하므로
 * 조회 사실을 그대로 결과 표면에 넘긴다. 상담 작성·수정·삭제의 입력과 확인 상태는 상담 절이 소유하며 이 훅은 조회만 한다.
 */
import { useListQuery } from '@/api/list-query';
import { useLocale } from '@/shared/i18n/locale-context';
import { memberCounselRecordsQuery } from '../api/detail-queries';
import type { MemberCounselRecords } from './MemberCounselSection';

export function useMemberCounselRecords(memberId: string): MemberCounselRecords {
  const { locale } = useLocale();
  return useListQuery({
    options: memberCounselRecordsQuery(locale, memberId),
    searched: true,
    select: (records) => ({ rows: records, total: records.length }),
  });
}
