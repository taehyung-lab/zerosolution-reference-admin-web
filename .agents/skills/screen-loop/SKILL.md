---
name: screen-loop
description: Use when a request asks to implement something ("** 구현해주세요", a screen, one component, one structure, or a contract) and no edit scope is confirmed yet. This is the only skill read before scope is known; it classifies grain and kind, then decides the mode, the entry, the evidence order, the return points on failure, and how differences found against the reference are routed back to their owners. Not for copy/style maintenance, script-only work, or a task that arrived with a prepared checkpoint.
---

# Screen Loop

한 문장 구현 요청의 **노드·간선·복귀**만 소유한다. 증거 순위는 [원장](../../../docs/reference/zero-sol/README.md), 파일 집합은 역할 **형태** 절, 준비·리뷰 필드는 [준비 절차](../../../scripts/agents/README.md#prepare-before-editing).

## 알갱이

| 알갱이 | 단서 | 진입 | 하지 않는 일 |
| --- | --- | --- | --- |
| **screen** | 목록·상세·조회·등록·수정 화면 | `context <id>` | 형제 제품 값 복사. 빈 역할 파일 |
| **slice** | 한 surface (필터만, 이력만, 팝업만) | 부모 `context` + 그 역할 형태. 승격된 화면이면 checkpoint `rows`에 그 surface 행 id를 적고 그 행만 받는다 | 화면 나머지 재구현 |
| **component** | 컴포넌트·패턴 이름 | 공용이면 `bundle`, 아니면 부모 context + 역할 절 | 한 호출자 때문에 공용 확대 (E6) |
| **logic** | 훅·순수 유틸·mechanic 이름 | 공용이면 `bundle` + [logic-promotion](../shared-ui-contract/references/logic-promotion.md), 아니면 부모 context + 역할 절 | 도메인 차이를 인자로 흡수 (E6) |
| **structure** | 형태·폴더·파일 집합 | 역할 `형태` + folder-structure | 원장 옵션·문구·권한 |

섞이면 **한 slice만**. 안 갈리면 화면 이름→screen, 컴포넌트 이름→component, `use*`·유틸 이름→logic, `형태`/`구조`/`폴더`→structure.

워크플로 작업은 checkpoint에 `grain`, `entry`, `mode`(`implement`|`drill`), `design.{flow,ownership,reuse,simplicity}`를 적는다. 없으면 `prepare`가 거절한다. `src/shared` 범위도 같다 — 면제는 `work.kind` maintenance/infrastructure와 이유이고, `mode`를 비우는 것은 면제가 아니라 거절이다. `entry`는 해석돼야 한다(context id · bundle id · `<reference>#형태` · structure/logic의 실존 경로). slice·component·logic은 화면 디렉터리 전체를 scope로 잡지 못한다. `work.kind`는 `workflow`|`maintenance`|`infrastructure`만 — `drill`은 kind가 아니라 `mode`다.

기본 모드는 implement. drill은 사용자가 "드릴"이라고 했거나 이 저장소 문서 루프 시험일 때만. 기존 route만으로 드릴하지 않는다. drill은 N3까지 대상 코드를 열지 않는다 — 화면이면 그 feature·route, 공용 component·logic이면 그 bundle의 `code`와 `tests`(테스트가 계약이자 답지다).

## 그래프

| 노드 | 소유자 | 나가는 조건 | 실패하면 |
| --- | --- | --- | --- |
| **N0 분류** | [진입 구분](../../../scripts/agents/README.md#know-which-entry-the-request-is) | `grain`·`entry`·`mode`가 checkpoint에 있다. mixed는 한 slice | — |
| **N1 진입** | `cli context <id>` / `cli bundle <id>` ([문맥 찾기](../../../scripts/agents/README.md#find-the-task-context)) | 종류가 요구하는 진입이 해석됐다. 화면이면 내부 surface 목록이 나왔다 | E0 · E1 |
| **N2 증거** | [문맥 찾기](../../../scripts/agents/README.md#find-the-task-context), [판독 규칙](../../../docs/reference/zero-sol/README.md#판독-규칙), [feature-contract 라우팅](../feature-contract/SKILL.md#read-only-what-applies) | `확정 / 미확인 / 충돌`이 갈렸고 역할 **형태**가 references에 있다. 화면 implement에서 Figma 관찰이 구성을 열거하지 않으면 그 경로 `unresolved` | E3 · E4 · E8 |
| **N3 설계 선언** | [준비 절차](../../../scripts/agents/README.md#prepare-before-editing) | `prepare` 통과 — `design` 네 칸이 있다. `unresolved[].paths`는 답이 오면 만들 파일 | E7 |
| **N4 구현** | 있는 역할의 **형태 절**([목록](../feature-contract/references/list-workflow.md#형태)·[URL 필드](../feature-contract/references/list-search-contract.md#형태)·[route](../feature-contract/references/router.md#형태)·[상세](../feature-contract/references/detail-workflow.md#형태)·[폼](../feature-contract/references/form-workflow.md#형태)), 없으면 해당 path skill. 배치는 [folder-structure-contract](../folder-structure-contract/SKILL.md) | 있는 역할만 그 형태 절의 파일·URL·route로 시작했고, 없는 책임을 빈 파일로 만들지 않았다. 미확인 밖 요구사항 전부에 코드와 **소유자 옆 테스트**가 있다. 화면이면 `contracts:check` 형태 검사가 통과한다 | E6 |
| **N5 검증** | [리뷰 절차](../../../scripts/agents/README.md#review-the-actual-output), [완료 상태](../../../scripts/agents/README.md#completion-states), [관찰 범위](../feature-contract/references/mutation-actions.md#시나리오-상태와-관찰-범위) | 요구사항별 증거가 실측으로 있다. 공용화·소유권·단순성 결함은 [복귀](#n5-복귀)로 돌아갔다. 이 저장소의 상한은 완료 상태 절이 정한다 | E5 |
| **N6 판정** | `cli review` + [AGENTS §5](../../../AGENTS.md#5-실행협업-모델) 독립 검토 | review 통과. **모든 implement·drill**에서 다른 모델(새 컨텍스트) 또는 사람이 diff와 정본을 열어 동의·반박·놓친 것을 냈고 그 기록이 review.json `independentReview`에 있다 — 게이트는 이 필드가 없으면 거절한다. 게이트·루트·공용 계약 변경은 §5대로 필수 | 반박이 맞으면 해당 노드로 |
| **N4′ 답지 대조** | 이 문서 [답지 대조](#답지-대조) | 형태 절에서 벗어난 곳과 그 이유, 그리고 형태 절이 정하지 않아 답지에서 가져온 것이 표로 남았다 | — |
| **N5′ 차이 반영** | 이 문서 [차이 라우팅 표](#차이-라우팅-표) | 차이마다 소유자 반영(같은 작업) 또는 사용자 질문으로 갈렸다 | 소유자 없음 → 보고만 |

순서 — implement: N0 N1 N2 N3 N4 (형제 답지가 있으면 N4′ N5′) N5 N6. drill: N0 N1 N2 N3 **N4′ N5′** 그다음 반영할 것마다 N4 N5 N6.

`design.flow` 누가 무엇을 호출하는가. `ownership` Query / URL / Form / 로컬 하나. `reuse` seed bundle 밖 feature mechanic·화면 내부 재사용(무엇을 쓰는지). seed `채택 / 수정 / 제외`는 checkpoint `contracts[]`가 소유한다. `simplicity` 새 파일·계층이 추적 비용을 줄이는 이유(없으면 만들지 않는다). 게이트는 네 칸의 **존재**와 `entry` 해석·scope 크기만 본다. 내용은 N5·N6이고, N6은 선택이 아니다.

### N5 복귀

| 발견 | 어디로 |
| --- | --- |
| 공용 계약을 한 소비자를 위해 넓힘 · admission 미답 | E6 |
| 같은 값을 Query·URL·Form·로컬에 복제 | N3 |
| 형태 절과 다른데 이유가 없음 | N4 |
| 단순 조립을 계층·wrapper로 감쌈 | N3 |
| 요구사항 미구현·다르게 구현 | E5 → N3 |

## 실패 간선 — 실측된 것만

| 간선 | 무엇이 일어나면 | 어디로 |
| --- | --- | --- |
| **E0** | 요청한 화면 이름이 `context` 목록에 없다 | N1. 원장 파일에서 절을 찾아 [없는 증거에서 시작](../../../scripts/agents/README.md#start-from-missing-evidence). checkpoint `entry`는 그 화면 바깥 역할의 `<reference>#형태`, `surfaces: []`, 코드 경로는 `evidenceGaps` |
| **E1** | 진입 id가 해석되지 않거나, `group`이라 화면 하나를 가리키지 않는다 | N1. 원장 표 본문에서 화면을 직접 분해. group id 자체는 `entry`로 유효하고 `prepare`가 받는다 — 분해는 사람 몫이다 |
| **E2** | `contract.rows`가 비어 있다 | **진행.** 구조는 skill 소유라 막지 않고 없는 제품 사실만 원문 관찰. 단 N2 나가는 조건(관찰 열이 구성을 열거하는가)은 이 행과 무관하게 따로 본다 |
| **E3** | 표 셀·산문·판정 문서가 다른 시점을 말한다 | N2. 정본은 [승격 행 읽기](../../../scripts/agents/README.md#read-the-migrated-rows), 셀을 같은 작업에서 갱신 |
| **E4** | 이름이 소유를 오도한다 | N2. [route 단위로 걷기](../../../scripts/agents/README.md#know-which-entry-the-request-is) |
| **E5** | 요구사항이 미구현·다르게 구현됐다 | N3. [리뷰 절차](../../../scripts/agents/README.md#review-the-actual-output)가 대체 ID 또는 차단 조건을 강제 |
| **E6** | 공용 계약을 넓혀야만 요청을 만족한다 | **구현 이탈.** [승격 심사](../shared-ui-contract/references/promotion.md#admission-test)에 답하지 못하면 feature-local |
| **E7** | `prepare`는 통과했는데 구현 파일이 훅에 막힌다 | N3. `unresolved[].paths`가 화면 전체를 덮었다. 답이 만들 파일로 좁힌다 |
| **E8** | 원문에만 있는 요구를 발견한다 | N2로 요구사항 추가 + N5′로 원장 행 추가 |

각 간선을 만든 실측 사건은 [이 저장소의 관찰](#이-저장소의-관찰)에 있다. 실측 없는 간선은 넣지 않는다.

## 답지 대조

드릴에서만 N3 전에 대상 코드를 닫아 둔다. implement는 대상 코드를 열어 고친다. 형제 답지 대조(N4′)는 두 모드 모두 쓸 수 있다.

- **형태는 형태 절에서, 제품 값은 원장·원문에서.** 구조(파일 집합·URL 모양·route 본문·훅 반환 모양)는 N4 에서 역할별 형태 절을 읽고 그대로 시작한다. 형제 화면은 형태 절이 아직 정하지 않은 구조를 잡는 보조다. 금지되는 것은 형제의 **제품 값**(옵션·문구·권한·기본값·컬럼 집합)을 근거 없이 가져오는 것이다.
- **drill 모드는 N3까지 대상 코드를 열지 않는다.** 화면이면 `src/features/<domain>`·`src/routes/_app/<domain>`, 공용 component·logic이면 bundle의 `code`·`tests`다. 대상 코드는 답지이므로 설계 선언 뒤에 연다. 저장소에 이를 관찰하는 장치는 없다 — 열었으면 보고서 첫머리에 "오염"으로 적는다.
- **N4′**: 표 두 개. ① 형태 절과의 차이 — `형태 절 항목 | 내 구현 | 같음·다름 | 다르면 이유`(이유 없는 다름은 고친다). ② 답지에서 가져온 것 — `답지 파일 | 가져온 구조 | 형태 절에 없어서인가`. "예"인 항목은 그 형태 절에 추가할 후보이고 N5′ 라우팅 표의 "skill 문장 없음" 행으로 간다. 답지끼리 다른 것(드리프트)도 여기 적는다.
- **N5′**: 아래 표로 소유자를 정하고 같은 작업에서 고친다. 반영 대상 파일을 checkpoint `scope`에 넣고 재준비한다. 제품 미확인만 사용자 질문으로 남기고 그 경로는 `unresolved`로 막는다. 소유자가 없는 차이는 새 정본을 만들지 말고 보고서에 남긴다.
- **산출물**: `.ai-work/YYYY-MM-DD-NN-drill-<id>/`에 `checkpoint.json`, `observations.md`, `DRILL.md`(절: 진입·배달 / 설계·prepare / 답지 대조 / 차이·반영 / 미확인 / 검증 yes·no). 보고서는 기록이고 **반영된 diff가 산출물**이다. 답지에서 얻은 사실을 원장·skill에 옮길 때는 답지가 아니라 원문·확정 답을 근거로 적는다.

## 차이 라우팅 표

| 차이 | 소유자 | 반영 |
| --- | --- | --- |
| 원장 행 없음 · `현재 코드` 낡음 · `(대기)` · 원문 행 누락 | `docs/reference/zero-sol/NN-*.md`, `notion/NN-*.md` | 같은 작업에서 셀 갱신·행 추가. 승격하면 `id`·`종류`([표 형식](../../../docs/reference/zero-sol/README.md#표-형식)) |
| 표 ↔ 산문 ↔ 판정 문서 충돌 | 판정 문서 §5 + 원장 셀 | 판독 규칙 적용 후 채택 결과를 셀에 기록. 답 없으면 질문 |
| 제품 사실 부재 | 판정 문서 §5 | 사용자 질문, 해당 경로 `unresolved` |
| skill 문장 없음·모호 (배치 분리 근거, 테스트 의무 등) | 해당 skill reference | 규칙 문장 추가. 도메인 이름 소비자 표는 만들지 않는다 |
| 형태 절이 정하지 않은 구조(파일·URL·route·훅 모양) | 그 역할 reference 의 `형태` 절 + `scripts/contracts/screen-shape.mjs` | 형태 절에 행 추가, 기계가 볼 수 있으면 검사기에도 |
| 답지끼리 드리프트 | 공용 semantics면 [ADR 0009](../../../docs/decisions/0009-shared-boundaries.md)·shared-ui-contract, feature 정책이면 그 화면 | 판정 후 한쪽 수정. 독립 검토 |
| 게이트 사각 | `scripts/agents/` + `preflight.test.mjs` | 장치로만 막는다. 못 잡는 종류는 아래에 한계로 적는다. 독립 검토 필수 |
| 도구·런타임 | [runtime-adapters.md](../../../scripts/agents/runtime-adapters.md) 또는 저장소 밖 | 보고만 |

## 한계

- 게이트는 선언·범위·인용·형태를 검사한다. 2026-09-10 드릴 3회에서 요구사항 본문을 제품 사실과 반대로 쓴 것, 다른 화면의 컬럼을 넣은 것, 날조한 enum을 요구사항에 제대로 붙인 것이 `prepare`·`review`·lint·test를 전부 통과했다. 그래서 N6의 독립 검토 기록(`independentReview`)을 review 게이트가 요구한다. 기록의 존재를 볼 뿐 검토의 질은 보지 못한다.
- `prepare`가 이 스킬을 필수 참조로 요구하는 것은 `work.kind`가 없거나 `workflow`인 `src/features`·`src/routes`·`src/shared` 범위다. `src/api`와 선언된 maintenance/infrastructure는 강제하지 않는다.
- 공용 API 확대(E6)는 bundle code root의 export **이름 집합** 변화만 게이트가 잡는다(prepare 시점 코드 ↔ review 시점 코드, `contracts[] modify` 필요). 같은 이름의 props·인자가 넓어지는 것은 N5·N6이 본다.
- `independentReview` 기록은 implement/drill 전부와 게이트·루트·스킬 scope(`scripts/agents`·`scripts/contracts`·`.agents/skills`·`AGENTS.md`)에 요구된다. 기록의 존재를 볼 뿐 검토자가 실제로 다른 컨텍스트였는지는 못 본다.
- `settled`는 포함 surface의 원장 표에 `id` 행이 있어야 통과한다. 원장 파서는 `frame 존재`만 적힌 관찰 셀을 미열거로 읽어 unresolved에 넣는다. 그 밖의 "열거하지 않은 셀"은 파서가 모른다.
- slice 의 행 단위 배달은 승격된 화면에서만 된다. 미승격 화면의 slice 는 원장 절 전체를 받고, 그 절에서 행을 고르는 것은 사람이다.
- 화면 형태 검사(`scripts/contracts/screen-shape.mjs`)는 파일 이름·위치·존재, 목록 route 의 e2e 배열 합류, 그리고 소스 두 가지(`$param` route 의 `loader`, columns 파일의 aria 어휘 리터럴·`headerSortDirection` import)만 본다. 보지 않는 것: 이름 관례(`*Filters.tsx`·`use*Result.ts`·`*DetailScreen.tsx`·`*CreateScreen.tsx`)를 따르지 않는 화면(역할이 없어 무검사), 한 디렉터리의 두 스택, mechanic 위임 뒤 그 mechanic 의 실제 파일, URL 필드 이름·값 모양, `locale` 타입. 그 다섯은 N4′ 표와 리뷰가 본다.
- 도구가 원문을 잘라 낼 수 있다. 읽는 방법은 [runtime-adapters.md](../../../scripts/agents/runtime-adapters.md)가 소유한다.
- 형제 화면의 제품 값을 근거 없이 가져오지 않고, 답지 사실을 규칙으로 승격하지 않고, 원장에 없는 문구·상태·권한·기본값을 추측하지 않는다. 구조는 형태 절이 정하고 검사기가 본다. 이 절차는 설명 없이 진행하기 위한 것이지 사용자 질문을 대신하는 것이 아니다.
- 읽기 비용: 화면에 있는 역할의 형태 절만 읽으면 구조를 시작할 수 있다(목록이면 목록·URL 필드·route 세 절, 2026-09-10 실측 약 5.4KB). 그 앞에 AGENTS §2 가 요구하는 SKILL 전체 읽기(feature·folder-structure·이 문서, 약 33KB)가 있으므로 형태 절은 Read 의 offset 으로 절만 읽는다. 검사 실패 문구가 읽을 절을 지목하므로 다른 절을 미리 열지 않는다.

## 이 저장소의 관찰

규칙이 아니라 위 간선·한계를 만든 이 저장소의 실측 사건이다. 신규 프로젝트는 이 절을 비우고 자기 드릴로 다시 채운다.

| 간선 | 실측 |
| --- | --- |
| E0 | 2026-09-10 색인 23개에 `공연 등록`이 없다 |
| E1 | `context managers` 실패, `settings` group 아래 |
| E2 | 2026-09-10 시점 23 surface 중 1개만 승격; 게시판 표는 `id` 열이 없어 항상 비었다(2026-09-11 승격) |
| E3 | 공연 상세 언어 탭(#72), 게시판 일괄변경 표↔산문(#83·#85) |
| E4 | 이름이 비슷한 필터 컴포넌트가 리허설 소유, 같은 파일명이 폴더마다 역할 반대 |
| E5 | 게이트 코드 |
| E6 | 한 소비자 필요로 공용을 넓히는 것이 가장 흔한 실패 |
| E7 | 게시판 드릴 1회차, 구현 대상 전부 거부 |
| E8 | 게시판 `게시물 조회 버튼 → 해당 게시판의 게시물만` |

한계 절의 "2026-09-10 드릴 3회"는 게시판 목록 드릴 B·C·D 다.

### 드릴 기록 (요청 한 문장 → 도달 상태)

영상 식으로 말하면 입력·기대 출력 쌍이다. 새 드릴을 돌리면 한 행을 더한다. N3 까지만 돈 드릴은 `설계 선언`까지로 적는다.

| 날짜 | 요청 한 문장 | grain·entry·mode | 도달 | 발동 간선 | 배달 | tool call | 고친 소유자 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-09-13 | 공연 등록 화면 구현해주세요 | screen · `form-workflow.md#형태`(색인 없음) · drill | 설계 선언(prepare 1회 통과). 원장이 이 admin 에 공연 자체 등록을 적지 않아 "무엇을 가리키는가" 질문으로 정지 | E0, E2, E7 예고 | 19 선택 / 112KB | README 진입 표(E0 뒤 entry), 이 문서 E0 행, zero-sol README `frame-index` 문장, 시나리오 카드 "등록/수정 폼" 대상 |
| 2026-09-13 | 게시판 목록 필터만 구현해주세요 | slice · `community`(group) · drill | 설계 선언(prepare 통과, rows 4행 배달). Stop 훅이 동시 세션의 편집 두 파일을 이 세션 저작으로 귀속해 12회 차단 | E1 | 40 선택 / 155KB | 게이트: 다른 세션의 bracket 도 잡은 그 세션 scope 안 경로는 그 세션 것으로 보고, 제외한 contract 의 절은 배달하지 않음. 이 문서 E1 행 |
| 2026-09-13 | useListFilterDraft 에 초기화 뒤 첫 필드로 포커스를 되돌리는 옵션 추가해주세요 | logic · `draft-commit` · drill | 설계 선언(prepare 1회 통과). 승격 심사 네 항목에 답해 E6 → feature-local 또는 FilterPanel, 훅 경로 unresolved | E6 | 12 선택 / 70KB | 이 문서 drill 규칙(공용 대상은 bundle code·tests 를 닫는다), README `cli` 경로 형식 |

선택 수·바이트·간선·차단 횟수는 각 세션의 보고에서 옮긴 값이다. 세 디렉터리에 `checkpoint.json`·`observations.md`는 있지만 `DRILL.md`는 없고(N3 에서 멈춘 드릴이라 답지 대조 절이 없다), prepare 출력 원문은 slice 드릴의 observations.md 에만 있다. 다음 드릴부터 prepare 의 `Context:` 줄을 observations.md 에 그대로 붙인다.

세 드릴 모두 문서에 답이 있는 것을 다시 묻지 않았고, 제품 사실이 없는 곳에서 멈췄다. 화면 드릴이 읽은 양(112KB)과 slice 가 읽은 양(155KB)이 뒤집힌 것은 group 진입이 판정 문서 질문 절·시나리오 카드·`table-composition.md` 전체를 배달하기 때문이다. 다음 축소 대상은 색인의 surface reference 다.
