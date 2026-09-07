import type { AppealProcessing } from "../../../model/appeal-record";
import type { AppealBulkChange } from "./appeal-bulk-change";

// 소명 처리의 저장·통보·일괄변경 연결 지점. 로그는 서버의 저장 결과나 통보 여부를 변경하지 않는다.
export const requestAppealSave: (request: {
  appealId: string;
  input: AppealProcessing;
}) => void = () => {
  console.log("[시나리오] 소명 처리 저장: 요청 입력 확인 → API 연결 대기");
};

export const requestAppealNotify: (request: {
  appealId: string;
  processing: AppealProcessing;
}) => void = () => {
  console.log("[시나리오] 소명 결과 통보: 요청 입력 확인 → API 연결 대기");
};

export const requestAppealBulkChange: (
  request: AppealBulkChange,
) => void = () => {
  console.log("[시나리오] 소명 회원 일괄변경: 요청 입력 확인 → API 연결 대기");
};
