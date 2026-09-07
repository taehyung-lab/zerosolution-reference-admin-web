import { ResultTotal } from '@/shared/ui/patterns/ResultTotal';
/**
 * 제품 운영자 목록의 건수·보기 설정·표·페이지와 조회 상태를 표시한다.
 * 조회 상태 판정은 ListResult가 소유하고, 액션 노드는 외부에서 받아 확인창 소유자의 수명을 보존한다.
 */
import type { ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/shared/ui/patterns/DataTable';
import { ListResult } from '@/shared/ui/patterns/ListResult';
import { PageSizeControl } from '@/shared/ui/patterns/PageSizeControl';
import { Pagination } from '@/shared/ui/patterns/Pagination';
import { ResultToolbar } from '@/shared/ui/patterns/ResultToolbar';
import { SortControl } from '@/shared/ui/patterns/SortControl';
import type { useManagerDirectoryData } from '../model/useManagerDirectoryData';
import type { useManagerDirectoryResult } from '../model/useManagerDirectoryResult';

export function ManagerDirectoryResult({
  data,
  result,
  toolbarRight,
}: {
  readonly data: ReturnType<typeof useManagerDirectoryData>;
  readonly result: ReturnType<typeof useManagerDirectoryResult>;
  readonly toolbarRight: ReactNode;
}) {
  const { t } = useTranslation('managers');
  const navigate = useNavigate();

  return (
    <>
      <ResultTotal searched={data.searched} total={data.total} />
      <ResultToolbar
        left={
          data.searched ? (
            <>
              <PageSizeControl
                label={t('result.pageSize')}
                value={result.pageSize.value}
                options={result.pageSize.options}
                onValueChange={result.pageSize.onValueChange}
              />
              <SortControl
                label={t('result.sort')}
                value={result.sort.value}
                options={result.sort.options}
                onValueChange={result.sort.onValueChange}
              />
            </>
          ) : null
        }
        right={toolbarRight}
      />
      <ListResult
        data={data}
        copy={{
          notSearched: t('result.notSearched'),
          empty: t('result.empty'),
        }}
        footer={
          <Pagination
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            onPageChange={result.pagination.onPageChange}
            ariaLabel={t('result.paginationLabel')}
            previousLabel={t('result.previous')}
            nextLabel={t('result.next')}
          />
        }
      >
        <DataTable
          rows={data.rows}
          columns={result.columns}
          getRowId={(row) => row.id}
          onRowActivate={(row) => {
            void navigate({
              to: '/managers/$managerId',
              params: { managerId: row.id },
            });
          }}
        />
      </ListResult>
    </>
  );
}
