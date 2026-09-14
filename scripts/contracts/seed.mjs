import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { PRODUCT_POINTER, productPaths } from './product-paths.mjs'

const location = (file, heading, marker) => ({ file, heading, marker })

/**
 * 사람은 채택 후보의 public 진입점, 그 진입점의 export 이름, 규범 문장, 결정 행, focused test와 소유권만 선언한다.
 * 실제 반출 파일은 이 진입점들의 local import closure를 매번 계산해 얻는다.
 * code root는 bundle 하나가 소유한다. focused test는 증거이므로 여러 bundle이 같은 파일을 가리킬 수 있다.
 * 설정·게이트·harness처럼 채택 후보가 아닌 이관 재료는 아래 TRANSPLANT_MANIFEST가 따로 소유한다.
 */
export const SEED_BUNDLES = [
  {
    id: 'ascii-triplet',
    code: ['src/shared/lib/ascii-triplet.ts'],
    skills: [location('.agents/skills/shared-ui-contract/references/shared-values.md', 'Pure utilities (`shared/lib`)', '`hasRepeatedOrSequentialAsciiTriplet')],
    adrs: [location('docs/decisions/0009-shared-boundaries.md', '단위별 단계와 소비자', '`hasRepeatedOrSequentialAsciiTriplet')],
    tests: ['src/shared/lib/ascii-triplet.test.ts'],
    ownership: { shared: 'Detects case-insensitive repeated or sequential ASCII letter/digit triplets.', feature: 'Owns password length, character classes, schema, copy, and server checks.' },
  },
  {
    id: 'confirmation',
    code: ['src/shared/lib/use-confirmation.ts', 'src/shared/ui/patterns/BulkActionDialogs.tsx'],
    skills: [location('.agents/skills/shared-ui-contract/references/shared-values.md', 'State mechanics (`shared/lib`)', '`useConfirmation')],
    adrs: [location('docs/decisions/0009-shared-boundaries.md', '단위별 단계와 소비자', '`useConfirmation')],
    tests: ['src/shared/ui/patterns/BulkActionDialogs.test.tsx'],
    ownership: { shared: 'Holds opaque confirmation values, invokes run after confirm, and renders selection rejection/confirmation surfaces; no form or API knowledge.', feature: 'Owns validation, copy, selection, callbacks, and all success/failure behavior.' },
  },
  {
    id: 'contact-masking',
    code: ['src/shared/lib/mask-contact.ts'],
    skills: [location('.agents/skills/shared-ui-contract/references/shared-values.md', 'Pure utilities (`shared/lib`)', '`maskEmail')],
    adrs: [location('docs/decisions/0009-shared-boundaries.md', '단위별 단계와 소비자', '`maskEmail')],
    tests: ['src/shared/lib/mask-contact.test.ts'],
    ownership: { shared: 'Applies the currently shared string-only contact masking algorithm.', feature: 'Owns raw data, permission, disclosure, and adoption of product masking rules.' },
  },
  {
    id: 'list-result',
    examples: [{
      files: ['src/features/performances/screens/list/ui/PerformanceListResult.tsx'],
      useWhen: 'Compare a feature composing result facts, empty/not-searched copy, pagination and table slots.',
      doNotCopy: 'Performance toolbar visibility, columns, translated messages or navigation. This is a composition example, not evidence of real-server recovery.',
    }],
    code: [
      'src/shared/ui/patterns/ListResult.tsx',
      'src/shared/ui/patterns/ResultToolbar.tsx',
      'src/shared/ui/patterns/ResultSummary.tsx',
      'src/shared/ui/patterns/ResultTotal.tsx',
    ],
    skills: [location(
      '.agents/skills/feature-contract/references/list-workflow.md',
      'Result ownership',
      '`ListResult` receives `ListResultData<TRow>`',
    )],
    adrs: [location(
      'docs/decisions/0009-shared-boundaries.md',
      '현재 provisional 계약',
      '`ListResult`는 `notSearched | loading | error | empty | ready`',
    )],
    tests: [
      'src/shared/ui/patterns/list-patterns.test.tsx',
      'src/shared/ui/patterns/ListResult.test-d.ts',
      'src/shared/ui/patterns/ResultTotal.test.tsx',
    ],
    ownership: {
      shared: 'Receives plain list facts, resolves the five-state result, and owns shared error, retry, live region, and trace presentation.',
      feature: 'Owns Query interpretation, plain facts, two domain messages, structural trace mapping, rows, and footer policy.',
    },
  },
  {
    id: 'detail-state-boundary',
    code: ['src/shared/ui/patterns/DetailStateBoundary.tsx'],
    skills: [location(
      '.agents/skills/feature-contract/references/detail-workflow.md',
      'Detail state',
      '`DetailStateBoundary`',
    )],
    adrs: [location(
      'docs/decisions/0011-detail-data-and-update-history-boundaries.md',
      'API 호출 계층 (조회·목록·mutation 공통)',
      '`DetailStateBoundary` 는 `ready | error | notFound` 렌더',
    )],
    tests: ['src/shared/ui/patterns/DetailStateBoundary.test.tsx'],
    ownership: {
      shared: 'Renders ready, error, and notFound with live error, retry, and trace slots.',
      feature: 'Owns which query runs, safe copy, retry behavior, and detail content; the state decision comes from api/useDetailQuery.',
    },
  },
  {
    id: 'detail-query',
    code: ['src/api/required-query.ts'],
    skills: [location(
      '.agents/skills/feature-contract/references/detail-workflow.md',
      'Detail state',
      '`useDetailQuery(options)`',
    )],
    adrs: [location(
      'docs/decisions/0011-detail-data-and-update-history-boundaries.md',
      'API 호출 계층 (조회·목록·mutation 공통)',
      '`resolveRequiredQueryOutcome(facts)`',
    )],
    tests: ['src/api/required-query.test.tsx'],
    ownership: {
      shared: 'API owns the required-query outcome priority (incident, not-found, cached data, pending, error) and its projection to the three detail states.',
      feature: 'Owns the queryOptions factory and API-only execution in api; screen workflow owns business state and follow-up effects. The screen owns safe copy, retry, and content.',
    },
  },
  {
    id: 'update-history',
    code: ['src/shared/ui/patterns/UpdateHistory.tsx'],
    skills: [location(
      '.agents/skills/shared-ui-contract/references/page-and-detail-surfaces.md',
      'Page and detail surfaces',
      '`UpdateHistory`',
    )],
    adrs: [location(
      'docs/decisions/0011-detail-data-and-update-history-boundaries.md',
      '업데이트 이력 — 2층',
      '`UpdateHistory`',
    )],
    tests: ['src/shared/ui/patterns/UpdateHistory.test.tsx'],
    ownership: {
      shared: 'Renders the three-column history table with one semantic line per change and the empty text.',
      feature: 'Owns the pure mapper from server change logs to localized safe lines: field labels, value formatting, redaction, unsupported/unknown copy, section title.',
    },
  },
  {
    id: 'blocking-progress',
    code: ['src/shared/ui/primitives/BlockingProgress.tsx', 'src/api/query-meta.ts'],
    skills: [location(
      '.agents/skills/shared-ui-contract/references/blocking-progress.md',
      'Blocking progress',
      '`BlockingProgress` is the sole confirmed app-wide loading surface',
    )],
    adrs: [location(
      'docs/decisions/0010-form-boundaries.md',
      '전역 진행 상태',
      '`AppShell`이 `useIsMutating()`',
    )],
    tests: ['src/app/shell/AppShell.test.tsx'],
    ownership: {
      shared: 'Owns the inert blocking surface, accessible progress presentation, and the query progress meta vocabulary (blocking | content | inline).',
      feature: 'AppShell derives explicit blocking screen-entry and mutation facts; mounted content and option queries stay local.',
    },
  },
  {
    id: 'form-sections-and-adapters',
    examples: [{
      files: [
        'src/features/managers/screens/form/ui/ManagerCreateScreen.tsx',
        'src/features/managers/screens/form/ui/ManagerForm.tsx',
      ],
      useWhen: 'Compare feature-owned schema, mutation and error mapping passed to useSaveForm, then form fields, dialogs and cancellation bound to that same save lifecycle.',
      doNotCopy: 'Rehearsal Manager fields, defaults, dependent options, request DTOs, route destinations or the optional internal options Query. Recheck the target product save policy.',
    }],
    code: [
      'src/shared/ui/form/useFormSections.ts',
      'src/shared/ui/form/FormField.tsx',
      'src/shared/ui/form/FormTextField.tsx',
      'src/shared/ui/form/FormSelectField.tsx',
      'src/shared/ui/form/FormMultiSelectField.tsx',
      'src/shared/ui/form/FormComboboxField.tsx',
      'src/shared/ui/form/FormCheckboxField.tsx',
      'src/shared/ui/form/FormRadioGroupField.tsx',
      'src/shared/ui/form/FormDateField.tsx',
      'src/shared/ui/form/FormDateRangeField.tsx',
      'src/shared/ui/form/FormPermissionTreeField.tsx',
      'src/shared/ui/form/FormFileField.tsx',
      'src/shared/ui/form/FormArrayField.tsx',
      'src/shared/ui/form/FormSubmitButton.tsx',
      'src/shared/ui/form/FormCancelButton.tsx',
      'src/shared/ui/form/UnsavedChangesGuard.tsx',
      'src/shared/ui/form/useSaveForm.tsx',
      'src/shared/ui/patterns/SortableList.tsx',
    ],
    skills: [
      location(
        '.agents/skills/feature-contract/references/form-workflow.md',
        'Sections and error visibility',
        'writes `fieldMeta.errorMap.onServer`',
      ),
      location(
        '.agents/skills/shared-ui-contract/references/form-fields.md',
        'Layer contract',
        'approved adapter vocabulary',
      ),
    ],
    adrs: [
      location(
        'docs/decisions/0010-form-boundaries.md',
        '소유권 경계',
        'TanStack 어댑터의 `form` + typed `name`',
      ),
      location(
        'docs/decisions/0010-form-boundaries.md',
        '저장 오케스트레이션과 서버 오류의 거처 (2026-09-03 개정)',
        'reveal → 첫 rejected field focus',
      ),
    ],
    tests: [
      'src/shared/ui/form/useFormSections.test.tsx',
      'src/shared/ui/form/useSaveForm.test.tsx',
      'src/shared/ui/form/FormField.test.tsx',
      'src/shared/ui/form/FormAdapters.test.tsx',
      'src/shared/ui/form/FormTextField.test.tsx',
      'src/shared/ui/form/FormSelectField.test.tsx',
      'src/shared/ui/form/FormDateRangeField.test.tsx',
      'src/shared/ui/form/FormFileField.test.tsx',
      'src/shared/ui/form/FormArrayField.test.tsx',
      'src/shared/ui/form/FormActionButtons.test.tsx',
      'src/shared/ui/form/UnsavedChangesGuard.test.tsx',
      'src/shared/ui/form/UnsavedChangesGuard.integration.test.tsx',
      'src/shared/ui/form/UnsavedChangesGuard.router.test.tsx',
      'src/shared/ui/patterns/SortableList.test.tsx',
      'src/shared/ui/patterns/dialogs.test.tsx',
    ],
    ownership: {
      shared: 'Owns typed field association, server-error placement and rendering, section disclosure, focus-target mechanics, and the save stage/guard lifecycle (useSaveForm).',
      feature: 'Owns schema, defaults, field order and section mapping, the ApiError classification link (classifyFormError), the mutation, destinations, and copy.',
    },
  },
  {
    id: 'draft-commit',
    examples: [{
      files: [
        'src/features/members/screens/list/model/useMemberListFilter.ts',
        'src/features/performances/screens/list/model/usePerformanceListFilter.ts',
      ],
      useWhen: 'Compare filter, period and keyword drafts that share a commit identity; callers collect input through prepareSubmit and retain URL transitions.',
      doNotCopy: 'Member explicit-search and performance immediate-search/reset policies, keyword fields or venueKeyword. Use individual primitives when input lifecycles differ.',
    }],
    code: ['src/shared/lib/use-draft-commit.ts', 'src/shared/lib/use-list-filter-draft.ts'],
    skills: [location(
      '.agents/skills/shared-ui-contract/references/logic-promotion.md',
      'Shared logic admission',
      'draft preservation while a caller identity is equal',
    ), location(
      '.agents/skills/shared-ui-contract/references/shared-values.md',
      'State mechanics (`shared/lib`)',
      '`useListFilterDraft` composes',
    )],
    adrs: [location(
      'docs/decisions/0009-shared-boundaries.md',
      '현재 provisional 계약',
      '`useDraftCommit`',
    ), location(
      'docs/decisions/0012-list-filter-draft-composition.md',
      '초안 조합 결정',
      '`useListFilterDraft`를 **provisional shared**로 채택한다',
    )],
    tests: ['src/shared/lib/use-draft-commit.test.tsx', 'src/shared/lib/use-list-filter-draft.test.tsx'],
    ownership: {
      shared: 'Owns preserve, rebuild, reset, and patch mechanics; composes declared filter identity, period and keyword drafts and input collection.',
      feature: 'Owns identity policy, field declarations, defaults, validation, keyword mapping, submit/reset destinations, navigation, and page policy.',
    },
  },
  {
    id: 'period-draft',
    code: ['src/shared/lib/use-period-draft.ts'],
    skills: [location(
      '.agents/skills/shared-ui-contract/references/logic-promotion.md',
      'Shared logic admission',
      'period preset/custom transitions',
    )],
    adrs: [location(
      'docs/decisions/0009-shared-boundaries.md',
      '현재 provisional 계약',
      '`usePeriodDraft`',
    )],
    tests: ['src/shared/lib/use-period-draft.test.tsx'],
    ownership: {
      shared: 'Owns preset/custom draft transitions and conversion from explicit timezone inputs.',
      feature: 'Owns period meaning, adopted presets, validation copy, provider use, and request boundaries.',
    },
  },
  {
    id: 'search-partition',
    code: ['src/shared/lib/search-partition.ts', 'src/shared/lib/search-fields.ts', 'src/shared/lib/search-codecs.ts', 'src/shared/lib/search.ts'],
    skills: [location(
      '.agents/skills/shared-ui-contract/references/shared-values.md',
      'Pure utilities (`shared/lib`)',
      'filterPartitionKey',
    ), location(
      '.agents/skills/shared-ui-contract/references/shared-values.md',
      'Search field declarations and codecs',
      'defineSearchFields',
    ), location(
      '.agents/skills/feature-contract/references/list-search-contract.md',
      'Search 계약과 기본값 작성',
      'defineSearchFields',
    )],
    adrs: [location(
      'docs/decisions/0009-shared-boundaries.md',
      '현재 provisional 계약',
      'filter/view partition',
    )],
    tests: ['src/shared/lib/search-partition.test.ts', 'src/shared/lib/search-fields.test.ts', 'src/shared/lib/search-codecs.test.ts', 'src/shared/lib/search.test.ts'],
    ownership: {
      shared: 'Derives schema/defaults/partition from caller fields, supplies domain-neutral recovery codecs, and projects filter-only draft identity/values.',
      feature: 'Owns which field is a filter and which is a view, the search shape itself, and the submit and URL transition.',
    },
  },
  {
    id: 'list-query',
    code: ['src/api/list-query.ts'],
    skills: [location(
      '.agents/skills/api-contract/references/query-cache.md',
      '서버 연결 전후의 책임',
      '`useListQuery`',
    )],
    adrs: [location(
      'docs/decisions/0009-shared-boundaries.md',
      '현재 provisional 계약',
      '`api/list-query.ts` (`useListQuery`)',
    )],
    tests: ['src/api/list-query.test.tsx'],
    ownership: {
      shared: 'API owns the three list-only facts: an empty page is a result, only the entry fetch may open the blocking surface, an incident failure is not the list error, and the committed rows stay while the next view loads.',
      feature: 'Owns the queryOptions, what counts as searched, and the response-to-rows/total projection.',
    },
  },
  {
    id: 'list-config',
    // The standard-preset assembly hook is an i18n entrypoint a renderer never imports, so the
    // import closure cannot reach it from `filter-surface`. Declaring it here keeps it exportable.
    code: [
      'src/shared/config/list.ts',
      'src/shared/i18n/use-period-presets.ts',
    ],
    skills: [location(
      '.agents/skills/shared-ui-contract/references/shared-values.md',
      'Config (`shared/config/list.ts`)',
      'standardPageSizeOptions',
    )],
    adrs: [location(
      'docs/decisions/0009-shared-boundaries.md',
      '현재 provisional 계약',
      '`standardPageSizeOptions`, `standardPeriodPresetValues`',
    )],
    tests: [
      'src/shared/config/list.test.ts',
      'src/shared/i18n/use-period-presets.test.tsx',
    ],
    ownership: {
      shared: 'Owns the observed standard page-size choices and period preset values as named presets, declares no default, and projects the standard period values onto their shared translations.',
      feature: 'Opts in explicitly — calling the standard hook is that opt-in — and owns its own default and every exception.',
    },
  },
  {
    id: 'keyword-draft',
    code: ['src/shared/lib/use-keyword-draft.ts'],
    skills: [location(
      '.agents/skills/shared-ui-contract/references/logic-promotion.md',
      'Shared logic admission',
      'pending keyword add/remove/trim behavior',
    )],
    adrs: [location(
      'docs/decisions/0009-shared-boundaries.md',
      '현재 provisional 계약',
      '`useKeywordDraft`',
    )],
    tests: ['src/shared/lib/use-keyword-draft.test.tsx'],
    ownership: {
      shared: 'Owns pending keyword add, remove, and trim mechanics.',
      feature: 'Owns keyword enum and field meaning, limits, URL state, and request mapping.',
    },
  },
  {
    id: 'transport-auth',
    code: [
      'src/api/error.ts',
      'src/api/error-outcome.ts',
      'src/api/http/client.ts',
      'src/api/http/credential.ts',
      'src/api/http/mutator.ts',
    ],
    skills: [
      location(
        '.agents/skills/api-contract/references/transport.md',
        'Envelope and errors',
        '`ApiError.kind` is the closed 12-kind taxonomy',
      ),
      location(
        '.agents/skills/api-contract/references/auth-session.md',
        'Auth transport and session incidents',
        "HTTP 401 runs the contract's reissue endpoint once",
      ),
    ],
    adrs: [location(
      'docs/decisions/0006-auth-token-storage.md',
      '결정',
      '`refreshPromise`',
    )],
    tests: [
      'src/api/error-outcome.test.ts',
      'src/api/http/credential.test.ts',
      'src/api/http/transport.test.ts',
    ],
    ownership: {
      shared: 'API owns the 12-kind error shape, four placement outcomes, safe diagnostics, token storage, reissue, and retry limits.',
      feature: 'App/feature context owns token-reader registration, incident UI, safe copy, recovery, and operation outcome.',
    },
  },
  {
    id: 'filter-surface',
    code: [
      'src/shared/ui/patterns/FilterPanel.tsx',
      'src/shared/ui/patterns/FilterField.tsx',
      'src/shared/ui/patterns/PeriodFilterField.tsx',
      'src/shared/ui/patterns/KeywordFilterField.tsx',
      'src/shared/ui/patterns/AsyncFieldBoundary.tsx',
    ],
    skills: [location(
      '.agents/skills/shared-ui-contract/references/filter-fields.md',
      'Composition',
      '`FilterPanel`',
    )],
    adrs: [location(
      'docs/decisions/0009-shared-boundaries.md',
      '현재 provisional 계약',
      '`FilterPanel`, `FilterField`, `AsyncFieldBoundary`',
    )],
    tests: [
      'src/shared/ui/patterns/list-patterns.test.tsx',
      'src/shared/ui/patterns/AsyncFieldBoundary.test.tsx',
    ],
    ownership: {
      shared: 'Owns the filter frame disclosure, label/control association, the optional select-plus-field row composition, and generic async field states.',
      feature: 'Owns criterion/target enums, defaults, labels, preset policy, validation, draft commit, and the option query.',
    },
  },
  {
    id: 'inline-search-select',
    code: ['src/shared/ui/primitives/InlineSearchSelect.tsx'],
    skills: [location(
      '.agents/skills/shared-ui-contract/references/combobox.md',
      'Inline single selection',
      '`InlineSearchSelect` is the provisional',
    )],
    adrs: [location(
      'docs/decisions/0009-shared-boundaries.md',
      '검토한 대안',
      '`InlineSearchSelect`를 provisional primitive로 분리했다',
    )],
    tests: ['src/shared/ui/primitives/InlineSearchSelect.test.tsx'],
    ownership: {
      shared: 'Owns local option matching, single selection, search clearing and the remove-before-reselect input state.',
      feature: 'Owns options and selected labels, remote loading/failure, product eligibility, filter/form commit and reset.',
    },
  },
  {
    id: 'data-table',
    examples: [{
      files: [
        'src/features/performances/screens/list/ui/PerformanceListResult.tsx',
        'src/features/performances/screens/list/ui/performance-columns.tsx',
        'src/features/performances/screens/list/ui/usePerformanceListResult.ts',
      ],
      useWhen: 'Trace stable row IDs and controlled meta.sort from feature columns through a URL transition callback to DataTable rendering.',
      doNotCopy: 'Performance fields, sort keys, direction defaults, row numbers or destinations. This example has no selection column or bulk workflow.',
    }],
    code: ['src/shared/ui/patterns/DataTable.tsx', 'src/shared/ui/patterns/selection-column.tsx'],
    skills: [location(
      '.agents/skills/shared-ui-contract/references/data-table.md',
      'Public contract',
      '`meta.sort`',
    ), location('.agents/skills/shared-ui-contract/references/data-table.md', 'Selection column', '`selectionColumn')],
    adrs: [location(
      'docs/decisions/0009-shared-boundaries.md',
      '현재 provisional 계약',
      '`DataTable`, `Pagination`, `PageSizeControl`, `SortControl`',
    )],
    tests: ['src/shared/ui/patterns/DataTable.test.tsx', 'src/shared/ui/patterns/selection-column.test.tsx'],
    ownership: {
      shared: 'Owns native table semantics, stable row identity, and the controlled sort header (button, aria-sort, glyph) from meta.sort.',
      feature: 'Owns which columns sort, direction transitions, server sort keys, URL, Query, selection, and empty/error copy.',
    },
  },
  {
    id: 'table-navigation',
    code: [
      'src/shared/ui/patterns/Pagination.tsx',
      'src/shared/ui/patterns/PageSizeControl.tsx',
      'src/shared/ui/patterns/SortControl.tsx',
    ],
    skills: [location(
      '.agents/skills/shared-ui-contract/references/pagination.md',
      'Pagination rendering',
      '`Pagination({ page, totalPages, onPageChange',
    )],
    adrs: [location(
      'docs/decisions/0009-shared-boundaries.md',
      '현재 provisional 계약',
      '`DataTable`, `Pagination`, `PageSizeControl`, `SortControl`',
    )],
    tests: ['src/shared/ui/patterns/list-patterns.test.tsx'],
    ownership: {
      shared: 'Owns controlled page window rendering, accessible current page, boundary buttons, and the controlled page-size/sort-field selects.',
      feature: 'Owns URL page state, default page size, out-of-range canonicalization, sort field vocabulary, and route navigation.',
    },
  },
  {
    id: 'page-header',
    code: ['src/shared/ui/patterns/PageHeader.tsx'],
    skills: [location(
      '.agents/skills/shared-ui-contract/references/page-and-detail-surfaces.md',
      'Page and detail surfaces',
      '`PageHeader`',
    )],
    adrs: [location(
      'docs/decisions/0011-detail-data-and-update-history-boundaries.md',
      '상세 표면 — provisional',
      '`PageHeader`',
    )],
    tests: ['src/shared/ui/patterns/PageHeader.test.tsx'],
    ownership: {
      shared: 'Owns the single h1 header row with optional breadcrumb and an end-aligned actions slot.',
      feature: 'Owns which actions exist, their permission and pending state, and navigation.',
    },
  },
  {
    id: 'section-card',
    code: ['src/shared/ui/patterns/SectionCard.tsx'],
    skills: [location(
      '.agents/skills/shared-ui-contract/references/disclosure-sections.md',
      'Which surface',
      '`SectionCard`',
    )],
    adrs: [location(
      'docs/decisions/0011-detail-data-and-update-history-boundaries.md',
      '상세 표면 — provisional',
      '`SectionCard`',
    )],
    tests: ['src/shared/ui/patterns/detail-patterns.test.tsx'],
    ownership: {
      shared: 'Owns the titled disclosure block: header button with aria-expanded/aria-controls, controlled/uncontrolled open, keepMounted, and the error-count badge.',
      feature: 'Owns section titles, which fields belong to which section, initial open policy, and header actions.',
    },
  },
  {
    id: 'detail-field',
    code: ['src/shared/ui/patterns/DetailField.tsx'],
    skills: [location(
      '.agents/skills/shared-ui-contract/references/page-and-detail-surfaces.md',
      'Page and detail surfaces',
      '`DetailField`',
    )],
    adrs: [location(
      'docs/decisions/0011-detail-data-and-update-history-boundaries.md',
      '상세 표면 — provisional',
      '`DetailField`',
    )],
    tests: ['src/shared/ui/patterns/detail-patterns.test.tsx'],
    ownership: {
      shared: 'Owns one dt/dd pair.',
      feature: 'Owns the enclosing dl grid, empty-value copy, formatting, masking, and interactive values.',
    },
  },
]

