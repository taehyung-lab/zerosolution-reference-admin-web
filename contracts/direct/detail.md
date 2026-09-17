# 역할 계약 — 상세

**답하는 질문**: 레코드 하나를 여는 진입·상태 경계·섹션·액션을 누가 소유하고, 무엇을 봐야 닫히는가.

**담지 않는 것**: 어떤 섹션·항목·액션이 있는가 — 그 화면의 fact 다. 배치 — `source-structure.md` 다.

ID 하나로 여는 조회 화면의 계약이다: 진입, 상태 경계, 섹션, 액션, 파일 집합. `{entity}` 자리에 그 화면의 엔티티가 들어간다.

## Ownership

- `api/queries.ts` 의 `{entity}DetailQueryOptions(locale, id)` 하나를 route loader·조회 화면·수정 화면이 같이 쓴다. `api/use{Entity}Detail(id)` 는 `useDetailQuery(options)`(`src/api/required-query.ts`)를 부르는 API-only 훅이다.
- 목록 행은 부분 값이라 상세 데이터가 아니다. 상세는 ID query 로 다시 읽는다.
- 섹션 구성·라벨·빈 값 문구·마스킹·상태별 액션 가시성·목적지는 feature 가 쓴다. 공용 shell·상태→액션 카탈로그를 만들지 않는다.
- 상세 안의 편집 섹션은 자기 폼이다([form](form.md)): 자기 `useForm`·저장·dirty 를 갖고 성공 시 상세 key 를 무효화한다. 상태가 읽기 전용이면 폼을 disable 하지 않고 읽기 표면을 그린다.

## State

```text
route loader: loadRequired(queryClient, {entity}DetailQueryOptions(locale, id), { preload })
screen:       const detail = use{Entity}Detail(id)
              <PageHeader … />                       ← 경계 밖. 실패에도 제목이 남는다
              <DetailStateBoundary query={detail}>
                {(record) => <{Entity}DetailContent record={record} … />}
              </DetailStateBoundary>
```

