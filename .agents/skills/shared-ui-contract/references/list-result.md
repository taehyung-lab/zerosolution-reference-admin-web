# List result surfaces

Read this file only for `ListResult`, `ResultToolbar`, `ResultSummary`, or `ResultTotal` rendering.

- `ListResult` receives feature-decided plain `ListResultData<TRow>` facts (rows, searched, isPending, isFetching, isError, trace, retry) and resolves
  `notSearched → loading → error → empty → ready` in one place. It does not inspect Query, read totals, or calculate pagination. Loading uses shared progress copy in the result surface; an app-wide entry overlay may cover it, while a first user search keeps it visible locally.
- The caller provides data, domain-specific `notSearched`/`empty` copy, footer, and ready children. The data
  contains retry behavior and structural `ErrorTraceValue`. The pattern directly reads shared error/retry/trace copy and
  owns `role="alert"`; callers do not assemble those labels or the trace disclosure.
- `ResultSummary({ groups: { key, items: { key, text }[] }[] })` renders each completed sentence as a list item; empty groups disappear and separators are decorative. For a single total, `ResultTotal({ searched, total })` owns `shared:list.total`, locale number formatting and the absent-before-search/visible-zero distinction using this summary layout; multi-item summaries (a total plus one count per status) are extra groups with feature meaning.
- `ResultToolbar({ left?, right? })` is two slots: view controls on the left, actions on the right. What sits in each slot, and whether it renders before the first search, is the caller's.
- A dialog opened from a toolbar action is mounted by an owner that **never sits inside a `searched` branch or `ListResult`'s ready children**. `ListResult` renders children only in `ready`, and toolbar actions are usually gated by `searched`, so an owner placed there unmounts mid-workflow: confirming a bulk change refetches, the transient `loading` drops the owner, and the dialog disappears before its consequence is visible. Gate the buttons, never the owner. Every list with a toolbar dialog pins this with rerender tests across `notSearched | loading | error | empty`.
- Feature code owns Query interpretation and plain facts, `ApiError` to structural trace mapping, recovery,
  permission, rows, and workflow action policy. Shared never imports the API layer.

Before search, a feature composes only what its design shows (often just the register action) and renders summary and view controls from `searched`; `ListResult` gets no toolbar mode.

Test the rendered state, live error/retry contract, slot composition, and accessible summary actually changed.

`ResultTotal` stays at the feature's chosen position before or after `ResultToolbar`. It consumes no Query
or loading/error facts; a consumer with an additional confirmed visibility gate supplies that boolean.
It does not hide action/dialog owners or merge summary, toolbar and result lifetimes. Multi-metric totals
still use `ResultSummary` with complete feature-owned sentences. Never use `total > 0` as the search gate.

## 이 저장소의 관찰

규칙이 아니라 이 저장소 화면에서 위 규칙을 적용한 기록이다. 신규 프로젝트는 이 절을 비우고 자기 화면으로 다시 채운다.

- 다이얼로그 소유자 rerender 테스트는 회원·운영자 목록에 있다. 검색 전 toolbar 에 등록 액션만 두는 예는 운영자 목록. 상태별 요약 여러 개의 예는 발권(총·발권대기·발권완료).