/**
 * code root 가 내보내는 이름. 집합이 바뀌면 이 표와 함께 고친다. 소비자가 그 이름을 호출하는지는 보지 않는다.
 * 해시는 읽히지 않으므로 이름을 적는다.
 */
export const SEED_BUNDLE_EXPORTS = {
  'ascii-triplet': ['hasRepeatedOrSequentialAsciiTriplet'],
  confirmation: ['BulkActionDialogs', 'SelectionAlert', 'useConfirmation', 'useSelectionGate'],
  'contact-masking': ['maskEmail', 'maskPhone'],
  'list-result': ['ListResult', 'ListResultCopy', 'ListResultData', 'ListResultState', 'ResultSummary', 'ResultSummaryGroup', 'ResultSummaryItem', 'ResultToolbar', 'ResultTotal'],
  'detail-state-boundary': ['DetailStateBoundary'],
  'detail-query': ['DetailQueryResult', 'DetailState', 'RequiredQueryFacts', 'RequiredQueryOutcome', 'resolveRequiredQueryOutcome', 'toDetailState', 'useDetailQuery'],
  'update-history': ['UpdateHistory', 'UpdateHistoryEntry'],
  'blocking-progress': ['ApiQueryMeta', 'BlockingProgress', 'QueryProgress', 'blockingProgress', 'contentProgress', 'inlineProgress'],
  'form-sections-and-adapters': ['FieldControlProps', 'FieldForm', 'FormArrayField', 'FormArrayFieldApi', 'FormCancelButton', 'FormCheckboxField', 'FormComboboxField', 'FormDateField', 'FormDateRangeField', 'FormDateRangeValue', 'FormErrorOutcome', 'FormField', 'FormFileField', 'FormFileValue', 'FormMultiSelectField', 'FormPermissionTreeField', 'FormRadioGroupField', 'FormSelectField', 'FormSubmitButton', 'FormTextField', 'SaveStage', 'SortableItemId', 'SortableList', 'SortableListItemProps', 'UnsavedChangesProvider', 'formFieldControlId', 'useFormSections', 'useSaveForm', 'useUnsavedChangesGuard'],
  'draft-commit': ['useDraftCommit', 'useListFilterDraft'],
  'period-draft': ['DisplayDateRange', 'PeriodDraft', 'PeriodPreset', 'PeriodValue', 'UtcPeriodRange', 'createPeriodDraft', 'usePeriodDraft'],
  'search-partition': ['FilterFieldKeys', 'Resolved', 'SearchFieldKind', 'SearchFieldPartition', 'SearchParser', 'canonicalizeRouteSearch', 'defineSearchFields', 'filterPartitionKey', 'filterPartitionValues', 'nonEmptyArray', 'normalizeClosedInstantRange', 'omitSearchDefaults', 'optionalInstant', 'optionalPositiveInteger', 'recoverArray', 'recoverArrayItems', 'resolveSearchDefaults', 'toTotalPages'],
  'list-query': ['ListQueryResult', 'useListQuery'],
  'list-config': ['standardPageSizeOptions', 'standardPeriodPresetValues', 'usePeriodPresetLabels', 'usePeriodPresets'],
  'keyword-draft': ['KeywordDraft', 'KeywordFilterItem', 'createKeywordDraft', 'useKeywordDraft'],
  'transport-auth': ['ACCESS_TOKEN_STORAGE_KEY', 'ApiError', 'ApiErrorKind', 'ApiFieldError', 'ErrorOperationContext', 'ErrorOutcome', 'LOGIN_ID_STORAGE_KEY', 'UnwrapEnvelope', 'applyCredentialChangeFromStorage', 'clearAccessToken', 'client', 'customInstance', 'isFeatureError', 'isPreAuthPath', 'readAccessToken', 'readCredentialGeneration', 'readLoginId', 'readReissuedAccessToken', 'readResponseHeader', 'registerReissueTokenReader', 'resolveErrorOutcome', 'setAccessToken', 'setLoginId'],
  'filter-surface': ['AsyncFieldBoundary', 'AsyncFieldState', 'FilterField', 'FilterFieldIds', 'FilterPanel', 'KeywordFilterField', 'PeriodFilterField'],
  'inline-search-select': ['InlineSearchSelect'],
  'data-table': ['DataTable', 'DataTableColumnMeta', 'DataTableColumnSort', 'DataTableProps', 'DataTableSortDirection', 'selectionColumn'],
  'table-navigation': ['PageSizeControl', 'Pagination', 'SortControl'],
  'page-header': ['PageHeader'],
  'section-card': ['SectionCard'],
  'detail-field': ['DetailField'],
}

