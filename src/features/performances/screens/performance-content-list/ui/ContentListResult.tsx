import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { contentSortKeys, type ContentRow } from '@/features/performances/model/content';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import type { ListResultData } from '@/shared/ui/list/ListResult';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import type { useContentListResult } from './useContentListResult';

/** 결과 영역: 건수 · 보기/정렬 · toolbar 우측 일괄변경 · 표 · 페이지. 행 클릭 목적지는 아직 없다. */
export function ContentListResult({
  data,
  total,
  result,
  actions,
}: {
  readonly data: ListResultData<ContentRow, true>;
  readonly total: number;
  readonly result: ReturnType<typeof useContentListResult>;
  readonly actions: ReactNode;
}) {
  const { t } = useTranslation('performances');

  return (
    <PagedListResult
      data={data}
      total={total}
      view={result.view}
      columns={result.columns}
      getRowId={(row) => row.id}
      actions={actions}
      copy={{ empty: t('content.result.empty') }}
      pageSizeOptions={standardPageSizeOptions}
      sortOptions={contentSortKeys.map((value) => ({ value, label: t(`content.fields.${value}`) }))}
    />
  );
}
