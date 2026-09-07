import type { MemberDownloadRequest } from "../../../mechanics/record-list/model/member-download";
import type { MemberCounselInput } from "../../../model/member-counsel";

export type MemberCounselRequest =
  | { readonly type: "download"; readonly input: MemberDownloadRequest }
  | {
      readonly type: "create";
      readonly counselId: string;
      readonly input: MemberCounselInput;
    }
  | {
      readonly type: "update";
      readonly counselId: string;
      readonly noteId: string;
      readonly input: MemberCounselInput;
    }
  | {
      readonly type: "delete";
      readonly counselId: string;
      readonly noteId: string;
    }
  | {
      readonly type: "reissue";
      readonly counselId: string;
      readonly noteId: string;
      readonly printerId: string;
      readonly test: boolean;
    };
