import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { accessSortKeys, type MemberAccessRow } from '@/features/members/model/member-records';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import type { ListResultData } from '@/shared/ui/list/ListResult';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import type { useAccessListResult } from './useAccessListResult';

/** 결과 영역: 건수 · 보기/정렬(검색 뒤에만) · toolbar 우측 액션 · 표 · 페이지. 접속 행은 열리는 상세가 없다. */
export function AccessListResult({
  data,
  total,
  result,
  actions,
}: {
  readonly data: ListResultData<MemberAccessRow>;
  readonly total: number;
  readonly result: ReturnType<typeof useAccessListResult>;
  readonly actions: ReactNode;
}) {
  const { t } = useTranslation('members');

  return (
    <PagedListResult
      data={data}
      total={total}
      view={result.view}
      columns={result.columns}
      getRowId={(row) => row.id}
      actions={actions}
      copy={{ notSearched: t('result.notSearched'), empty: t('result.empty') }}
      pageSizeOptions={standardPageSizeOptions}
      sortOptions={accessSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
    />
  );
}