/**
 * code root 의 줄 시작 `export` 이름만. re-export 별칭의 바깥 이름. `export default X` 는 `X`(익명이면 `default`).
 * 읽지 않는 것: `export * from`(2026-09-11 실측 `src/shared`·`src/api` 에 0건), 그리고 이름이 같은 채로
 * 넓어진 props·인자 타입. 이름 집합이 같으면 drift 가 아니므로 optional prop 하나 늘리는 E6 는 리뷰가 본다.
 */
export function readExportedNames(source) {
  const names = new Set()
  for (const [, name] of source.matchAll(/^export default (?:(?:async )?function\*? |class )?(\w+)?/gm)) names.add(name ?? 'default')
  for (const [, name] of source.matchAll(/^export (?:async )?function (\w+)/gm)) names.add(name)
  for (const [, name] of source.matchAll(/^export (?:const|class|type|interface|enum) (\w+)/gm)) names.add(name)
  for (const [, body] of source.matchAll(/^export (?:type |async )?\{([^}]+)\}/gm)) {
    for (const part of body.split(',')) {
      const cleaned = part.replace(/\btype\b/g, ' ').trim()
      if (!cleaned) continue
      const bits = cleaned.split(/\s+as\s+/)
      const name = (bits[bits.length - 1] ?? '').replace(/\W.*$/, '').trim()
      if (name) names.add(name)
    }
  }
  return [...names].sort()
}

