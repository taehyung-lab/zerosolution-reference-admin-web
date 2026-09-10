---
name: screen-loop
description: Use when a request asks to implement one screen or one shared contract ("** 화면 구현해주세요", "implement the performance list", "이 공용 컴포넌트 구현해주세요") and no edit scope is confirmed yet. This is the only skill read before scope is known; it decides the mode, the entry, the evidence order, the return points on failure, and how differences found against the reference are routed back to their owners. Not for copy/style maintenance, script-only work, or a task that arrived with a prepared checkpoint.
---

# Screen Loop

한 문장으로 온 구현 요청을 문서 → 설계 선언 → 구현 → 검증 → 판정으로 옮기고, 실패 종류별로 어느 노드로
돌아가는지를 정한다. **규칙을 새로 쓰지 않는다.** 각 노드는 소유자를 가리키고, 이 문서가 소유하는 것은
노드의 나가는 조건, 실패 간선, 답지 대조, 차이 라우팅 표다. 소유자에 있는 문장은 링크로만 두고 옮겨 적지 않는다.
2026-09-09~10에 같은 한 문장 요청으로 돌린 드릴 8회(운영자 목록, 회원 목록, 공연 목록·상세, 전시, 게시판 ×4)에서
**실제 발생한 것만** 담았다.

## 모드 판별 — 첫 동작

축은 route 존재가 아니라 **대조할 답지가 있는가**다.

| 모드 | 조건 | 뜻 |
| --- | --- | --- |
| **drill** | 요청한 화면의 route 파일이 `src/routes/_app/`에 이미 있다 | 이 저장소의 기존 화면. N3까지 그 화면의 feature·route 코드를 열지 않고 문서만으로 설계한 뒤, 현재 구현을 답지로 대조해 레퍼런스(원장·skill·공용 계약·게이트)의 결함을 찾고 같은 작업에서 고친다. 사용자가 "드릴"이라 말하지 않아도 이 조건이면 drill이다 |
| **build** | route 파일이 없다 | 실프로젝트의 모든 요청과 이 저장소의 미구현 화면. 같은 workflow 형태의 형제 화면(`node scripts/agents/cli.mjs bundle <id>`의 `examples`)이 있으면 N4′를 형제 답지로 수행한다. 형제도 없으면 N4′를 생략한다 |

게시판·전시 드릴은 route가 없는 build였고 형제 화면(운영자·회원 목록)을 답지로 대조해 차이 표를 만들었다.
따라서 답지 대조는 drill 전용이 아니고, 실프로젝트에도 형제 답지가 있다. 판별 결과와 답지를 시작 게이트 공개에 한 줄로 적는다.

## 그래프

