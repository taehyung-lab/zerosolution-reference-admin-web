import type { MemberActivityDelete } from "../../../model/member-activity";
import type { MemberCounselInput } from "../../../model/member-counsel";
import type { MemberDetailActionRequest } from "./member-detail-actions";

export type MemberDetailRequest =
  | MemberDetailActionRequest
  | {
      readonly kind: "deleteActivity";
      readonly memberId: string;
      readonly input: MemberActivityDelete;
    }
  | {
      readonly kind: "createCounsel";
      readonly memberId: string;
      readonly input: MemberCounselInput;
    }
  | {
      readonly kind: "updateCounsel";
      readonly memberId: string;
      readonly id: string;
      readonly input: MemberCounselInput;
    }
  | {
      readonly kind: "deleteCounsel";
      readonly memberId: string;
      readonly id: string;
    };