export function collectBundleExportNames(bundle, root = process.cwd(), read = (file) => readFileSync(resolve(root, file), 'utf8')) {
  const names = new Set()
  for (const file of bundle.code ?? []) {
    if (!existsSync(resolve(root, file))) continue
    for (const name of readExportedNames(read(file))) names.add(name)
  }
  return [...names].sort()
}

/** What the code roots export right now, per bundle — the review compares this, not the declaration table. */
export function currentBundleExportNames(root = process.cwd(), bundles = SEED_BUNDLES) {
  return Object.fromEntries(bundles.map((bundle) => [bundle.id, collectBundleExportNames(bundle, root)]))
}

/** 선언한 public API 집합과 code root 가 어긋나면 실패. 호출 그래프는 보지 않는다. */
export function findBundleExportDrift(bundles = SEED_BUNDLES, declared = SEED_BUNDLE_EXPORTS) {
  const failures = []
  const ids = new Set(bundles.map((bundle) => bundle.id))
  for (const bundle of bundles) {
    const listed = declared[bundle.id]
    if (!Array.isArray(listed) || listed.length === 0) {
      failures.push(`seed bundle ${bundle.id}: SEED_BUNDLE_EXPORTS 가 없다`)
      continue
    }
    if (new Set(listed).size !== listed.length) failures.push(`seed bundle ${bundle.id}: SEED_BUNDLE_EXPORTS 중복`)
    const actual = collectBundleExportNames(bundle)
    const declaredSet = new Set(listed)
    const actualSet = new Set(actual)
    const missing = actual.filter((name) => !declaredSet.has(name))
    const extra = listed.filter((name) => !actualSet.has(name))
    if (missing.length) failures.push(`seed bundle ${bundle.id}: 미선언 export ${missing.join(', ')} — SEED_BUNDLE_EXPORTS 를 갱신한다`)
    if (extra.length) failures.push(`seed bundle ${bundle.id}: 코드에 없는 export ${extra.join(', ')} — SEED_BUNDLE_EXPORTS 를 갱신한다`)
  }
  for (const id of Object.keys(declared).sort()) {
    if (!ids.has(id)) failures.push(`SEED_BUNDLE_EXPORTS 고아 id: ${id}`)
  }
  return failures.sort()
}

