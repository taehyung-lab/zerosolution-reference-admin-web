export const memberCounselTypes = [
  "booking",
  "ticketing",
  "delivery",
  "refund",
  "reprintDefect",
  "reprintLost",
  "reprintOther",
  "other",
] as const;

export type MemberCounselType = (typeof memberCounselTypes)[number];

export interface MemberCounselValues {
  readonly receivedAt: string;
  readonly answeredAt: string;
  readonly operatorName: string;
  readonly inquiryType: string;
  readonly content: string;
}

export interface MemberCounselInput extends Omit<
  MemberCounselValues,
  "inquiryType"
> {
  readonly inquiryType: MemberCounselType;
}

export interface MemberCounselRecord extends MemberCounselInput {
  readonly id: string;
  readonly createdAt: string;
}
