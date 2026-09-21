# 0001. 리허설 API 계약 사용

- 상태: 승인됨
- 날짜: 2026-08-27
- 결정자: 제품 소유자 (사용자)

## 맥락

신규 제품 ZERO PLUS+ 어드민은 Figma 시안은 있으나 **백엔드가 아직 없다.**

`AGENTS.md`의 완료 절의 bootstrap 계약은 OpenAPI generate, transport, 실제 workflow와 contract gate를
함께 검증하도록 요구한다. 동시에 §6(판단·안전)은 불확실한 서버 계약을 추측하지 말라고 한다.
백엔드가 없는 상태에서는 이 둘이 동시에 만족되지 않는다.

검토한 대안:

1. **프론트가 신규 스펙을 직접 저작** — 더 깔끔한 추측일 뿐이며, 상상한 것만 증명한다.
2. **백엔드가 나올 때까지 셸만 구성** — `AGENTS.md`의 완료 절의 기계 게이트를 실제로 만들 수 없다.
3. **별개 제품의 실제 계약으로 리허설** — 실제 401·재발급·필드 오류·페이지네이션을 통과시킬 수 있다.

## 결정

3안을 택한다. 별개 제품 `Zero Solution 2.0 API`의 dev 스펙을 **격리된 리허설 계약**으로 사용해
generator / transport / envelope / query-cache seam을 검증한다.

- 출처: `https://dev.api.zeroplussolution.com/v3/api-docs/1.%20Admin%20API`
- 스냅샷: `openapi/admin.snapshot.json` (원본 그대로 커밋)
- 성격: **신규 제품의 계약이 아니다.** legacy rehearsal contract.

## 격리 조건 (전부 필수)

1. `openapi/README.md`가 리허설 성격과 금지 사항을 선언한다.
2. 리허설의 endpoint·DTO·enum·status·permission code를 `src/shared/**`, `src/app/config/**`,
   번역 리소스의 **제품 진실로 삼지 않는다.**
3. 기본 개발과 테스트는 스냅샷 파생 MSW 계약으로 돌린다. 실제 dev API 호출은 명시적 opt-in
   통합 검증으로 분리하고 production-like 환경에 연결하지 않는다.
4. 이 계약으로 만든 코드는 공용 승격의 "두 번째 실제 사용" 카운트에 넣지 않는다 ([ADR 0014](0014-single-screen-shape.md)).
5. 교체 성공 기준을 "generated + feature api/model 컴파일 통과"로 **축소하지 않는다.**
   route search schema, form schema/defaults/mapper, auth lifecycle, permission, i18n copy,
   MSW/test까지 영향 분석 대상이다.

## 생성 전용 변환

원본 스냅샷은 수정하지 않는다. `scripts/openapi/prepare-generation.mjs`가 임시 산출물
(`.openapi-prepared/`, gitignore)에서만 아래를 보정하며, **각 항목의 규모가 예상과 다르면 실패한다.**

| # | 보정 | 규모 | 근거 |
| --- | --- | --- | --- |
| 1 | parameter `in` 대문자 → 소문자 | 0 | Admin 그룹에는 없어야 한다는 회귀 가드 |
| 2 | 중복 `Authorization` header parameter 제거 | 0 | Admin 그룹에는 없어야 한다는 회귀 가드 |
| 3 | `$` 포함 component 키 정규화 (`$`→`_`) + 모든 `$ref` 재작성 | 353 | 스펙 패턴 `^[a-zA-Z0-9.\-_]+$` 위반. Orval 8이 거부 |
| 4 | `schema`/`content` 없는 parameter에 타입 선언 | 1 | 스펙의 `example`이 이미 문자열임을 보여준다. 타입을 발명하지 않는다 |
| 5 | `type: apiKey`에 섞인 `scheme`/`bearerFormat` 제거 | 2 | 두 속성은 `type: http` 전용. 런타임 의미(Authorization 헤더)는 유지 |
| 6 | 누락된 path parameter를 형제 operation 정의로 보충 | 0 | Admin 그룹에는 없어야 한다는 회귀 가드 |