const SOURCE_EXTENSIONS = ['.ts', '.tsx']
const ASSET_EXTENSIONS = ['.json']

function isSourceFile(path) {
  return SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension))
}

function relativeToProject(path) {
  return relative(resolve('.'), resolve(path))
}

/** 다른 checkout(이관 source)을 root 로 읽을 때의 저장소 상대 경로. `relativeToProject` 는 map 콜백으로 쓰여 인자를 늘리지 않는다. */
function relativeToRoot(path, root) {
  return relative(resolve(root), resolve(root, path)).split('\\').join('/')
}

export function resolveLocalSpecifier(fromFile, specifier) {
  const base = specifier.startsWith('@/')
    ? resolve('src', specifier.slice(2))
    : specifier.startsWith('.')
      ? resolve(dirname(resolve(fromFile)), specifier)
      : null
  if (base === null) return null
  const candidates = [
    ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...ASSET_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => resolve(base, `index${extension}`)),
    base,
  ]
  const hit = candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile())
  return hit === undefined ? null : relativeToProject(hit)
}

export function readLocalImports(file, read = readFileSync) {
  if (!isSourceFile(file)) return []
  const source = read(resolve(file), 'utf8')
  const specifiers = [
    ...source.matchAll(/\b(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),
    ...source.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g),
  ].map((match) => match[1])
  return [...new Set(specifiers
    .map((specifier) => resolveLocalSpecifier(file, specifier))
    .filter((resolved) => resolved !== null))]
}

