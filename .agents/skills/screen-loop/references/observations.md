# 이 저장소의 관찰 — screen-loop 드릴 기록

규칙이 아니라 [SKILL.md](../SKILL.md)의 간선·한계를 만든 이 저장소의 실측 사건이다. 현재 행동을 바꾸는 한계·복귀 조건은 SKILL.md에 남고, 여기에는 그 조건을 만든 사건·수치·원본 위치만 둔다. 신규 프로젝트는 이 파일을 비우고 자기 드릴로 다시 채운다. 원본은 `.ai-work/`의 각 디렉터리이며 만료될 수 있으므로, 판단에 필요한 사실은 이 파일에 옮겨 적는다.

## 간선을 만든 사건

| 간선 | 실측 | 원본 |
| --- | --- | --- |
| E0 | 2026-09-10 색인 23개에 `공연 등록`이 없다 | `2026-09-13-01-drill-performance-create` |
| E1 | `context managers` 실패, `settings` group 아래 | 2026-09-10 게시판 드릴 A |
| E2 | 2026-09-10 시점 23 surface 중 1개만 승격; 게시판 표는 `id` 열이 없어 항상 비었다(2026-09-11 승격) | 드릴 A·B·C·D `observations.md` |
| E3 | 공연 상세 언어 탭(#72), 게시판 일괄변경 표↔산문(#83·#85) | 드릴 B §1.5, D `observations.md` |
| E4 | 이름이 비슷한 필터 컴포넌트가 리허설 소유, 같은 파일명이 폴더마다 역할 반대 | 드릴 B §4 |
| E5 | 게이트 코드 (`recordReview`의 replacement/blocked 강제) | `scripts/agents/preflight.mjs` |
| E6 | 한 소비자 필요로 공용을 넓히는 실패를 반복 확인 | 드릴 A·B 형제 대조, `2026-09-13-03` 승격 심사 |
| E7 | 게시판 드릴 1회차, 구현 대상 전부 거부 | 드릴 D §2.3 |
| E8 | 게시판 `게시물 조회 버튼 → 해당 게시판의 게시물만` | 드릴 C `observations.md` §3.1·§3.3 |

## 2026-09-10 드릴 A·B·C·D — 실제로 실행한 것

SKILL.md 한계 절의 옛 문장 "드릴 3회에서 … `prepare`·`review`·lint·test를 전부 통과했다"는 원본과 다르다. 네 드릴의 원본 §5(검증) 절에서 확인한 실행 범위는 다음과 같다. 요청 한 문장은 전부 "커뮤니티 > 게시판 구현해주세요"(또는 그 필터 slice)였고, 네 드릴 모두 `src/`에 화면을 남기지 않았다.

| 드릴 | 원본 | 실제로 실행한 게이트·검사 | 통과한 잘못된 입력 | 도달 상태(자기 보고) |
| --- | --- | --- | --- | --- |
| A | `2026-09-10-03-board/BOARD-DRILL.md` §4 | `prepare` 통과. `review` 부정 대조 C7~C10 실행: 요구사항 누락·미배달 절 인용·없는 파일은 거절, **전부 `unimplemented`+`blocked`는 통과**(이후 804acc6이 미청구 파일 검사로 닫음). `pnpm verify`·브라우저 미실행 | 코드 0줄 리뷰 기록 | 시나리오 확정됨 이하 |
| B | `2026-09-10-04-board-b/BOARD-DRILL-B.md` §4·§5 | `prepare` 통과. 훅 부정 대조(scope 밖·unresolved·이름 바꾼 우회) 실행. `review` N1·N2·N3·N6 거절 확인. **N8만** `review`를 끝까지 돌렸고 `contracts:check`·ESLint·`vitest related`가 그 파일에 대해 통과했다 | 확정된 답(질문 18)을 미확인으로 적은 checkpoint, 근거 없는 진입 정책, 날조한 권한 enum을 R6에 정확히 청구한 리뷰(N8), unresolved 경로를 파일 이름만 바꿔 쓴 것(N7) | 시나리오 확정됨 이하 |
| C | `2026-09-10-05-board-c/BOARD-DRILL-C.md` §5 | `prepare` 통과. 변형 A~F는 `workflowContext`를 **메모리에서** 호출: 요구사항 본문을 사실과 반대로(D)·다른 화면 컬럼(E)은 통과, gap·surface·근거 제거(B·C·F)는 거절. `review`·lint·test·typecheck·브라우저 **미실행**(§5.4) | D·E | 시나리오 확정됨에 미달(§5.4) |
| D | `2026-09-10-06-board-d/BOARD-DRILL-D.md` §5 | `prepare` 1회차 거절(E7) 후 통과. 훅 부정 대조 (a)~(e) 실행. typecheck·lint·test·i18n·verify·`review`·브라우저 **하나도 실행하지 않았다**(§5.4) | 없음(코드가 파일로 없음) | 시나리오 확정됨 |

정정한 결론: "요구사항 본문을 제품 사실과 반대로 쓴 것, 다른 화면의 컬럼을 넣은 것"은 C의 `prepare` 수준 실측이고, "날조한 enum을 요구사항에 제대로 붙인 것"이 `review`·lint·test까지 통과한 사례는 B N8 **한 건**이다. 세 종류가 각각 다른 수준에서 통과했다는 사실은 그대로이며, 그것이 N6 독립 검토 기록을 게이트가 요구하는 이유다.

**B의 오염 기록(B 1132~1135행).** B는 §3 설계 전에 형제 답지(`managers`·`members` 목록)를 읽었다고 스스로 밝혔다. 과제 지시와 `bundle`의 `examples`가 그 파일을 가리켰기 때문이다. 이 사실만으로 당시 과제의 드릴 규칙 위반이라고 판정하지 않는다. 대상 코드 열람과 형제 답지 열람, 당시 지시의 순서를 구별해야 한다. 대신 B의 "배치가 일치한다"는 문서만으로 그 배치에 도달했다는 증거로 쓰지 못하며, B의 부정 대조 값은 그대로다. 두 문장을 섞어 읽지 않는다.

**B §5.e.** 드릴 중 B가 만든 파일이 B가 지우지 않았는데 사라졌고, B는 원인을 확인하지 못했다(다른 세션의 편집으로 추정). 같은 트리를 여러 세션이 쓰는 비용의 실측이며 [runtime-adapters](../../../../scripts/agents/runtime-adapters.md)가 소유한다.

## 2026-09-10 화면 드릴 1회차(worktree) — 열어 본 N6 도달 기록

원본: `2026-09-10-07-screen-loop/DRILL-1-REVIEW.md`. 새 컨텍스트 세션, 격리 worktree, 54분·355 tool call. `verify.txt`에 unit 1022/143 파일·gates:negative·e2e 104 통과, `browser-report.txt`에 smoke 3건. 요구사항 15개 중 구현 8 / 다름 3 / 미구현 4(목적지 route 부재·권한 cascade 미확인). 도달 상태 `시나리오 구현 완료`는 보고서 주장이며 verify 출력과 부합한다.

그러나 이 드릴은 grain·entry·mode·`independentReview` 게이트(2026-09-11~13) **이전**이고, 훅이 worktree 쓰기를 귀속하지 못해 Write/Edit 거부를 Bash로 우회했다(같은 문서 항목 6·8). 따라서 이 기록만으로 현행 게이트 아래 N0→N6 재현을 증명하지 않는다. 이후 소비 시험은 아래 2026-09-14 절과 구별한다.

## 2026-09-13 드릴 세 건 — N3까지

| 날짜 | 요청 한 문장 | grain·entry·mode | 도달 | 발동 간선 | 배달 | 고친 소유자 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-09-13 | 공연 등록 화면 구현해주세요 | screen · `form-workflow.md#형태`(색인 없음) · drill | 설계 선언(prepare 1회 통과). 원장이 이 admin에 공연 자체 등록을 적지 않아 "무엇을 가리키는가" 질문으로 정지 | E0, E2, E7 예고 | 19 선택 / 112KB | README 진입 표(E0 뒤 entry), SKILL E0 행, zero-sol README `frame-index` 문장, 시나리오 카드 "등록/수정 폼" 대상 |
| 2026-09-13 | 게시판 목록 필터만 구현해주세요 | slice · `community`(group) · drill | 설계 선언(prepare 통과, rows 4행 배달). Stop 훅이 동시 세션의 편집 두 파일을 이 세션 저작으로 귀속해 12회 차단 | E1 | 40 선택 / 155KB | 게이트: 다른 세션의 bracket도 잡은 그 세션 scope 안 경로는 그 세션 것으로 보고, 제외한 contract의 절은 배달하지 않음. SKILL E1 행 |
| 2026-09-13 | useListFilterDraft에 초기화 뒤 첫 필드로 포커스를 되돌리는 옵션 추가해주세요 | logic · `draft-commit` · drill | 설계 선언(prepare 1회 통과). 승격 심사 네 항목에 답해 E6 → feature-local 또는 FilterPanel, 훅 경로 unresolved | E6 | 12 선택 / 70KB | SKILL drill 규칙(공용 대상은 bundle code·tests를 닫는다), README `cli` 경로 형식 |

선택 수·바이트·간선·차단 횟수는 각 세션의 보고에서 옮긴 값이다. 세 디렉터리에 `checkpoint.json`·`observations.md`는 있지만 `DRILL.md`는 없고(N3에서 멈춰 답지 대조 절이 없다), prepare 출력 원문은 slice 드릴의 `observations.md`에만 있다. 이제 `prepare`는 시도마다 수락·거절을 `.ai-work/agent-attempts/`에 남기므로 자기 보고 대신 그 기록을 옮긴다.

세 드릴 모두 문서에 답이 있는 것을 다시 묻지 않았고, 제품 사실이 없는 곳에서 멈췄다. 화면 드릴이 읽은 양(112KB)과 slice가 읽은 양(155KB)이 뒤집힌 것은 group 진입이 판정 문서 질문 절·시나리오 카드·`table-composition.md` 전체를 배달하기 때문이다. 축소 대상은 색인의 공통 참조이며, 행 표만 줄이는 것으로는 줄지 않는다.

## 2026-09-14 새 세션 소비 시험

원본: `.ai-work/document-loop-implementation/consumer-drill/`, Orca run `run_9099f617c68c`, Claude dispatch `ctx_d8bb41af86f8`. 설계 보고서·게이트 코드를 선행 입력으로 주지 않고 AGENTS → screen-loop로 세 요청을 진행했다. Codex 코디네이터가 실제 체크포인트·기존 코드·정본을 열어 반박했고 보고서가 수정됐다.

- logic `ascii-triplet`: 기존 구현 채택, 변경 0줄, 기존 단위 테스트 16개 통과, 실제 CLI review에 독립 검토와 검사 receipt 기록. 새로운 코드 구현의 성공 사례는 아니다.
- 후속 독립 검토에서 `KKK`, `Klm`, `jKl`이 true인 반례를 실행했다. ASCII 확인 전에 소문자로 변환해 `K`가 `k`가 되므로 R3의 비ASCII 제외 요구는 미충족이다. 앞선 implemented 판정을 철회한다. N6 기록·기존 테스트 통과가 계약의 의미적 충족을 증명하지 못한 사례이며, 공용 함수 수정은 별도 범위로 남겼다(`.ai-work/document-loop-implementation/ascii-counterexample.txt`, `closure-independent-review.md`).
- 게시판 필터 slice: 선택 4행, 테스트 26개 통과. Q23–Q26과 원장 행의 영향 범위를 구별해야 하며 제품 구현 완료를 판정하지 않았다.
- mixed: 첫 단위만 N6 도달, 나머지 단위 보존. 첫 단위 전달량은 104,839 → 66,373 bytes로 변했다. 미래 단위 bundle 자동 전달 수정과 작성자의 명시적 reference 축소가 함께 적용됐으므로 순수 게이트 효과나 토큰 절감률로 읽지 않는다.
- 실제 소비자가 `grain: mixed`를 적어 거절됐고 진단을 현재 단위 grain으로 고쳤다. 한 행의 미확인이 그 행의 모든 요구사항을 막는 과잉 차단도 발견해 `unresolved.requirementIds`로 영향 부분을 좁혔다. 부분 영향 판단의 타당성은 독립 검토가 소유한다.

동일 단위의 변경 없는 채택은 authored fingerprint가 빈 집합의 해시다. 검토자는 보고서가 지목한 기존 파일을 직접 읽어야 하며, 이 fingerprint가 기존 코드까지 고정한다고 주장하지 않는다. 작은 fixture의 다섯 grain 실행·review·Stop 통과는 별도 `normal-trials/` 기록이며 실제 새 프로젝트 인수를 대신하지 않는다.

## 읽기 비용 실측

2026-09-10: 목록 화면에 있는 역할의 형태 절 세 개(목록·URL 필드·route)만 읽으면 구조를 시작할 수 있었다(약 5.4KB). 그 앞에 AGENTS §2가 요구하는 SKILL 전체 읽기(feature·folder-structure·screen-loop, 당시 약 33KB)가 있다. 이 파일을 SKILL.md에서 분리한 이유가 그 고정 비용이다.

2026-09-10: 필터링 `cat` 래퍼가 98행 reference를 5행으로, 표시 없이 잘랐다(드릴 B §1.3). 읽는 방법은 [runtime-adapters](../../../../scripts/agents/runtime-adapters.md)가 소유한다.
