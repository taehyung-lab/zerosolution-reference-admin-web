# Screen composition

Read this file for a new ordinary screen skeleton or app-shell/navigation metadata. List, detail, form, and specialized workflows have their own references.

## Explicit composition

Routes and feature screens compose visible parts explicitly. Repeated JSX is acceptable; do not replace it with `ResourcePage`, a page-controller hook, or a universal config/screen descriptor. A shared pattern owns layout and interaction mechanics only. Fields, columns, copy, permissions, queries, mutations, and workflow decisions stay in the feature.

Sibling lists inside one feature may reuse one feature-owned result component for an identical
toolbar/count/table/pagination assembly; columns, sort options, search gating and row actions remain
explicit caller inputs, and the composition has no resource mode, query, endpoint or schema descriptor
(current example: [이 저장소의 관찰](#이-저장소의-관찰)).

Within one feature, screens with the same workflow may share an explicit screen and a small typed definition for actual field/column differences. If state transitions, selection, actions or query gates differ, keep separate screen/filter/result assembly and reuse the repeated mechanics. Props alone are not a reason to combine hooks; a pure feature-local transition is enough when only the sort/page update repeats.

Inspect only the confirmed product screens and adjacent workflows needed to identify the current screen and genuine shared candidates. Choose one representative workflow; do not implement a catalog. Figma repetition is evidence only when semantics, state transitions, and failure behavior match. Promotion decisions use `shared-ui-contract` and ADR 0009.

- The route mounts one feature screen or an explicit composition of independently owned screens.
- The feature composes only the visible surfaces its selected workflow reference requires.
- Cross-domain navigation and permission-evaluator metadata lives in `app/config`, not `shared` or another feature.

## Feature-internal decomposition

Apply the same ownership test to every sibling workflow, not only the first representative screen. Being feature-local does not justify keeping independent filter, result, action, and data workflows in one Screen file.

- A Screen is the composition entry: it connects named surfaces and their owners. When a list contains filter draft/commit, result selection/paging, and action confirmation workflows, separate those responsibilities into feature-local Filters, Result, and Actions components and focused state/data hooks. Keep the Screen readable as their wiring.
- Columns belong beside the result surface; move a substantial column definition out of the Screen. Pure render-local formatting stays with its renderer. Extract hooks for state or workflow ownership, not to wrap every calculation.
- `Screen → Filters / Result / Actions` with `useData / useResult / useActions` and columns is a responsibility map, not a mandatory seven-file template. Omit absent responsibilities. The role `형태` tables are the same map: invariants stay, files exist only when the role exists. File length is a review signal, not a pass/fail threshold; a small read-only surface does not need empty adapters.
- A list also owns three model responsibilities the map above does not render: the URL/page transition policy as pure functions (`*-list-policy.ts` — a view change returns to the first page while paging preserves the other conditions), the declared search fields and their codecs (`search-schema.ts`), and the request boundary each action calls (`*-list-requests.ts`). Both existing list consumers carry all three, so decide the set by opening one of them rather than recalling this list: a screen without mutations omits the request boundary, and omission is a stated decision, not a silent gap.
- Detail screens follow their actual sections, forms, and dialogs rather than the list template. Split independently validated forms and action lifecycles while preserving one owner for each draft.
- Keep action/dialog owners mounted across searched/loading/empty result branches. Only their triggers or result content follow those branches; moving the owner to a route is not the remedy. Cross-feature wiring follows [router.md](router.md).

## Placement and naming

파일 생성·이동과 배치 판단은 [folder-structure-contract](../../folder-structure-contract/SKILL.md)가 소유한다.
화면은 `screens/{workflow}`, 도메인 내부 재사용 기능은 `mechanics/{capability}` 아래 필요한 목적별 segment를 둔다.
이 문서는 화면 내부 책임 분해만 소유한다. 표시 조립 훅은 ui, 실행·상태·업무 정책은 model에 둔다.
타입만 공유하더라도 화면이나 UI를 역참조하지 않고 실제 공통 값의 소유 위치를 바로잡는다.

## 기존 화면을 확장할 때의 대조

새 화면을 조립하기 전에 같은 업무군의 route·Screen·data/filter/result/actions와 내부 팝업의 실제 호출부를 비교한다.
각 책임을 `유지 / 연결부 교체 / mock으로 이동 / 계약 확인 필요`로 구분하고, 기존 공용 계약의 채택과 남길 화면별 차이를 설명한다.
주석은 한글로 역할·상태 소유자·임시 데이터와 교체 조건을 설명하되 코드 자체를 줄마다 반복하지 않는다.
Screen의 props는 조회/URL/업무 연결과 표시 책임을 분리하는 경계다. 테스트를 위해서만 불필요한 전달 계층을 만들지 않는다.

조회·옵션·mock 책임은 [query-cache.md](../../api-contract/references/query-cache.md#서버-연결-전후의-책임),
공용 승격은 [logic-promotion.md](../../shared-ui-contract/references/logic-promotion.md#실제-api에서도-남는-중복인가),
등록·수정·발송 등 최종 callback의 완료 증거는 [mutation-actions.md](mutation-actions.md#api-연결-전-시나리오-요청)를 따른다.
대표 화면 하나의 적용을 다른 route와 팝업의 적용 완료로 간주하지 않는다.

## Never

- Shared screen shells or schema/config-driven universal pages
- Feature-to-feature imports for permission or navigation catalogs
- Screen-specific copy, permissions, Query, or mutations inside shared UI

## 이 저장소의 관찰

규칙이 아니라 이 저장소 화면에서 위 규칙을 적용한 기록이다. 신규 프로젝트는 이 절을 비우고 자기 화면으로 다시 채운다.

- feature 소유 결과 컴포넌트 재사용: 회원 기록 목록들이 `MemberRecordResult` 를 공유한다.
- 같은 workflow 의 변형이 한 화면과 작은 타입 정의를 공유하는 예: 활성 회원 전체·일반·불량.