export function readLocalMocks(file, read = readFileSync) {
  if (!isSourceFile(file)) return []
  const source = read(resolve(file), 'utf8')
  return [...new Set([...source.matchAll(/\bvi\.mock\(\s*['"]([^'"]+)['"]/g)]
    .map((match) => resolveLocalSpecifier(file, match[1]))
    .filter((resolved) => resolved !== null))]
}

/** 선언된 code/test roots에서 시작해 실제 local import closure를 계산한다. */
export function collectImportClosure(entrypoints, readImports = readLocalImports) {
  const seen = new Set()
  const queue = entrypoints.map(relativeToProject)
  while (queue.length > 0) {
    const current = queue.shift()
    if (seen.has(current)) continue
    seen.add(current)
    for (const target of readImports(current)) {
      if (!seen.has(target)) queue.push(target)
    }
  }
  return [...seen].sort()
}

/** focused test의 명시적 vi.mock 대체 모듈은 실행 closure에 넣지 않는다. */
export function collectTestImportClosure(
  tests,
  readImports = readLocalImports,
  readMocks = readLocalMocks,
) {
  const files = new Set()
  for (const test of tests) {
    const mocked = new Set(readMocks(test))
    for (const file of collectImportClosure(
      [test],
      (current) => readImports(current).filter((target) => !mocked.has(target)),
    )) {
      files.add(file)
    }
  }
  return [...files].sort()
}

function sectionAt(content, heading) {
  const lines = content.split(/\r?\n/)
  const headings = lines.map((line, index) => {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line)
    return match === null ? null : { index, level: match[1].length, title: match[2] }
  }).filter(Boolean)
  const start = headings.find((candidate) => candidate.title === heading)
  if (start === undefined) return null
  const end = headings.find(
    (candidate) => candidate.index > start.index && candidate.level <= start.level,
  )?.index ?? lines.length
  return lines.slice(start.index + 1, end).join('\n')
}

function locationFailures(bundleId, kind, locations) {
  const failures = []
  if (!Array.isArray(locations) || locations.length === 0) {
    return [`seed bundle ${bundleId}: ${kind} 위치가 없다 (4-part 누락)`]
  }
  for (const item of locations) {
    if (!item?.file || !item.heading || !item.marker) {
      failures.push(`seed bundle ${bundleId}: ${kind} 위치는 file + heading + marker가 필요하다`)
      continue
    }
    if (!existsSync(resolve(item.file))) {
      failures.push(`seed bundle ${bundleId}: ${kind} 파일이 없다: ${item.file}`)
      continue
    }
    const section = sectionAt(readFileSync(resolve(item.file), 'utf8'), item.heading)
    if (section === null) {
      failures.push(`seed bundle ${bundleId}: ${kind} 절이 없다: ${item.file}#${item.heading}`)
    } else if (!section.includes(item.marker)) {
      failures.push(`seed bundle ${bundleId}: ${kind} marker가 절 안에 없다: ${item.file}#${item.heading}`)
    }
  }
  return failures
}

