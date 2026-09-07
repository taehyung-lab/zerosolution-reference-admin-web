import type { MemberCounselRecord } from "./member-counsel";
import type { CounselRow } from "./member-records";

export interface CounselDetail extends CounselRow {
  readonly records: readonly MemberCounselRecord[];
  readonly booking?: {
    readonly performance: string;
    readonly booking: string;
    readonly booker: string;
  };
}
