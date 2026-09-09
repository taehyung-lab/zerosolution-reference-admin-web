// TRANSPLANT_PENDING_PERFORMANCE_EDIT_POLICY: 파일 제한·입력방식 전환 정책 확인 후 편집 route로 연결한다. 저장 성공이나 이동 완료를 뜻하지 않는다.
export const requestPerformanceEdit: (performanceId: string) => void = () => {
  console.log(
    "[시나리오] 공연 입장안내 편집: 대상 확인 → 미확정 입력 정책 대기",
  );
};
