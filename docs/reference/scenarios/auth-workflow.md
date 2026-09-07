# 로그인 workflow 시나리오 — 1차 인증 · 2차 인증 · 비밀번호 변경 · 세션 성립

`session-lifetime.md`가 **성립한 세션이 언제 끝나는가**를 다룬다면, 이 카드는 그 앞 구간, 즉 **세션이 어떻게 성립하는가**를 다룬다. 현재 저장소에는 1차 인증만 있고 2차 인증·비밀번호 변경 단계는 미구현이다(`src/features/auth/screens/login/ui/LoginScreen.tsx:36-40`). 이 카드는 그 작업의 설계 입력이며 구현 코드는 쓰지 않는다.

증거 출처: 저장소 안은 `파일:줄`, 스냅샷은 `openapi/admin.snapshot.json:줄`로 표기한다. 저장소 밖 근거는 2026-09-04에 비교 가능한 운영 어드민의 커밋 메시지와 코드를 읽어 확정한 **런타임 실패·정정 사실**만 "외부 관측"으로 쓰고, 그 제품의 설계·파일 구조·구현 선택은 증거에서 제외한다. `[확인]`은 파일:줄이나 스키마 원문으로 확인한 것, `[추론]`은 그 사실에서 끌어낸 판단이다.

## 1. 이 시나리오가 요구하는 것

대응 화면은 Figma `2.1 로그인`이며 흐름이 **로그인 → 2단계 이메일 인증 / 2단계 구글OTP 인증 / 구글OTP 등록 → 비밀번호 변경**으로 관찰된다(`docs/reference/zero-sol/02-auth.md:7`). 현재 코드는 `LoginScreen`(2단계 없음)이다. **적용 가능**하다. `[확인]`

Notion이 선언한 정책. `[확인]`

- 1차 인증 **연속 5회 실패 시 계정 잠금**, 성공하면 누적 초기화. **2차 인증은 이 실패 카운트에서 제외**한다(`docs/reference/zero-sol/notion/02-auth.md:5`).
- **1차 로그인 유효시간은 30분**이고 초과하면 alert "2차인증 지연으로 초기화됩니다. / 다시 로그인 후 이용해주세요." → 확인 시 1차 로그인 화면으로 이동(`notion/02-auth.md:11`).
- 2차 인증 화면의 **남은시간은 5분 0초부터** 카운트한다(`notion/02-auth.md:12`).
- 2차 성공 후 **접근 권한이 있는 메뉴 중 가장 좌측 메뉴 화면으로 진입**한다(`notion/02-auth.md:13`).
- 마지막 비밀번호 변경일로부터 **90일 초과 시 비밀번호 변경 화면**이 제공되고, "다음에 변경하기"는 "클릭한 날짜 기준 90일 초과 시점 **or** 마지막 변경 시점 90일 이후"에 재노출한다 — **Notion 자체가 이 `or`를 미확정으로 표기**한다(`notion/02-auth.md:9,14`).

우리 계약(스냅샷)이 선언한 것. 인증 태그 관리자 operation은 9개다. `[확인]`

| operation | 요청 | 응답 | security | 근거 |
| --- | --- | --- | --- | --- |
| `POST /auth/sign-in` | `ah.AuthDTO$SignIn`(id, password) | `rs.Ah.AuthDTO$SignInResponse` | `[]` | `:6909` |
| `POST /auth/2fa/email/send` | `ah.TwoFaDTO$Request`(id) | `rs.Ja.Object` | `[]` | `:7202` |
| `POST /auth/2fa/email/verify` | `ah.TwoFaDTO$Verify`(id, authCode) | `rs.Ah.AuthDTO$SignInResponse` | `[]` | `:7169` |
| `POST /auth/2fa/google-otp/generate` | `ah.TwoFaDTO$Request` | `rs.Ah.TwoFaDTO$GoogleOtp` | `[]` | `:7137` |
| `POST /auth/2fa/google-otp/verify` | `ah.TwoFaDTO$Verify` | `rs.Ah.AuthDTO$SignInResponse` | `[]` | `:7105` |
| `PUT /auth/password` | `ah.AuthDTO$ChangePassword`(password?, extend?) | `rs.Ja.Void` | 전역 상속 = **인증 필요** | `:3093`, `:14558` |
| `POST /auth/sign-out` · `POST /auth/ping` · `POST /auth/reissue` | — | `rs.Ja.Void` / `rs.Ja.Void` / `SignInResponse` | 상속 / 상속 / `[]` | `:6887,:6985,:6942` |