| 노드 | 소유자 | 나가는 조건 | 실패하면 |
| --- | --- | --- | --- |
| **N0 분류** | [진입 구분](../../../scripts/agents/README.md#know-which-entry-the-request-is) | 화면 하나 / 공용 계약 하나 중 하나로 확정, 모드·답지 판별 완료 | — |
| **N1 진입** | `cli context <id>` / `cli bundle <id>` ([문맥 찾기](../../../scripts/agents/README.md#find-the-task-context)) | id가 해석됐고 내부 surface 목록이 나왔다 | E0 · E1 |
| **N2 증거** | 아래 [증거 순서](#n2-증거-순서와-소유자-집합) | surface별 `확정 / 미확인 / 충돌`이 갈렸고, 필요한 **소유자 집합**이 checkpoint `references`에 전부 들어갔다. `(대기)`·`(미판독)` 셀은 [원문 관찰](../../../scripts/agents/README.md#find-the-task-context) 절대로 원문을 봤거나 미확인으로 남겼다 | E3 · E4 · E8 |
| **N3 설계 선언** | [준비 절차](../../../scripts/agents/README.md#prepare-before-editing) | `prepare` 통과. `unresolved[].paths`가 **답이 오면 만들 파일**로 좁혀져 있고, scope에 번역 파일·navigation·i18n resources처럼 화면이 끝까지 필요로 하는 경로가 들어 있다 | E7 |
| **N4 구현** | surface 별 역할 reference 의 **형태 절**([목록](../feature-contract/references/list-workflow.md#형태)·[URL 필드](../feature-contract/references/list-search-contract.md#형태)·[route](../feature-contract/references/router.md#형태)·[상세](../feature-contract/references/detail-workflow.md#형태)·[폼](../feature-contract/references/form-workflow.md#형태)), 배치는 [folder-structure-contract](../folder-structure-contract/SKILL.md) | 화면에 있는 역할의 형태 절이 정한 파일 집합·URL 모양·route 본문으로 시작했고, 미확인 밖 요구사항 전부에 코드와 **소유자 옆 테스트**가 있다. `contracts:check` 의 화면 형태 검사가 통과한다 | E6 |
| **N5 검증** | [리뷰 절차](../../../scripts/agents/README.md#review-the-actual-output), [시나리오 상태](../feature-contract/references/mutation-actions.md#시나리오-상태와-관찰-범위) | 요구사항별 증거가 실측으로 있다. 이 저장소의 상한은 [AGENTS §4](../../../AGENTS.md#4-완료-증거)가 정한다 | E5 |
| **N6 판정** | `cli review` + [AGENTS §5](../../../AGENTS.md#5-실행협업-모델) 독립 검토 | review 통과. 게이트·루트·공용 계약을 바꿨거나 N5′를 거쳤으면 다른 모델이 diff와 정본을 열어 동의·반박·놓친 것을 냈다 | 반박이 맞으면 해당 노드로 |
| **N4′ 답지 대조** | 이 문서 [답지 대조](#답지-대조) | 형태 절에서 벗어난 곳과 그 이유, 그리고 형태 절이 정하지 않아 답지에서 가져온 것이 표로 남았다 | — |
| **N5′ 차이 반영** | 이 문서 [차이 라우팅 표](#차이-라우팅-표) | 차이마다 소유자 반영(같은 작업) 또는 사용자 질문으로 갈렸다 | 소유자 없음 → 보고만 |

순서 — drill: N0 N1 N2 N3 **N4′ N5′** 그다음 반영할 것마다 N4 N5 N6. build: N0 N1 N2 N3 N4 (형제 답지가 있으면 N4′ N5′) N5 N6.

### N2 증거 순서와 소유자 집합

1. **원장 절** — `context`가 준 `docs/reference/zero-sol/NN-*.md`의 해당 화면 표. 읽는 법은 [승격 행 읽기](../../../scripts/agents/README.md#read-the-migrated-rows)가 소유한다.
2. **Notion 원문 절** — `docs/reference/zero-sol/notion/NN-*.md`. 2026-09-10(#81) 이후 색인된 23개 surface 전부에 연결돼 `prepare`가 배달한다. 배달된 절을 끝까지 읽는다. 원문에만 있고 원장 표에는 없던 요구가 실제로 있었다(E8).
3. **시나리오 카드** — `docs/reference/scenarios/`의 연결 카드.
4. **판정 문서** — `docs/reference/zero-sol-figma-analysis.md`의 관련 질문과 확정된 판독 답. 표와 어긋나는 확정 답이 여기 있을 수 있다.
5. **실제 있는 surface의 skill** — [feature-contract 라우팅](../feature-contract/SKILL.md#read-only-what-applies)의 **해당하는 모든 줄**과 그 줄이 가리키는 api-contract·shared-ui-contract·folder-structure-contract. `prepare`의 필수 참조 검사는 이 집합의 하한이지 전부가 아니다.

이 다섯을 checkpoint `references`에 적는 것이 **소유자 집합 선언**이다. 2026-09-09 근본원인 분석에서 판단 오류 13건 중
7건이 "한 소유자만 보고 결론"이었고, 게이트는 인용한 절만 검사하므로 인용하지 않은 소유자를 잡지 못한다. 선언은 그
누락을 검사 가능하게 만든다. 충돌은 [판독 규칙](../../../docs/reference/zero-sol/README.md#판독-규칙)으로 풀고, 같은
사실이 아니어서 규칙이 적용되지 않으면 질문이다.

## 실패 간선 — 실측된 것만

| 간선 | 무엇이 일어나면 | 어디로 | 실측 |
| --- | --- | --- | --- |
| **E0** | 요청한 화면 이름이 `context` 목록에 없다 | N1. 원장 파일에서 절을 찾아 [없는 증거에서 시작](../../../scripts/agents/README.md#start-from-missing-evidence) | 2026-09-10 색인 23개에 `공연 등록`이 없다 |
| **E1** | 진입 id가 `group`이거나 해석되지 않는다 | N1. 원장 표 본문에서 화면을 직접 분해 | `context managers` 실패, `settings` group 아래 |
| **E2** | `contract.rows`가 비어 있다 | **진행.** 구조는 skill 소유라 막지 않고 없는 제품 사실만 원문 관찰 | 23 surface 중 1개만 승격 |
| **E3** | 표 셀·산문·판정 문서가 다른 시점을 말한다 | N2. 정본은 [승격 행 읽기](../../../scripts/agents/README.md#read-the-migrated-rows), 셀을 같은 작업에서 갱신 | 공연 상세 언어 탭(#72), 게시판 일괄변경 표↔산문(#83·#85) |
| **E4** | 이름이 소유를 오도한다 | N2. [route 단위로 걷기](../../../scripts/agents/README.md#know-which-entry-the-request-is) | 이름이 비슷한 필터 컴포넌트가 리허설 소유, 같은 파일명이 폴더마다 역할 반대 |
| **E5** | 요구사항이 미구현·다르게 구현됐다 | N3. [리뷰 절차](../../../scripts/agents/README.md#review-the-actual-output)가 대체 ID 또는 차단 조건을 강제 | 게이트 코드 |
| **E6** | 공용 계약을 넓혀야만 요청을 만족한다 | **구현 이탈.** [승격 심사](../shared-ui-contract/references/promotion.md#admission-test)에 답하지 못하면 feature-local | 한 소비자 필요로 공용을 넓히는 것이 가장 흔한 실패 |
| **E7** | `prepare`는 통과했는데 구현 파일이 훅에 막힌다 | N3. `unresolved[].paths`가 화면 전체를 덮었다. 답이 만들 파일로 좁힌다 | 게시판 드릴 1회차, 구현 대상 전부 거부 |
| **E8** | 원문에만 있는 요구를 발견한다 | N2로 요구사항 추가 + N5′로 원장 행 추가 | 게시판 `게시물 조회 버튼 → 해당 게시판의 게시물만` |

## 답지 대조

- **형태는 형태 절에서, 제품 값은 원장·원문에서.** 구조(파일 집합·URL 모양·route 본문·훅 반환 모양)는 N4 에서 역할별 형태 절을 읽고 그대로 시작한다. 형제 화면은 형태 절이 아직 정하지 않은 구조를 잡는 보조다. 금지되는 것은 형제의 **제품 값**(옵션·문구·권한·기본값·컬럼 집합)을 근거 없이 가져오는 것이다.
- **drill 모드는 N3까지 대상 화면의 `src/features/<domain>`·`src/routes/_app/<domain>`을 열지 않는다.** 대상 코드는 답지이므로 설계 선언 뒤에 연다. 저장소에 이를 관찰하는 장치는 없다 — 열었으면 보고서 첫머리에 "오염"으로 적는다.
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

- 게이트는 선언·범위·인용을 검사한다. 2026-09-10 게시판 드릴 3회에서 요구사항 본문을 제품 사실과 반대로 쓴 것, 다른 화면의 컬럼을 넣은 것, 날조한 enum을 요구사항에 제대로 붙인 것이 `prepare`·`review`·lint·test를 전부 통과했다. N6의 독립 검토가 판단 내용을 보는 유일한 검사다.
- `prepare`가 이 스킬을 필수 참조로 요구하는 것은 기본 workflow의 `src/features`·`src/routes` 범위(화면 진입)뿐이다. 공용 계약 진입(`src/shared`)은 AGENTS §2 첫 행이 라우팅하고 게이트는 강제하지 않는다.
- 화면 형태 검사(`scripts/contracts/screen-shape.mjs`)는 파일 이름·위치·존재와 목록 route 의 e2e 배열 합류만 본다. 보지 않는 것: 이름 관례(`*Filters.tsx`·`use*Result.ts`·`*DetailScreen.tsx`·`*CreateScreen.tsx`)를 따르지 않는 화면(역할이 없어 무검사), 한 디렉터리의 두 스택, mechanic 위임 뒤 그 mechanic 의 실제 파일, URL 필드 이름·값 모양, `locale` 타입. 그 다섯은 N4′ 표와 리뷰가 본다.
- 도구가 원문을 잘라 낼 수 있다. 읽는 방법은 [runtime-adapters.md](../../../scripts/agents/runtime-adapters.md)가 소유한다.
- 형제 화면의 제품 값을 근거 없이 가져오지 않고, 답지 사실을 규칙으로 승격하지 않고, 원장에 없는 문구·상태·권한·기본값을 추측하지 않는다. 구조는 형태 절이 정하고 검사기가 본다. 이 절차는 설명 없이 진행하기 위한 것이지 사용자 질문을 대신하는 것이 아니다.
- 읽기 비용: 화면에 있는 역할의 형태 절만 읽으면 구조를 시작할 수 있다(목록이면 목록·URL 필드·route 세 절, 2026-09-10 실측 약 5.4KB). 그 앞에 AGENTS §2 가 요구하는 SKILL 전체 읽기(feature·folder-structure·이 문서, 약 33KB)가 있으므로 형태 절은 Read 의 offset 으로 절만 읽는다. 검사 실패 문구가 읽을 절을 지목하므로 다른 절을 미리 열지 않는다.
