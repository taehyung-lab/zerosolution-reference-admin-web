import { http, HttpResponse } from 'msw';

/**
 * `pnpm dev:mock` 의 HTTP handler 집합. 제품 route 의 조회는 feature queryFn 이 임시 응답으로 공급하고
 * 쓰기는 `api/scenario` 의 시나리오 함수가 도달만 기록하므로, 여기 남는 것은 실제 네트워크로 나가는 요청을
 * 막는 마지막 handler 하나다. 미정의 API 는 501 로 끝나며 저장 성공이나 상태 전이를 만들지 않는다.
 * 특정 응답을 검증하는 테스트는 계약에 근거한 handler 를 `server.use` 로 지정한다.
 */
export const handlers = [
  http.all(/^https?:\/\/[^/]+\/api\//, () =>
    HttpResponse.json({ code: 'MOCK_NOT_IMPLEMENTED' }, { status: 501 }),
  ),
];
