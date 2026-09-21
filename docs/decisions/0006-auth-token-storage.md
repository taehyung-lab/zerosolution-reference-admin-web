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

재발급 실패를 모두 terminal로 접지 않는다. 서버가 자격증명을 거부한 경우(재발급 응답 401/403, 봉투가 선언한
자격증명 거부 코드)와 요청을 만들 수 없는 경우만 terminal이며, 그때만 저장된 자격증명을 지우고 로그인 요구
사실을 발행한다. 네트워크·타임아웃·5xx까지 terminal로 접으면 서버가 잠깐 죽은 동안에도 사용자가 로그인
화면으로 튕긴다. 어떤 봉투 코드가 자격증명 거부인지는 [ADR 0001](0001-rehearsal-api-contract.md)의 HTTP 200
resultCode 표가 정한다. 실패처럼 들리는 코드를 그 자리에서 추측해 넣으면 업무 실패 한 건이 세션 종료가 된다.

401을 모두 세션 사건으로 다루지도 않는다. 로그인 전 요청(sign-in·2FA)의 401은 아직 성립한 세션이 없으므로
틀린 자격증명이지 세션의 종료가 아니다. 그것을 전역 사실로 발행하면 로그인 실패가 화면 안 오류가 아니라
로그인 화면 재이동으로 끝난다. 반대로 재발급을 이미 거쳐 온 replay가 다시 401이면 세션이 끝난 것이 확정이므로
자격증명을 지운다. 죽은 토큰을 남기면 라우트 가드가 화면을 다시 열어 주고 401 → 재발급 → 실패가 반복된다.

로그인 요구의 중복 억제는 사실을 발행하는 transport가 아니라 로그인 이동을 실행하는 소비자가 소유하며,
억제 키는 토큰 문자열이 아니라 자격증명 세대다. 토큰은 비밀이라 사실에 실을 수 없고, 발행 시점에는 이미
지워져 있어 어떤 만료에서나 같은 값(비어 있음)으로 읽힌다. 그것을 키로 쓰면 첫 만료 이후의 로그인 요구가
영구히 억제된다. 세대는 새 자격증명이 성립할 때만 오르므로 동시 401 N건은 같은 세대를 공유해 한 번만
이동하고, 재로그인이 세대를 올려 억제를 푼다. 지우기에서 세대를 올리면 동시 실패마다 세대가 갈라져
아무것도 억제되지 않는다.

규칙 본문(저장 adapter, cookie credential, reissue·replay 순서, cross-tab 직렬화, pre-auth 실패와 세션 종료의
구분, 세대 기반 억제, 401/403 incident 표면)은 `.agents/skills/auth-session/SKILL.md`가 소유한다.

## 채택한 것과 제외한 것

채택 범주: 토큰 저장·credential·reissue/replay·cross-tab 직렬화·incident 출처·request ID 보존. 항목별 규칙은
`auth-session.md`에 있다.

제외 범주: 신규 백엔드 계약이 없는 부가 요청 헤더, 추정된 복제 지연 창, SSE 복구와 refresh singleton 결합.
제외 목록의 exact 이름은 `.agents/skills/api-wire/SKILL.md`가 소유하며, 신규 계약과 현재
요구사항이 없으므로 이 레퍼런스의 사실로 승격하지 않는다.

## 미확인과 이행 조건

서버가 인증 요청마다 세션 TTL을 롤링 연장한다. 따라서 세션 만료 타이머를 만들 때 마감의 권위를
로그인과 사용자 조작 ping으로 좁혀야 한다. 배경 조회가 세션을 밀어 만료 경고가 스스로 닫히는 실패가
실측된 바 있다. 타이머·연장 UI는 이 결정의 범위 밖이며, 그 작업이 만료 권위와 ping 주기를 확정한다.

refresh cookie의 배포 조건은 더 이상 공백이 아니라 격리 계약이 선언한 값이다. 그 계약은
`refreshToken`(HttpOnly 세션 쿠키)과 `isLoggedIn`(JS에서 읽을 수 있는 브라우저 종료 감지용 세션 쿠키),
STG·PROD Domain `.zeroplussolution.com`, SameSite LOCAL·DEV `None` / STG·PROD `Lax`를 선언한다
([ADR 0001](0001-rehearsal-api-contract.md)). 미확인은 그 값이 신규 제품의 실제 배포(CORS, domain, SameSite)에서
그대로인지이며, 확인 전에는 제품 정책으로 복사하지 않는다. `isLoggedIn`을 라우트 가드가 함께 읽을지는
이 결정의 범위 밖이고 별도 판단이 필요하다. 신규 backend의 business code 의미도 미확인이다. transport는
response body를 access token으로 바꾸는 adapter shape만 제공하고, 현재 연결된 reader는 격리 계약의
봉투를 읽는다. 코드의 이관 sentinel이 그 자리를 표시한다. 신규 OpenAPI가 확정되면 endpoint·request body·reader를
그 계약으로 다시 확인하고 cookie 배포 조건(CORS, domain, SameSite)을 실제 환경에서 검증해야 bootstrap 완료를 판정할 수 있다.

localStorage access token은 XSS로 읽힐 수 있다. 이 위험은 제품 소유자가 운영 참조 구현과 함께 명시적으로
수용한 trade-off이며 CSP·sanitization 같은 별도 보안 통제를 이 ADR이 추측해 추가하지 않는다.