/** 4-part 실존, 문서 위치, 소유권, 중복 계약 root를 검사한다. */
export function validateSeedBundles(bundles = SEED_BUNDLES) {
  const failures = []
  const ids = new Set()
  const ownedRoots = new Map()
  for (const bundle of bundles) {
    const id = typeof bundle?.id === 'string' && bundle.id !== '' ? bundle.id : '<missing-id>'
    if (ids.has(id)) failures.push(`seed bundle id 중복 소유: ${id}`)
    ids.add(id)

    if (!Array.isArray(bundle?.code) || bundle.code.length === 0) {
      failures.push(`seed bundle ${id}: code 진입점이 없다 (4-part 누락)`)
    }
    if (!Array.isArray(bundle?.tests) || bundle.tests.length === 0) {
      failures.push(`seed bundle ${id}: focused test가 없다 (4-part 누락)`)
    }
    for (const [kind, files] of [['code', bundle?.code], ['focused test', bundle?.tests]]) {
      for (const file of files ?? []) {
        if (!existsSync(resolve(file)) || !statSync(resolve(file)).isFile()) {
          failures.push(`seed bundle ${id}: ${kind} 파일이 없다: ${file}`)
        }
        if (kind !== 'code') continue
        const owner = ownedRoots.get(file)
        if (owner !== undefined && owner !== id) {
          failures.push(`seed contract 중복 소유: ${file} (${owner}, ${id})`)
        } else {
          ownedRoots.set(file, id)
        }
      }
    }
    failures.push(...locationFailures(id, 'skill', bundle?.skills))
    failures.push(...locationFailures(id, 'ADR', bundle?.adrs))
    if (bundle?.examples !== undefined) {
      if (!Array.isArray(bundle.examples)) {
        failures.push(`seed bundle ${id}: examples must be an array`)
      } else for (const example of bundle.examples) {
        if (!Array.isArray(example?.files) || example.files.length === 0) {
          failures.push(`seed bundle ${id}: example files are required`)
        } else for (const file of example.files) {
          if (typeof file !== 'string' || !existsSync(resolve(file)) || !statSync(resolve(file)).isFile()) {
            failures.push(`seed bundle ${id}: example file is missing: ${file}`)
          }
        }
        if (typeof example?.useWhen !== 'string' || !example.useWhen.trim() ||
            typeof example?.doNotCopy !== 'string' || !example.doNotCopy.trim()) {
          failures.push(`seed bundle ${id}: example useWhen and doNotCopy are required`)
        }
      }
    }
    if (!bundle?.ownership?.shared?.trim() || !bundle?.ownership?.feature?.trim()) {
      failures.push(`seed bundle ${id}: shared/feature 소유권 문장이 없다`)
    }
  }
  return failures.sort()
}

/** 4-part 문서와 선언 root의 기계 계산 closure를 합친 실제 seed 파일 목록. */
export function listSeedFiles(bundles = SEED_BUNDLES) {
  const codeEntrypoints = bundles.flatMap((bundle) => bundle.code)
  const tests = bundles.flatMap((bundle) => bundle.tests)
  const documents = bundles.flatMap((bundle) => [
    ...bundle.skills.map(({ file }) => file),
    ...bundle.adrs.map(({ file }) => file),
  ])
  return [...new Set([
    'AGENTS.md',
    ...collectImportClosure(codeEntrypoints),
    ...collectTestImportClosure(tests),
    ...documents.map(relativeToProject),
  ])].sort()
}

export function findUnexpectedSeedTests(seedFiles, bundles = SEED_BUNDLES) {
  const declared = new Set(bundles.flatMap((bundle) => bundle.tests).map(relativeToProject))
  return seedFiles
    .filter((file) => file.includes('.test.') && !declared.has(relativeToProject(file)))
    .sort()
}

/** materialized seed의 어떤 local import도 복사 목록 밖으로 나가지 않아야 한다. */
export function findSeedLeaks(seedFiles, readImports = readLocalImports) {
  const seed = new Set(seedFiles)
  const leaks = []
  for (const current of seedFiles.filter(isSourceFile)) {
    for (const target of readImports(current)) {
      if (!seed.has(target)) leaks.push({ from: current, to: target })
    }
  }
  return leaks.sort((a, b) => `${a.to}${a.from}`.localeCompare(`${b.to}${b.from}`))
}

/** code와 각 focused test를 독립 실행 단위로 보고 contextual mock을 반영해 폐쇄를 검사한다. */
export function findBundleClosureLeaks(bundles = SEED_BUNDLES) {
  const leaks = []
  for (const bundle of bundles) {
    const codeFiles = collectImportClosure(bundle.code)
    for (const leak of findSeedLeaks(codeFiles)) leaks.push({ bundle: bundle.id, ...leak })
    for (const test of bundle.tests) {
      const mocked = new Set(readLocalMocks(test))
      const imports = (file) => readLocalImports(file).filter((target) => !mocked.has(target))
      const testFiles = collectImportClosure([test], imports)
      for (const leak of findSeedLeaks(testFiles, imports)) {
        leaks.push({ bundle: bundle.id, ...leak })
      }
    }
  }
  return leaks.sort((a, b) => `${a.bundle}${a.to}${a.from}`.localeCompare(`${b.bundle}${b.to}${b.from}`))
}

/**
 * 채택 후보가 아닌 이관 재료. 코드 closure로 계산되지 않는 skill 전체·skill이 이름으로 가리키는 ADR(`adrs`)·
 * 대상 버전과 대조해야 하는 핀 ADR(`conditional`)·게이트·설정·test harness·스타일 배선과,
 * 계약이 아니라 런타임인 i18n core(`core`)·같은 제품의 app shell 카피(`app`, 대상과 병합)를 사람이 명시한다.
 * 디렉터리는 반출 시 재귀로 펼친다. `templates`는 복사가 아니라 대상과 병합할 파일이다.
 * `entrypoints`는 각 런타임이 AGENTS.md 로 들어오는 루트 포인터, `runtime`은 게이트를 실제로 부르는 hook 설정이다.
 * 대상에 없으면 복사하고 있으면 병합 대상으로 보고한다.
 *
 * 이 제품의 활성 원장(인벤토리·판정·시나리오·색인)은 기본 이관 재료가 아니다(docs/design/2026-09-14-reference-document-loop-redesign.md §8). 다른 제품의
 * 기본값이 될 수 없으므로 `productLedgerManifest` 로 명시 요청할 때만 나가고, 기본 stage 는 대상 포인터 경로에
 * 빈 원장 뼈대를 만든다.
 */
