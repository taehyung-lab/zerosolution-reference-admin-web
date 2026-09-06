import type { AppealRow } from "../model/member-records";

export interface AppealProcessing {
  readonly status: "waiting" | "reviewing" | "held" | "completed";
  readonly result: "waiting" | "completed" | "rejected";
  readonly reason: "" | "unclear" | "insufficient" | "other";
  readonly direct: string;
  readonly opinion: string;
}
export interface AppealRecord extends AppealRow {
  readonly birthDate: string;
  readonly joinedAt: string;
  readonly signupMethod: "direct";
  readonly application: string;
  readonly attachments: readonly { name: string; href: string }[];
  readonly processing: AppealProcessing;
  readonly notified: boolean;
}
