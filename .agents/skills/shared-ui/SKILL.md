---
name: shared-ui
description: >
  `src/shared`의 primitive·DataTable·폼 필드·다이얼로그·공용 훅·i18n UI·접근성·focus·렌더 성능을 추가·변경·승격·축소·삭제할 때 사용한다. 화면 조립은 해당 역할 계약, 배치는 source-structure로 보낸다.
---

# 역할 계약 — 공용 UI

**답하는 질문**: `src/shared` 와 `src/api` 가 지금 내보내는 공용 단위가 무엇을 받고, 무엇을 소유하며,
무엇을 **의도적으로 소유하지 않는가.**

**담지 않는 것**: 화면에서 어떤 단위를 언제 조립하는가 — `list-contract`·`detail-contract`·`form-contract`
가 소유한다. 제품 값 — fact 다.

catalog는 **caller가 넘기는 의미 / 단위의 소유 / 소유하지 않는 것**을 찾는 안내다.
정확한 prop·타입은 TypeScript export가 소유한다. 기존 API를 쓰는 데 승격 심사는 필요 없다.
공개 책임을 넓혀야 한다면 `source-structure`의 [승격 심사](../source-structure/references/promotion.md)로 판단한다.

공통 규칙: shared는 도메인·Query·endpoint·permission·업무 정책을 모른다(ESLint가 본다).
현재 `UnsavedChangesGuard`의 앱 blocker 연결만 Router 예외이며, 다른 단위로 확대하지 않는다.
primitive 만 Radix 를 import 한다. 문구는 props 로 받고, `shared` namespace 는 그 단위의 상호작용
계약에 속한 제품 공통 문구(오류·재시도·저장 확인·알림 제목)만 읽는다. 값을 해석하는 곳은 caller 다.

## Read only what applies

| Request | Read |
| --- | --- |
| What a shared unit takes, owns, and refuses — any `shared/ui`, `shared/hooks`, `shared/lib`, or `src/api` unit by name | the unit's row in [references/catalog.md](references/catalog.md) (`Primitives`, `Form`, `Filter`, `List`, `Detail`, `Dialog`, `Feedback`, `Hooks`, `Lib`, `API`) |
| Promoting, narrowing, demoting, deleting, or broadening a shared unit's responsibility | `source-structure` 의 [승격 심사](../source-structure/references/promotion.md) |
| Radix/Tailwind primitive internals, focus, keyboard, tokens, which selection control, React Compiler, TanStack Table v9 | [references/primitives-and-tokens.md](references/primitives-and-tokens.md) |
| Translation namespaces, adding a key, product-generic copy, locale parity | [references/i18n.md](references/i18n.md) |
| How a screen composes these units | `list-contract` · `detail-contract` · `form-contract` |
| Server state, keys, mutations | `api-wire` · `server-state` |

File creation, relocation and feature-local reuse placement follow `source-structure`. This skill owns whether a contract is domain-free enough to be shared.

## UI layers

1. `shared/ui/primitives`: source-owned Radix primitive plus Tailwind tokens and accessibility behavior.
2. `shared/ui/{dialog,feedback,filter,list,detail,layout}`: domain-neutral composition proven by real screens, grouped by the render contract it owns.
3. `shared/ui/form`: thin TanStack Form adapters around primitives and `FormField`, plus the save lifecycle (`useSaveForm`).
4. `shared/hooks` (state lifetime), `shared/lib` (pure calculation and policy values), `src/api` (query/mutation projection above transport).
5. `features/*/**`: columns, status UI, forms, permissions, workflow dialogs, and all domain-aware components.

Only `shared/ui/primitives` imports Radix directly. Shared UI must not accept a resource name, server DTO, query result, permission code, or mode switch that selects domain behavior. A pattern may read the `shared` translation namespace only when confirmed product-generic copy is part of its own interaction contract; domain nouns, feature labels, and workflow-specific wording remain caller-owned.

Do not prebuild a component catalog. "Approved" means the current requirement needs the unit, not that reuse seems likely. Add the minimum primitive or pattern required by that screen, then test its interaction contract. The `Form*Field` adapter set in the catalog is the one declared exception: it stays for the declared input kinds even with zero consumers, and no alias is added beside it.

`useSaveForm`의 확인·완료 절차나 `PagedListResult`의 배치는 특정 상호작용을 재사용하는 조합이다.
그 절차·배치를 요구하는 소비자에서 채택한다. 요구가 다르면 필요한 하위 단위로 기능 안에서 조립하고,
새 옵션으로 차이를 숨기거나 모든 화면을 기존 조합에 맞추지 않는다.

## Common mistakes

- Promoting on visual similarity or a mechanical third occurrence
- Building `ResourcePage`, schema forms, permission buttons, or universal CRUD tables
- Putting translation fragments, domain keys, navigation, toast, or mutation handling inside primitives
- Adding memoization or virtualization without a specific identity contract or measurement
- Adding a prop to a shared unit so that one caller fits instead of composing feature-locally

## 이 계약의 검증 대상

| 축 | 무엇을 확인하나 |
| --- | --- |
| 계약 준수 | 타입에 맞으며 caller의 제품 판단을 공용 단위가 대신하지 않는가 |
| 접근성 | 바뀐 상호작용의 접근 가능한 이름·키보드 조작·focus 진입과 복원·disabled |
| 값 | controlled 값이 caller 에게 되돌아가는가, 빈 값의 표현이 표대로인가 |
| 경계 | 도메인·Query·endpoint 결합이 없고, Router 연결이 기존 guard 예외 밖으로 새지 않는가(lint가 본다) |

소비자를 찾아 영향 범위를 정한다. 공용 동작은 해당 focused 테스트로, 공개 타입 변경은 호출부의
타입 검사로, 연결 차이는 영향을 받는 소비 방식별로 확인한다. 같은 공용 동작을 모든 화면에서
반복 실측할 의무는 없다. 전역 focus·스타일처럼 영향이 넓거나 연결 차이가 드러나면 범위를 넓힌다.