불변식: schema 개수 불변(407), `$ref` 개수 불변(874)이며 변환 후 전부 해석되어야 한다.
`pnpm api:validate`는 원본의 결함을 **숨기지 않고 매번 리포트**한다.

## Swagger 그룹 선택

dev 백엔드는 네 그룹을 제공하며 합본 `/v3/api-docs`는 그 표면을 모두 섞는다.

| 그룹 | paths | operations | schemas | 이 저장소의 선택 |
| --- | ---: | ---: | ---: | --- |
| 1. Admin API | 173 | 214 | 407 | snapshot source |
| 2. PC 클라이언트 API | 7 | 7 | 43 | 어드민 웹 비대상 |
| 3. 모바일 클라이언트 API | 15 | 17 | 69 | 어드민 웹 비대상 |
| 4. kspo API | 22 | 31 | 68 | 어드민 웹 비대상 |

Admin 그룹만 사용한다. 합본은 어드민 웹이 호출하지 않는 44개 path와 DTO를 포함하고, 그룹과
환경의 scan 순서에 따라 operationId 및 Orval 함수명이 달라진다. source를 바꿀 때는 실제 생성물의
경로를 `src/api/generated-contract.test.ts`로 다시 확인한다. 현장발권 PC 클라이언트를 같은 저장소에
구현하는 제품 요구가 확정되면 그룹 선택과 snapshot 경계를 재검토한다.

## 리허설 계약에서 확인된 사실 (제품 정책 아님)

스펙 문서에 명시된 값이다. **신규 제품의 정책으로 복사 금지.** 신규 백엔드에서 다시 확인해야 한다.

- **응답 코드 체계 (dev 서버 실측, 2026-08-27)**
  - 성공: HTTP 200 + `{"header":{"resultCode":200,"resultMessage":"SUCCESS"}, "data": ...}`
  - **업무 실패: HTTP 200 + `{"header":{"resultCode":2100,"resultMessage":"NOT EXIST"}, ...}`**
    → HTTP 200만으로 성공을 판정하면 안 된다는 transport 경계의 근거가 실측으로 확인됐다
  - 입력값 실패: HTTP 400 + `data: [{field, validCode, message}]`
  - 인증 실패: HTTP 401 + `{"header":{"resultCode":401,...}, "data": null}`
  - 응답에 `x-request-id` 헤더는 **없다**
- 세션: Access Token 30분 / Refresh Token 7일 / 중복 로그인 불가 / 웹은 2FA 이메일 인증
- 응답 헤더 `X-Session-Expires` (ISO-8601), 매 요청마다 30분 슬라이딩, 만료 시 `SESSION_EXPIRED(4004)`
- 쿠키 `refreshToken`(HttpOnly, Secure, LOCAL·DEV=None / STG·PROD=Lax), `isLoggedIn`(비 HttpOnly).
  둘 다 세션 쿠키이며 브라우저 종료 시 삭제. STG·PROD Domain `.zeroplussolution.com`
- 세션 연장 PING: UI 활동 감지 시 `POST /api/v1/auth/ping`, **1분 throttle**
- 서버 지원 로케일 `ko`(기본), `ja`. `X-Locale` > `Accept-Language`. **`en` 미지원**
- 커스텀 헤더 `X-Client-Path`(활동 로그용 화면 경로), `X-Printer-Key`(프린터 API 전용)

### dev 합본과 staging 합본의 서로 다른 결함

2026-08-27 두 환경의 합본 `/v3/api-docs`는 operation 269개로 같지만 서로 다른 계약 결함과
차이를 가진다. 아래 표는 현재 snapshot인 dev Admin 그룹이 아니라 합본끼리 비교한 관측값이다.

| 항목 | dev | staging |
| --- | --- | --- |
| 시간 직렬화 | `"14:30:00+09:00"` 문자열 (정상) | `OffsetTime` 객체 그래프와 `ZoneRules` DST 전환 테이블 누출 (결함) |
| `Authorization` 중복 parameter | 256개 존재 (결함) | 없음 (정상) |
| `X-Client-Path` parameter | 존재 | 없음 |

