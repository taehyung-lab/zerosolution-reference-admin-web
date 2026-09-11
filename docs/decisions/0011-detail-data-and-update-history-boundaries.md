# 0011. 상세 조회 경계, API 소비 계층, 업데이트 이력 공용화

- 상태: 채택 — 상세·수정 조회의 상태 판정, API 호출 계층, 업데이트 이력 표시의 공용 계약. Managers 상세/수정이 검증하는 첫 consumer 다
- 날짜: 2026-09-03. 방식: 사용자 grilling 으로 요구사항 잠금 → Claude·Codex 독립 설계안 → 교차 리뷰 2라운드(Orca run `run_881d4a85a564`) → 단일 결론 → 사용자 컨펌
- 적용 범위: 레퍼런스 프로젝트의 ID 기반 상세·수정 조회, feature API 소비 계층, 상세 안 업데이트 이력 표
- 관찰 근거: [ZEROsol 인벤토리](../reference/zero-sol/04-members.md) 4.1.4 회원 조회 · 4.4 소명신청 조회 · [5.1 콘텐츠 조회](../reference/zero-sol/05-performances.md) · [6.6 발권 조회](../reference/zero-sol/06-ticketing.md) · 11.1 운영자 조회. 판정 기록은 [ZEROsol 공용화 판정 §8](../reference/zero-sol-figma-analysis.md)
- 관련 결정: 목록·필터는 [0009](0009-shared-boundaries.md), 등록·수정 폼은 [0010](0010-form-boundaries.md). 두 ADR 은 상세 조회와 API 소비 계층을 다루지 않았고 이 ADR 이 그 공백을 채운다

## 이 ADR 의 책임

상세 조회 공용화의 이유, 거부한 대안, 소유권, provisional 단계, 재검토 조건을 보존한다. 구현 절차는
`.agents/skills/feature-contract/references/detail-workflow.md`(상세 화면), `.agents/skills/api-contract/references/query-cache.md`·`mutations.md`(선언과 실행의 분리),
`.agents/skills/shared-ui-contract/references/page-and-detail-surfaces.md`(`UpdateHistory`)가 소유한다. 기계 불변식은 `src/api/required-query.test.tsx`,
`eslint.config.js` 의 API/workflow 의존 규칙과 `gates:negative` 대조군이 소유한다.

이 결정은 "detail-workflow 가 feature 소유라고 썼다"는 문장이 아니라 코드에서 실측한 복제와 결함 입력을 근거로 기존 문장을
바꿨다. 문서가 기준이 아니라는 원칙은 `AGENTS.md` §0(저장소 운영 모드)이 소유한다.

## 맥락 (코드와 인벤토리에서 실측한 사실)

- `ManagerDetailScreen` 과 `ManagerEditScreen` 에 `notFound | error | ready` 삼항 판정이 글자 그대로 두 번 있었다. 목록은 `useManagerListData` 가 같은 판정을 세 번째 변형으로 갖고 있었다.
- 조회는 `queryOptions` 팩토리 + 화면의 `useQuery`, 목록은 feature 훅, mutation 은 `api/mutations.ts` 의 훅으로 **비대칭**이었다.
- Orval 은 `axios-functions` 만 생성한다. route loader(`new`·`edit`)가 `queryClient.query(팩토리)` 로 옵션 캐시를 채우므로 팩토리는 어떤 설계에서도 남는다.
- 인벤토리 5 화면(회원·소명·발권·운영자·콘텐츠 조회)의 업데이트 이력은 같은 3열(업데이트일·사항·담당자)이고, 사항 열은 한 셀에 수정·삭제 같은 여러 종류와 field 단위 `이름: A > B`를 줄바꿈한다. 담당자는 `이름 (계정)` 형식이며 회원가입 행은 빈칸이다. 리허설 DTO `CnChangeLogDTOInventory { type: C/U/D, changes[{field, before, after}] }` 가 14 개 상세 DTO 에 공용으로 들어간다. 현재 코드는 `type` 라벨 한 줄만 그려 디자인과 달랐다.

### 3-state 판정만으로 잡지 못하는 결함 입력 (Codex 교차 리뷰에서 확정)

