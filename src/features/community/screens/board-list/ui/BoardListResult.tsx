import { useTranslation } from 'react-i18next';
import { boardSortKeys, type BoardRow } from '@/features/community/model/board';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import type { ListResultData } from '@/shared/ui/list/ListResult';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
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
  readonly data: ListResultData<BoardRow, true>;
  readonly total: number;
  readonly result: ReturnType<typeof useBoardListResult>;
  readonly onActivate: (boardId: string) => void;
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('community');

  return (
    <PagedListResult
      data={data}
      total={total}
      view={result.view}
      columns={result.columns}
      getRowId={(row) => row.id}
      onRowActivate={(row) => onActivate(row.id)}
      actions={<Button onClick={onCreate}>{t('board.result.create')}</Button>}
      copy={{ empty: t('board.result.empty') }}
      pageSizeOptions={standardPageSizeOptions}
      sortOptions={boardSortKeys.map((value) => ({ value, label: t(`board.sort.${value}`) }))}
    />
  );
}
