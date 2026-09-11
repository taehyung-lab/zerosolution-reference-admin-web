---
name: screen-loop
description: Use when a request asks to implement something ("** 구현해주세요", a screen, one component, one structure, or a contract) and no edit scope is confirmed yet. This is the only skill read before scope is known; it classifies grain and kind, then decides the mode, the entry, the evidence order, the return points on failure, and how differences found against the reference are routed back to their owners. Not for copy/style maintenance, script-only work, or a task that arrived with a prepared checkpoint.
---

# Screen Loop

한 문장으로 온 구현 요청을 분류 → 문서 조합 → 설계 선언 → 구현 → 검증 → 판정으로 옮기고, 실패 종류별로
어느 노드로 돌아가는지를 정한다. 이 절차가 보장하려는 것은 셋이다(2026-09-11 사용자 확정): **① 있는 역할의
구조는 그 역할 형태 절이 정한 공용 형태로**(N4), **② 시나리오는 요청 문장의 사용자 요구가 있으면 그것을, 없으면
확정 답과 Figma·Notion 원장·원문을, 원장이 없거나 낡음·충돌·변경 징후가 있으면 실측을 따라**(N2), **③ 구현이
그대로 반영됐는지 요구사항별로 검증하고, 공용화·소유권·단순성 결함은 원인 노드로 되돌린다**(N5·N6). **규칙을
새로 쓰지 않는다.** 각 노드는 소유자를 가리키고, 이 문서가 소유하는 것은 노드의 나가는 조건, 실패 간선, 답지
대조, 차이 라우팅 표다. 소유자에 있는 문장은 링크로만 두고 옮겨 적지 않는다.
2026-09-09~10에 같은 한 문장 요청으로 돌린 드릴 8회(운영자 목록, 회원 목록, 공연 목록·상세, 전시, 게시판 ×4)에서
**실제 발생한 것만** 담았다. 드릴은 기본 구현 루프가 아니다.

## 모드 판별 — 첫 동작

먼저 **알갱이**를 정한다. 그다음 종류·모드. 한 요청에 알갱이가 여러 개면 mixed로 나누고 **한 slice만** 진행한다.

