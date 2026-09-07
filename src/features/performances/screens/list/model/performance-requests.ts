// 공연 상세 목적지가 확정되기 전에는 선택한 공연 ID를 받는 이동 요청 지점까지만 검증한다.
export const requestPerformanceDetail: (performanceId: string) => void = () => {
  console.log("[시나리오] 공연 상세 이동: 대상 확인 → 상세 화면 연결 대기");
};
