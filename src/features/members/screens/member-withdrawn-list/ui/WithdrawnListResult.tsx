import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  withdrawnSortKeys,
  type WithdrawnMemberRow,
} from '@/features/members/model/member-records';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import type { ListResultData } from '@/shared/ui/list/ListResult';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import type { useWithdrawnListResult } from './useWithdrawnListResult';

/** 결과 영역: 건수 · 보기/정렬(검색 뒤에만) · toolbar 우측 액션 · 표 · 페이지. */
export function WithdrawnListResult({
  data,
  total,
  result,
  actions,
  onActivate,
}: {
  readonly data: ListResultData<WithdrawnMemberRow>;
  readonly total: number;
  readonly result: ReturnType<typeof useWithdrawnListResult>;
  readonly actions: ReactNode;
  readonly onActivate: (memberId: string) => void;
}) {
  const { t } = useTranslation('members');

  return (
    <PagedListResult
      data={data}
      total={total}
      view={result.view}
      columns={result.columns}
      getRowId={(row) => row.id}
      onRowActivate={(row) => onActivate(row.id)}
      actions={actions}
      copy={{ notSearched: t('result.notSearched'), empty: t('result.empty') }}
      pageSizeOptions={standardPageSizeOptions}
      sortOptions={withdrawnSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
    />
  );
}
