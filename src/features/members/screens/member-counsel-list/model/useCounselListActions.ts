import { useMutation } from '@tanstack/react-query';
import { downloadCounselListMutation } from '@/features/members/api/mutations';
import { useMemberDownload } from '@/features/members/shared/download/model/useMemberDownload';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSelectionGate } from '@/shared/hooks/use-selection-gate';
import { toCounselListConditions, type CounselListView } from './counsel-list-search';

/** toolbar 의 다운로드: 선택한 행 또는 확정한 검색 조건(페이지 제외) 전체를 요청 함수에 넘긴다. */
export function useCounselListActions(selectedIds: readonly string[], search: CounselListView) {
  const { locale } = useLocale();
  const gate = useSelectionGate(selectedIds.length);
  const downloadList = useMutation(downloadCounselListMutation(locale));
  const download = useMemberDownload({
    selectedIds,
    gate,
    search: toCounselListConditions(search),
    run: (request) => downloadList.mutateAsync(request),
  });
  return { gate, download };
}