- 진입 실패는 route 의 것이다: 없는 ID 는 셸 안의 not-found 페이지, 403·401 은 incident 표면, 그 외는 error 페이지. 화면은 mount 되지 않는다([router](route-composition.md#loader-and-preload)).
- `DetailStateBoundary` 는 진입 **이후**의 전이만 그린다: refetch 실패 → `error`(재시도·trace), 그 사이 삭제된 레코드 → `notFound`, 그 외 → `children(data)`. pending·delegated 는 내용 없는 ready 다(app progress·incident 표면이 덮는다).
- 판정 우선순위는 `resolveRequiredQueryOutcome` 하나가 소유한다: incident → not-found → 캐시 데이터 → pending → 로컬 오류. 화면은 삼항으로 다시 판정하지 않는다.
- 상세 options 는 `meta.progress` 를 선언하지 않는다. loader 가 기다리므로 대기 표면은 `RoutePending` 이다.

## Composition

`{Entity}DetailContent({ record, ... })` 는 같은 파일 안의 두 번째 컴포넌트다. 데이터가 있는 상태에서만 mount 되므로 훅이 `record` 를 조건 없이 읽는다.

| 표면 | 공용 | feature 가 쓰는 것 |
| --- | --- | --- |
| 헤더 | `PageHeader({ title, breadcrumbs, tooltip?, actions? })` | 경로 문구, 헤더 우측 액션(데이터가 있을 때만) |
| 섹션 | `SectionCard({ title, actions?, collapsible? })` | 제목, 어떤 필드가 어느 섹션인가 |
| 필드 | `<dl>` 안의 `DetailField({ label, children })` | 컬럼 grid, 빈 값 `-`, 포맷, 마스킹, 값 안의 버튼·링크 |
| 상태 | `Badge({ tone })` | 상태 → tone 의 exhaustive map |
| 이력 | `UpdateHistory({ entries, labels, emptyText })` | `model/{entity}-history.ts` 의 순수 mapper `to{Entity}HistoryEntries(logs, t)` — 항목 라벨, 값 포맷, 비노출 항목(변경 사실만 한 줄), 모르는 항목의 중립 문구 |
| 자식 행 집합(이력·자식 목록·자식 표) | [collection](collection.md) 이 분류 | 행 출처·컬럼·문구·빈 상태 |
| 탭 | `Tabs*` | 선택 값(로컬 상태), 라벨 |

렌더 계약은 [catalog Detail](shared-ui.md#detail).

## Actions

액션은 두 종류다. 둘 다 `useMutation({entity}ActionMutation(locale))` 하나에 닿고, mutation 입력이 대상 ID 를 실는다.

- **확인만 받는 액션**(승인·삭제·활성·비활성): `useConfirmation<Kind>({ run: (kind) => action.mutateAsync({ type: kind, id }), description: (kind) => …, confirmLabel?: (kind) => … })`. 버튼은 `confirmation.request(kind)`, Content 끝에 `{confirmation.dialog}` 를 한 번 렌더한다. 삭제 문구는 `shared:deleteConfirm.description`, 그 외 문구는 feature namespace.
- **입력이 필요한 액션**(사유·비밀번호·재인증): `ui/{Entity}ActionForm.tsx` 다이얼로그 하나가 종류별 schema 를 고르고 자기 `useForm`·`useUnsavedChangesGuard`·pending·실패 문구를 소유한다. 유효 입력을 `run(action)` 에 넘겨 이행되면 닫힌다. `key={kind}` 로 종류가 바뀌면 새 폼 수명이다.
- 다른 도메인의 기능(발송 등)은 화면이 채널만 알리고(`onMessage(channel)`) route 가 그 도메인의 훅·다이얼로그를 조립한다([router Thin route](route-composition.md#thin-route)).
- 수정 진입은 `onEdit(id)` prop 이다. 어떤 상태에서 보이는가는 원장에서 읽는다.
- 미연결 mutation 은 [mutations](../contract/server-state.md#시나리오-요청) 의 `scenarioRequest(label)` 이다. 비밀번호·사유는 로그에 싣지 않는다.

## 형태

**책임이 있으면 이 이름·이 자리에 둔다. 없으면 파일도 없다.** 폴더는 `screens/{entity}-detail/`.

| 책임 | 있으면 이 자리 |
| --- | --- |
| ID·locale 를 query options 에 묶는 실행 | `api/use{Entity}Detail.ts`(도메인 `api/`) |
| 헤더 + 상태 경계 + 내용 조립 | `ui/{Entity}DetailScreen.tsx` |
| 서버 변경 로그 → 표시 줄 mapper | `model/{entity}-history.ts` |
| 입력이 필요한 액션의 다이얼로그 | `ui/{Entity}ActionForm.tsx` |
| 자기 query·폼·액션을 가진 섹션이나 다이얼로그 | `ui/{Entity}{Section}Section.tsx` · `ui/{Name}Dialog.tsx` |
| 진입(레코드 await)과 화면 mount | `src/routes/…/$id/index.tsx`([router 형태](route-composition.md#형태)) |

- 읽기 전용 섹션은 Screen 안 인라인이 기본이다. 섹션이 자기 상태를 갖거나 Screen 이 읽기 어려워질 때 파일로 나눈다.
- 테스트는 파일 수가 아니라 **닫아야 할 동작**으로 고른다: 읽기 표시(마스킹·빈 값), 상태별 액션 가시성, 확인 취소가 아무것도 부르지 않음, 확정이 요청에 한 번 닿음, 입력 액션의 검증과 dirty 닫기, 없는 ID. 이력 mapper 가 있으면 secret·서버 코드가 새지 않음을 따로 고정한다.

## Verification

바뀐 것만: ID·key 동일성, ready·error·notFound 매핑과 재시도, 상태별 액션 가시성, 확인·입력 액션이 요청 함수에 닿는 한 번, 목적지. 브라우저 증거는 어떤 상태의 어떤 레코드를 열어 어떤 액션을 눌렀는지를 적는다.

실측한 것 중 되돌아올 전이 하나를 `tests/e2e/` 에 회귀 앵커로 남긴다([브라우저로 판정되는 결과](../../AGENTS.md#브라우저로-판정되는-결과)).
