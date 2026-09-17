import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { contentSortKeys, type ContentRow, type ContentSortKey } from '@/features/performances/model/content';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import { DataTable } from '@/shared/ui/list/DataTable';
import { ListResult, type ListResultData } from '@/shared/ui/list/ListResult';
import { PageSizeControl } from '@/shared/ui/list/PageSizeControl';
import { Pagination } from '@/shared/ui/list/Pagination';
import { ResultToolbar } from '@/shared/ui/list/ResultToolbar';
import { ResultTotal } from '@/shared/ui/list/ResultTotal';
import { SortControl } from '@/shared/ui/list/SortControl';
import type { useContentListResult } from './useContentListResult';

/** 결과 영역: 건수 · 보기/정렬 · toolbar 우측 일괄변경 · 표 · 페이지. 행 클릭 목적지는 아직 없다. */
export function ContentListResult({
  data,
  total,
  result,
  actions,
}: {
  readonly data: ListResultData<ContentRow>;
  readonly total: number;
  readonly result: ReturnType<typeof useContentListResult>;
  readonly actions: ReactNode;
}) {
  const { t } = useTranslation('performances');
  const { view } = result;

  return (
    <>
      <ResultTotal searched={data.searched} total={total} />
      <ResultToolbar
        left={
          <>
            <PageSizeControl
              label={t('content.result.pageSize')}
              options={standardPageSizeOptions}
              {...view.pageSize}
            />
            <SortControl<ContentSortKey>
              label={t('content.result.sort')}
              value={view.sort.value}
              options={contentSortKeys.map((value) => ({ value, label: t(`content.fields.${value}`) }))}
              onValueChange={view.sort.onValueChange}
            />
          </>
        }
        right={actions}
      />
      <ListResult
        data={data}
        copy={{ notSearched: t('content.result.notSearched'), empty: t('content.result.empty') }}
        footer={
          <Pagination
            {...view.pagination}
            ariaLabel={t('content.result.pagination')}
            previousLabel={t('content.result.previous')}
            nextLabel={t('content.result.next')}
          />
        }
      >
        <DataTable rows={data.rows} columns={result.columns} getRowId={(row) => row.id} />
      </ListResult>
    </>
  );
}
