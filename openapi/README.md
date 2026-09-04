# OpenAPI 스냅샷 사용법

`admin.snapshot.json`은 신규 백엔드가 없는 동안 generator·transport·envelope·query-cache 경계를 시험하는 격리된 리허설 계약이며 ZERO PLUS+의 제품 계약이 아니다. 채택 이유, 원본 출처, Admin 그룹 선택, 관찰된 결함과 보정 근거, 폐기 조건은 [ADR 0001](../docs/decisions/0001-rehearsal-api-contract.md)이 소유한다.

## 사용 금지 경계

- endpoint, DTO, enum, status, permission code를 신규 제품의 진실로 삼지 않는다.
- 위 값을 `src/shared/**`, `src/app/config/**`, 번역 리소스의 제품 공통 계약으로 승격하지 않는다.
- 이 계약으로 만든 consumer를 공용화의 두 번째 실제 사용 근거로 세지 않는다.
- 원본 snapshot을 손으로 고쳐 계약 diff를 위조하지 않는다.
- 신규 제품 계약이 연결되면 리허설과 다르다는 이유로 신규 계약을 거부하지 않는다.

## 로컬 생성 흐름

원본은 그대로 보존한다. `pnpm api:prepare`가 ADR 0001에 기록된 알려진 결함만 `.openapi-prepared/` 임시 산출물에서 보정한다. 예상한 결함 규모와 실제 값이 다르면 실패해야 한다.

`api:validate`는 OpenAPI 표준 linter가 아니라 snapshot metadata, 기본 구조, `$ref` 해석과 알려진 결함 규모를 검사한다. 따라서 성공해도 “OpenAPI lint 통과”라고 부르지 않는다. 생성 결과의 import와 type 해석은 `api:check`가 별도로 확인한다.

| 명령 | 동작 | 네트워크 |
| --- | --- | --- |
| `pnpm api:pull` | 승인된 원격 source에서 snapshot과 metadata를 갱신하고 diff를 보고 | 필요 |
| `pnpm api:diff -- <url>` | 원격과 현재 snapshot의 path/operation/schema 차이를 읽기 전용 보고 | 필요 |
| `pnpm api:validate` | snapshot 구조·metadata·알려진 결함 규모 검사 | 불필요 |
| `pnpm api:prepare` | 생성 전용 임시 보정; 원본 불변 | 불필요 |
| `pnpm api:generate` | prepare 후 Orval 생성 | 불필요 |
| `pnpm api:check` | validate + generate + generated typecheck | 불필요 |

`api:pull`과 원격 drift 확인은 `pnpm verify` 밖의 명시적 작업이다. 신규 clone과 CI의 기본 검증을 원격 서버 가용성에 묶지 않는다.

## 교체할 때

신규 Admin OpenAPI URL 또는 백엔드 초안이 제공되면 ADR 0001의 폐기 조건에 따라 snapshot을 교체한다. generated code만 컴파일되는 것으로 끝내지 말고 feature query/mutation, route schema, form mapper, auth·permission, i18n, MSW와 테스트 영향까지 다시 확인한다.
