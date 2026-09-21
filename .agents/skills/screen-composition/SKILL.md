---
name: screen-composition
description: >
  새 화면 뼈대를 세우며 route·feature·Screen의 책임과 조립을 나눌 때 사용한다. 기존 화면 동작은 해당 역할 계약, 파일 배치는 source-structure, route guard는 route-composition으로 보낸다.
---

# 역할 계약 — 화면 조립

**답하는 질문**: 새 화면의 뼈대를 무엇으로 세우고, route 와 feature 가 무엇을 나눠 갖는가.

**담지 않는 것**: 역할별 동작 — 선택된 역할 skill이 소유한다.
파일이 어디 놓이는가 — `.agents/skills/source-structure/SKILL.md` 다.

Read this file for a new ordinary screen skeleton, app-shell/navigation metadata, or when deciding how a screen's responsibilities split into files. List, detail, form, and specialized workflows have their own references.

역할이 아직 확인되지 않았다면 가장 비슷해 보이는 CRUD 역할을 먼저 고르지 않는다. fact에서 진입점,
핵심 상호작용, 상태·실패·복구를 확인한 뒤 역할 계약이나 specialized workflow로 보낸다. 그래도 닫히지
않으면 이 문서는 최소 조립 경계만 세우고 새 역할의 고정 파일 집합을 발명하지 않는다.

## Explicit composition

Routes and feature screens compose visible parts explicitly. Repeated JSX is acceptable; do not replace it with `ResourcePage`, a page-controller hook, or a universal config/screen descriptor. A shared pattern owns layout and interaction mechanics only. Fields, columns, copy, permissions, queries, mutations, and workflow decisions stay in the feature.

- The route mounts one feature screen or an explicit composition of independently owned screens.
- The feature composes only the visible surfaces its selected workflow reference requires.
- Cross-domain navigation and permission-evaluator metadata lives in `app/config`, not `shared` or another feature.

## One responsibility map per role

역할이 확인된 화면은 그 역할 계약의 책임 경계를 사용한다. 파일 이름과 개수는
[source-structure](../source-structure/SKILL.md)가 정하고, 제품 사실은 해당 화면 fact에서만 가져온다.

- A Screen is the visible composition entry. URL·ID·navigation 배선과 역할 소유 상태를 연결하되, 정확한 prop·hook 순서나 파일 분리는 현재 구현이 소유한다.
- State lives with its owner: `model/` hooks own URL transitions, drafts, query facts, and action policy; `ui/` hooks own only what the renderer consumes (columns, view controls, selection). Pure render-local formatting stays with its renderer.
- Variants of one screen (URL tabs, fixed filters) are one Screen plus a typed `definition` in `model/`. If state transitions, selection, actions, or query gates differ, it is another screen.
- A piece two screens of one domain share with identical meaning, transitions, and failure lifecycle moves to the domain's `shared/{capability}/{ui,model}` ([folder-structure](../source-structure/SKILL.md)). Screens never import sibling screens; ESLint enforces it.
- Dialog owners (confirmation, selection alert, action form) render inside the component that triggers them and never inside a `searched`/`ready` branch, so a refetch cannot unmount an open dialog.
- Cross-feature wiring (another domain's dialog on this screen) happens in the route ([router](../route-composition/SKILL.md#thin-route)).

## Placement and naming

파일 생성·이동과 배치 판단은 [`source-structure.md`](../source-structure/SKILL.md)가 소유한다. 화면은 `screens/{entity}-list|detail|form`, 도메인 내부 재사용 기능은 그 도메인의 `shared/{capability}` 아래 필요한 목적별 segment 를 둔다. 표시 조립 훅은 ui, 실행·상태·업무 정책은 model 에 둔다. 타입만 공유하더라도 화면이나 UI 를 역참조하지 않고 실제 공통 값의 소유 위치(`model/`)를 바로잡는다.

## Extending an existing screen

새 화면을 조립하기 전에 같은 업무군의 route·Screen·model/ui 훅과 다이얼로그의 실제 호출부를 비교한다. 각 책임을 `유지 / 연결부 교체 / mock 으로 이동 / 계약 확인 필요` 로 구분하고, 기존 공용 계약의 채택과 남길 화면별 차이를 설명한다. 주석은 한글로 역할·상태 소유자·임시 데이터와 교체 조건을 설명하되 코드 자체를 줄마다 반복하지 않는다. Screen 의 props 는 조회/URL/업무 연결과 표시 책임을 분리하는 경계다. 테스트를 위해서만 불필요한 전달 계층을 만들지 않는다.

조회·선택지·mock 책임은 [query-cache](../server-state/SKILL.md#서버-연결-전후의-책임), 공용 승격은 [promotion](../shared-ui/SKILL.md), 미연결 mutation 의 종착점은 [mutations](../server-state/SKILL.md#시나리오-요청)를 따른다. 대표 화면 하나의 적용을 다른 route 와 다이얼로그의 적용 완료로 간주하지 않는다.

## Never

- Shared screen shells or schema/config-driven universal pages
- Feature-to-feature imports for permission or navigation catalogs
- Screen-specific copy, permissions, Query, or mutations inside shared UI
- Copying a sibling screen's product values (fields, options, copy, defaults) as this screen's facts
