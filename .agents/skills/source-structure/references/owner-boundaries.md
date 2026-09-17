# 소유자 경계 — 한 파일이 `api` 인지 `model` 인지 갈릴 때

배치 판단 표로 갈리지 않는 경계 사례만 모았다. 표가 답하면 여기 오지 않는다.

## 소유자 경계 — api 훅과 model, lib 와 config

한 파일이 `api`인지 `model`인지, 상수가 `config`인지 `model`인지, 도우미가 `lib`인지 갈릴 때만 읽는다. 배치 표는 [SKILL.md 배치 판단](../SKILL.md#배치-판단)이 소유한다.

## API 훅과 model을 구분하는 기준

`use` 접두사나 API 호출 유무가 아니라 **입력과 결과, 소유하는 결정**을 본다.

- `api`: ID·locale·명시적인 조회 조건을 받아 요청하고 데이터·pending/error/retry 또는 안정된 옵션 값을 반환한다
  (`use<Entity>Detail`, `use<Entity>Options` 꼴). 조회 조건의 선택은 caller가 소유한다. loader용 원본 queryOptions와 키를 그대로 공유한다.
- `model`: URL 정규화·검색 시작 여부·페이지 수·선택 대상·폼 종속 필드·mutation 후 캐시를 결정한다
  (`use<Entity>ListData`, `use<Entity>FormOptions`, `useUpdate<Entity>Mutation` 꼴).
- API-only mutation 훅도 가능하다(로그인처럼 후속 처리가 caller 에 있는 요청). 성공 후 session·navigation 등은
  호출 workflow가 처리한다. 캐시·폼·화면 동작을 옵션 팩토리나 API 훅에 감추지 않는다.
- 기존 API 훅은 이 기준으로 옮기되, 새 훅은 안정된 연결 책임이 있을 때만 만든다.
  함수 호출 한 줄을 감싸는 훅을 의무적으로 추가하지 않는다.

한 도메인의 참조 데이터 조회가 그 도메인 안에서 재사용될 수 있어도 `shared` 데이터는 아니다. 다른 도메인의
실제 소비자가 생기면 [공용 reference data 조건](../../server-state/SKILL.md#shared-reference-data)을
대조한다. 미래 사용 가능성만으로 cross-feature import를 허용하거나 entities를 만들지 않는다.

## lib/config를 과하게 나누지 않는 기준

`model`은 모든 .ts 파일의 수납장이 아니며, `lib`도 나머지를 버리는 폴더가 아니다.
도메인의 날짜 formatter와 오류 번역 키 변환은 domain/lib, 목록의 노출 정의는
screens/list/config에 둔다. 도메인 공통 타입은 domain/model, 한 화면의 schema/defaults는 그 화면의 model,
dialog props는 그 화면의 ui, 표시 전용 문자열 함수는 그 화면의 lib가 소유한다.

상수라고 모두 config로 빼지 않는다. 검색 schema의 기본값, 정렬 허용 목록과 전이,
이력의 개인정보 비노출 정책은 이를 해석하는 model과 함께 둔다. 순수 함수여도 업무 판단을
소유하면 model이다. 특정 화면만 사용하는 행 mapper는 그 화면 model에 둔다.

같은 엔티티가 두 서버 계약(제품 계약과 격리 계약)을 갖는 동안 두 구현은 같은 list/detail/form 업무군 안에서
구분하고 서로의 서버 의미를 합치지 않는다.
