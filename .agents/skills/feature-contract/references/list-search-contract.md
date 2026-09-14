# List search contract

Read the applicable sections when changing search field declarations, defaults, period input, or search variants. URL transitions, Query gating, and result ownership remain in [list-workflow.md](list-workflow.md).

## Search 계약과 기본값 작성

화면의 `screens/<workflow>/model/*search*.ts` 한 곳에서 필드별 `schema`, `defaultValue`,
`kind: 'filter' | 'view'`를 선언하고 `defineSearchFields(fields)`로 schema·defaults·partition을
함께 만든다. 같은 도메인의 여러 기록 목록이 공유하는 조립은 `mechanics/record-list/model`이
소유한다. API/model은 화면의 search 파일을 역참조하지 않는다. 폴더 기준은
[folder-structure-contract](../../folder-structure-contract/SKILL.md)가 소유한다.

```ts
const fields = {
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  periodType: {
    schema: z.enum(periodTypes).optional().catch(undefined),
    defaultValue: 'performedAt',
    kind: 'filter',
  },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
} as const;
const contract = defineSearchFields(fields);
```

이는 선언 방식의 일부 예시다. 새 제품에서는 실제 필드·기본값·분류를 먼저 확인한다.
공통 날짜·양의 정수·배열 codec의 동작과 타입 경계는
[shared-values.md](../../shared-ui-contract/references/shared-values.md#search-field-declarations-and-codecs)가 소유한다.
허용 pageSize와 enum은 caller가 선택한다. 제품 목록은 `standardPageSizeOptions` 중 하나를 쓴다. 제품 계약이 아닌 격리 계약의 소비자만 그 계약의 형(양의 정수)을 유지한다.

### 형태

새 제품 목록의 URL 필드 이름과 값 모양이다. 새 화면은 이 표를 따르고 이탈을 늘리지 않는다. 현재 소비자와 이탈은 [이 저장소의 관찰](#이-저장소의-관찰)에 있다. `contracts:check` 는 이 표를 보지 않는다 — 리뷰가 본다.

| 필드 | 모양 |
| --- | --- |
| `page`, `pageSize` | 양의 정수. 제품 목록의 `pageSize` 는 `standardPageSizeOptions` 중 하나(격리 계약의 소비자만 위 서술대로 그 계약의 형을 유지). kind `view` |
| `sortType`, `sortDirection` | feature 의 정렬 키 enum, `'asc' \| 'desc'`. `sortDirection` 은 `defaultValue` 필수(목록 공통 `desc`, 2026-09-11 사용자 확정) — `undefined` 를 두면 활성 컬럼이 표시 없이 렌더되므로 `contracts:check` 가 `defaultValue: undefined` 를 실패로 잡는다. aria 어휘 변환은 `headerSortDirection`([list-workflow Sorting](list-workflow.md#sorting)). kind `view` |
| `periodType`, `startDateTime`, `endDateTime` | 기간 기준 enum, UTC instant 두 개. kind `filter` |
| `keywords` | `{ field, value }[]` — 검색 대상이 하나여도 이 모양이다. 축이 없는 `string[]` 을 만들지 않는다. kind `filter` |
| 다중선택 | `string[]`(enum 항목), 빈 배열 = 전체. kind `filter` |
| 단일 선택 | enum 값 또는 `undefined`(전체·조건 없음) |
| `searched` | 표식이 있는 화면만. 극성과 수명은 [list-workflow 상태 절](list-workflow.md#state-and-url-lifecycle)이 정한다. 이 표식의 유무가 "검색을 눌러야 조회" 와 "진입 즉시 조회" 를 가르는 유일한 스위치다 — route loader 는 그 신호가 아니다([router 형태](router.md#형태)) |

### 기본값의 세 가지 역할

| 역할 | 위치와 동작 |
| --- | --- |
| 누락·불량 URL 복구 | 필드 schema의 `optional().catch(undefined)` 등. 유효하지 않은 값의 복구이며 UI 기본값 주입이 아니다. 배열은 항목 제거/배열 전체 제거 중 기존 정책을 선택한다. |
| 화면·요청 유효값 | 각 필드의 `defaultValue`. `resolveSearchDefaults(sparse, contract.defaults)`로 해소한다. `undefined`는 의도적인 미지정, `[]`는 빈 선택이다. 둘의 의미를 제품에서 확인한다. |
| 검색·초기화·URL 복구 정책 | 같은 feature search 계약과 workflow. 조회 시작 정책과 검색 표식은 feature 소유. 날짜 pair 정규화와 선언된 기본값 생략은 순수 공용 도구를 채택한다. |

route의 `validateSearch`와 canonical guard는 해당 화면의 sparse schema를 사용한다.
기본값을 해소한 객체를 route 검색 상태로 저장하지 않는다. 화면은 경계에서 한 번 해소하고 필터·결과·조회 소비자의 입력 타입으로 필수값을 보장한다. 캐시만 읽는 독립 소비자도 같은 resolver를 사용한다. 필터 draft는 해소한 값의
`contract.partition` 중 filter만 받고, 검색 확정 때 view 값은 현재 URL에서 읽는다.
검색 gate는 기본값 해소 전 canonical URL의 검색 의도로 결정한다. 기본 `periodType`이 생겼다는 이유로 Query를 켜면 안 된다.
정렬·보기·페이지 표시와 요청에는 같은 해소 값을 사용하고, Query 키에도 바로 그 요청 입력을 넣는다.
캐시에서 수신자 등을 읽는 별도 소비자도 같은 해소 과정을 거쳐야 한다.

검색 시 첫 페이지, 초기화 시 `{}` 등은 서로 다른 전이다. URL 기본값을 생략할 때는
같은 계약의 defaults와 비교한다. 의미 없는 별도 기본값 상수 계층이나 `?? 100` 복사본을 만들지 않는다.
기간 preset의 기본 선택과 `periodType`은 서로 독립적이며, 검색어 editor의 `initialField`도
`keywords: []`와 다르다. preset·keyword draft의 초기 조작값은 해당 feature 조립이 소유한다. 현재 목록의 무기간은 `inferPeriodPreset`으로 ALL을 파생하며 별도 defaultPreset 상태를 만들지 않는다. 검색어 초기 대상은 feature의 허용 목록 첫 항목을 채택하고 schema와 옵션 UI가 같은 목록을 읽는다. pageSize 허용 목록은 `standardPageSizeOptions`를 채택한다(격리 계약의 소비자만 그 계약의 형을 유지).

### 기간 입력과 확정 경계

`usePeriodDraft.setRange`는 입력 중 한쪽 날짜를 보존한다. 역전된 calendar-day 입력은 편집한 쪽을 남기고 이전 쪽을 지우며, 양쪽을 지우면 ALL을 파생한다. 첫 날짜 입력 즉시 둘 다 지우면 두 단계 입력이 불가능하므로 closed-range 정규화는 여기서 실행하지 않는다.
검색 제출과 직접 URL은 같은 feature canonical schema에서 양끝을 검증한다. 제출 시 기간 draft를 재설정하므로 불완전한 입력이 기존 무기간 URL과 같아져도 입력칸은 비워지고 ALL로 돌아온다. 완전한 범위는 새 committed 값에서 복원한다. 날짜 preset은 브라우저 zone의 하루 양끝을 UTC로 변환한다.

### 변형과 override

같은 목록의 변형이 필드가 다른 경우 공통 원본 필드 객체를 조합하고, 추가·제거·override를
마친 뒤 `defineSearchFields`를 호출한다. 파생된 schema만 `.pick()`/`.omit()`하고 기존 defaults나
partition을 재사용하지 않는다. 각 변형의 세 결과는 정확히 같은 키 집합이어야 한다.
필드의 기본값과 kind가 바뀌면 원본 필드에서 함께 바꾼다. UI·Router·Query·API를 생성하는 팩토리로 확장하지 않는다.

### 날짜 pair 와 기본값 생략의 호출 순서

모든 소비자는 공용 `normalizeClosedInstantRange`를 채택한다. 그 pair 계약은 [shared-values.md](../../shared-ui-contract/references/shared-values.md#pure-utilities-sharedlib)가 소유한다. 여기서 정하는 것은 호출 순서뿐이다 — 불량 pair를 제거해도 독립적으로 유효한 조건과 검색 의도는 보존한다. 초기화 표식이 feature 정책으로 다른 소비자도 날짜·기본값 정규화에서는 제외하지 않는다. 실제 API 계약·이관 미확인 조건은 기존 sentinel을 따른다.

### 검증 기준

필드 전체와 각 변형에서 schema·defaults·partition의 정확한 키, enum·pageSize union·optional 타입,
잘못된 기본값/누락 metadata 거부를 검사한다. 기본값의 타입 적합성이 제품 의미나 숫자 범위까지 증명하지는 않는다.
빈/불량 URL, 검색 전·후, 초기화 2회, 뒤로/앞으로, 정렬·보기 후 재검색을 실제 소비자에서 검증한다.
동일 요청 의미의 생략값/명시값은 요청 입력과 Query 캐시가 같고, 다른 page 등은 달라야 한다.
green은 실행한 시나리오 범위의 증거이며 실 API·제품 전체 이관 완료를 뜻하지 않는다.

## 이 저장소의 관찰

규칙이 아니라 이 저장소 목록에서 위 계약을 적용한 기록이다. 신규 제품의 정책 근거로 복사하지 않으며, 신규 프로젝트는 이 절을 비우고 자기 소비자로 다시 채운다. 실제 숫자·enum의 단일 원본은 각 search 필드 선언이며 변경 시 이 표도 대조한다.

### 형태 절의 현재 이탈 (2026-09-10 3차 검토 실측)

제품 운영자 목록은 `sort`/`direction`(`manager-list-search.ts`)과 `permission` 기본값 `""`(아래 "중복 정리" 표가 확정)를 쓴다 — 표에 맞추는 것은 별도 작업이다. 리허설 운영자의 `{keywordType, keyword}`·`ASC/DESC` 는 서버 어휘라 그대로 둔다. 형태 표 그대로인 소비자는 회원·공연 목록이다.

### 현재 소비자의 기본값과 보존한 차이

| 소비자 | 기간 기준 / 정렬 기본값 | 진입·초기화 |
| --- | --- | --- |
| 운영자 제품 | joinedAt / joinedAt·desc | 명시 검색: 빈 URL 대기, 유효 조건 직접 접근 또는 searched=true 조회, 초기화 `{}` |
| 운영자 리허설 | CREATED_AT / CREATED_AT·DESC | 명시 검색: 제품과 같은 searched 표식, 서버 enum 어휘는 별도 유지 |
| 활성 회원 전체·일반·불량 | joinedAt / joinedAt·desc | 명시 검색; 해당 변형에서 숨긴 필드만 있는 URL은 대기 |
| 공연 | performedAt / registeredAt·방향 미지정 | 진입 즉시 조회, 초기화 `{ searched: false }`, 검색 시 false 제거 |
| 휴면 | joinedAt / joinedAt·desc | 명시 검색, 초기화 `{}` |
| 탈퇴 | joinedAt / withdrawnAt·desc | 명시 검색, 초기화 `{}`. 기간 생략은 직접 접근/버튼 검색 모두 같은 joinedAt 기본값 |
| 접속 | accessedAt / accessedAt·desc | 명시 검색, 초기화 `{}` |
| 상담·소명 | receivedAt·appliedAt / 각각 같은 필드·desc | 진입과 초기화 `{}` 모두 조회 |

위 소비자의 page 기본값은 1, pageSize는 100이며 기간 양끝은 미지정이다. 공연의 초기화 표식만 feature 정책으로 다르다. 변형이 필드가 다른 예는 회원 일반/불량이다.

### 중복 정리의 소유자 (2026-09-07)

| 검토 항목 | 현재 단일 출처·처리 |
| --- | --- |
| 제품 운영자 enum/옵션 4쌍 | search model의 허용 목록을 schema와 옵션 UI가 함께 소비 |
| 리허설 운영자 enum 재선언 | API enum 상수를 옵션에서 참조. UI 순서·번역은 feature에 유지; keyword 목록은 search model 공유 |
| pageSize 허용 목록 | 제품 목록은 `standardPageSizeOptions` 채택. 리허설 양의 정수는 다른 계약이므로 유지 |
| keyword 초기 대상 리터럴 | feature 허용 목록의 첫 항목에서 파생. 빈 keywords 기본값과는 다른 책임 |
| 기간 preset 기본값 | 무기간에서 ALL 파생을 유지. 별도 기본값 선언·상태를 추가하지 않음 |
| permission 빈 문자열 잔류 | 필드 schema가 빈 문자열을 복구하므로 별도 `if (permission === '')` 삭제. 기본값 검색 표식만 유지 |