- sign-in description 원문: "관리자 웹 로그인. **이메일로 6자리 인증 코드가 발송되며, 인증 코드를 검증해야 JWT 토큰을 발급받을 수 있습니다.**", "**비밀번호 오류 5회 시 계정 자동 잠금**"(`:6909`).
- 2fa email verify description 원문: "**인증 코드 유효 시간: 6분**"(`:7169`). Notion의 5분과 다르다(미확인 3).
- `ah.AuthDTO$SignInResponse`(`:18350`)에는 **`required`가 하나도 없다.** 필드는 `id`, `type`(INTERNAL|AGENCY|SITE|VENDOR|KSPO), `name`, `email`, `permissionId`, `statusType`(AWAITING|ACTIVE|LOCKED|INACTIVE), `roles`("메뉴 목록"), `pwdChangedAt`, `accessToken`, `requirePasswordChange`다.

## 2. 상태와 전이

### 2.1 응답으로 오는 것과 그 밖에서 오는 것

**sign-in, 2fa/email/verify, 2fa/google-otp/verify 세 operation이 완전히 같은 스키마를 돌려준다.** `[확인]` 즉 계약이 구분하는 것은 엔드포인트가 아니라 **응답에 `accessToken`이 실렸는가** 하나뿐이다. sign-in description은 검증 전에는 토큰을 발급하지 않는다고 말하므로, 1차 성공의 정상 응답은 **`accessToken`이 비어 있는 200**이다. `[확인]`

응답 밖에서 오는 것. `[확인]`

- **인증 코드**는 이메일(또는 OTP 앱)이라는 대역 밖 채널로 간다. 화면은 도착·미도착을 알 수 없고, "발송됨"은 요청 성공일 뿐이다.
- **1차 마감 30분**과 **코드 카운터 5분**은 어떤 응답에도 필드가 없다. `rs.Ja.Object`(send)와 `SignInResponse` 어디에도 만료 시각이 없다.
- **쿠키 2종**(`refreshToken` HttpOnly, `isLoggedIn` JS 가독)은 sign-in description이 산문으로만 선언하고(`:6909`) 스키마는 어느 응답이 굽는지 말하지 않는다.

### 2.2 상태 집합

```text
anonymous ──sign-in 200 (accessToken 없음)──▶ challenge-pending ──verify 200 (accessToken 있음)──▶ session
    ▲                                              │                                                  │
    └──── 30분 초과 alert "2차인증 지연으로 초기화" ─┘                        requirePasswordChange=true ▼
                                                                           password-change-required ──▶ operating
```

**1차 성공과 세션 성립은 다른 사건이다.** `[확인]` 1차 성공은 "이 계정의 비밀번호를 안다"까지고, 세션 성립은 `accessToken`이 도착한 순간이다. 그 사이 구간에는 서버가 인정한 주체가 없으므로 `Authorization` 헤더도, 라우트 진입 권한도, 세션 마감 타이머도 존재하지 않는다.

비밀번호 변경 요구는 **세션 성립 이후**에 있다. `PUT /auth/password`가 전역 security를 상속해 인증을 요구하기 때문이다(`:3093`). `[확인]` Figma가 이 단계를 로그인 흐름 안에 그린 것과 계약이 요구하는 순서가 어긋난다(미확인 5).

## 3. 관측된 실패

