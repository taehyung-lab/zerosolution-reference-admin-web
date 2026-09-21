import { useTranslation } from 'react-i18next';
import type { PrinterRow } from '@/features/ticketing/model/printer';
import { listViewControls } from '@/shared/lib/list-view';
import { usePageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { PrinterListView } from '../model/printer-list-search';
import { printerListColumns } from './printer-list-columns';

/**
 * 결과 영역이 그대로 렌더할 선택·보기 컨트롤·컬럼. 보기 전이 규칙은 공용 `list-view` 가 소유한다.
 * 선택은 확정된 한 화면(committed search)의 현재 페이지에 한정된다.
 */
export function usePrinterListResult({
  search,
  rows,
  totalPages,
  commit,
}: {
  readonly search: PrinterListView;
  readonly rows: readonly PrinterRow[];
  readonly totalPages: number;
  readonly commit: (next: PrinterListView) => void;
}) {
  const { t } = useTranslation('ticketing');
  const selection = usePageRowSelection({
    rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });
  const view = listViewControls({ search, totalPages, commit });

  return {
    selection,
    view,
    columns: printerListColumns({ t, search, selection, onHeaderSort: view.sort.onHeaderSort }),
  };
}
