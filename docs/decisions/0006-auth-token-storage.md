# 0006. access token 저장과 401/403 경계

- 상태: 승인됨 — response wire 연결은 신규 백엔드 계약 대기
- 날짜: 2026-09-02
- 교체: 2026-08-27의 “메모리에만 보관” 결정을 제품 소유자 확정 사항으로 교체

## 교체 근거

이전 결정은 refresh와 cookie 정책이 없을 때의 임시 보류였다. 제품 소유자가 access token 저장 위치,
cookie refresh, 401 재발급, 탭 간 회전 직렬화, 403 UX를 확정했으므로 메모리 전용 포트와 callback-only
incident seam을 유지할 근거가 사라졌다. 신규 서버 계약을 요구하는 부가 헤더와 복제 지연/SSE 결합은
이 결정의 범위에 넣지 않는다.

## 결정

제품 소유자 확정에 따라 access token은 `localStorage`(try/catch adapter + in-memory mirror), refresh token은
서버 cookie가 소유하고, 401은 reissue 한 번 + 원 요청 재전송 한 번으로 처리한다. 동시 401은 document
single-flight(`refreshPromise`)·Web Locks·rotation retry 상한으로 묶어 무한 반복 없이 한 번의 회전으로 수렴시키며,
terminal incident는 출처(`api | refresh | cross-tab`)를 보존해 app boundary가 UX를 고르게 한다.

규칙 본문(저장 adapter, cookie credential, reissue·replay 순서, cross-tab 직렬화, 401/403 incident 표면)은
`.agents/skills/api-contract/references/auth-session.md`가 소유한다.

## 채택한 것과 제외한 것

채택 범주: 토큰 저장·credential·reissue/replay·cross-tab 직렬화·incident 출처·request ID 보존. 항목별 규칙은
`auth-session.md`에 있다.

제외 범주: 신규 백엔드 계약이 없는 부가 요청 헤더, 추정된 복제 지연 창, SSE 복구와 refresh singleton 결합.
제외 목록의 exact 이름은 `.agents/skills/api-contract/references/transport.md`가 소유하며, 신규 계약과 현재
요구사항이 없으므로 이 레퍼런스의 사실로 승격하지 않는다.

## 미확인과 이행 조건

refresh cookie의 이름·만료·SameSite, reissue response body, 신규 backend의 business code 의미는
미확인이다. transport는 response body를 access token으로 바꾸는 adapter shape만 제공하며 기본 adapter는
값을 추측하지 않는다. 신규 OpenAPI가 확정되면 생성 endpoint/DTO에 맞는 reader를 app auth boundary에
연결하고 cookie 배포 조건(CORS, domain, SameSite)을 실제 환경에서 검증해야 bootstrap 완료를 판정할 수 있다.

localStorage access token은 XSS로 읽힐 수 있다. 이 위험은 제품 소유자가 운영 참조 구현과 함께 명시적으로
수용한 trade-off이며 CSP·sanitization 같은 별도 보안 통제를 이 ADR이 추측해 추가하지 않는다.