| 무엇이 깨졌나 | 왜 | 애초에 무엇을 몰라서 그랬나 |
| --- | --- | --- |
| 탭을 새로 열 때마다 2차 인증까지 포함한 재로그인을 요구했다 (외부 관측) | 성립한 세션 자격증명을 탭 로컬 저장소에 뒀다 | **성립한 세션과 성립 전 challenge의 공유 범위가 다르다**는 것. 세션은 origin 하나이고 challenge는 탭마다 다른 계정으로 동시에 진행될 수 있다. 저장소를 한 정책으로 묶으면 한쪽을 고칠 때 다른 쪽이 깨진다 |
| 비밀번호 변경 "다음에 변경하기"가 브라우저를 닫았다 열어도 유지됐고, 다른 브라우저에서는 다시 떴다 (외부 관측) | 미루기를 클라이언트 플래그로 저장했다. 이름은 "세션 단위"였지만 실제 저장소는 origin·영속이라 다음 로그인/로그아웃까지 살았다 | 미루기의 만료 규칙(클릭일 +90일)이 **서버만 계산할 수 있는 값**이라는 것. 클라이언트 저장소는 그 규칙을 표현할 수 없다 |
| 권한을 바꾼 뒤 화면 게이트가 갱신되지 않았고, 갱신용 캐시 패치 경로는 **애초에 한 번도 동작한 적이 없었다** (외부 관측) | roles를 저장소와 Query cache 두 곳이 소유했다. 실제 쿼리 키에 locale이 붙어 있어 base key로 쓴 패치는 항상 no-op이었고, "캐시 패치로 즉시 반영된다"는 주석만 오래 살아남았다 | 권한 사실의 소유자는 하나여야 한다는 것. 사본을 두면 **그 사본이 살아 있는지 아무도 검증하지 않는다** |
| 다른 곳의 로그인으로 서버가 세션을 끊었는데(중복로그인) 클라이언트가 먼저 토큰 재발급을 시도했고, 최종 종결 사유가 재발급 실패 에러로 덮여 원인 안내가 표시되지 못했다 (외부 관측) | 종결 여부를 HTTP status로 판정했다 | 종결의 권위는 status가 아니라 서버가 선언한 결과코드라는 것 |
| 리프레시 토큰 만료와 유휴 만료가 같은 문구로 수렴해 원인이 다른 종결이 구분되지 않았다. 구분하는 것처럼 생긴 분류 테이블이 있었지만 모든 값이 같은 사유로 접혀 **효용이 0**이었다 (외부 관측) | 테이블과 폴백이 같은 값을 냈다 | 결과를 바꾸지 못하는 분류는 분류가 아니라 비용만 남는 구조라는 것 |
| **현재 저장소**: sign-in 응답에 `accessToken`이 없으면 매퍼가 예외를 던진다(`src/features/auth/model/session.ts:12-14`) | 1차 응답을 곧 세션으로 접었다 | 계약이 그 경우를 **정상 흐름**으로 선언한다는 것(`:6909`). 2차 인증을 붙이는 순간 정상 진입이 contract 결함으로 실패한다 |

## 4. 처음부터 알았다면 이렇게 설계한다

### 4.1 성립 판정은 엔드포인트가 아니라 응답 필드로 한다 `[추론]`

세 operation이 같은 스키마를 주므로, 세션 성립 판정은 "무엇을 호출했는가"가 아니라 "`accessToken`이 왔는가" 한 줄이다. 2차 방식이 이메일·OTP 둘이고 앞으로 늘어도 성립 경로는 하나로 남는다. 반대로 엔드포인트별로 저장 경로를 나누면 방식이 늘 때마다 저장 코드가 늘고, 그중 하나가 조용히 죽는다(관측 실패 3의 형태).

따라서 `startSession`은 `accessToken`이 실제로 온 응답에서만 호출한다. `accessToken`이 없는 200은 실패가 아니라 **challenge 진입**이다.

### 4.2 2차 인증 대기 상태: 소유자와 수명 `[추론]`

담는 것은 로그인 ID, 1차 성공 시각(30분 마감 계산용), 선택한 2차 방식뿐이다. 토큰·roles·permission·프로필은 담지 않는다 — 아직 서버가 인정한 주체가 아니다.

AGENTS.md §3 상태 소유권 표의 어느 칸도 이것을 받지 못한다.

- **서버 데이터/캐시(Query)** — 아니다. 진행 중인 workflow이지 조회 결과가 아니다.
- **Router search** — 아니다. URL에 실으면 공유·복원 대상이 되고, 아직 인증되지 않은 주체의 진행 상태가 링크로 새어 나간다.
- **TanStack Form** — 아니다. 인증코드 입력 필드는 Form이지만 대기 상태 자체는 폼 값이 아니다.
- **app boundary/provider** — 아니다. 세션 이전이라 앱 수명주기가 아니고, 로그인 화면 밖에 소비자가 없다.

**표에 없는 칸이므로 새 칸으로 적는다: "성립 전 인증 진행 상태(pending challenge)". 소유자는 로그인 화면(feature), 수명은 문서(탭) 수명과 서버가 정한 마감 중 먼저 오는 것.**

