import type { ListResultData } from '@/shared/ui/list/ListResult';

/** 상담 기록의 문의유형. `reprint*` 는 재발권 진입이 열리는 유형이다. */
export const memberCounselTypes = [
  'booking',
  'ticketing',
  'delivery',
  'refund',
  'reprintDefect',
  'reprintLost',
  'reprintOther',
  'other',
] as const;
export type MemberCounselType = (typeof memberCounselTypes)[number];

/** 폼이 보관하는 입력 값. 일시는 브라우저 지역시각 `YYYY-MM-DDTHH:mm`, 유형은 빈 선택을 허용한다. */
export interface MemberCounselValues {
  readonly receivedAt: string;
  readonly answeredAt: string;
  readonly operatorName: string;
  readonly inquiryType: string;
  readonly content: string;
}

/** 검증을 지난 저장 입력. 일시는 UTC instant 다. */
export interface MemberCounselInput extends Omit<MemberCounselValues, 'inquiryType'> {
  readonly inquiryType: MemberCounselType;
}

export interface MemberCounselRecord extends MemberCounselInput {
  readonly id: string;
  readonly createdAt: string;
}

/** 상담 기록 절이 소비하는 조회 사실. 기록이 없는 것과 아직 오지 않은 것, 실패한 것을 구분한다. */
export type MemberCounselRecords = ListResultData<MemberCounselRecord>;
