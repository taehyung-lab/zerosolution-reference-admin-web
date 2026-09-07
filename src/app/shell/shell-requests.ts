// 통합검색 결과의 API·route가 확정되면 입력을 연결한다. 검색어는 개인정보를 포함할 수 있어 출력하지 않는다.
export const requestGlobalSearch: (keyword: string) => void = () => {
  console.log('[시나리오] 통합검색: 검색 입력 수신 → API·결과 화면 연결 대기');
};

// 내 정보의 목적지와 로그인 계정 연결 계약을 기다린다. 임의의 운영자 상세로 이동시키지 않는다.
export function requestMyInfo() {
  console.log('[시나리오] 내 정보 이동: 진입 요청 확인 → 대상 화면 연결 대기');
}
