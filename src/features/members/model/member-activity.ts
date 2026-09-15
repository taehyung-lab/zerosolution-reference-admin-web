import type { ListResultData } from "@/shared/ui/list/ListResult";

export const memberActivityTabs = [
  "ticket",
  "attendance",
  "rewatch",
  "entry",
] as const;

export type MemberActivityTab = (typeof memberActivityTabs)[number];

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

/** 상세 안의 페이지 목록이 소비하는 조회 사실이다. 빈 페이지와 조회 실패를 같은 것으로 만들지 않는다. */
export interface MemberActivityData extends ListResultData<MemberActivityRow> {
  readonly total: number;
}

export interface MemberActivityDelete {
  readonly tab: Exclude<MemberActivityTab, "entry">;
  readonly ids: readonly string[];
}
