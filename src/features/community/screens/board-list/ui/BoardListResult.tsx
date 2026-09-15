import { useTranslation } from 'react-i18next';
import type { BoardRow } from '@/features/community/model/board';
import { DataTable } from '@/shared/ui/list/DataTable';
import { ListResult } from '@/shared/ui/list/ListResult';
import type { ListResultData } from '@/shared/ui/list/ListResult';
import { Pagination } from '@/shared/ui/list/Pagination';
import { PageSizeControl } from '@/shared/ui/list/PageSizeControl';
import { ResultToolbar } from '@/shared/ui/list/ResultToolbar';
import { ResultTotal } from '@/shared/ui/list/ResultTotal';
import { SortControl } from '@/shared/ui/list/SortControl';
import { Button } from '@/shared/ui/primitives/Button';
import type { useBoardListResult } from './useBoardListResult';

/**
 * toolbar 우측은 원장 11행의 `등록` 하나뿐이다(일괄변경 없음, 2026-09-10 사용자 확정).
 * 행 클릭은 원문 51행의 `특정 행 클릭시, 조회 화면으로 이동` 이다. 두 목적지 route 는 caller 가 준다.
 */
export function BoardListResult({
  data,
  total,
  result,
  onActivate,
  onCreate,
}: {
  readonly data: ListResultData<BoardRow>;
  readonly total: number;
  readonly result: ReturnType<typeof useBoardListResult>;
  readonly onActivate: (boardId: string) => void;
  readonly onCreate: () => void;
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
        right={<Button onClick={onCreate}>{t('board.result.create')}</Button>}
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
        <DataTable
          rows={data.rows}
          columns={result.columns}
          getRowId={(row) => row.id}
          onRowActivate={(row) => onActivate(row.id)}
        />
      </ListResult>
    </>
  );
}