| 입력 | 기존 판정 | 결정 |
| --- | --- | --- |
| 초기 요청 401/403, data 없음 | `isFeatureError` 가 false → 두 번째 절이 generic `error` 를 띄우고 incident overlay 도 함께 뜸 | `delegated` — 로컬 표면을 만들지 않고 incident boundary 가 소유 |
| cached data + background 500/network | `error` 가 먼저 → 보이던 상세가 오류 화면으로 바뀜 | `ready` — 읽을 수 있는 data 유지 |
| cached data + background 404 | data 우선이면 삭제된 레코드를 stale 로 계속 표시 | `not-found` — 서버가 방금 없다고 답한 사실이 우선 |
| settled, data·error 모두 없음 / non-`ApiError` | — | recoverable `error` — 조용한 빈 화면을 만들지 않고 not-found 의미를 발명하지 않음 |

## 검토한 대안

- **화면이 `useQuery` 를 직접 쓰고 판정을 반복한다**: 화면 수만큼 복제되고 위 결함 입력의 우선순위가 화면마다 달라진다. 거부.
- **`shared/lib` 순수 함수 `toDetailState(facts)`**: facts 를 뽑는 코드가 화면에 남아 반복의 절반만 없어진다. 거부.
- **`DetailStateBoundary` 가 Query 결과를 직접 받는다**: shared 가 Query 와 `ApiError` 를 알게 되어 ESLint 경계(ADR 0009)를 깬다. 거부.
- **`useResourceQuery`·`useCrud`·endpoint/config 기반 controller**: list/detail/form 의 다른 상태 대수를 mode 로 숨긴다. 거부(`local/no-prohibited-abstraction` 가 이름을 막는다).
- **`managerUpdateMutation(queryClient, locale, id)` 팩토리**: options 인데 런타임 객체를 받는 시그니처. 거부. 단, 서버 호출 선언은 `api/` 밖으로 나갈 수 없다(아래 결정).
- **이력 항목 discriminated union(`change | event | unsupported`) 을 shared 입력으로**: 첫 consumer 에 없는 kind 별 스타일·동작 분기라 YAGNI. 거부. 두 번째 consumer 가 요구할 때 재설계.
- **ADR 2개(API 소비 / 이력) + 새 shared reference 파일**: 새 프로젝트 개발자가 상세 이력을 만들 때 4번 이동. 한 검토 맥락이므로 ADR 1개 + 기존 reference 갱신으로 3번 이동. 거부.
- **feature api 훅 금지 lint 를 미루기(반복 결함 1회)**: Codex 안. 사용자가 "우리가 만들어 가는 것이 기준이며 게이트가 1순위" 로 뒤집어 lint 채택.

## 결정

### API 호출 계층 (조회·목록·mutation 공통)

```text
generated (HTTP 함수·DTO)
  → features/{domain}/api/   queryOptions·mutationOptions, keys, contract 타입, API-only 실행 훅
  → 화면 폴더의 workflow 훅   URL·검색·폼·선택 정책, 업무 projection, cache consequence
  → 화면                      훅 결과와 JSX 만
```

- `src/api/required-query.ts` 가 필수 단건 조회의 판정을 소유한다. 순수 함수 `resolveRequiredQueryOutcome(facts)` 가 `incident → not-found → usable data → pending → local error → settled-without-data` 우선순위로 `ready | pending | not-found | error | delegated` 를 돌려주고, 얇은 훅 `useDetailQuery(options)` 가 그것을 `{ data, state: ready|error|notFound, error, retry }` 로 투영한다. `pending`·`delegated` 는 content 없는 `ready` 다(전역 progress·incident boundary 가 자기 표면 소유).
- `shared/ui/patterns/DetailStateBoundary` 는 `ready | error | notFound` 렌더 만 소유하고 API 변경이 없다. `DetailStateBoundary` 는 `ready | error | notFound` 렌더 이며 판정은 `useDetailQuery` 가 한다.
- API-only 조회는 `api/useManagerDetail`, `api/useManagerEditDetail`처럼 ID·locale를 연결한다. 화면 정책을 소유하는 목록 훅 `screens/list/model/useManagerListData`와 캐시 후속 처리가 있는 `screens/form/model/useCreateManagerMutation`·`useUpdateManagerMutation`은 workflow에 둔다. `auth/api/useSignInMutation`은 옵션 실행만 하며 session·navigation은 로그인 workflow가 소유한다.
- **선언과 실행의 분리**: generated 함수는 `features/*/api` 와 `src/api` 만 import 할 수 있다(기존 lint). 따라서 `api/mutations.ts` 는 `mutationOptions`(서버 호출·`retry: false`) 선언만 두고, workflow 훅이 `useMutation({ ...선언, onSuccess })` 로 실행하며 `useQueryClient` 와 awaited invalidation 을 소유한다. `queryClient` 를 인자로 받는 팩토리는 만들지 않는다.
- `features/*/api/**`의 `useQuery`·`useMutation`은 허용한다. `useQueryClient`, 전역 진행 집계, Router/Form import는 lint가 막는다. API 훅의 화면 정책 혼입은 import 검사만으로 증명할 수 없으므로 소비자·callbacks를 리뷰한다. 정상 query/mutation 훅과 위반 cache-client/router 대조군은 `gates:negative`가 실행한다.

