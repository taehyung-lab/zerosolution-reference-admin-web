import { useTranslation } from 'react-i18next';
import type { BoardRow } from '@/features/community/model/board';
import { DataTable } from '@/shared/ui/patterns/DataTable';
import { ListResult } from '@/shared/ui/patterns/ListResult';
import type { ListResultData } from '@/shared/ui/patterns/ListResult';
import { Pagination } from '@/shared/ui/patterns/Pagination';
import { PageSizeControl } from '@/shared/ui/patterns/PageSizeControl';
import { ResultToolbar } from '@/shared/ui/patterns/ResultToolbar';
import { ResultTotal } from '@/shared/ui/patterns/ResultTotal';
import { SortControl } from '@/shared/ui/patterns/SortControl';
import type { useBoardListResult } from './useBoardListResult';

/**
 * toolbar 우측은 원장 11행의 `등록` 하나뿐이지만 등록 화면 route 가 이 저장소에 없다.
 * 목적지 없는 버튼을 놓으면 구현 누락을 감추므로 slot 을 비워 둔다(차단된 요구사항 R12).
 */
export function BoardListResult({
  data,
  total,
  result,
}: {
  readonly data: ListResultData<BoardRow>;
  readonly total: number;
  readonly result: ReturnType<typeof useBoardListResult>;
}) {
  const { t } = useTranslation('community');

  return (
    <>
      <ResultTotal searched={data.searched} total={total} />
      <ResultToolbar
        left={
          <>
            <PageSizeControl label={t('board.result.pageSize')} {...result.pageSize} />
            <SortControl label={t('board.result.sort')} {...result.sort} />
          </>
        }
      />
      <ListResult
        data={data}
        copy={{
          // 진입 즉시 조회라 notSearched 에 도달하지 않는다. 타입이 두 문구를 요구해 같은 값을 넘긴다.
          notSearched: t('board.result.empty'),
          empty: t('board.result.empty'),
        }}
        footer={
          <Pagination
            {...result.pagination}
            ariaLabel={t('board.result.pagination.label')}
            previousLabel={t('board.result.pagination.previous')}
            nextLabel={t('board.result.pagination.next')}
          />
        }
      >
        <DataTable rows={data.rows} columns={result.columns} getRowId={(row) => row.id} />
      </ListResult>
    </>
  );
}
