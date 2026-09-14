# Shared values: pure utilities, mechanics, and config

Read this file only for a `shared/lib` function or hook, a `shared/config` preset, or when deciding whether a helper belongs there ([logic-promotion.md](logic-promotion.md) owns the admission test).

## Pure utilities (`shared/lib`)

| Function | Input → output | Use for | Not for |
| --- | --- | --- | --- |
| `resolveSearchDefaults(sparse, defaults)` | sparse route search + complete defaults → resolved object; only declared keys, `??` per key | turning canonical sparse URL search into UI/request values | injecting defaults into the URL |
| `omitSearchDefaults(search, defaults)` | removes undefined, empty arrays and structurally equal declared defaults | canonical sparse URL output | deciding whether a search was requested; the caller detects valid conditions before omission |
| `normalizeClosedInstantRange(value)` | optional instant pair → missing/invalid/reversed pair cleared, independent fields preserved | consistent chronological comparison including fractional-second spellings | ISO syntax codecs, changing an editable partial draft, selecting a period criterion or search policy |
| `canonicalizeRouteSearch(schema, raw)` | `{ search, changed }` after `schema.parse` → `compactSearchValues` → structural compare | the route canonical guard (`replace` when `changed`) | validation policy (that is the feature schema) |
| `compactSearchValues(obj)` | drops top-level `undefined` and empty arrays only; keeps `null`, `''`, nested values | writing sparse URL search | deep cleaning |
| `filterPartitionKey(search, partition)`, `filterPartitionValues(search, partition)` (`search-partition.ts`) | committed search + a caller-declared `filter \| view` map → draft identity string / filter-only values | keeping a draft rebuild and a submit from carrying committed view state (sort, page, page size) back over the URL | deciding which field is filter or view — that map is the feature's, and the mechanic never reads a field name it was not given |
| `nonEmptyArray(values)` | copy of the array or `undefined` when empty | request params that must omit empty filters | — |
| `toTotalPages(total, pageSize)` | `max(1, ceil(total / pageSize))` | feature `totalPages` for `Pagination` | deciding out-of-range recovery |
| `toSelectOption({ id, name })` | `{ value: String(id ?? ''), label: name ?? '' }` | mapping an id/name DTO into `Select` options | ids that may be missing — an empty `value` conflicts with the `Select` null contract (unconfirmed; validate ids first) |
| `formatCount(locale, n)` | `Intl.NumberFormat(locale)` string | summary numbers | sentences or units |
| `formatDate`, `displayTimeZone`, `utcDayBoundary`, `periodPresetRange`… (`datetime.ts`) | see ADR 0003 | display in browser zone, UTC request boundary, preset → range | deriving a zone from locale, storing `Date` in models |
| `maskEmail`, `maskPhone` (`mask-contact.ts`) | string → masked display string | the contact display algorithm two features currently share | permission, revealing raw values, assuming new products use this masking rule |
| `hasRepeatedOrSequentialAsciiTriplet` (`ascii-triplet.ts`) | string → boolean, case-insensitive repeated or ascending/descending ASCII letter/digit triplet | the password predicate two features currently share | password length, character classes, schema, copy or server password history |
| `cn(...classes)` | clsx + tailwind-merge | primitive class composition | — |

## Search field declarations and codecs

`defineSearchFields(fields)` (`search-fields.ts`) derives a sparse Zod object schema, defaults, and
filter/view partition from the same keys. Every source field declares `schema`, `defaultValue`, and `kind`.
Defaults must fit the schema output type; explicit `undefined` keeps absence, and array literals can be
readonly in the declaration. Resolved arrays retain their element type, enums and numeric unions stay
narrow, and partition kinds stay literal. Object projection assertions are confined to this helper.
The tool does not validate product policy or refinements such as a numeric minimum in the default.

`resolveSearchDefaults(sparse, contract.defaults)` remains the value-resolution boundary. It applies
`??` to declared keys only; it does not modify the URL or decide whether to search. Source declarations
and returned defaults are immutable configuration: consumers replace draft arrays, never mutate defaults.

| Codec (`search-codecs.ts`) | Contract |
| --- | --- |
| `optionalInstant` | ISO datetime input → same string; missing/invalid → undefined. No timezone conversion or pair ordering. |
| `optionalPositiveInteger` | Coerced positive integer → number; missing/invalid → undefined. No default or product page-size choices. |
| `recoverArray(item)` | Validate the whole array; one invalid item, invalid array, or missing array → undefined. Empty array stays empty. |
| `recoverArrayItems(item)` | Keep parsed valid items in order; drop invalid items. Invalid/missing array → undefined; all-invalid array → empty array. |