**2026-09-07 재검토:** 공연장·운영자 옵션 및 ID 상세 조회까지 화면 model에 강제하면 재사용 API와 화면 상태가 다시 섞였다. 사용자의 전체 구조 재점검 요청과 실제 훅 책임을 근거로 기존의 모든 API 훅 금지를 API-only 실행 허용으로 수정했다. mutation 캐시 후속 처리의 workflow 소유는 유지한다. 폴더 배치 정본은 [folder-structure-contract](../../.agents/skills/folder-structure-contract/SKILL.md)다.
- 화면 이름은 자원과 목적을 말한다(`useManagerDetail`, `useManagerEditDetail`). HTTP 동사 이름(`useGetManager`)은 쓰지 않는다.

### 업데이트 이력 — 2층

- `UpdateHistory`(`shared/ui/patterns/UpdateHistory.tsx`, props `{ entries, labels: { date, change, manager }, emptyText }`) 는 3열 `Table` primitive, stable key, 사항 셀의 `<ul><li>`(줄마다 한 항목) 만 소유한다. `UpdateHistoryEntry { id, date, lines: readonly string[], manager }` 는 이미 localized·safe 한 문자열이다. `SectionCard` 감싸기·제목·빈 문구는 feature 가 쓴다. `ReactNode`·render callback·server DTO 는 받지 않는다. 정렬 계약이 없으므로 `DataTable` 이 아니다.
- feature 순수 함수 `screens/detail/model/manager-history.ts: toManagerHistoryEntries(logs, t)` 가 C/D 한 줄, U 는 `수정` + field 별 `필드: before > after`, 같은 값이면 필드명만, 비밀번호 등 비노출 field 는 값 없는 한 줄, 구조 미정 값은 공용 미지 문구, 미등록 field 는 중립 문구, 담당자 없음은 `-` 를 만든다. 원문 JSON·secret·서버 field 코드 비노출은 이 함수의 테스트가 보장한다. 훅이 아니다.
- 채택한 규칙: DTO↔렌더 입력 분리 경계, C/U/D 줄 규칙, `A > A` 방지, 원문 미노출·unsupported fallback. 제외한 구조: Accordion 결합, 컴포넌트 내부 i18n 기본값, 값 해석 옵션 bag, 도메인 formatter 훅, newline 단일 문자열.

### 상세 표면 — provisional

- `PageHeader`(제목 `h1`·선택적 breadcrumb·끝 정렬 actions slot), `SectionCard`(제목 disclosure 블록: `aria-expanded`/`aria-controls`, controlled/uncontrolled, `keepMounted`, 오류 수 badge), `DetailField`(`dt`/`dd` 한 쌍)는 인벤토리 5 상세 화면(회원·소명·발권·운영자·콘텐츠 조회)이 같은 구성으로 반복하는 provisional shared 다. 상세는 `PageHeader`를 `DetailStateBoundary` 밖에, `SectionCard`·`DetailField`를 안에 조립한다.
- shared 가 소유하는 것은 위 표면의 markup·접근성·개폐 mechanic 뿐이다. 어떤 action 이 있는지, 섹션 제목과 field 배치, 빈 값 문구, 값의 마스킹·링크는 feature 가 쓴다. 코드 consumer 는 Managers 1 이며 두 번째 상세에서 confirm/demote 한다. 계약 문장은 `page-and-detail-surfaces.md`·`disclosure-sections.md` 가 소유한다.
- 빈 값 `-`는 인벤토리 9곳에서 반복돼 표현 후보가 됐지만, absence 판정은 caller에 남고 두 번째 코드 consumer가 생기기 전에는 shared API를 만들지 않는다. 회원가입 이력의 빈 담당자를 `-`로 표시할지 빈칸으로 보존할지도 미확인이다.

