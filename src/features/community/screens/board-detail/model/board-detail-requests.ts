/**
 * 게시판 조회 화면의 업무 요청 경계다. 원문 「게시판정보를 조회할 수 있다」의 `삭제 버튼` 과
 * 99-cross-screen 의 `클릭시 삭제 확인 alert 제공` 까지가 확정된 사실이고, 실제 삭제 API 는 없다.
 * 도달 조건: 조회 화면의 삭제 확인 alert 에서 `확인`. 미연결 후속(삭제 완료 alert·목록 복귀·캐시
 * 무효화)은 서버 계약이 확정된 뒤 mutation workflow 로 교체하며 여기서 성공을 만들지 않는다.
 */
export const requestBoardDelete: (boardId: string) => void = () => {
  console.log('[시나리오] 게시판 삭제: 요청 입력 확인 → API 연결 대기');
};