export const TRANSPLANT_MANIFEST = {
  skills: [
    '.agents/skills/screen-loop',
    '.agents/skills/folder-structure-contract',
    '.agents/skills/api-contract',
    '.agents/skills/feature-contract',
    '.agents/skills/shared-ui-contract',
  ],
  // 여기 있는 skill 전체와 `gates` 의 `eslint.config.js` 가 이름으로 가리키는 결정. 선택한 bundle 과 무관하게
  // 함께 나가야 그 문장들이 대상에서 끊기지 않는다(`0009` 는 `0011`·`0012` 를 다시 가리킨다).
  adrs: [
    'docs/decisions/0003-datetime-utc.md',
    'docs/decisions/0005-locale-query-key.md',
    'docs/decisions/0006-auth-token-storage.md',
    'docs/decisions/0008-primitive-implementation-selection.md',
    'docs/decisions/0009-shared-boundaries.md',
    'docs/decisions/0010-form-boundaries.md',
    'docs/decisions/0011-detail-data-and-update-history-boundaries.md',
    'docs/decisions/0012-list-filter-draft-composition.md',
  ],
  conditional: [
    'docs/decisions/0002-typescript-version-pin.md',
    'docs/decisions/0004-runtime-version-pin.md',
  ],
  entrypoints: ['CLAUDE.md', '.github/copilot-instructions.md'],
  runtime: ['.claude/settings.json', '.codex/hooks.json', '.github/hooks/reference.json'],
  gates: [
    'eslint.config.js',
    'scripts/gates',
    'scripts/agents',
    'tests/gates',
    'scripts/verify-negative-controls.mjs',
    'scripts/verify-negative-controls.test.mjs',
    'scripts/contracts',
    'scripts/i18n',
  ],
  config: [
    'tsconfig.json',
    'tsconfig.base.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    // `tsconfig.json` 이 project reference 로 가리킨다. 빠지면 대상에서 tsconfig 로드 자체가 실패한다(실측).
    'tsconfig.e2e.json',
    'vitest.config.ts',
    'vite.config.ts',
    'playwright.config.ts',
    '.node-version',
    '.nvmrc',
    '.env.example',
    '.github/workflows/verify.yml',
  ],
  harness: ['src/test', 'src/styles.css'],
  core: [
    // The negative-control harness copies ApiError into its isolated type-aware lint workspace.
    'src/api/error.ts',
    'src/shared/i18n/i18n.ts',
    'src/shared/i18n/locale.ts',
    'src/shared/i18n/locale-context.tsx',
    'src/shared/i18n/locales/ko/shared.json',
    'src/shared/i18n/locales/en/shared.json',
    'src/shared/i18n/locales/ja/shared.json',
  ],
  app: [
    'src/app/i18n/resources.ts',
    'src/shared/i18n/locales/ko/app.json',
    'src/shared/i18n/locales/en/app.json',
    'src/shared/i18n/locales/ja/app.json',
  ],
  templates: ['package.json'],
}

/**
 * 명시 요청(`--with-ledger`)에만 나가는 활성 원장: 제품 포인터와 그것이 가리키는 인벤토리·판정·시나리오·색인.
 * 포인터에서 파생하므로 경로를 여기 다시 적지 않는다.
 */
export function productLedgerManifest(root = process.cwd()) {
  const paths = productPaths(root)
  return { ledger: [...new Set([PRODUCT_POINTER, paths.inventory, paths.judgment, paths.scenarios, paths.index])] }
}

function expandManifestEntry(entry, root = process.cwd()) {
  const absolute = resolve(root, entry)
  if (!existsSync(absolute)) return []
  const stat = statSync(absolute)
  if (stat.isFile() || stat.isSymbolicLink()) return [relativeToRoot(absolute, root)]
  return readdirSync(absolute, { recursive: true, withFileTypes: true })
    .filter((item) => item.isFile() || item.isSymbolicLink())
    .map((item) => relativeToRoot(resolve(item.parentPath, item.name), root))
}

/** manifest의 모든 항목이 실존해야 한다. 값의 타당성은 사람이 판단한다. */
export function validateTransplantManifest(manifest = TRANSPLANT_MANIFEST) {
  const failures = []
  for (const [group, entries] of Object.entries(manifest)) {
    if (!Array.isArray(entries) || entries.length === 0) {
      failures.push(`transplant manifest ${group}: 항목이 없다`)
      continue
    }
    for (const entry of entries) {
      if (!existsSync(resolve(entry))) failures.push(`transplant manifest ${group}: 파일이 없다: ${entry}`)
    }
  }
  return failures.sort()
}

/** manifest를 실제 파일 목록으로 펼친다(디렉터리 재귀). */
export function listTransplantManifestFiles(manifest = TRANSPLANT_MANIFEST, root = process.cwd()) {
  return [...new Set(Object.values(manifest).flat().flatMap((entry) => expandManifestEntry(entry, root)))].sort()
}

/**
 * seed closure에 들어오면 안 되는 것. feature 코드·리허설 생성물·도메인 번역은 제품 사실이 아니다(ADR 0009 채택 경계).
 */
export const FORBIDDEN_SEED_PATTERNS = [
  /^scripts\/agents\/reference-product\.test\.mjs$/,
  /^src\/features\//,
  /^src\/routes\//,
  /^src\/api\/generated\//,
  // 업무군 workflow 테스트는 feature 화면을 import 하는 제품 테스트다. harness(`src/test`) 디렉터리에 살지만 seed 가 아니다.
  /^src\/test\/workflows\//,
  /\/locales\/[a-z]{2}\/(?!shared\.json$|auth\.json$|app\.json$)[^/]+\.json$/,
]

export function findForbiddenSeedFiles(seedFiles, patterns = FORBIDDEN_SEED_PATTERNS) {
  return seedFiles.filter((file) => patterns.some((pattern) => pattern.test(file))).sort()
}

/**
 * focused test closure로만 따라온 shared/api 계약 파일은 선언 없는 부수 반출이다.
 * 계약 레이어(`src/shared/**`, `src/api/**`)의 production 파일은 어느 bundle의 code closure 안에 있어야 한다.
 * test helper(`src/test/**`)와 test 파일은 증거이므로 대상이 아니다.
 */
export function findUndeclaredContractExports(
  bundles = SEED_BUNDLES,
  manifestFiles = listTransplantManifestFiles(),
  readImports = readLocalImports,
  readMocks = readLocalMocks,
) {
  const declared = new Set([
    ...collectImportClosure(bundles.flatMap((bundle) => bundle.code), readImports),
    ...manifestFiles,
  ])
  const testClosure = collectTestImportClosure(bundles.flatMap((bundle) => bundle.tests), readImports, readMocks)
  return testClosure
    .filter((file) => /^src\/(shared|api)\//.test(file))
    .filter((file) => !file.includes('.test.') && !file.endsWith('.test-d.ts'))
    .filter((file) => !declared.has(file))
    .sort()
}
