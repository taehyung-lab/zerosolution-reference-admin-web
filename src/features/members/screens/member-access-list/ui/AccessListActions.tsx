import { useTranslation } from 'react-i18next';
import { MemberDownloadControl } from '@/features/members/mechanics/download/ui/MemberDownloadControl';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { Button } from '@/shared/ui/primitives/Button';
import type { AccessListView } from '../model/access-list-search';
import { useAccessListActions } from '../model/useAccessListActions';

/** 결과 toolbar 우측: `등록` · `다운로드 범위 ▾ + 다운로드`(검색 뒤에만). alert 의 수명은 이 컴포넌트가 소유한다. */
export function AccessListActions({
  search,
  selectedIds,
  onCreate,
}: {
  readonly search: AccessListView;
  readonly selectedIds: readonly string[];
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('members');
  const actions = useAccessListActions(selectedIds, search);

  return (
    <>
      <div className="flex flex-wrap items-start gap-2">
        <Button onClick={onCreate}>{t('actions.register')}</Button>
        {search.searched ? <MemberDownloadControl download={actions.download} /> : null}
      </div>
      <SelectionAlert controller={actions.gate} />
    </>
  );
}
