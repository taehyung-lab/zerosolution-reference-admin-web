import type { MemberProfile } from "./member-profile";

export interface DormantMemberRow {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string;
  readonly signupMethod: MemberProfile["signupMethod"];
  readonly accountStatus: "general" | "flagged";
  readonly joinedAt: string;
  readonly lastAccessedAt: string;
  readonly dormantAt: string;
}
export interface WithdrawnMemberRow {
  readonly id: string;
  readonly email: string;
  readonly signupMethod: MemberProfile["signupMethod"];
  readonly accountStatus: "general" | "flagged";
  readonly joinedAt: string;
  readonly lastAccessedAt: string;
  readonly withdrawnAt: string;
  readonly reason: string;
}
export interface MemberAccessRow {
  readonly id: string;
  readonly grade: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string;
  readonly accountStatus: "general" | "flagged";
  readonly accessedAt: string;
  readonly accessPath: "app";
}
export interface CounselRow {
  readonly id: string;
  readonly memberId: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string;
  readonly signupMethod: MemberProfile["signupMethod"];
  readonly accountStatus: "general" | "flagged";
  readonly receivedAt: string;
  readonly answeredAt: string;
  readonly inquiryType: string;
  readonly content: string;
  readonly status: "waiting" | "reviewing" | "completed";
}
export interface AppealRow {
  readonly id: string;
  readonly memberId: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string;
  readonly accountStatus: "general" | "flagged";
  readonly appliedAt: string;
  readonly flaggedAt: string;
  readonly restrictions: readonly string[];
  readonly status: "waiting" | "reviewing" | "held" | "completed";
  readonly result: "waiting" | "completed" | "rejected";
}
