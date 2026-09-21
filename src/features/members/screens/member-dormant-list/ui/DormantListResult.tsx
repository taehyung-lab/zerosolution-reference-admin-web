import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { dormantSortKeys, type DormantMemberRow } from '@/features/members/model/member-records';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import type { ListResultData } from '@/shared/ui/list/ListResult';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import type { useDormantListResult } from './useDormantListResult';

/** 결과 영역: 건수 · 보기/정렬(검색 뒤에만) · toolbar 우측 액션 · 표 · 페이지. */
export function DormantListResult({
  data,
  total,
  result,
  actions,
  onActivate,
}: {
  readonly data: ListResultData<DormantMemberRow>;
  readonly total: number;
  readonly result: ReturnType<typeof useDormantListResult>;
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
      sortOptions={dormantSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
    />
  );
}
