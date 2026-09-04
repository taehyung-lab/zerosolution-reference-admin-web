# Shared values: pure utilities, mechanics, and config

Read this file only for a `shared/lib` function or hook, a `shared/config` preset, or when deciding whether a helper belongs there ([logic-promotion.md](logic-promotion.md) owns the admission test).

## Pure utilities (`shared/lib`)

| Function | Input → output | Use for | Not for |
| --- | --- | --- | --- |
| `resolveSearchDefaults(sparse, defaults)` | sparse route search + complete defaults → resolved object; only declared keys, `??` per key | turning canonical sparse URL search into UI/request values | injecting defaults into the URL |
| `canonicalizeRouteSearch(schema, raw)` | `{ search, changed }` after `schema.parse` → `compactSearchValues` → structural compare | the route canonical guard (`replace` when `changed`) | validation policy (that is the feature schema) |
| `compactSearchValues(obj)` | drops top-level `undefined` and empty arrays only; keeps `null`, `''`, nested values | writing sparse URL search | deep cleaning |
| `nonEmptyArray(values)` | copy of the array or `undefined` when empty | request params that must omit empty filters | — |
| `toTotalPages(total, pageSize)` | `max(1, ceil(total / pageSize))` | feature `totalPages` for `Pagination` | deciding out-of-range recovery |
| `toSelectOption({ id, name })` | `{ value: String(id ?? ''), label: name ?? '' }` | mapping an id/name DTO into `Select` options | ids that may be missing — an empty `value` conflicts with the `Select` null contract (unconfirmed; validate ids first) |
| `formatCount(locale, n)` | `Intl.NumberFormat(locale)` string | summary numbers | sentences or units |
| `formatDate`, `displayTimeZone`, `utcDayBoundary`, `periodPresetRange`… (`datetime.ts`) | see ADR 0003 | display in browser zone, UTC request boundary, preset → range | deriving a zone from locale, storing `Date` in models |
| `cn(...classes)` | clsx + tailwind-merge | primitive class composition | — |

## State mechanics (`shared/lib`)

| Hook | Caller passes | Owns | Caller owns |
| --- | --- | --- | --- |
| `useDraftCommit({ committed, keyOf, createDraft })` | committed value, identity function, draft factory | `draft`, `setDraft`, `patchDraft`, `resetDraft`; preserves the draft while `keyOf(committed)` is `Object.is`-equal and rebuilds when it changes | what counts as identity (filter vs view fields), when to commit |
| `usePeriodDraft({ committed: { startDateTime?, endDateTime? }, resetKey })` | committed UTC range | `preset`, browser-zone `range`, `utcRange`, `setPreset` (writes UTC day boundaries), `setRange` (forces `CUSTOM`), `reset` | period criterion, adopted presets, default preset, validation copy |
| `useKeywordDraft<TField>({ committedItems, initialField, resetKey })` | committed `{ field, value }[]`, initial target | `items`, `pending`, `setPendingField/Value`, `addPending` (trims; empty is ignored), `removeAt`, `clear` (empties `items`, keeps `pending`), `reset` (rebuilds both from committed), `itemsIncludingPending` | target enum, server mapping, duplicate policy (unconfirmed product rule) |

## Config (`shared/config/list.ts`)

`standardPageSizeOptions = [100, 200, 300, 400, 500, 700, 1000]` and `standardPeriodPresetValues` (8 presets, no `CUSTOM`) are provisional product presets observed on every list. A feature opts in explicitly and still owns its default and any exception; the config declares no default. Inventory-observed defaults: 목록 100·전체, 발권 등록 화면 200, 통계 1개월 전, 로그 7일 전.

Test the pure transformation or transition that changed; do not add a config value or helper without a consuming feature.
