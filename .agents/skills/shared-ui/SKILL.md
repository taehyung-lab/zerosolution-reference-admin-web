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

한 줄이 한 단위이고, 열은 **caller 가 넘기는 것 / 단위가 소유하는 것 / 소유하지 않는 것**이다.
표에 없는 prop·mode·callback 을 한 호출자 때문에 더하지 않는다 — 그 판단은 `source-structure` 의 [승격 심사](../source-structure/references/promotion.md) 이 소유한다.

공통 규칙: shared 는 도메인·Router·Query·endpoint·permission·workflow 를 모른다(ESLint 가 본다).
primitive 만 Radix 를 import 한다. 문구는 props 로 받고, `shared` namespace 는 그 단위의 상호작용
계약에 속한 제품 공통 문구(오류·재시도·저장 확인·알림 제목)만 읽는다. 값을 해석하는 곳은 caller 다.

## Read only what applies

| Request | Read |
| --- | --- |
| What a shared unit takes, owns, and refuses — any `shared/ui`, `shared/model`, `shared/lib`, or `src/api` unit by name | the unit's row in [references/catalog.md](references/catalog.md) (`Primitives`, `Form`, `Filter`, `List`, `Detail`, `Dialog`, `Feedback`, `Model`, `Lib`, `API`) |
| Promoting, confirming, narrowing, demoting, or deleting a shared unit; a caller that needs a new prop | `source-structure` 의 [승격 심사](../source-structure/references/promotion.md) |
| Radix/Tailwind primitive internals, focus, keyboard, tokens, which selection control, React Compiler, TanStack Table v9 | [references/primitives-and-tokens.md](references/primitives-and-tokens.md) |
| Translation namespaces, adding a key, product-generic copy, locale parity | [references/i18n.md](references/i18n.md) |
| How a screen composes these units | `list-contract` · `detail-contract` · `form-contract` |
| Server state, keys, mutations | `api-wire` · `server-state` |

File creation, relocation and feature-local reuse placement follow `source-structure`. This skill owns whether a contract is domain-free enough to be shared.

## UI layers

1. `shared/ui/primitives`: source-owned Radix primitive plus Tailwind tokens and accessibility behavior.
2. `shared/ui/{dialog,feedback,filter,list,detail,layout}`: domain-neutral composition proven by real screens, grouped by the render contract it owns.
3. `shared/ui/form`: thin TanStack Form adapters around primitives and `FormField`, plus the save lifecycle (`useSaveForm`).
4. `shared/model` (state lifetime and policy values), `shared/lib` (pure calculation), `src/api` (query/mutation projection above transport).
5. `features/*/**`: columns, status UI, forms, permissions, workflow dialogs, and all domain-aware components.

Only `shared/ui/primitives` imports Radix directly. Shared UI must not accept a resource name, server DTO, query result, permission code, or mode switch that selects domain behavior. A pattern may read the `shared` translation namespace only when confirmed product-generic copy is part of its own interaction contract; domain nouns, feature labels, and workflow-specific wording remain caller-owned.

Do not prebuild a component catalog. "Approved" means the current requirement needs the unit, not that reuse seems likely. Add the minimum primitive or pattern required by that screen, then test its interaction contract. The `Form*Field` adapter set in the catalog is the one declared exception: it stays for the declared input kinds even with zero consumers, and no alias is added beside it.

## Common mistakes

- Promoting on visual similarity or a mechanical third occurrence
- Building `ResourcePage`, schema forms, permission buttons, or universal CRUD tables
- Putting translation fragments, domain keys, navigation, toast, or mutation handling inside primitives
- Adding memoization or virtualization without a specific identity contract or measurement
- Adding a prop to a shared unit so that one caller fits instead of composing feature-locally

## 이 계약의 검증 대상

| 축 | 무엇을 확인하나 |
| --- | --- |
| 계약 준수 | caller 가 표에 없는 prop·mode·callback 을 넘기지 않는가 |
| 접근성 | 바뀐 상호작용의 접근 가능한 이름·키보드 조작·focus 진입과 복원·disabled |
| 값 | controlled 값이 caller 에게 되돌아가는가, 빈 값의 표현이 표대로인가 |
| 경계 | 단위가 도메인·Router·Query·endpoint 를 알게 되지 않았는가(lint 가 본다) |

공용 단위를 바꿨으면 **그 단위의 focused 테스트 + 기존 소비자 전부**가 완료의 범위다. 한 호출자의
필요가 계약을 넓히지 못한다.