staging을 단순히 수정 전 빌드나 전부 고장 난 계약으로 보지 않는다. dev 합본은 활동 로그용
`X-Client-Path`를 포함해 더 최신인 정황이 있고 시간 직렬화가 정상이다. 현재 snapshot은 dev의
Admin 그룹만 선택하므로 합본의 중복 `Authorization`은 포함하지 않으며, 해당 변환은 0건 회귀
가드로 유지한다.

snapshot은 dev 출처 하나만 유지하고 환경별 snapshot 및 `api:pull:dev`/`api:pull:staging` 별칭을
만들지 않는다. 원격 비교는 snapshot을 쓰지 않는 `api:diff`로만 수행하며, 각 환경의 결함이
교정되면 두 계약을 다시 비교한다.

### HTTP 200 응답의 resultCode 매핑

| resultCode | transport 판정 | 확인 근거 |
| --- | --- | --- |
| `200` | 성공 | dev 서버 실측 |
| `400` | `validation` | 리허설 입력값 실패 응답 |
| `401`, `4004` | `unauthorized` | 인증 실패 응답, `SESSION_EXPIRED` 선언 |
| 그 외 (`2100` 포함) | `business` | 업무 실패 사실만 확인됨. 구체 회복 의미는 미확인 |

`business`는 서버가 업무 실패를 선언했다는 사실만 뜻하며 conflict, not-found 같은 회복 행동을
주장하지 않는다. 구체 kind 매핑은 **실서버에서 해당 code의 의미를 관측했거나 백엔드가 의미를
확인한 경우에만** 이 표와 transport 구현에 함께 추가한다. 미매핑 code는 개발 모드에서 경고한다.

## 폐기 조건

아래 중 하나라도 성립하면 이 ADR은 폐기되고 스냅샷은 교체된다.

1. 신규 제품의 Admin OpenAPI URL이 확정된다.
2. 신규 백엔드 owner가 스펙 초안을 제공한다.

교체 시 **우리 쪽이 진다.** 리허설 계약과의 차이를 이유로 신규 스펙에 요구를 걸지 않는다.
단, 아래는 신규 스펙에 대한 요구사항으로 전달한다.

- `Authorization`은 전역 `security`로만 선언하고 operation parameter로 중복 선언하지 않는다.
- component 키는 OpenAPI 3 패턴을 지킨다.
- parameter는 `schema` 또는 `content`를 반드시 갖는다.

## 봉투 unwrap과 생성 타입의 정합

리허설 계약에서 Orval이 endpoint 반환 타입 인자로 봉투 타입(`Rs...` = `{header?, data?}`)을 넘기는 사실을
확인했다. mutator가 봉투를 벗기면서 타입을 그대로 두면 정적 타입이 런타임과 어긋나므로, 반환 타입 매핑
당시에는 봉투를 벗긴 런타임 값과 생성 타입을 함께 맞추는 규칙(`UnwrapEnvelope<T>`)을 두었고,
그 선택의 회귀는 transport 단위 테스트로 확인했다. 현재 규칙과 파일 위치는 실행 코드와 검사가 소유한다.

## 결과

- `pnpm api:check`가 네트워크 없이 실제로 통과한다 (validate → prepare → Orval → generated typecheck).
- **214개 operation**이 생성되어 전부 프로젝트 Axios 인스턴스(`customInstance`)를 경유한다.
  (`customInstance<` 문자열은 시그니처와 호출부에 각각 나타나 428회 등장하지만 operation 수는 214다.)
- 생성 시그니처에 `Authorization` 인자가 없다.
- `VITE_API_BASE_URL`은 **origin 까지만** 담는다. 생성 URL이 이미 `/api/v1`을 포함하므로
  baseURL에 `/api`를 넣으면 `/api/api/v1`이 된다. `src/env.ts`가 검증으로 막고
  `transport.test.ts`가 절대 URL 단언으로 회귀를 막는다.
