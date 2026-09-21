import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { appealSortKeys, type AppealRow } from '@/features/members/model/member-records';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import type { ListResultData } from '@/shared/ui/list/ListResult';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import type { useAppealListResult } from './useAppealListResult';

/** 결과 영역: 건수 · 보기/정렬 · toolbar 우측 액션 · 표 · 페이지. 행 클릭은 소명신청 조회로 간다. */
export function AppealListResult({
  data,
  total,
  result,
  actions,
  onActivate,
}: {
  readonly data: ListResultData<AppealRow, true>;
  readonly total: number;
  readonly result: ReturnType<typeof useAppealListResult>;
  readonly actions: ReactNode;
  readonly onActivate: (appealId: string) => void;
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
      copy={{ empty: t('result.empty') }}
      pageSizeOptions={standardPageSizeOptions}
      sortOptions={appealSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
    />
  );
}