기본값은 **로그인 화면의 React state 하나**다. 근거는 새로고침 복원이 제품 요구로 확인되지 않았고(미확인 4), Notion의 30분 초과 처리가 "다시 로그인"으로 끝나므로 복원 실패의 대가가 재로그인 1회이기 때문이다. 새로고침 복원이 요구로 확정되면 그때 **탭 격리 저장소**가 최소 형태다. 그 경우에도 성립한 자격증명(origin 공유, `src/api/http/credential.ts:29-45`)과 **같은 저장소에 두지 않는다** — 관측 실패 1이 정확히 그 결합의 대가였다. 저장소는 값의 **공유 범위**가 정하지 편의가 정하지 않는다.

### 4.3 코드 카운터와 1차 마감 `[추론]`

둘 다 응답 필드가 아니므로 클라이언트 상수가 된다. 상수를 코드에 박는 것이 문제가 아니라 **그 값의 출처가 둘로 갈려 있는 것**이 문제다(계약 6분 vs Notion 5분). 값이 확정되기 전에는 미확인으로 잠그고, 확정되면 한 곳에 두고 그 한 곳을 계약 대조 대상으로 삼는다.

이 카운터는 세션 마감(`X-Session-Expires`)과 **다른 축**이다. `session-lifetime.md`의 `deadlineAt`과 같은 소유자에 넣지 않는다 — 하나는 성립 전, 하나는 성립 후이며 권위의 출처도 다르다.

### 4.4 비밀번호 변경 요구: 판정 시점과 미루기의 소유자 `[추론]`

- **판정은 세션 성립 응답 1회.** `requirePasswordChange`가 그 응답의 필드다(`:18350`). 매 요청마다 재판정하지 않는다.
- **판정 주체는 서버.** `pwdChangedAt`으로 클라이언트가 90일을 다시 계산하지 않는다. 두 판정이 갈리면 서버는 요구하는데 화면은 안 띄우거나 그 반대가 된다.
- **미루기의 소유자도 서버다.** `ah.AuthDTO$ChangePassword`에 `extend`가 이미 요청 필드로 있다(`:14558`). "다음에 변경하기"는 클라이언트 플래그가 아니라 `extend`를 실은 요청이고, 다음 성립 응답의 `requirePasswordChange`가 그 결과를 말한다.
- 그러므로 **미루기를 기억하는 클라이언트 칸을 만들지 않는다.** 만들면 (a) 다른 브라우저에서 다시 뜨고, (b) 저장소를 지우면 다시 뜨고, (c) "클릭일 +90일"이라는 제품 규칙을 클라이언트가 계산해야 한다. 셋 다 서버만 아는 값이다. 이것이 관측 실패 2의 구조적 해소다.
- **화면 위치는 로그인 화면 안이 아니다.** 엔드포인트가 인증을 요구하므로 세션이 성립한 뒤의 표면(인증 영역 위 dialog 또는 전용 route)이다.

### 4.5 로그아웃 실패 정책 `[추론]`

**서버 호출이 실패해도 로컬 자격증명은 지운다.** 근거는 관측이 아니라 계약 원문이다 — sign-out description이 "프론트에서 localStorage의 accessToken도 함께 삭제해야 합니다"라고 선언한다(`:6887`). `[확인]`

사용자 의도는 "이 브라우저에서 나가겠다"이다. 실패했다고 자격증명을 남기면 화면은 계속 열리고 요청은 계속 나가며, 사용자는 로그아웃했다고 믿는다. 반대 위험(서버 세션이 남는 것)의 상한은 서버 TTL 30분이고, 그 축은 `session-lifetime.md`가 소유한다. 두 위험은 대칭이 아니다.

다만 성공과 실패를 **같은 결과로 접되 같은 사실로 보고하지는 않는다**. 서버 세션이 남았을 수 있다는 것은 사용자에게 의미 있는 차이다. 종결 후 이동은 새 경로를 만들지 않고 이미 로그인 요구를 소유한 `IncidentBoundary`로 수렴시킨다(`src/app/error-boundary/IncidentBoundary.tsx:26-33`).

현재 코드는 `signOutSession()`이 던지면 `clearAccessToken()`에 도달하지 못한다(`src/app/providers/AuthProvider.tsx:48-51`). `[확인]`

### 4.6 가져오지 말아야 할 것 `[추론]`

