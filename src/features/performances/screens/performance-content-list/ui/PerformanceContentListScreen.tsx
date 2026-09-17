import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import {
  contentListSearch,
  type ContentListSearch,
  type ContentListView,
} from '../model/content-list-search';
import { useContentListData } from '../model/useContentListData';
import { useContentListFilter } from '../model/useContentListFilter';
import { ContentListActions } from './ContentListActions';
import { ContentListFilters } from './ContentListFilters';
import { ContentListResult } from './ContentListResult';
import { ContentPreviewDialog } from './ContentPreviewDialog';
import { useContentListResult } from './useContentListResult';

/**
 * 5.1 콘텐츠 목록. 조립만 하고 상태는 각 소유자에 둔다.
 * route 는 검증한 sparse search 를 넘기고 화면이 한 번 해소한다. 모든 URL 전이는 `commit` 한 곳으로
 * 나가며 canonical 로 줄여 `onSearchChange` 에 넘긴다. 미리보기 팝업의 열림은 이 화면의 일시 상태다.
 */
export function PerformanceContentListScreen({
  search: sparse,
  onSearchChange,
}: {
  readonly search: ContentListSearch;
  readonly onSearchChange: (next: ContentListSearch) => void;
}) {
  const { t } = useTranslation('performances');
  const search = contentListSearch.resolve(sparse);
  const commit = (next: ContentListView) => onSearchChange(contentListSearch.canonical.parse(next));
  const filter = useContentListFilter(search, commit);
  const { rows, total, totalPages, ...data } = useContentListData(search);
  const [previewId, setPreviewId] = useState<string>();
  const result = useContentListResult({
    search,
    rows,
    totalPages,
    commit,
    onPreview: (row) => setPreviewId(row.id),
  });

  return (
    <section>
      <PageHeader title={t('content.title')} />
      <ContentListFilters filter={filter} />
      <ContentListResult
        data={{ rows, ...data }}
        total={total}
        result={result}
        actions={
          <ContentListActions
            selectedIds={result.selection.selectedIds}
            onChanged={result.selection.clear}
          />
        }
      />
      {previewId === undefined ? null : (
        <ContentPreviewDialog contentId={previewId} onClose={() => setPreviewId(undefined)} />
      )}
    </section>
  );
}