Both recovery contracts have consumers today (which is which: [이 저장소의 관찰](#이-저장소의-관찰)). Keyword trimming, enum meaning, page-size acceptance,
search discriminator, and which declared defaults may be omitted remain feature choices; the structural omission algorithm is shared. These codecs do not know field names.
Every list consumer adopts `normalizeClosedInstantRange` after codecs and `omitSearchDefaults` after any explicit-intent detection. These pure functions own neither Router nor Query and never choose defaults or whether to query. Screen consumers receive resolved types; optional dates remain optional by declaration. Search metadata is not included in `defineSearchFields` or its defaults/partition.

Compose source fields before derivation, including subset and override. Do not trim only a derived schema
and reuse old maps. Shared code does not generate a UI, Router, Query, DTO, or product/URL reset controller. The
consumer workflow and current default inventory live in
[list-search-contract](../../feature-contract/references/list-search-contract.md#search-계약과-기본값-작성).

Tests cover exact keys after remove/add/override, default compatibility, literal enum and optional output,
filter-only draft typing, sparse vs resolved values, and the two distinct array failure contracts.
Every real list variant and the record lists test adoption ([이 저장소의 관찰](#이-저장소의-관찰)); helper tests alone do
not establish product defaults or end-to-end behavior. This is a local reference contract, not completed
new-product transplant evidence.

## State mechanics (`shared/lib`)

| Hook | Caller passes | Owns | Caller owns |
| --- | --- | --- | --- |
| `useConfirmation({ run })` | opaque validated value via `requestConfirmation` | closed/confirm state, cancel, confirmed callback | validation, copy, API, success/failure, navigation; extracted from bulk and reused by two features' forms |
| `useDraftCommit({ committed, keyOf, createDraft })` | committed value, identity function, draft factory | `draft`, `setDraft`, `patchDraft`, `resetDraft`; preserves the draft while `keyOf(committed)` is `Object.is`-equal and rebuilds when it changes | what counts as identity (filter vs view fields), when to commit |
| `useListFilterDraft({ search, partition, scope?, keywords, initialKeywordField, localDefaults? })` | resolved search, declared filter/view partition, optional caller scope, neutral keywords, optional local-only defaults | one identity for filter/period/keyword drafts, filter projection, `prepareSubmit`, `resetDrafts` | partition and scope meaning, keyword mapping, validation, submit/reset destination, page policy, Query |
| `usePeriodDraft({ committed: { startDateTime?, endDateTime? }, resetKey })` | committed UTC range | `preset`, browser-zone `range`, `utcRange`, `setPreset` (writes UTC day boundaries), `setRange` (nonempty draft → `CUSTOM`, empty → `ALL`), `reset` | period criterion, adopted presets, committed closed-range validation, validation copy |
| `useKeywordDraft<TField>({ committedItems, initialField, resetKey })` | committed `{ field, value }[]`, initial target | `items`, `pending`, `setPendingField/Value`, `addPending` (trims; empty is ignored), `removeAt`, `clear` (empties `items`, keeps `pending`), `reset` (rebuilds both from committed), `itemsIncludingPending` | target enum, server mapping, duplicate policy (unconfirmed product rule) |

`useListFilterDraft` composes the three primitives for every list filter in this repository (five consumers,
listed in [이 저장소의 관찰](#이-저장소의-관찰)). View-only changes preserve input; filter or `scope` changes
rebuild it. Explicit-search consumers pass their committed search discriminator as `scope`.
The caller may supply URL-resolved or host-local committed values; the hook does not select their owner.
Use the [Draft commit adoption criteria](../../feature-contract/references/list-workflow.md#draft-commit) for every host, not the names of these existing consumers.
`defineSearchFields` owns complete field declarations; a selected variant may project a subset.
Include every committed period/keyword field in the filter partition. Union-only fields are optional
in the projected type because they may not belong to the selected variant.

`prepareSubmit()` captures `{ filters, range, keywords }` (including trimmed pending keyword), then
resets only the period draft so an incomplete range cannot survive an unchanged canonical URL.
It does not validate, prevent a form event, navigate, or reset other drafts.
`resetDrafts()` rebuilds all inputs from current committed values; the caller separately commits its
reset destination. `localDefaults` cannot overlap search fields and is excluded from submitted filters.
Initial keyword field and local defaults are configuration; if their meaning changes dynamically,
the caller changes `scope`. Flows with different input lifecycles compose the primitives directly.

## Config (`shared/config/list.ts`)

`standardPageSizeOptions = [100, 200, 300, 400, 500, 700, 1000]` and `standardPeriodPresetValues` (8 presets, no `CUSTOM`) are provisional product presets observed on every list. A feature opts in explicitly and still owns its default and any exception; the config declares no default. Defaults are per-screen inventory facts (see [이 저장소의 관찰](#이-저장소의-관찰)).

`usePeriodPresets(values)` (`shared/i18n/use-period-presets.ts`) is the one place that joins adopted preset values to their shared translations and returns the `{ presets, customLabel }` pair `PeriodField` takes. It holds no default, selected value, range or request shape — only the value-to-label projection — and takes no default `values`, so the argument at the call site is the feature's opt-in rather than a transfer of period policy.

Adding a period preset *value* is not a config or hook change alone. `periodPresetRange` computes each range from the literal value, so a new preset means `PeriodPreset`, `periodPresetRange`, the `inferPeriodPreset` candidate list (all `datetime.ts`), the `shared:list.periodPresets` keys in three locales, and `standardPeriodPresetValues` change together. That is the transplant decision a new product makes once; it never grows a second hook.

Test the pure transformation or transition that changed; do not add a config value or helper without a consuming feature.

## 이 저장소의 관찰

규칙이 아니라 이 저장소 원장에서 읽은 값이다. 신규 프로젝트는 이 절을 비우고 자기 원장으로 다시 채운다.

- 인벤토리가 적은 기본값: 목록 100·전체, 발권 등록 화면 200, 통계 1개월 전, 로그 7일 전.
- 배열 codec 채택: 회원·기록·리허설 운영자 목록은 항목 단위 복구(`recoverArrayItems`), 공연·제품 운영자 목록은 배열 전체 복구(`recoverArray`).
- `useListFilterDraft` 소비자 다섯: 공연, 회원, 회원 기록, 제품 운영자, 리허설 운영자 필터.
- 채택 테스트를 가진 소비자: 회원 목록 변형들, 공연, 운영자, 기록 목록 다섯. `maskEmail`·`maskPhone` 과 `hasRepeatedOrSequentialAsciiTriplet` 은 회원·운영자 두 feature 가 공유하고, `useConfirmation` 은 일괄 액션에서 추출돼 회원·운영자 폼이 재사용한다.
