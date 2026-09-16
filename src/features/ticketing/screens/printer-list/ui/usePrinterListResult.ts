import { useTranslation } from 'react-i18next';
import { printerSortKeys } from '@/features/ticketing/model/printer';
import type { PrinterRow, PrinterSortKey } from '@/features/ticketing/model/printer';
import { usePageRowSelection } from '@/shared/model/use-page-row-selection';
import {
  toHeaderSortSearch,
  toPageSearch,
  toPageSizeSearch,
  toSortSearch,
} from '../model/printer-list-policy';
import { printerPageSizes } from '../model/printer-list-search';
import type {
  PrinterListSearch,
  ResolvedPrinterListSearch,
} from '../model/printer-list-search';
import { printerListColumns } from './printer-list-columns';

/**
 * 결과 영역이 그대로 렌더할 컬럼·선택·controls. 전이 규칙은 `printer-list-policy` 가 소유한다.
 * 선택은 확정된 한 화면(committed search)의 현재 페이지에 한정된다.
 */
export function usePrinterListResult({
  search,
  rows,
  totalPages,
  onSearchChange,
}: {
  readonly search: ResolvedPrinterListSearch;
  readonly rows: readonly PrinterRow[];
  readonly totalPages: number;
  readonly onSearchChange: (next: PrinterListSearch) => void;
}) {
  const { t } = useTranslation('ticketing');
  const selection = usePageRowSelection({
    rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });

  return {
    selection,
    columns: printerListColumns({
      t,
      search,
      selection,
      onHeaderSort: (sortType: PrinterSortKey) =>
        onSearchChange(toHeaderSortSearch(search, sortType)),
    }),
    pageSize: {
      value: search.pageSize,
      options: printerPageSizes,
      onValueChange: (pageSize: number) => onSearchChange(toPageSizeSearch(search, pageSize)),
    },
    sort: {
      value: search.sortType,
      options: printerSortKeys.map((value) => ({
        value,
        label: t(`printer.sort.${value}`),
      })),
      onValueChange: (sortType: PrinterSortKey) =>
        onSearchChange(toSortSearch(search, sortType)),
    },
    pagination: {
      page: search.page,
      totalPages,
      onPageChange: (page: number) => onSearchChange(toPageSearch(search, page)),
    },
  };
}
