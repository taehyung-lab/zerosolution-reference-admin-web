import type { ListResultData } from "@/shared/ui/list/ListResult";
import type { MemberCounselRecord } from "./member-counsel";

/**
 * 상담 기록 절이 소비하는 조회 사실이다. 기록이 없는 것과 아직 오지 않은 것, 실패한 것을 구분한다.
 * 작성 폼은 이 상태와 무관하게 계속 mount 상태로 남아 초안을 잃지 않는다.
 */
export type MemberCounselRecords = ListResultData<MemberCounselRecord>;
