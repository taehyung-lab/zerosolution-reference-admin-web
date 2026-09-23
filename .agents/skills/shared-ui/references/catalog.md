# 공용 단위 목록 — 무엇을 받고, 무엇을 소유하며, 무엇을 소유하지 않는가

한 줄이 한 단위이고, 열은 **caller가 제공하는 의미 / 단위가 소유하는 것 / 소유하지 않는 것**이다.
바꾸려는 단위의 **그 행만** 읽는다. 이 목록은 손으로 쓴다 — 코드에서 생성할 수 있는 것은 export
목록이고, 여기 적힌 것은 **무엇을 의도적으로 거절하는가**라서 코드에 없다.

입력 열은 capability를 찾기 위한 대표 의미이지 닫힌 prop 목록이 아니다. 정확한 symbol·prop·타입은
현재 TypeScript export와 type test가 소유하며, 이 표와 다르면 코드를 따른다.

## Primitives

`shared/ui/primitives`. 접근성·토큰·Radix 배선만 소유한다. React 19 라 `ref` 는 일반 prop 이다.

| 단위 | caller 가 넘기는 것 | 소유 | 소유하지 않음 |
| --- | --- | --- | --- |
| `Button`, `Input`, `Checkbox`, `Table`/`TableHead`/`TableCell` | native props | 토큰. `Button` 은 `type="button"` 기본, `Checkbox` 는 `indeterminate` → `aria-checked="mixed"` | 값 정책. `thead/tbody/tr` 은 caller 가 쓴다 |
| `Select` | `value: string \| null`, `onValueChange(value \| null)`, `options`, `placeholder?`, `disabled?`, `id?`, `aria-label` 또는 `aria-labelledby`(둘 중 하나) | Radix 빈 문자열 매핑(caller 는 모른다), 키보드·focus | `searchable`·`multiple`·도메인 mode. 빈 문자열 옵션 값 |
| `Combobox` | `value: string \| null`, `onValueChange`, `options`, `searchValue`, `onSearchValueChange`, `placeholder`, `searchLabel`, `emptyLabel`, aria props | 열림 상태 하나, 로컬 라벨 필터, `Popover` 배선 | 원격 조회·pending·미해소 선택 라벨(첫 소비자가 정의) |
| `InlineSearchSelect` | `searchValue`, `value: string \| undefined`, `options`, `selectedLabel`, 라벨 | 로컬 매칭, 선택 후 입력 잠금·제거 | 팝업, 원격 조회, 도메인 mode |
| `MultiSelect` | `values: string[]`, `onValueChange`, `options`, `getRemoveLabel(option)`, aria props | 첫 라벨 + `+N` 트리거, 제거 가능한 토큰 | `options` 에 없는 값의 표시(유지되지만 안 보인다), 단일 선택 겸용 |
| `CheckboxTree` | `nodes`(leaf `{ value, label }` / branch `{ label, children }`), `values`(leaf 만), `onValueChange`, `ariaLabelledby`, `emptyMeansAll?` | 전체·부모 토글 대수, 부분 선택은 checked 로 표시, 전체 항목의 이름(`shared:checkboxTree.selectAll`) | enum 의미·선택지 출처·기본값. `FilterField group` 으로 감싸지 않는다(이름이 두 번 읽힌다) |
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
| `FormPermissionTreeField` | + `nodes`, `emptyMeansAll?` | `CheckboxTree` 를 group 으로 | 행 × 기능 matrix(feature 가 `Table` + `Checkbox` 로 조립) |
| `FormArrayField` | `form`, `name`, `minItems?`, render child | 배열 path 등록, `items`·`append`·`remove`·`move`·`canRemove` | row factory·stable id·row schema |
| `SortableList` | `items: stableIds`, `onMove(from, to)`, `getItemLabel`, children | dnd 센서·handle·접근성 안내 | 순서의 소유(Form 배열) |
| `FormSubmitButton` / `FormCancelButton` | `pending` / `onClick`, `disabled?`, children? | `shared:formAction.save/cancel` 기본 문구, cancel 은 `type="button"` | — |
| `FormSaveDialogs` / `FormSaveFailureMessage` | `stage`, `pending`, `onConfirm/onCancel/onAcknowledge` / `failure` | 저장 확인·완료 쌍의 `shared:formSave.*` 문구, root 실패 한 줄 | 어떤 mutation, 목적지 |
| `useSaveForm` | `schema`, `defaultValues`, `resetKey?`, `sections`, `blurValidator?`(값 → 필드별 문구. 제출 전에도 알려야 하는 교차 필드 불일치 하나), `save: { run, isPending, getDefaultValues? }`, `mapError`, `onDone` | 폼 인스턴스, 저장 단계, 잘못된 제출 reveal·focus, `onServer` 배치·정리, 기준선 갱신, dirty guard, `dialogs` 노드 | schema·mutation·오류 분류·목적지([form](../../form-contract/SKILL.md#저장-lifecycle)) |
| `UnsavedChangesProvider` / `useUnsavedChangesGuard({ when, refuseSilently? })` | dirty·pending 사실 | 앱의 Router blocker 하나와 `beforeunload`, `{ dialog, leave(navigate), close(discard, { when? }) }`, 취소 문구와 이동 문구의 구분 | 값·목적지, 보호 대상 범위(원장) |

## Filter

`shared/ui/filter`. 한 이름 아래 형제 컨트롤은 `FilterField group` 하나이고 자식 라벨은 낱말 그대로다.

| 단위 | caller 가 넘기는 것 | 소유 | 소유하지 않음 |
| --- | --- | --- | --- |
| `FilterPanel` | `onSubmit(event)`, `onReset`, children | `form` 이름·접기/펼치기 이름·검색/초기화 버튼 문구(`shared:filter.*`), 접기 disclosure, 필드·액션 배치 | 커밋 목적지(caller 의 submit/reset), 안에 놓이는 필드 |
| `FilterField` | `label`, `group?`, `children: ({ labelId, controlId }) => node` | `controlId` 를 읽으면 `<label htmlFor>`, 안 읽으면 `<span id>`; `group` 은 `role="group"` | 컨트롤 상태 |
| `PeriodFilterField` | `label`(행 이름 — 화면마다 다를 수 있다), `criterion?: FilterSelectSlot`, + `PeriodField` props | 기준 select + 기간 필드 한 group, 기준 select 의 접근 이름(`shared:filter.period.criterion`) | 기준 enum·옵션 라벨·기본값·preset 정책 |
| `KeywordFilterField` | `label`, `field?: FilterSelectSlot`, + `KeywordChipField` props | 대상 select + chip 필드 한 group, 대상 select 의 접근 이름(`shared:filter.keyword.field`) | 대상 enum·옵션 라벨·검증 |
| `FilterSelectSlot<TValue>` | `value`, `options`, `onValueChange` | controlled 문자열 표면 | enum 해석·기본값·자기 접근 이름(감싸는 composite 가 준다) |
| `PeriodField` | `preset`, `presets`, `customLabel`, `onPresetChange`, `range: { from?, to? }`, `onRangeChange` | preset 라디오 + 달력 둘. 반대쪽 bound 를 `min/max` 로. 시작일·종료일·달력 열기·preset 그룹의 접근 이름(`shared:filter.period.*`) | `CUSTOM` 전이(`usePeriodDraft`), 검증 문구(없다 — 역전은 canonical 이 지운다) |
| `KeywordChipField` | `items`, `pendingValue`, `onPendingValueChange`, `onAdd`, `onRemoveAt`, `formatItem(item)` | chip 렌더, 입력·추가·`{{value}} 삭제` 의 접근 이름(`shared:filter.keyword.*`) | `"대상 : 값"` 포맷(caller 의 `formatItem`) |

## List

`shared/ui/list`.

| 단위 | caller 가 넘기는 것 | 소유 | 소유하지 않음 |
| --- | --- | --- | --- |
| `DataTable` | `rows`, `columns: ColumnDef[]`(`meta.sort?: { direction?, onSort }`), `getRowId`, `onRowActivate?` | native table, `meta.sort` 헤더 버튼·`aria-sort`·glyph(활성 컬럼 하나만), 행 활성화(pointer·Enter·Space, interactive child 제외) | 선택·편집·확장·페이지·정렬 정책·문구·Table 인스턴스 노출 |
| `selectionColumn({ selection, pageLabel, rowLabel, isSelectable? })` | `PageRowSelection`, 라벨 | 헤더·행 체크박스 렌더 | 선택 상태(`usePageRowSelection`) |
| `ListResult` | `data: ListResultData<TRow, TSearched>`(rows·searched·isPending·isFetching·isError·trace·retry), `copy: ListResultCopy<TSearched>` — `searched` 가 리터럴 `true` 인 즉시 조회 목록은 `{ empty }` 만, gated 목록(`boolean`)은 `{ notSearched, empty }` 필수, `footer?`, children | `notSearched → loading → error → empty → ready` 판정, 공용 로딩·오류·재시도·`ErrorTrace`, `aria-busy`. 도달 불가 상태의 문구를 caller 에게 요구하지 않는다(타입이 잡는다) | Query 읽기, total, 페이지 계산 |
| `PagedListResult` | `data`, `total`, `view: ListViewControls<TView>`, `columns`, `getRowId`, `onRowActivate?`, `actions?: ReactNode`, `copy: ListResultCopy<TSearched>`, `pageSizeOptions`, `sortOptions: { value: TView['sortType'], label }[]` | 결과 영역의 순서 하나: `ResultTotal → ResultToolbar(왼쪽 PageSizeControl·SortControl 은 `data.searched` 일 때만, 오른쪽 actions) → ListResult(footer Pagination) → DataTable`. 자기 컨트롤의 제품 공통 라벨(`shared:list.pageSize`·`list.sort`·`list.pagination.*`) | 조회·URL 전이·선택 상태·컬럼·정렬 옵션 라벨·notSearched/empty 문장·actions 내용·행 활성화 목적지·PageHeader·Filters. 순서·노출 mode 를 받지 않는다 — 다른 배치가 필요한 화면은 아래 단위를 직접 조립한다 |
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

## Hooks

`shared/hooks`. 렌더하지 않고 상태 수명·전이를 소유한다. 정책 값(`standardPageSizeOptions`·`standardPeriodPresetValues`)은 `shared/lib/list-options` 에 있고 아래 표에 함께 적는다.

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
| `descendingRowNumber({ page, pageSize }, total, index)` (`list-view.ts`) | → `total − (page − 1) × pageSize − index`. 1페이지 첫 행이 결과 건수, 페이지를 넘겨도 이어진다(LIST-ROW-NUMBER) | `No.` 컬럼을 가진 목록의 셀. 컬럼을 둘지는 화면 fact 가 정한다 |
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
| `cn(...)` | class 병합 | primitive |

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
