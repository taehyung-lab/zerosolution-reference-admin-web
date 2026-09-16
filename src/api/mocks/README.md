# API 응답 mock

`pnpm dev:mock` 이 브라우저에 MSW worker 를 붙인다. 목적은 실제 네트워크로 나가는 요청이 없음을 보이는 것이다.

- `handlers.ts`: 브라우저와 Node 테스트가 함께 쓰는 handler 집합. 지금은 `/api/` 로 나가는 모든 요청을
  501(`MOCK_NOT_IMPLEMENTED`)로 끝내는 마지막 handler 하나다.
- `browser.ts`: worker 연결. 앱 시작점이 개발용 `mock` mode 일 때만 로드한다.

제품 route 의 조회는 각 feature 의 `api/queries.ts` 가 `fixtures/` 의 임시 응답 함수로 공급하고, 쓰기는
`src/api/scenario.ts` 의 시나리오 함수가 도달만 기록하고 성공으로 끝난다. 그래서 HTTP handler 가 흉내 낼
서버 응답이 없다. 실제 OpenAPI 가 확정되면 generated client 를 `queries.ts`·`mutations.ts` 에 연결하고,
특정 응답을 검증하는 테스트가 계약에 근거한 handler 를 `server.use` 로 지정한다.

현재 mock 은 로그인 세션을 만들지 않는다. 브라우저 검사는 Playwright 의 테스트 세션을 쓴다.