| 알갱이 | 단서 | 하는 일 | 하지 않는 일 |
| --- | --- | --- | --- |
| **screen** | 목록·상세·조회·등록·수정 **화면** | 그 화면 workflow 전체. `context <id>` | 형제의 제품 값 복사. 없는 역할의 빈 파일 |
| **slice** | 한 surface만 (필터만, 이력만, 카테고리 팝업만) | 부모 화면 context + 그 역할 형태 절만. scope를 그 파일로 좁힘 | 화면 나머지 재구현 |
| **component** | 한 컴포넌트·패턴 이름 | 공용이면 `bundle`. feature-local이면 소비 화면 원장 + 그 역할 절 | 공용 API를 한 호출자 때문에 넓힘 (E6) |
| **structure** | 형태·폴더·조립·파일 집합 | [형태 절](#그래프) + folder-structure. 파일 위치·역할만 | 원장에서 옵션·문구·권한을 가져와 채움 |

알갱이가 안 갈리면 질문하지 말고, 요청 문장에 화면 이름이 있으면 screen, 컴포넌트 이름이면 component, `형태`/`구조`/`폴더`면 structure로 두고 시작 게이트에 적는다.

기본 모드는 **implement**. 드릴은 사용자가 "드릴"이라고 했거나 **이 저장소의 문서 루프를 시험**하라고 한 때만이다. 기존 route만으로 드릴하지 않는다. checkpoint `work.kind`는 화면 드릴이면 `workflow`, 문서·게이트만이면 `infrastructure`다. `drill`은 허용된 kind가 아니다(`prepare`가 거부한다).

| 모드 | 조건 | 뜻 |
| --- | --- | --- |
| **implement** | 기본. 코드를 만들어 달라는 요청 | 알갱이에 맞는 증거·skill로 설계→구현→검증. 같은 workflow의 형제(`cli bundle <id>` `examples`)가 있으면 N4′를 보조 답지로 쓴다 |
| **drill** | 사용자 요청 · 문서 루프 시험 | 대상 feature·route 코드를 N3까지 열지 않는다. 문서만으로 설계한 뒤 현재 구현과 비교해 **문서·skill·게이트**만 고친다. 제품 코드는 바꾸지 않는다 |

게시판·전시 드릴은 route가 없는 implement였고 형제 화면(운영자·회원 목록)을 답지로 대조해 차이 표를 만들었다.
답지 대조는 drill 전용이 아니다. 알갱이·종류·모드·답지를 시작 게이트 공개에 한 줄로 적는다.

## 그래프

| 노드 | 소유자 | 나가는 조건 | 실패하면 |
| --- | --- | --- | --- |
| **N0 분류** | [진입 구분](../../../scripts/agents/README.md#know-which-entry-the-request-is) | 알갱이(screen / slice / component / structure)·종류·모드·답지 판별 완료. mixed는 한 slice의 경계를 공개한다 | — |
| **N1 진입** | `cli context <id>` / `cli bundle <id>` ([문맥 찾기](../../../scripts/agents/README.md#find-the-task-context)) | 종류가 요구하는 진입이 해석됐다. 화면이면 내부 surface 목록이 나왔다 | E0 · E1 |
| **N2 증거** | 아래 [증거 순서](#n2-증거-순서와-소유자-집합) | 종류별 진실 출처에서 `확정 / 미확인 / 충돌`이 갈렸고, 필요한 **소유자 집합**이 checkpoint `references`에 전부 들어갔다. 화면의 `(대기)`·`(미판독)` 셀은 [원문 관찰](../../../scripts/agents/README.md#find-the-task-context) 절대로 원문을 봤거나 미확인으로 남겼다 | E3 · E4 · E8 |
| **N3 설계 선언** | [준비 절차](../../../scripts/agents/README.md#prepare-before-editing) | `prepare` 통과. 흐름·상태 소유·재사용(`채택 / 수정 / 제외`)·단순성(왜 이 파일이 필요한가)을 공개했다. `unresolved[].paths`가 **답이 오면 만들 파일**로 좁혀져 있고, 화면이면 scope에 번역·navigation처럼 끝까지 필요한 경로가 들어 있다 | E7 |
| **N4 구현** | 있는 역할의 **형태 절**([목록](../feature-contract/references/list-workflow.md#형태)·[URL 필드](../feature-contract/references/list-search-contract.md#형태)·[route](../feature-contract/references/router.md#형태)·[상세](../feature-contract/references/detail-workflow.md#형태)·[폼](../feature-contract/references/form-workflow.md#형태)), 없으면 해당 path skill. 배치는 [folder-structure-contract](../folder-structure-contract/SKILL.md) | 있는 역할만 그 형태 절의 파일·URL·route로 시작했고, 없는 책임을 빈 파일로 만들지 않았다. 미확인 밖 요구사항 전부에 코드와 **소유자 옆 테스트**가 있다. 화면이면 `contracts:check` 형태 검사가 통과한다 | E6 |
| **N5 검증** | [리뷰 절차](../../../scripts/agents/README.md#review-the-actual-output), [완료 상태](../../../scripts/agents/README.md#completion-states), [관찰 범위](../feature-contract/references/mutation-actions.md#시나리오-상태와-관찰-범위) | 요구사항별 증거가 실측으로 있다. 공용화·소유권·단순성 결함은 [복귀](#n5-복귀)로 돌아갔다. 이 저장소의 상한은 완료 상태 절이 정한다 | E5 |
| **N6 판정** | `cli review` + [AGENTS §5](../../../AGENTS.md#5-실행협업-모델) 독립 검토 | review 통과. 게이트·루트·공용 계약을 바꿨거나 N5′를 거쳤으면 다른 모델이 diff와 정본을 열어 동의·반박·놓친 것을 냈다 | 반박이 맞으면 해당 노드로 |
| **N4′ 답지 대조** | 이 문서 [답지 대조](#답지-대조) | 형태 절에서 벗어난 곳과 그 이유, 그리고 형태 절이 정하지 않아 답지에서 가져온 것이 표로 남았다 | — |
| **N5′ 차이 반영** | 이 문서 [차이 라우팅 표](#차이-라우팅-표) | 차이마다 소유자 반영(같은 작업) 또는 사용자 질문으로 갈렸다 | 소유자 없음 → 보고만 |

순서 — implement: N0 N1 N2 N3 N4 (형제 답지가 있으면 N4′ N5′) N5 N6. drill: N0 N1 N2 N3 **N4′ N5′** 그다음 반영할 것마다 N4 N5 N6.

### N3 설계 한 줄

게이트는 이 문장의 품질을 검사하지 않는다. 공개하지 않고 `prepare`만 통과한 설계는 N5에서 소유권·단순성 결함이 나오면 여기로 돌아온다. 네 항목을 시작 게이트 또는 checkpoint 옆 기록에 적는다: **흐름**(누가 무엇을 호출하는가), **상태 소유**(Query / URL / Form / 로컬), **재사용**(기존 공용·feature 계약을 `채택 / 수정 / 제외`), **단순성**(새 파일·계층이 추적 비용을 줄이는 이유. 없으면 만들지 않는다).

### N5 복귀

| 발견 | 어디로 |
| --- | --- |
| 공용 계약을 한 소비자를 위해 넓힘 · admission 미답 | E6 |
| 같은 값을 Query·URL·Form·로컬에 복제 | N3 |
| 형태 절과 다른데 이유가 없음 | N4 |
| 단순 조립을 계층·wrapper로 감쌈 | N3 |
| 요구사항 미구현·다르게 구현 | E5 → N3 |

### N2 증거 순서와 소유자 집합

제품 사실의 우선순위는 하나다: **요청 문장에 담긴 사용자 요구** → **판정 문서의 확정 답**(기록된 사용자
결정) → **원장(Figma 관찰)·Notion 원문** → **`aside-browser` 실측**([원문 관찰](../../../scripts/agents/README.md#find-the-task-context))
→ **미확인(질문)**. 실측은 원장·원문이 없을 때만이 아니라 낡음·충돌·변경 징후가 있을 때도 돈다([근거의
수명](../../../docs/reference/zero-sol/README.md#근거의-수명과-읽기-범위)); 그 결과로 대조한 셀을 같은 작업에서
갱신한다. 같은 순위 안에서 Figma 와 Notion 이 어긋나면 [판독 규칙](../../../docs/reference/zero-sol/README.md#판독-규칙)이
푼다(Notion). 위 순위끼리 어긋나면 낮은 순위로 채우지 않고 충돌을 드러낸다(사용자 요구가 원장과 다르면 그 다름을
적고 사용자 요구를 따른다). 요구사항의 `sources` 가 그 순위를 그대로 보여 준다(`"user"` 또는 문서 절). 아래 1~5 는
읽어야 할 **소유자 집합**이고 등급이 아니다.

**나가는 조건(2026-09-11 게시판 드릴 실패로 추가):** 구현할 surface 의 원장 행에서 `Figma 관찰` 열이 화면 구성(항목 집합·순서·
그룹·초기 상태·활성 조건·버튼)을 **열거하지 않으면** implement 를 시작할 수 없다 — 행이 없거나, 셀이 `frame 존재`·`(대기)`·`(미판독)`
같은 존재 표시만이거나, 항목을 세지 않는 산문만 있는 경우가 모두 해당한다. 근거는 판독 규칙의 [구성은 Figma frame 만이 열거한다](../../../docs/reference/zero-sol/README.md#판독-규칙)
이고, 그 규칙대로 같은 사실이 어긋나면 여전히 Notion 이 이긴다(위 우선순위 문장과 충돌하지 않는다 — 이 조건은 충돌이 아니라
**미관찰**을 막는다). frame 을 실측(Figma MCP, 막히면 `aside repl`)해 관찰 열을 채운 뒤 N3 으로 간다. E2(`contract.rows` 비면 진행)와는
다른 검사다: E2 는 승격 색인(`id` 열이 있는 표)의 기계 행이고, 이 조건은 원장 셀의 내용이다 — 9장처럼 `id` 열이 없는 표는 `screen-contract.mjs`
가 건너뛰어 `contract.rows` 가 항상 비고 `(대기)`·`(미판독)` 도 기계에 보이지 않으므로, **이 조건은 현재 리뷰 전용**이다(게이트가 잡지
못한다; 기계화는 `screen-contract.mjs` 가 `frame 존재` 류 셀을 `unresolved` 로 올리는 것이며 아직 없다). 드릴 2회차는 이 조건이 없어
Notion 이 적은 필드 3개로 폼을 만들었고 frame 의 19개 항목을 놓쳤다(판정 문서 「게시판 조회·등록·수정 재설계」).
알갱이가 **structure**이면 이 조건을 쓰지 않는다. **component / shared**이면 bundle이 정본이다. **drill**에서 한 행의 구성만 미기록이면 그 행을 미확인으로 두고 나머지 확정 행으로 N3에 간다. implement에서 그 행의 구성이 필요하면 실측 전에 해당 경로를 `unresolved`로 막는다.

1. **원장 절** — `context`가 준 `docs/reference/zero-sol/NN-*.md`의 해당 화면 표. 읽는 법은 [승격 행 읽기](../../../scripts/agents/README.md#read-the-migrated-rows)가 소유한다.
2. **Notion 원문 절** — `docs/reference/zero-sol/notion/NN-*.md`. 2026-09-10(#81) 이후 색인된 23개 surface 전부에 연결돼 `prepare`가 배달한다. 배달된 절을 끝까지 읽는다. 원문에만 있고 원장 표에는 없던 요구가 실제로 있었다(E8).
3. **시나리오 카드** — `docs/reference/scenarios/`의 연결 카드.
4. **판정 문서** — `docs/reference/zero-sol-figma-analysis.md`의 관련 질문과 확정된 판독 답. 표와 어긋나는 확정 답이 여기 있을 수 있다.
5. **실제 있는 역할의 skill** — [feature-contract 라우팅](../feature-contract/SKILL.md#read-only-what-applies)의 **해당하는 모든 줄**과 그 줄이 가리키는 api-contract·shared-ui-contract·folder-structure-contract. `context.json`은 원장·시나리오·related **발견**이지 skill 집합이 아니다. 목록·상세·폼·route 역할이 있으면 그 파일의 **형태** 절을 checkpoint `references`에 넣는다 — 인덱스가 다른 heading만 실어도 형태는 skill 표가 정본이다. `prepare`의 필수 참조 검사는 이 집합의 하한이지 전부가 아니다.

화면이 아니면 1~4 대신 그 종류의 진실 출처를 넣는다(shared는 bundle `skills`·`adrs`, api는 snapshot·소유 ADR, maintenance는 해당 문서). 5는 있는 역할에만 해당한다.

이 집합을 checkpoint `references`에 적는 것이 **소유자 집합 선언**이다. 2026-09-09 근본원인 분석에서 판단 오류 13건 중
7건이 "한 소유자만 보고 결론"이었고, 게이트는 인용한 절만 검사하므로 인용하지 않은 소유자를 잡지 못한다. 선언은 그
누락을 검사 가능하게 만든다. 충돌은 [판독 규칙](../../../docs/reference/zero-sol/README.md#판독-규칙)으로 풀고, 같은
사실이 아니어서 규칙이 적용되지 않으면 질문이다.

## 실패 간선 — 실측된 것만

| 간선 | 무엇이 일어나면 | 어디로 | 실측 |
| --- | --- | --- | --- |
| **E0** | 요청한 화면 이름이 `context` 목록에 없다 | N1. 원장 파일에서 절을 찾아 [없는 증거에서 시작](../../../scripts/agents/README.md#start-from-missing-evidence) | 2026-09-10 색인 23개에 `공연 등록`이 없다 |
| **E1** | 진입 id가 `group`이거나 해석되지 않는다 | N1. 원장 표 본문에서 화면을 직접 분해 | `context managers` 실패, `settings` group 아래 |
| **E2** | `contract.rows`가 비어 있다 | **진행.** 구조는 skill 소유라 막지 않고 없는 제품 사실만 원문 관찰. 단 N2 나가는 조건(관찰 열이 구성을 열거하는가)은 이 행과 무관하게 따로 본다 | 23 surface 중 1개만 승격; 9장 표는 `id` 열이 없어 항상 빈다 |
| **E3** | 표 셀·산문·판정 문서가 다른 시점을 말한다 | N2. 정본은 [승격 행 읽기](../../../scripts/agents/README.md#read-the-migrated-rows), 셀을 같은 작업에서 갱신 | 공연 상세 언어 탭(#72), 게시판 일괄변경 표↔산문(#83·#85) |
| **E4** | 이름이 소유를 오도한다 | N2. [route 단위로 걷기](../../../scripts/agents/README.md#know-which-entry-the-request-is) | 이름이 비슷한 필터 컴포넌트가 리허설 소유, 같은 파일명이 폴더마다 역할 반대 |
| **E5** | 요구사항이 미구현·다르게 구현됐다 | N3. [리뷰 절차](../../../scripts/agents/README.md#review-the-actual-output)가 대체 ID 또는 차단 조건을 강제 | 게이트 코드 |
| **E6** | 공용 계약을 넓혀야만 요청을 만족한다 | **구현 이탈.** [승격 심사](../shared-ui-contract/references/promotion.md#admission-test)에 답하지 못하면 feature-local | 한 소비자 필요로 공용을 넓히는 것이 가장 흔한 실패 |
| **E7** | `prepare`는 통과했는데 구현 파일이 훅에 막힌다 | N3. `unresolved[].paths`가 화면 전체를 덮었다. 답이 만들 파일로 좁힌다 | 게시판 드릴 1회차, 구현 대상 전부 거부 |
| **E8** | 원문에만 있는 요구를 발견한다 | N2로 요구사항 추가 + N5′로 원장 행 추가 | 게시판 `게시물 조회 버튼 → 해당 게시판의 게시물만` |

## 답지 대조

드릴에서만 N3 전에 대상 코드를 닫아 둔다. implement는 대상 코드를 열어 고친다. 형제 답지 대조(N4′)는 두 모드 모두 쓸 수 있다.

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
- 화면 형태 검사(`scripts/contracts/screen-shape.mjs`)는 파일 이름·위치·존재, 목록 route 의 e2e 배열 합류, 그리고 소스 두 가지(`$param` route 의 `loader`, columns 파일의 aria 어휘 리터럴·`headerSortDirection` import)만 본다. 보지 않는 것: 이름 관례(`*Filters.tsx`·`use*Result.ts`·`*DetailScreen.tsx`·`*CreateScreen.tsx`)를 따르지 않는 화면(역할이 없어 무검사), 한 디렉터리의 두 스택, mechanic 위임 뒤 그 mechanic 의 실제 파일, URL 필드 이름·값 모양, `locale` 타입. 그 다섯은 N4′ 표와 리뷰가 본다.
- 도구가 원문을 잘라 낼 수 있다. 읽는 방법은 [runtime-adapters.md](../../../scripts/agents/runtime-adapters.md)가 소유한다.
- 형제 화면의 제품 값을 근거 없이 가져오지 않고, 답지 사실을 규칙으로 승격하지 않고, 원장에 없는 문구·상태·권한·기본값을 추측하지 않는다. 구조는 형태 절이 정하고 검사기가 본다. 이 절차는 설명 없이 진행하기 위한 것이지 사용자 질문을 대신하는 것이 아니다.
- 읽기 비용: 화면에 있는 역할의 형태 절만 읽으면 구조를 시작할 수 있다(목록이면 목록·URL 필드·route 세 절, 2026-09-10 실측 약 5.4KB). 그 앞에 AGENTS §2 가 요구하는 SKILL 전체 읽기(feature·folder-structure·이 문서, 약 33KB)가 있으므로 형태 절은 Read 의 offset 으로 절만 읽는다. 검사 실패 문구가 읽을 절을 지목하므로 다른 절을 미리 열지 않는다.
