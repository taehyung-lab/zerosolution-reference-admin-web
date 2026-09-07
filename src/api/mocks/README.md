# API 응답 mock

목적은 생성된 API → transport → Query → 화면 흐름을 서버 없이 검사하는 것이다.
mock 응답은 제품 계약을 정의하지 않는다. 현재 데이터는 `openapi/admin.snapshot.json`의 운영자 계약을 따른다.

- `managers.ts`: 동일한 예시 레코드에서 목록·상세·수정 초기값과 연결된 유형·기획사·권한 옵션을 반환한다.
- `handlers.ts`: 브라우저와 Node 테스트가 함께 사용하는 HTTP handler 집합.
- `browser.ts`: MSW worker 연결. 앱 시작점에서 개발용 `mock` mode일 때만 로드한다.
- `src/features/managers/api/mock.test.ts`: 생성 API와 실제 query options를 호출해 응답·오류를 검증한다.

`pnpm dev:mock`으로 실행한다. 일반 개발·production 실행은 HTTP worker를 시작하지 않는다.
제품 회원·운영자 route는 미확정 계약의 예시 응답을 feature queryFn에서 공급한다. 이 HTTP handler는 기존 생성 API 소비자의 테스트용이며 제품 route의 상태/검색 계약을 대신하지 않는다.
현재 mock은 로그인 세션을 만들지 않는다. 브라우저 검사는 기존 Playwright의 테스트 세션을 사용한다.
`pnpm test:e2e:mock`은 제품 목록의 Query 결과와 실제 worker의 목록 응답·미지원 쓰기 501을 검사한다. 생성 API의 목록·상세·수정·옵션 연동은 `mock.test.ts`가 검사한다.

지원하는 목록 조건은 유형·상태·정렬·페이지다. 기간 종류는 전달받지만 날짜 범위 필터는 아직 지원하지 않는다.
미지원 검색 인자는 HTTP 501, 잘못된 페이지/정렬은 400, 없는 상세 ID는 404를 반환한다.
실서버 응답으로 주장하는 정책이 아니라 mock의 검증 범위를 드러내는 동작이다.
빈 목록은 정상 응답이며, 없는 상세를 빈 객체로 바꾸지 않는다.

등록·수정·삭제·인증의 업무 handler는 기본 집합에 없다. 미정의 API는 마지막 handler가 501로 응답한다.
확정되지 않은 성공 응답이나 상태 전이를 만들지 않는다.
그 동작을 검증하는 테스트가 계약에 근거한 handler를 `server.use`로 지정한다.
기존 시나리오의 최종 요청 함수·로그 기준은 그대로다.

## 근거와 전환

dt-admin-web의 `packages/api-client/src/queries/venues/{list,detail,mutations}.ts`와
`apps/admin/src/mocks/browser.ts`에서 조회 선언·응답 변환·mutation 후처리·HTTP mock 경계를 비교했다.
그 프로젝트의 손으로 작성한 client 호출과 invalidation dispatcher는 복사하지 않는다.
이 저장소는 기존 생성 API, `useListQuery`/`useDetailQuery`, feature mutation options와 workflow 소유권을 유지한다.

새 OpenAPI가 확정되면 생성 API·feature 변환·mock 응답을 함께 대조한다.
실서버 연결 후에는 일반 실행에서 실제 API를 사용하고, 유효한 mock은 테스트에 유지한다.
현재 제품 route는 단일 화면 경로에서 feature Query의 예시 응답을 사용한다. 생성 API의 리허설 소비자는 테스트에 보존한다.
서로 다른 필드·검색·업무 계약은 신규 OpenAPI 확인 후 대조하며, 현재 상태를 실서버 연결 완료로 보지 않는다.
