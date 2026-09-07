import type { MemberRecordSearch } from "../../../model/member-record-search";

export type MemberDownloadRequest =
  | { readonly scope: "selected"; readonly ids: readonly string[] }
  | { readonly scope: "all"; readonly search: MemberRecordSearch };
