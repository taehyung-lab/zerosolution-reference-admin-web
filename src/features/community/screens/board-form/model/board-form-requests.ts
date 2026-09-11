/**
 * 게시판 등록·수정의 업무 요청 경계다. 원문은 `저장 버튼 → 클릭시, 유효성 체크 → Case02. 정상` 까지
 * 적고 이 저장소에는 저장 API 가 없다(AGENTS 1절).
 * 도달 조건: 폼 검증 통과 → 저장 확인 alert 에서 `확인`. 저장 성공·완료 alert·목록 복귀는 서버 계약이
 * 확정된 뒤 mutation workflow 로 교체하며 여기서 성공을 만들거나 dirty 를 지우지 않는다.
 */
import type { BoardFormValues } from './board-form-schema';

export const requestBoardCreate: (input: BoardFormValues) => void = () => {
  console.log('[시나리오] 게시판 등록: 요청 입력 확인 → API 연결 대기');
};

export const requestBoardEdit: (request: {
  boardId: string;
  input: BoardFormValues;
}) => void = () => {
  console.log('[시나리오] 게시판 수정: 요청 입력 확인 → API 연결 대기');
};
