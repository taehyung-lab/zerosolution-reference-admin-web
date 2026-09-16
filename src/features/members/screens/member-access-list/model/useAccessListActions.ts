import { useMutation } from '@tanstack/react-query';
import { downloadAccessListMutation } from '@/features/members/api/mutations';
import { useMemberDownload } from '@/features/members/mechanics/download/model/useMemberDownload';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSelectionGate } from '@/shared/model/use-selection-gate';
import { toAccessListConditions, type AccessListView } from './access-list-search';

/** toolbar 의 다운로드: 선택한 행 또는 확정한 검색 조건(페이지 제외) 전체를 요청 함수에 넘긴다. */
export function useAccessListActions(selectedIds: readonly string[], search: AccessListView) {
  const { locale } = useLocale();
  const gate = useSelectionGate(selectedIds.length);
  const downloadList = useMutation(downloadAccessListMutation(locale));
  const download = useMemberDownload({
    selectedIds,
    gate,
    search: toAccessListConditions(search),
    run: (request) => downloadList.mutateAsync(request),
  });
  return { gate, download };
}
