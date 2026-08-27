# OpenAPI 스냅샷

## 이 스냅샷의 정체

`admin.snapshot.json`은 **이 제품(ZERO PLUS+)의 서버 계약이 아니다.**

신규 백엔드가 아직 없는 상태에서 generator / transport / envelope / query-cache seam을
실제 복잡도로 검증하기 위해 사용하는 **격리된 리허설 계약**이다.

- 출처: `https://dev.api.zeroplussolution.com/v3/api-docs` (별개 제품 `Zero Solution 2.0 API`)
- 성격: legacy rehearsal contract
- 폐기 조건과 소유권: `docs/decisions/0001-rehearsal-api-contract.md`

## 금지 사항

- 이 스냅샷의 endpoint, DTO, enum, status, permission code를 **신규 제품의 진실로 삼지 않는다.**
- 위 값들을 `src/shared/**`, `src/app/config/**`, 번역 리소스로 승격하지 않는다.
- 이 계약으로 만든 코드를 공용 승격의 "두 번째 실제 사용" 근거로 세지 않는다.
- **원본 파일을 손으로 고쳐 커밋하지 않는다.** 계약 diff를 위조하는 행위다.

## 알려진 결함 (원본 그대로 보존)

원본 스펙은 OpenAPI 3 스펙을 **6곳에서** 위반한다. 전부 그대로 보존하며 숨기지 않는다.
`pnpm api:validate`가 앞의 5개를 매 실행마다 리포트하고, 규모가 예상과 다르면 실패한다.

| # | 결함 | 규모 | 보정 근거 |
| --- | --- | --- | --- |
| 1 | parameter `in` 값이 비표준 대문자 `HEADER` | 325 parameters | 스펙은 소문자만 허용 |
| 2 | `Authorization`이 전역 `security`와 operation `parameter`로 중복 선언 | 256 operations | 제거하지 않으면 생성 시그니처에 토큰이 노출된다 |
| 3 | component 키에 `$` 포함 (Java inner-class 네이밍) | 470 keys | 스펙 패턴 `^[a-zA-Z0-9.\-_]+$` 위반. Orval 8이 거부. `$`→`_` 치환 + 모든 `$ref` 재작성 |
| 4 | `schema`/`content`가 모두 없는 parameter | 1 | 스펙의 `example`이 이미 문자열임을 보여준다. 타입을 발명하지 않는다 |
| 5 | `type: apiKey`에 `type: http` 전용 속성 `scheme`/`bearerFormat` 혼입 | 2 properties | 두 속성만 제거. 런타임 의미(Authorization 헤더)는 유지 |
| 6 | path template에 선언됐으나 정의가 없는 path parameter | 2 operations | 같은 path의 형제 operation이 이미 `id: integer/int64`로 선언. 형제 정의가 없으면 실패시킨다 |

각 항목의 상세 근거와 폐기 조건은 `docs/decisions/0001-rehearsal-api-contract.md`가 소유한다.

생성 시점에만 `pnpm api:prepare`가 메모리/임시 산출물에서 위 6개를 보정한다.
보정 결과는 `.openapi-prepared/`(gitignore)에만 쓰이며 **원본은 건드리지 않는다.**

### `api:validate`의 현재 한계

`api:validate`는 표준 OpenAPI linter가 아니다. 구조 검사(버전, paths/schemas 존재, `$ref` 해석)와
알려진 결함의 **규모 대조**를 수행한다. 변환 산출물에 대한 strict OpenAPI validation과
valid/invalid fixture 부정 대조군은 아직 없다. 따라서 현재 상태를
"OpenAPI lint 통과"라고 불러서는 안 된다.

## 명령

| 명령 | 동작 | 네트워크 |
| --- | --- | --- |
| `pnpm api:pull` | 원격 스펙을 내려받아 스냅샷 갱신 + diff 요약 | 필요 |
| `pnpm api:validate` | 스냅샷 구조 검증 + 알려진 결함 리포트 | 불필요 |
| `pnpm api:prepare` | 생성 전용 변환 (원본 불변) | 불필요 |
| `pnpm api:generate` | prepare 후 Orval 실행 | 불필요 |
| `pnpm api:check` | validate + generate + generated typecheck | 불필요 |

`api:pull`은 `pnpm verify`에 포함되지 않는다. 신규 clone과 CI가 서버 가용성에 묶이면 안 된다.
