// 통합검색 결과의 API·route가 확정되면 입력을 연결한다. 검색어는 개인정보를 포함할 수 있어 출력하지 않는다.
export const requestGlobalSearch: (keyword: string) => void = () => {
  console.log('[시나리오] 통합검색: 검색 입력 수신 → API·결과 화면 연결 대기');
};
