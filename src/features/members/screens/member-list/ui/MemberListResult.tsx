import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { memberSortKeys, type MemberProfile, type MemberSortKey } from '@/features/members/model/member';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import { DataTable } from '@/shared/ui/list/DataTable';
import { ListResult, type ListResultData } from '@/shared/ui/list/ListResult';
import { PageSizeControl } from '@/shared/ui/list/PageSizeControl';
import { Pagination } from '@/shared/ui/list/Pagination';
import { ResultToolbar } from '@/shared/ui/list/ResultToolbar';
import { ResultTotal } from '@/shared/ui/list/ResultTotal';
import { SortControl } from '@/shared/ui/list/SortControl';
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
  const { view } = result;

  return (
    <>
      <ResultTotal searched={data.searched} total={total} />
      <ResultToolbar
        left={
          data.searched ? (
            <>
              <PageSizeControl label={t('result.pageSize')} options={standardPageSizeOptions} {...view.pageSize} />
              <SortControl<MemberSortKey>
                label={t('result.sort')}
                value={view.sort.value}
                options={memberSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
                onValueChange={view.sort.onValueChange}
              />
            </>
          ) : null
        }
        right={actions}
      />
      <ListResult
        data={data}
        copy={{ notSearched: t('result.notSearched'), empty: t('result.empty') }}
        footer={
          <Pagination
            {...view.pagination}
            ariaLabel={t('result.paginationLabel')}
            previousLabel={t('result.previous')}
            nextLabel={t('result.next')}
          />
        }
      >
        <DataTable rows={data.rows} columns={result.columns} getRowId={(row) => row.id} onRowActivate={(row) => onActivate(row.id)} />
      </ListResult>
    </>
  );
}