- **roles/permission을 클라이언트 저장소에 복제하는 것.** 이전 분석의 "해롭다" 판정을 다시 검토했고 **유지한다.** 근거 셋: (a) 복제본은 서버가 권한을 바꿔도 스스로 낡아, 권한을 바꾸는 화면마다 갱신을 호출해야 하는 규율이 생기고 규율은 검사되지 않는다. (b) 소유자가 둘이 되면 어느 쪽이 진실인지 아무도 확인하지 않는다 — 실제로 한쪽 경로가 죽은 채 오래 살아남았다(관측 실패 3). (c) `roles`는 서버가 "메뉴 목록"이라 선언한 화면 접근 판정의 입력이므로(`:18350`), 낡은 사본은 곧 잘못된 접근 허용 또는 차단이다. 대신 roles/permission은 서버 데이터이므로 **TanStack Query 한 곳**이 소유하고, 진입 권한이 필요한 route는 loader에서 그 query options를 await한다(`.agents/skills/feature-contract/references/router.md` §Guards). 부팅 시점의 공백은 우리 가드가 이미 "자격증명 존재만 본다"로 좁혀 두었으므로(`src/routes/_app.tsx:11-15`) 복제본 없이 성립한다.
- **명령형 "역할 갱신" 함수와 그 전파용 커스텀 이벤트.** 필요한 것은 "권한을 바꾼 mutation이 권한 query를 무효화한다" 한 줄이지 새 이벤트 채널이 아니다.
- **엔드포인트별로 갈라진 세션 저장 경로**(4.1).
- **HTTP status만으로 종결을 판정하는 것**(관측 실패 4).
- **결과를 바꾸지 못하는 분류 테이블**(관측 실패 5). 우리 쪽 대응은 새 테이블을 만드는 것이 아니라, 이미 있는 선언 테이블이 실제로 kind를 바꾸는지 테스트로 고정하는 것이다.

## 5. 우리 공용 계약과의 대조

| 요구하는 것 | 근거 | 판정 |
| --- | --- | --- |
| pre-auth 실패를 세션 종료로 접지 않기 | `src/api/error-outcome.ts:33-37`, `.agents/skills/api-contract/references/auth-session.md:8`, `docs/decisions/0006-auth-token-storage.md:27-30` | 커버됨 |
| 2FA 경로에 `Authorization` 미부착 | `src/api/http/credential.ts:117`(`/auth/2fa/` 포함, 이관 sentinel 표시됨) | 커버됨 |
| 2차 인증 4개 operation 생성물 | `src/api/generated/endpoints.ts:2352,2366,2382,2396`(`verifyGoogleOtp`·`generateGoogleOtp`·`verifyEmail`·`sendEmail`) | 커버됨 |
| `accessToken` 없는 sign-in 200을 정상 흐름으로 다루기 | `src/features/auth/model/session.ts:12-14`가 예외를 던진다. 계약은 그 경우를 정상으로 선언(`openapi/admin.snapshot.json:6909`) | 수정 필요 |
| 성립 전 challenge 상태의 소유자 칸 | `AGENTS.md` §3 상태 소유권 표에 해당 칸 없음(4.2) | 아예 없음 |
| 인증코드 카운트다운 표시 | `src/`(생성물 제외)에 countdown/남은시간 심볼 0건 | 아예 없음 |
| 비밀번호 변경 요구 화면 | `src/features/auth/screens/login/ui/LoginScreen.tsx:36-40`이 자리표시자 오류만 낸다 | 아예 없음 |
| 미루기 상태를 저장할 클라이언트 칸 | 없고, **만들지 않는다**. 소유자는 서버 `extend`(`openapi/admin.snapshot.json:14558`) | 아예 없음(제외 판정) |
| 로그아웃 실패 시 로컬 자격증명 정리 | `src/app/providers/AuthProvider.tsx:48-51` — throw하면 정리에 도달하지 못함. 계약 원문은 정리를 요구(`:6887`) | 수정 필요 |
| 종결 시 로그인 요구 1회 억제 | `src/app/error-boundary/IncidentBoundary.tsx:23,30-31`, `src/api/http/credential.ts:19-25` | 커버됨 |
| 자격증명 존재 기반 진입 가드 + 원래 목적지 보존 | `src/routes/_app.tsx:11-15`, `src/routes/login.tsx:10-12`, `auth-session.md:20` | 커버됨 |
| 탭 간 자격증명 동기화 | `src/api/http/incident.ts:86-97` | 커버됨 |
| roles/permission의 단일 소유자 | `src/app/config/navigation.ts:2` — 메뉴/권한 계약 미확인, 로컬 자리표시자 카탈로그 | 아예 없음 |
| 계정 잠금(5회) 안내 분기 | `src/features/auth/screens/login/ui/LoginScreen.tsx:81-84`가 `unauthorized`·`business`를 한 문구로 접는다. 잠금 코드가 계약에 선언되지 않음 | 아예 없음 |
| 30분 초과·잠금 alert의 dialog primitive | `.agents/skills/shared-ui-contract/references/dialogs.md:9`(`AlertDialog`) | 커버됨 |
| 로그인 실패를 화면 안에 렌더 | `src/features/auth/screens/login/ui/LoginScreen.tsx:56-87` | 커버됨 |
| 2차 인증 화면의 route·surface 조립, 코드 입력 폼·검증 | `.agents/skills/feature-contract/references/router.md` §Thin route, `docs/reference/zero-sol/02-auth.md:7` | feature 소유 |
| 성립 후 착지 화면 결정("가장 좌측 메뉴") | 메뉴 권한 계약이 없어 판정 불가(`src/app/config/navigation.ts:2`, `notion/02-auth.md:13`) | 아예 없음 |
| 인증코드 유효시간 값 | `notion/02-auth.md:12`(5분) vs `openapi/admin.snapshot.json:7169`(6분) | 수정 필요 |

