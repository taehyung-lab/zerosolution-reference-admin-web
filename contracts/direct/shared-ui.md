# 역할 계약 — 공용 UI

**답하는 질문**: `src/shared` 와 `src/api` 가 지금 내보내는 공용 단위가 무엇을 받고, 무엇을 소유하며,
무엇을 **의도적으로 소유하지 않는가.**

**담지 않는 것**: 화면에서 어떤 단위를 언제 조립하는가 — `contracts/direct/list.md`·`detail.md`·`form.md`
가 소유한다. 제품 값 — fact 다.

한 줄이 한 단위이고, 열은 **caller 가 넘기는 것 / 단위가 소유하는 것 / 소유하지 않는 것**이다.
표에 없는 prop·mode·callback 을 한 호출자 때문에 더하지 않는다 — 그 판단은 [공용 단위의 승격](../contract/source-structure.md#공용-단위의-승격) 이 소유한다.

공통 규칙: shared 는 도메인·Router·Query·endpoint·permission·workflow 를 모른다(ESLint 가 본다).
primitive 만 Radix 를 import 한다. 문구는 props 로 받고, `shared` namespace 는 그 단위의 상호작용
계약에 속한 제품 공통 문구(오류·재시도·저장 확인·알림 제목)만 읽는다. 값을 해석하는 곳은 caller 다.

공통 규칙: shared 는 도메인·Router·Query·endpoint·permission·workflow 를 모른다(ESLint). primitive 만 Radix 를 import 한다. 문구는 props 로 받고, `shared` namespace 는 그 단위의 상호작용 계약에 속한 제품 공통 문구(오류·재시도·저장 확인·알림 제목)만 읽는다. 값을 해석하는 곳은 caller 다.

## Primitives

`shared/ui/primitives`. 접근성·토큰·Radix 배선만 소유한다. React 19 라 `ref` 는 일반 prop 이다.

| 단위 | caller 가 넘기는 것 | 소유 | 소유하지 않음 |
| --- | --- | --- | --- |
| `Button`, `Input`, `Checkbox`, `Table`/`TableHead`/`TableCell` | native props | 토큰. `Button` 은 `type="button"` 기본, `Checkbox` 는 `indeterminate` → `aria-checked="mixed"` | 값 정책. `thead/tbody/tr` 은 caller 가 쓴다 |
| `Select` | `value: string \| null`, `onValueChange(value \| null)`, `options`, `placeholder?`, `disabled?`, `id?`, `aria-label` 또는 `aria-labelledby`(둘 중 하나) | Radix 빈 문자열 매핑(caller 는 모른다), 키보드·focus | `searchable`·`multiple`·도메인 mode. 빈 문자열 옵션 값 |
| `Combobox` | `value: string \| null`, `onValueChange`, `options`, `searchValue`, `onSearchValueChange`, `placeholder`, `searchLabel`, `emptyLabel`, aria props | 열림 상태 하나, 로컬 라벨 필터, `Popover` 배선 | 원격 조회·pending·미해소 선택 라벨(첫 소비자가 정의) |
| `InlineSearchSelect` | `searchValue`, `value: string \| undefined`, `options`, `selectedLabel`, 라벨 | 로컬 매칭, 선택 후 입력 잠금·제거 | 팝업, 원격 조회, 도메인 mode |
| `MultiSelect` | `values: string[]`, `onValueChange`, `options`, `getRemoveLabel(option)`, aria props | 첫 라벨 + `+N` 트리거, 제거 가능한 토큰 | `options` 에 없는 값의 표시(유지되지만 안 보인다), 단일 선택 겸용 |
| `CheckboxTree` | `nodes`(leaf `{ value, label }` / branch `{ label, children }`), `values`(leaf 만), `onValueChange`, `selectAllLabel`, `ariaLabelledby`, `emptyMeansAll?` | 전체·부모 토글 대수, 부분 선택은 checked 로 표시 | enum 의미·선택지 출처·기본값. `FilterField group` 으로 감싸지 않는다(이름이 두 번 읽힌다) |
| `RadioGroup`/`RadioGroupItem` | `value`, `onValueChange`, `label` **또는** `ariaLabelledby`, item `value`+children | `fieldset`, 내부 `name`, 화살표 이동 | `''` 는 아무것도 checked 아님(폼이 `required` 로 검증) |
| `Calendar` | `value?: 'YYYY-MM-DD'`, `min?`, `max?`, `onValueChange(value \| undefined)`, `ariaLabelledby`, aria props | `role="group"` 컨테이너, 표시 locale·탐색 라벨(`shared` namespace 예외) | `label` prop, `Date` 객체 |
| `FileInput` | native props + `onFileChange(File \| undefined)` | 선택 하나 | `multiple`, controlled `value` |
| `Dialog` | `open`, `onOpenChange`, `title`, `description?`, `closeLabel?`, children | focus trap, 열기 전 focus 복원, ×·Escape·바깥 → 같은 닫기 요청 | 닫기 확인 여부(feature 의 guard) |
| `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` | `value`, `onValueChange`, item `value`, `forceMount?` | tab·tabpanel 연결, roving focus. 비활성 내용은 unmount 기본 | 선택 값의 소유(로컬 상태), 라벨 |
| `Tooltip` | `content`, trigger child | hover·focus·Escape | 문구 |
| `Badge` | `tone`, children | 토큰 | 상태 → tone 매핑(feature 의 exhaustive map) |
| `BlockingProgress` | `open`, `message`, children | inert 덮개, 진행 announcement. app shell 만 mount 한다 | 무엇이 blocking 인가(`query-meta`) |
| `ModalCover` | children | 전체 화면 modal 표면(inert, dialog 위) | 문구, 열 이유 |
| `Accordion`, `Popover` | — | `SectionCard` / `Combobox`·`PeriodField` 를 통해서만 소비 | feature 직접 사용 |

## Form

`shared/ui/form`. TanStack Form 어댑터다. schema·기본값·선택지·mapper·목적지는 caller 다.

| 단위 | caller 가 넘기는 것 | 소유 | 소유하지 않음 |
| --- | --- | --- | --- |
| `FormField` | `form`, typed `name`, `label`, `required?`, `description?`, `labelTarget: 'control' \| 'group'`, render child | `form.Field` 등록, 첫 오류 문구, `control.id`·`aria-describedby`·`aria-invalid`, `onServer` 렌더 | 검증 규칙 |
| `formFieldControlId(form, name)` | form, name | 동시 폼에서 유일한 control id | — |
| `FormTextField` | + `type?`, `placeholder?`, `autoComplete?` / 읽기 전용 `{ readOnly, label, value }` | `Input`. 읽기 전용은 텍스트만 그리고 등록하지 않는다 | — |
| `FormSelectField` | + `options`, `placeholder`, `state?`/`onRetry?`, `onValueChange?(value)`, `disabled?` | `Select`, `'' ↔ null`, `state` 가 있으면 `AsyncFieldBoundary` 로 대체, `aria-labelledby` 로 이름 | 선택지 query |
| `FormComboboxField` | + `options`, `searchValue`, `onSearchValueChange`, 라벨들 | `Combobox`, `'' ↔ null` | 원격 검색 |
| `FormMultiSelectField` | + `options`, `getRemoveLabel` | `MultiSelect`, 값 `string[]` | — |
| `FormCheckboxField` | + `disabled?` | `Checkbox`, 값 `boolean` | — |
| `FormRadioGroupField` | + `options` | `RadioGroup`, `labelId` 로 이름 | — |
| `FormDateField` / `FormDateRangeField` | + `min?`, `max?` (range: `fromLabel`, `toLabel`) | `Calendar` 를 `labelTarget="group"` 으로, range 는 `{ from, to }` 문자열 둘과 반대쪽 bound | 기간 의미·검증 문구 |
| `FormFileField` | + `selectLabel`, `removeLabel`, `accept?` | 값 `{ kind: 'empty' \| 'existing' \| 'selected' \| 'removed' }`, `FileInput` + 제거 버튼 | 업로드 transport |
| `FormPermissionTreeField` | + `nodes`, `selectAllLabel`, `emptyMeansAll?` | `CheckboxTree` 를 group 으로 | 행 × 기능 matrix(feature 가 `Table` + `Checkbox` 로 조립) |
| `FormArrayField` | `form`, `name`, `minItems?`, render child | 배열 path 등록, `items`·`append`·`remove`·`move`·`canRemove` | row factory·stable id·row schema |
| `SortableList` | `items: stableIds`, `onMove(from, to)`, `getItemLabel`, children | dnd 센서·handle·접근성 안내 | 순서의 소유(Form 배열) |
| `FormSubmitButton` / `FormCancelButton` | `pending` / `onClick`, `disabled?`, children? | `shared:formAction.save/cancel` 기본 문구, cancel 은 `type="button"` | — |
| `FormSaveDialogs` / `FormSaveFailureMessage` | `stage`, `pending`, `onConfirm/onCancel/onAcknowledge` / `failure` | 저장 확인·완료 쌍의 `shared:formSave.*` 문구, root 실패 한 줄 | 어떤 mutation, 목적지 |
| `useSaveForm` | `schema`, `defaultValues`, `resetKey?`, `sections`, `save: { run, isPending, getDefaultValues? }`, `mapError`, `onDone` | 폼 인스턴스, 저장 단계, 잘못된 제출 reveal·focus, `onServer` 배치·정리, 기준선 갱신, dirty guard, `dialogs` 노드 | schema·mutation·오류 분류·목적지([form](form.md#저장-lifecycle)) |
| `UnsavedChangesProvider` / `useUnsavedChangesGuard({ when, refuseSilently? })` | dirty·pending 사실 | 앱의 Router blocker 하나와 `beforeunload`, `{ dialog, leave(navigate), close(discard, { when? }) }`, 취소 문구와 이동 문구의 구분 | 값·목적지, 보호 대상 범위(원장) |

## Filter

`shared/ui/filter`. 한 이름 아래 형제 컨트롤은 `FilterField group` 하나이고 자식 라벨은 낱말 그대로다.

| 단위 | caller 가 넘기는 것 | 소유 | 소유하지 않음 |
| --- | --- | --- | --- |
| `FilterPanel` | `title`, `collapseLabel`, `expandLabel`, `submitLabel`, `resetLabel`, `onSubmit(event)`, `onReset`, children | `form` 이름, 접기 disclosure, 필드·액션 배치 | 커밋 목적지(caller 의 submit/reset) |
| `FilterField` | `label`, `group?`, `children: ({ labelId, controlId }) => node` | `controlId` 를 읽으면 `<label htmlFor>`, 안 읽으면 `<span id>`; `group` 은 `role="group"` | 컨트롤 상태 |
| `PeriodFilterField` | `label`, `criterion?: FilterSelectSlot`, + `PeriodField` props | 기준 select + 기간 필드 한 group | 기준 enum·기본값·preset 정책 |
| `KeywordFilterField` | `label`, `field?: FilterSelectSlot`, + `KeywordChipField` props | 대상 select + chip 필드 한 group | 대상 enum·검증 |
| `FilterSelectSlot<TValue>` | `label`, `value`, `options`, `onValueChange` | controlled 문자열 표면(`aria-label` 로 자기 이름) | enum 해석·기본값 |
| `PeriodField` | `preset`, `presets`, `customLabel`, `onPresetChange`, `range: { from?, to? }`, `onRangeChange`, `fromLabel`, `toLabel`, `calendarLabel`, `presetGroupLabel?` | preset 라디오 + 달력 둘. 반대쪽 bound 를 `min/max` 로 | `CUSTOM` 전이(`usePeriodDraft`), 검증 문구(없다 — 역전은 canonical 이 지운다) |
| `KeywordChipField` | `items`, `pendingValue`, `onPendingValueChange`, `onAdd`, `onRemoveAt`, `addLabel`, `removeLabel(item)`, `inputLabel`, `formatItem(item)` | chip 렌더 | `"대상 : 값"` 포맷(caller 의 `formatItem`) |

## List

`shared/ui/list`.

| 단위 | caller 가 넘기는 것 | 소유 | 소유하지 않음 |
| --- | --- | --- | --- |
| `DataTable` | `rows`, `columns: ColumnDef[]`(`meta.sort?: { direction?, onSort }`), `getRowId`, `onRowActivate?` | native table, `meta.sort` 헤더 버튼·`aria-sort`·glyph(활성 컬럼 하나만), 행 활성화(pointer·Enter·Space, interactive child 제외) | 선택·편집·확장·페이지·정렬 정책·문구·Table 인스턴스 노출 |
| `selectionColumn({ selection, pageLabel, rowLabel, isSelectable? })` | `PageRowSelection`, 라벨 | 헤더·행 체크박스 렌더 | 선택 상태(`usePageRowSelection`) |
| `ListResult` | `data: ListResultData<TRow>`(rows·searched·isPending·isFetching·isError·trace·retry), `copy: { notSearched, empty }`, `footer?`, children | `notSearched → loading → error → empty → ready` 판정, 공용 로딩·오류·재시도·`ErrorTrace`, `aria-busy` | Query 읽기, total, 페이지 계산 |
| `ResultToolbar` | `left?`, `right?` | 두 slot | 무엇이 들어가고 언제 보이는가 |
| `ResultTotal` | `searched`, `total` | `shared:list.total`, 숫자 포맷, 검색 전 부재 / 0 표시 | 위치 |
| `ResultSummary` | `groups: { key, items: { key, text }[] }[]` | 완성 문장의 리스트 | 문장 |
| `Pagination` | `page`, `totalPages`, `onPageChange`, `ariaLabel`, `previousLabel`, `nextLabel` | 창(window)·anchor·`aria-current`(raw page 만), `totalPages <= 1` 이면 없음 | URL, 범위 이탈 복구 정책 |
| `PageSizeControl` / `SortControl` | `label`, `value`, `options`, `onValueChange` | controlled select. `SortControl` 은 정렬 **필드**만 | 방향(컬럼 헤더 정책) |

## Detail

`shared/ui/detail`, `shared/ui/layout`.

| 단위 | caller 가 넘기는 것 | 소유 | 소유하지 않음 |
| --- | --- | --- | --- |
| `PageHeader` | `title`, `breadcrumbs?: string[]`, `tooltip?: { content, label }`, `actions?` | 구분자, 마지막 항목 `aria-current="page"`, 안내 아이콘, `h1` 한 줄, 우측 액션 slot | 어떤 액션·권한·pending·이동 |
| `SectionCard` | `title`, `actions?`, `collapsible?`(기본 true), `defaultOpen?`, `open?/onOpenChange?`, `keepMounted?`, `errorCount?` | 헤더 버튼(`aria-expanded`·`aria-controls`), 닫힘 unmount(기본) / `keepMounted` 는 `hidden`, 오류 수 badge(`shared:formSection.errors`) | 어떤 필드가 어느 섹션인가, 초기 열림 |
| `DetailField` | `label`, children | `dt`/`dd` 한 쌍 | 감싸는 `dl` grid, 빈 값 `-`, 포맷, 마스킹 |
| `DetailStateBoundary` | `query: { data, state: 'ready' \| 'error' \| 'notFound', error, retry }`, `children: (data) => node` | error(`role="alert"`, 재시도, trace)·notFound 문구, ready 에서 `children(data)`, 데이터 없는 ready 는 null | 상태 판정(`useDetailQuery`), 진입 실패(route loader) |
| `UpdateHistory` | `entries: { id, date, lines: string[], actor }[]`, `labels: { date, change, actor }`, `emptyText` | 3열 `Table`, 줄마다 `<li>`, 빈 문구 | 서버 로그 → 줄 mapper(feature 순수 함수), 정렬·페이지 |
| `EmptyState` | children | 테두리 박스 | role(호스트가 `alert`/`status` 를 붙인다) |

## Dialog

`shared/ui/dialog`.

| 단위 | caller 가 넘기는 것 | 소유 | 소유하지 않음 |
| --- | --- | --- | --- |
| `ConfirmDialog` | `open`, `onOpenChange`, `title`, `description?`, `confirmLabel`, `cancelLabel`, `onConfirm`, `pending?`, children? | pending 동안 두 버튼 disable 과 닫기 무시 | 문구(보통 `title` 은 `shared:alert.title`), mutation |
| `AlertDialog` | `open`, `onOpenChange`, `title`, `description?`, `acknowledgeLabel`, `onAcknowledge?` | 버튼 하나로 닫힘 | pending |
| `useConfirmation<TValues>({ run, description, confirmLabel? })` | `run(values)`(promise), 문구(값에 따라 함수 가능) | `request(values)` → 열림 → 확정 → `run` → 닫힘, pending guard, `run` 거부 시 실패 한 줄과 열린 채 재시도·취소, `dialog` 노드 | 어떤 값·무슨 요청·성공 뒤 이동 |
| `SelectionAlert({ controller })` | `useSelectionGate` 결과 | 거절 문구의 alert 하나(`shared:alert.title`, `bulkAction.acknowledge`) | 무엇이 거절인가 |

전역 imperative confirm 서비스, router 타입 props, CRUD 문구, dialog 안의 mutation·오류 처리는 만들지 않는다.

**`dialog`·`dialogs` 노드를 돌려주는 훅은 명시적 예외다.** `useConfirmation`·`useSaveForm`·`useUnsavedChangesGuard` 만 해당하며, 이유는 열림 상태와 그 상태를 그리는 표면이 갈라지면 한쪽만 살아남기 때문이다(guard 가 이동을 막는데 질문이 렌더되지 않으면 사용자가 화면에 갇힌다). 조건은 셋이다: 노드가 반환값의 이름 있는 필드여서 **호출자가 어디에 그릴지 고른다**, 그 훅이 소유한 lifecycle 하나만 그린다, 도메인 문구·mutation·이동을 모른다. 이 셋을 만족하지 않는 훅이 JSX 를 돌려주면 그것이 금지하는 "숨은 JSX" 다 — 렌더 위치를 훅이 정하거나, 화면 조각을 훅이 조립하거나, 반환 JSX 가 도메인을 알면 컴포넌트로 되돌린다.

## Feedback

`shared/ui/feedback` 와 incident 표면.

| 단위 | caller 가 넘기는 것 | 소유 | 소유하지 않음 |
| --- | --- | --- | --- |
| `AsyncFieldBoundary` | `state: 'loading' \| 'error' \| 'ready'`, `labelledBy`, `onRetry`, children | loading `role="status"`, error `role="alert"` + 재시도 버튼, ready 는 children | state 판정(캐시가 있으면 ready), 선택지 query |
| `ErrorTrace({ value: { requestId?, status?, kind? } })` | `ApiError` 가 구조적으로 만족 | `shared` 의 다섯 라벨, 셋 다 없으면 없음 | raw message |
| `IncidentBoundary`(`src/app`) | — | `forbidden` 의 유일한 표면(`AccessDeniedPage` modal cover). `origin: 'route-loader'` 로 재발행된 incident, 관찰 중인 query 의 거절, 모든 mutation 거절에서만 덮는다. 확인 → 뒤로 / 홈 | 세션 타이머(미구현, 제품이 정한다) |
| `resolveErrorOutcome(context, kind)`(`src/api/error-outcome.ts`) | 요청 자리와 kind | `'none' \| 'feature' \| 'incident' \| 'root'`. `pre-auth` 는 feature, `route-loader` 의 401/403 은 incident, `prefetch`+`forbidden` 은 none. `isFeatureError(error)` 가 inline 표시의 guard | 표시 자체 |

## Model

`shared/model`. 렌더하지 않고 상태 수명·전이·허용 값을 소유한다.

| 단위 | caller 가 넘기는 것 | 소유 | 소유하지 않음 |
| --- | --- | --- | --- |
| `useListFilterDraft({ search, partition, scope?, keywords, initialKeywordField, localDefaults? })` | 해소된 검색, filter/view 선언, 초안 정체성 scope | `draft`·`patchDraft`·`period`·`keyword`, `prepareSubmit()`(입력 수집 후 기간만 reset), `resetDrafts()` | 필드 의미·기본값·검증·커밋 목적지·페이지 정책 |
| `useDraftCommit({ committed, keyOf, createDraft })` | 확정값, 정체성 함수, 초안 factory | 정체성이 같으면 보존, 바뀌면 재생성; `patchDraft`, `resetDraft` | 무엇이 정체성인가 |
| `usePeriodDraft({ committed, resetKey })` | UTC range | `preset`, 브라우저 zone `range`, `utcRange`, `setPreset`(하루 양끝 → UTC), `setRange`(비어 있지 않으면 CUSTOM), `reset` | 기준 enum, 채택 preset, 검증 |
| `useKeywordDraft({ committedItems, initialField, resetKey })` | `{ field, value }[]`, 초기 대상 | `items`, `pending`, `addPending`(trim, 빈 값 무시), `removeAt`, `clear`, `reset`, `itemsIncludingPending` | 대상 enum, 중복 정책 |
| `usePageRowSelection({ rows, getId, isSelectable?, resetKey })` | 현재 페이지 행, id 함수, 정체성 키 | 현재 페이지 선택 가능 행만; `resetKey` 가 바뀌면 해제, 같은 키 refetch 는 남은 선택 가능 id 만 유지; `isChecked`·`isAllChecked`·`isMixed`·`toggleRow`·`togglePage`·`clear` | 무엇이 선택 가능인가, payload |
| `useSelectionGate(selectedCount)` | 선택 수 | `requireSelection(message)`·`reject(message)` → `false`, `message`, `close` | 문구, 규칙 |
| `useFormSections(sections, { invalidFields })` | 섹션 → 필드, 오류 필드 | `sectionProps(section)` → `{ open, onOpenChange, keepMounted: true, errorCount }`, `revealInvalid(fields)` → 첫 오류 필드 | focus(`useSaveForm`) |
| `standardPageSizeOptions`, `standardPeriodPresetValues` (`list-options.ts`) | — | **이 제품이 고른 선택지 집합의 한 자리.** 값 자체는 제품 정책이라 이관 대상이 아니며 대상 제품이 자기 값으로 교체한다 | 어떤 값을 채택할지, 기본값, 예외 |
| `usePeriodPresets(values)` (`shared/i18n`) | 채택할 preset 값 | `{ presets, customLabel }`(`shared:list.periodPresets`) | 기본 선택, 다른 문구(화면 namespace) |

## Lib

`shared/lib`. 상태도 렌더도 없는 결정적 계산. `React` import 와 hook export 는 lint 가 막는다.

| 단위 | 입력 → 출력 | 쓰는 곳 |
| --- | --- | --- |
| `listViewControls({ search, totalPages, commit })` (`list-view.ts`) | → `{ pageSize, sort: { value, direction, onValueChange, onHeaderSort }, pagination }`. 보기·정렬 키 변경은 1페이지, 페이지 이동은 나머지 보존, 활성 헤더 클릭만 방향 뒤집기 | 모든 목록 결과 훅. 순수 전이 `changePageSize`·`changeSort`·`toggleHeaderSort`·`goToPage` 도 export |
| `headerSortDirection({ type, direction }, key)` (`list-sort.ts`) | 활성 키면 `'ascending' \| 'descending'`, 아니면 `undefined`. `direction` 은 필수 | 컬럼 `meta.sort.direction` 의 유일한 출처 |
| `defineSearchFields(fields)` / `defineGatedSearchFields(fields)` (`search-fields.ts`) | `{ schema, defaultValue, kind }` 선언 → `{ schema, defaults, partition, resolve, canonical }`. gated 는 `searched` 표식을 붙이고 `searched: false` 커밋을 `{}` 로 | 목록 URL 선언 |
| `optionalInstant`, `optionalPositiveInteger`, `recoverArray(item)`, `recoverArrayItems(item)` (`search-codecs.ts`) | 불량 값 → `undefined` / 항목 제거 | 필드 schema |
| `resolveSearchDefaults`, `omitSearchDefaults`, `normalizeClosedInstantRange`, `canonicalizeRouteSearch`, `nonEmptyArray`, `toTotalPages` (`search.ts`) | 기본값 해소 / 기본값·빈 배열 생략 / 반쪽·역전 기간 제거 / route guard 용 `{ search, changed }` / 빈 배열 → `undefined` / `max(1, ceil)` | `defineSearchFields` 내부, 요청 mapper, `canonicalSearchGuard` |
| `compactSearchValues`, `filterPartitionKey`, `filterPartitionValues` | top-level `undefined`·빈 배열 제거 / filter 필드만의 정체성·값 | 초안 mechanic 내부 |
| `formatDate`, `displayTimeZone`, `utcDayBoundary`, `periodPresetRange`… (`datetime.ts`) | ADR 0003. 표시는 브라우저 zone, 요청은 UTC | 셀 포맷, 기간 초안 |
| `formatCount(locale, n)` (`format.ts`) | `Intl.NumberFormat` | 건수 |
| `maskEmail`, `maskPhone` (`mask-contact.ts`) | 문자열 → 마스킹 문자열 | 상세 표시(권한·해제는 caller) |
| `hasRepeatedOrSequentialAsciiTriplet` (`ascii-triplet.ts`) | 문자열 → boolean | 비밀번호 schema 의 한 조건 |
| `errorMessageKey(kind)`, `errorTraceOf(error)` (`error-copy.ts`) | kind → `shared` 키 / unknown → `ErrorTraceValue` | 공용 오류 문구 |
| `toSelectOption({ id, name })`, `cn(...)` | `{ value, label }` / class 병합 | 선택지 매핑, primitive |

## API

`src/api`. transport 위, feature 아래의 공용 계약.

| 단위 | caller 가 넘기는 것 | 소유 | 소유하지 않음 |
| --- | --- | --- | --- |
| `useListQuery({ options, searched, select })` (`list-query.ts`) | `queryOptions`, 검색 여부, 응답 → `{ rows, total }` | `enabled = searched`, `keepPreviousData`, 진입 fetch 만 `blockingProgress` 나머지 `contentProgress`, 빈 페이지 = 결과, incident 실패 제외 → `ListQueryResult` | options, 무엇이 searched 인가 |
| `useDetailQuery(options)` / `resolveRequiredQueryOutcome(facts)` (`required-query.ts`) | `queryOptions` | `incident → not-found → 캐시 데이터 → pending → 로컬 오류` 우선순위, `{ data, state, error, retry }` | 문구, 재시도 표면 |
| `classifyFormError(error, fields)` (`form-error.ts`) | 거부, 필드 순서 | `{ fields, root?: 'general' \| 'validation' \| 'connection' } \| undefined`(incident·취소는 `undefined`) | 표시 |
| `scenarioRequest<TInput, TResult>(label)` (`scenario.ts`) | 업무 이름 | 미연결 mutation 의 `mutationFn`: `[시나리오] <label>: 요청 입력 확인 → API 연결 대기` 한 줄 로그 후 resolve. 입력을 로그에 싣지 않는다 | 성공·실패 응답 만들기 |
| `blockingProgress`, `contentProgress`, `inlineProgress` (`query-meta.ts`) | — | `meta.progress` 어휘, `meta.invalidates` 타입 | 어느 query 가 어느 progress 인가 |
| `loadRequired(queryClient, options, { preload })` (`src/app/router/required-loader.ts`) | 상세 options | not-found → Router `notFound({ data: { kind: 'record' } })`, forbidden → incident 재발행(preload 제외), 그 외 rethrow | 화면 |

## Primitive 내부와 렌더 성능

Read this file only for a shadcn-style copied component, Radix primitive, Tailwind token/variant, focus, keyboard behavior, primitive accessibility, or React rendering/compiler questions. The public contract of each primitive is a row in [catalog.md](shared-ui.md#primitives).

- `shared/ui/primitives` owns Radix/native wiring, focus, keyboard, ARIA semantics, Tailwind tokens, and visual variants.
- Only primitives import Radix directly. A shadcn-style copied component is source-owned project code, not an external black box. Implementation choices per primitive are recorded in [ADR 0008](../../docs/decisions/0008-primitive-implementation-selection.md); the public contract does not change when the implementation does.
- Add only the primitive and variants the current screen uses; do not install or prebuild a component catalog. An accessibility or design-token invariant justifies a source-owned primitive at first real use; it does not justify a shared workflow or page pattern.
- A primitive receives visible content, controlled values, and callbacks. It knows no feature, server DTO, Query, Router, permission, or mutation. Copy arrives as props; `Calendar` alone reads the `shared` namespace for its navigation labels and locale.
- Keep the public contract domain-neutral and preserve native semantics instead of recreating them with generic elements.
- React 19: a primitive receives `ref` as an ordinary prop; do not add `forwardRef` wrappers.

## Native passthrough primitives

`Button`, `Input`, `Checkbox`, and `Table`/`TableHead`/`TableCell` forward native props and add tokens only. They interpret no value: `Button` defaults to `type="button"`; `Input` has no value/default/empty policy; `Checkbox` is a native checkbox plus an `indeterminate` prop that renders `aria-checked="mixed"`; the table primitives provide `table`/`th`/`td` styling while the caller writes `thead`/`tbody`/`tr`. Name a native control with `<label htmlFor>` or `aria-label`, not both.

`Popover` takes `trigger` (a button element that accepts a ref), `children`, and `contentLabel`; it owns outside-click dismissal and focus return to the trigger. Open state is uncontrolled by default; a consumer that must render the same state elsewhere (`Combobox` and its trigger `aria-expanded`) passes `open`/`onOpenChange` so there is exactly one owner. `Combobox` and the `PeriodField` calendar consume it; a feature does not compose `Popover` directly for a new surface.

Which primitive a feature may use directly: `Button`, `Input`, `Checkbox`, `Badge`, `Table*`, `Select`, `Combobox`, `InlineSearchSelect`, `MultiSelect`, `RadioGroup`, `Calendar`, `FileInput`, `Dialog`, `Tabs*`, `Tooltip`. Consumed only through a pattern: `Accordion` (→ `SectionCard`), `Popover` (→ `Combobox`, `PeriodField`), `BlockingProgress` and `ModalCover` (→ app shell and incident boundary).

## Selection controls — which one

- Few options, all visible, inline with a leading "전체": `CheckboxTree`.
- Many options, searched, or shown as removable tokens: `MultiSelect`.
- Mutually exclusive choices all visible (period presets, a recipient-type choice): `RadioGroup`. More than a handful, or a dropdown in the design: `Select`.
- Searchable single selection over a reference entity: `Combobox` (local options) or `InlineSearchSelect` (inline candidates). Remote search with pending/error, an unresolved selected label, and custom entry are unimplemented candidates that the first such consumer defines rather than widening these contracts silently.
- Rows × function columns with per-column select-all: a feature composition of `Table` + `Checkbox`; `CheckboxTree` supplies only the row-hierarchy algebra.

Unconfirmed until a consumer asks: partial selection rendered as `aria-checked="mixed"`, the closed-section disclosure glyph, a sibling-trigger arrow order across several `Accordion` items.

## Controlled tabs

`Tabs`, `TabsList`, `TabsTrigger(value)`, `TabsContent(value)` wrap Radix Tabs: Radix owns tab/tabpanel linkage and roving keyboard focus; the wrappers add tokens. The feature owns the selected value, labels, initial value and whether it belongs in local state or URL; a locale tab is not a UI-locale switch. Inactive content unmounts by default; a caller requiring retained panels passes `forceMount` and the panel stays hidden. Tests that click a tab use `mouseDown` (Radix activates on pointer down).

## React Compiler and rendering

React Compiler is on for the React 19 app and the official hooks/compiler lint rules stay active. Do not add `memo`, `useMemo`, or `useCallback` by habit. Manual identity stabilization is justified only when the compiler skips the component or file, an external API requires a stable reference, code must run outside the compiled boundary, or profiling demonstrates a material regression. Keep exhaustive dependencies correct for every remaining hook; the compiler does not repair stale dependency arrays.

TanStack Table v9 names: `useTable` (v8 `useReactTable`), `tableFeatures` for feature slots, `table.FlexRender`. The shared `DataTable` calls `useTable` internally and owns the `features`/`TFeatures` contract; do not wrap it in project hooks such as `useListTable` or return the Table instance to feature code. A nested component that reads changing table state adds the narrowest `Subscribe` boundary or receives the value as a prop; do not subscribe every row. Virtualization is opt-in after row volume and profiling justify it.

Derive values during render; use effects only for external synchronization. Subscribe to the smallest Query/store/Table state the rendered output needs. Import modules directly instead of broad barrels. Lazy-load heavy editors or charts only with bundle evidence. Next.js, RSC, and Server Actions are not part of this Vite SPA. A profiling-based exception records the interaction, before/after trace, and retained identity requirement in the change report.

Test the interaction actually changed: accessible name/description, keyboard operation, focus entry/restoration, disabled state, controlled value, and relevant visual variants.

## i18n

Read this file only for translation namespaces, adding a key, product-generic copy ownership, or locale parity.

- Locales are `ko`, `en`, `ja` with equal key sets; `pnpm i18n:check` fails on any missing key. The initial locale is `ko` and fallback is disabled (`fallbackLng: false`); a missing key throws in every environment (`missingKeyHandler`) instead of rendering the key path, so parity is the only safety net.
- `src/shared/i18n/locale.ts` is the single runtime-independent source for `UI_LOCALES`, `UiLocale`, and `DEFAULT_UI_LOCALE`. `LocaleProvider` owns the current value and i18n/transport synchronization. Components use `useLocale().locale`; route loaders use the typed Router `context.locale`. Do not cast `i18n.language`, put the i18n instance in Router context, or derive timezone from locale.
- Namespaces: `shared` (product-generic copy that belongs to a shared pattern's interaction contract — `error.*`, `list.total`, `list.periodPresets`, `formSave.*`, `formCancel.*`, `unsavedChanges.*`, `alert.title`, `progress.*`), `app` (app shell and bootstrap/route copy — `shell.*`, `bootstrap.*`; read by `src/app/shell/**` and `src/routes/**` only), `auth` (login feature), and one namespace per feature (`<feature>`). A shared component reads only `shared`; a feature reads its own namespace and `shared`; nothing under `src/shared` reads `app`.
- Registration: `src/shared/i18n/i18n.ts` creates the instance and registers only `shared`. `src/app/i18n/resources.ts` (`registerAppI18nResources`) adds `app`, `auth`, and feature bundles (`src/features/<domain>/i18n/locales/<locale>/<domain>.json`) with `addResourceBundle`; `LocaleProvider` calls it for the app and `src/test/setup.ts` calls it once for every test, so `TestLocaleProvider` and direct `i18n` imports in tests receive the same namespaces. Each namespace resource lives with its owner: `shared` under `src/shared/i18n/locales/{locale}/shared.json`, `app` under `src/app/i18n/locales`, and every feature namespace under `src/features/<domain>/i18n/locales`. `pnpm i18n:check` discovers every `i18n/locales` root under `src` and fails both on key parity and on a namespace stored outside its owner.
- A key moves to `shared` only when the same sentence is confirmed across screens and a shared pattern renders it ([공용 단위의 승격](../contract/source-structure.md#공용-단위의-승격)). Domain meaning — status names, column labels, empty/not-searched sentences — stays in the feature namespace.
- `usePeriodPresetLabels()` returns one label per declared preset value plus `CUSTOM`, from `shared:list.periodPresets`. Which values exist is product config, not a shared contract. A caller adopting shared preset wording passes the values it adopts to `usePeriodPresets(values)` (same file) and gets the `{ presets, customLabel }` pair `PeriodField` takes — the argument is the opt-in, so there is no default and a subset needs no extra machinery. Different **wording** for the same values is not a parameter: that sentence is domain meaning, so the screen owns the keys in its own namespace and composes the list itself. `CUSTOM` never joins the options either way. Adding a period *value* is not a hook change at all: `PeriodPreset`, `periodPresetRange`, the `inferPeriodPreset` candidates (`datetime.ts`), the `shared:list.periodPresets` keys in three locales, and `standardPeriodPresetValues` change together (아래 [Model](#model)).
- Server response locale is sent from the UI locale by the transport; server-side locale coverage is whatever the contract snapshot declares.
- Whether a sentence may exist at all — its trigger and the form the product states it in — belongs to [제품 사실 정책](../../product/policies/evidence.md#화면에-문장을-더하려면-원문이-그-문장을-말해야-한다), not here. This file owns shape: locales, namespaces, registration, promotion. Equal key sets across `ko`/`en`/`ja` never establish that the product says it.
- Copy in code is a lint error (`local/no-user-facing-literal`); placeholders, aria labels, and dialog text all go through `t`.

Test that a new key exists in all three locale files and that the component reads the namespace it is allowed to.
- Product-generic copy confirmed across several screens keeps one translation per locale across every feature namespace that carries it. A feature namespace does not drift from a sibling's translation without a recorded decision; moving such a key to `shared:` goes through [공용 단위의 승격](../contract/source-structure.md#공용-단위의-승격).

## 공용 UI 를 바꿀 때의 경계

## Read only what applies

| Request | Read |
| --- | --- |
| What a shared unit takes, owns, and refuses — any `shared/ui`, `shared/model`, `shared/lib`, or `src/api` unit by name | the unit's row in [catalog.md](#primitives) (`Primitives`, `Form`, `Filter`, `List`, `Detail`, `Dialog`, `Feedback`, `Model`, `Lib`, `API`) |
| Promoting, confirming, narrowing, demoting, or deleting a shared unit; a caller that needs a new prop | [공용 단위의 승격](../contract/source-structure.md#공용-단위의-승격) |
| Radix/Tailwind primitive internals, focus, keyboard, tokens, which selection control, React Compiler, TanStack Table v9 | [primitive 내부와 렌더 성능](#primitive-내부와-렌더-성능) |
| Translation namespaces, adding a key, product-generic copy, locale parity | [i18n](#i18n) |
| How a screen composes these units | [`list.md`](list.md) · [`detail.md`](detail.md) · [`form.md`](form.md) |
| Server state, keys, mutations | [`api-wire.md`](../contract/api-wire.md) · [`server-state.md`](../contract/server-state.md) |

File creation, relocation and feature-local reuse placement follow [`source-structure.md`](../contract/source-structure.md). This skill owns whether a contract is domain-free enough to be shared.

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
