import { MemberDownloadControl } from '@/features/members/mechanics/download/ui/MemberDownloadControl';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import type { CounselListView } from '../model/counsel-list-search';
import { useCounselListActions } from '../model/useCounselListActions';

/** 결과 toolbar 우측: `다운로드 범위 ▾ + 다운로드`. alert 의 수명은 이 컴포넌트가 소유한다. */
export function CounselListActions({
  search,
  selectedIds,
}: {
  readonly search: CounselListView;
  readonly selectedIds: readonly string[];
}) {
  const actions = useCounselListActions(selectedIds, search);
  return (
    <>
      <div className="flex flex-wrap items-start gap-2">
        <MemberDownloadControl download={actions.download} />
      </div>
      <SelectionAlert controller={actions.gate} />
    </>
  );
}
