import type { ListResultData } from '@/shared/ui/list/ListResult';

/** 회원 조회·탈퇴회원 조회 안의 활동정보 탭. 입장기록은 삭제할 수 없다. */
export const memberActivityTabs = ['ticket', 'attendance', 'rewatch', 'entry'] as const;
export type MemberActivityTab = (typeof memberActivityTabs)[number];

/** 상세 안의 페이지 목록이라 URL 이 아니라 그 절이 소유하는 조회 조건이다. 페이지 크기는 100 고정이다. */
export interface MemberActivitySearch {
  readonly tab: MemberActivityTab;
  readonly keyword: string;
  readonly page: number;
  readonly pageSize: 100;
}

export interface MemberActivityRow {
  readonly id: string;
  readonly occurredAt: string;
  readonly performanceName: string;
  readonly session: string;
  readonly performanceAt: string;
  readonly bookingNumber: string;
  readonly seatNumber: string;
}

export interface MemberActivityPage {
  readonly rows: readonly MemberActivityRow[];
  readonly total: number;
}

/** 절이 소비하는 조회 사실. 빈 페이지와 조회 실패를 같은 것으로 만들지 않는다. */
export interface MemberActivityData extends ListResultData<MemberActivityRow> {
  readonly total: number;
}

export interface MemberActivityDelete {
  readonly tab: Exclude<MemberActivityTab, 'entry'>;
  readonly ids: readonly string[];
}
