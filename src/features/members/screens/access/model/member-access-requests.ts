import type { MemberDownloadRequest } from "../../../mechanics/record-list/model/member-download";

// 선택 범위는 ID, 전체 범위는 확정한 검색 조건을 받는다. 파일 생성·다운로드 API는 아직 연결하지 않았다.
export const requestMemberAccessDownload: (
  request: MemberDownloadRequest,
) => void = () => {
  console.log("[시나리오] 회원접속 다운로드: 요청 입력 확인 → API 연결 대기");
};
