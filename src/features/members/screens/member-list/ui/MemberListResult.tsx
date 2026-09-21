import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { memberSortKeys, type MemberProfile } from '@/features/members/model/member';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import type { ListResultData } from '@/shared/ui/list/ListResult';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import type { useMemberListResult } from './useMemberListResult';

/**
 * 결과 영역: 건수 · 보기/정렬(검색 뒤에만) · toolbar 우측 액션 · 표 · 페이지.
 * 검색 전에는 안내 문구만 있고 보기 컨트롤은 없다. 행 클릭의 목적지는 caller 가 준다.
 */
export function MemberListResult({
  data,
  total,
  result,
  actions,
  onActivate,
}: {
  readonly data: ListResultData<MemberProfile>;
  readonly total: number;
  readonly result: ReturnType<typeof useMemberListResult>;
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
      sortOptions={memberSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
    />
  );
}