## 6. 미확인

1. **2차 인증이 항상인가 조건부인가.** sign-in description은 항상 코드를 발송한다고 말하지만(`:6909`) 응답 스키마는 `accessToken`을 담을 수 있게 열려 있다(`:18350`). 성립 판정 코드는 두 해석에서 같지만(4.1) 화면 수와 라우팅이 달라진다.
2. **Google OTP 등록을 언제 요구하는가.** Figma `2.1`에 "구글OTP 등록" frame이 있고 `generate`는 pre-auth인데(`:7137`), 최초 로그인 시인지 설정 화면인지 계약과 Notion 모두 침묵한다.
3. **인증코드 유효시간이 5분인가 6분인가.** 어느 쪽도 응답 필드가 아니라 클라이언트 상수가 되므로, 틀리면 사용자는 아직 유효한 코드를 만료로 보거나 만료된 코드를 입력한다.
4. **1차 마감 30분의 authority.** 응답에 필드가 없다. 클라이언트 상수인지, 서버가 다른 경로로 통보하는지, 초과 후 verify가 어떤 코드로 거절되는지가 확정돼야 alert 시점과 복원 필요 여부(4.2)가 정해진다.
5. **"다음에 변경하기"의 재노출 규칙과 `extend`의 의미.** Notion이 "클릭일 +90일 **or** 마지막 변경일 +90일"을 미확정으로 남겼다(`notion/02-auth.md:14`). `extend`에는 description이 없고 operation summary는 "비밀번호 변경 **및 연장**"이라(`:3093`) 비밀번호 유효기간 연장인지 세션 연장인지 갈린다 — `session-lifetime.md` 미확인 6과 같은 갈림이다. 또한 비밀번호 변경이 인증을 요구하므로(`:3093`) Figma가 그린 로그인 흐름 안의 위치와 계약의 순서가 어긋난다.
6. **계정 잠금(5회)이 어떤 status·resultCode로 오는가.** Notion은 전용 alert를 요구하지만(`notion/02-auth.md:5`) 잠금 코드가 계약에 선언되지 않아 지금은 일반 로그인 실패와 구분할 수 없다.
7. **`statusType`이 AWAITING·LOCKED·INACTIVE인 채로 성립 응답이 200으로 올 수 있는가.** 올 수 있다면 "200인데 세션을 만들면 안 되는" 경우가 생기고, 그 판정 자리는 4.1의 성립 판정 한 줄 옆이다.
8. **성립 후 착지 규칙의 입력.** "접근 권한이 있는 메뉴 중 가장 좌측"을 계산하려면 메뉴 권한 계약이 필요하다. 그 계약이 없는 동안 로그인 성공 후 목적지는 `redirect` 파라미터와 고정 기본 경로로만 결정할 수 있다.
