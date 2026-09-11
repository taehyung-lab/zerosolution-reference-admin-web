/**
 * 게시판 조회 화면의 업무 요청 경계다. 원문 「게시판정보를 조회할 수 있다」의 `삭제 버튼` 과
 * 99-cross-screen 의 `클릭시 삭제 확인 alert 제공` 까지가 확정된 사실이고, 실제 삭제 API 는 없다.
 * 도달 조건: 조회 화면의 삭제 확인 alert 에서 `확인`. 미연결 후속(삭제 완료 alert·목록 복귀·캐시
 * 무효화)은 서버 계약이 확정된 뒤 mutation workflow 로 교체하며 여기서 성공을 만들지 않는다.
 */
import type { BoardCategoryItem } from '@/features/community/model/board';

export const requestBoardDelete: (boardId: string) => void = () => {
  console.log('[시나리오] 게시판 삭제: 요청 입력 확인 → API 연결 대기');
};

/**
 * 카테고리 설정 팝업(Figma 9.1.5.1)의 `저장`. 원문 50행은 추가·드래그 정렬·순서·제목 지정·삭제만 적고 저장이
 * 무엇을 확정하는지(즉시 반영인지 게시판 저장에 묶이는지)는 미확인이다(판정 문서 질문 27). 여기서는 팝업의
 * 저장이 곧 요청 도달이며, 순서는 배열 순서다.
 */
export const requestBoardCategoriesSave: (request: {
  boardId: string;
  categories: readonly BoardCategoryItem[];
}) => void = () => {
  console.log('[시나리오] 게시판 카테고리 설정 저장: 요청 입력 확인 → API 연결 대기');
};