### 검증 단계

| 단위 | 단계 | 근거·consumer |
| --- | --- | --- |
| `useDetailQuery` / `resolveRequiredQueryOutcome` | provisional shared(api) | 상세·수정 2 consumer 일치, 결함 입력 4종 table test |
| feature 훅 배치·API/workflow 의존 lint | 수정 채택 | API-only 실행 허용, 캐시 클라이언트·Router/Form·화면 역참조 금지; 의미 판정은 소비자 리뷰 |
| `UpdateHistory` | provisional shared | 인벤토리 5 화면 동일 3열, 코드 consumer 는 Managers 1 |
| `toManagerHistoryEntries` 줄 조립 규칙 | feature-local | 두 번째 화면에서 같은 규칙이면 그때 `shared/lib` 승격 |
| `PageHeader` / `SectionCard` / `DetailField` | provisional shared | 인벤토리 5 상세 화면 동일 구성, 코드 consumer 는 Managers 1 |

## 미확인 (구현하지 않음)

- 신규 서버의 `before/after` 인코딩(primitive vs object), field key 안정성, 날짜·enum 값의 wire 형식, PII 마스킹 권한.
- 상세·수정 DTO/endpoint 통합 여부. 리허설의 `get8`/`getForEdit1`, `staleTime: Infinity`, `gcTime: 0` 을 제품 결정으로 복사하지 않는다.
- update 성공 시 정확한 invalidate 범위. 현행 Manager family invalidation 은 리허설 안전안이다.
- background 404 → `not-found` 로 stale 표시를 끊는 정책이 신규 제품의 삭제·비활성 의미와 맞는지.
- 담당자 계정 식별자의 서버 필드와 마스킹 정책, 담당자 없음의 빈칸/`-` 표시 규칙.

## 신규 프로젝트 채택 경계

가져갈 것은 4칸 계층, `resolveRequiredQueryOutcome` 의 우선순위와 결함 입력 테스트, API/workflow 의존 lint 와 대조군, `UpdateHistory` 의 좁은 계약, 선언/실행 분리 원칙이다. Manager field 라벨 맵·비노출 field 목록·리허설 DTO 이름·Manager family invalidation 은 제품 사실로 가져가지 않는다. 4-part bundle 은 `scripts/contracts/seed.mjs` 의 `detail-query`·`detail-state-boundary`·`update-history`·`page-header`·`section-card`·`detail-field` 가 선언한다.

## 재검토 조건

- 두 번째 상세 화면이 `useDetailQuery`·`UpdateHistory` 를 소비해 semantics·lifecycle·failure behavior 를 비교할 수 있을 때
- 두 번째 consumer 가 이력 항목에 kind 별 스타일·동작(before/after 개별 노드, 링크)이나 paging 을 요구할 때 — API 를 넓히지 않고 좁히거나 demote 한다
- 신규 서버 계약이 `before/after` 인코딩과 상세·수정 endpoint 를 확정할 때
- `useDetailQuery` 가 Router·permission·domain mode 인자를 요구하게 될 때(demotion 신호)

재검토는 투표가 아니라 실제 diff, focused test, 브라우저 실측으로 판정한다.

## 후속 (2026-09-11)

- 상세·수정 route 가 `loader` 에서 같은 query options 를 `loadRequired`(`src/app/router/required-loader.ts`) 로 기다린다. `not-found` 는 Router `notFound({ data: { kind: 'record' } })` 로 `_app` 의 notFound 페이지(셸 유지), 403·401 은 `IncidentBoundary`(loader 가 `origin: 'route-loader'` 로 재발행, error 컴포넌트는 null), 그 외는 `_app` 의 error 페이지. 위 판정(`useDetailQuery` → `DetailStateBoundary`)은 진입 이후 전이(refetch 실패·삭제)에만 적용된다. 사용자 확정. 소유자는 [router.md](../../.agents/skills/feature-contract/references/router.md#loader-and-preload).
