import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCounselInquiryOptions } from '@/features/members/api/useCounselOptions';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { counselListSearch, type CounselListSearch, type CounselListView } from '../model/counsel-list-search';
import { useCounselListData } from '../model/useCounselListData';
import { useCounselListFilter } from '../model/useCounselListFilter';
import { CounselDetailDialog } from './CounselDetailDialog';
import { CounselListActions } from './CounselListActions';
import { CounselListFilters } from './CounselListFilters';
import { CounselListResult } from './CounselListResult';
import { useCounselListResult } from './useCounselListResult';

/**
 * 4.6 회원상담 목록. 진입 즉시 조회하고, 행을 클릭하면 같은 화면 위에 상담 팝업(문의·기록 CRUD·재발권)을 연다.
 * 어떤 상담을 열었는지는 URL 이 아니라 이 화면이 소유한다 — 팝업이라 공유·복원할 상태가 아니다.
 */
export function MemberCounselListScreen({
  search: sparse,
  onSearchChange,
}: {
  readonly search: CounselListSearch;
  readonly onSearchChange: (next: CounselListSearch) => void;
}) {
  const { t } = useTranslation('members');
  const search = counselListSearch.resolve(sparse);
  const commit = (next: CounselListView) => onSearchChange(counselListSearch.canonical.parse(next));
  const inquiryOptions = useCounselInquiryOptions();
  const filter = useCounselListFilter(search, commit);
  const { rows, total, totalPages, ...data } = useCounselListData(search);
  const result = useCounselListResult({ search, rows, totalPages, inquiryOptions: inquiryOptions.items, commit });
  const [opened, setOpened] = useState<string>();

  return (
    <section>
      <PageHeader title={t('screens.counsel')} breadcrumbs={[t('path.members'), t('screens.counsel')]} />
      <CounselListFilters filter={filter} inquiryOptions={inquiryOptions} />
      <CounselListResult
        data={{ rows, ...data }}
        total={total}
        result={result}
        actions={<CounselListActions search={search} selectedIds={result.selection.selectedIds} />}
        onActivate={setOpened}
      />
      {opened ? <CounselDetailDialog key={opened} counselId={opened} onClose={() => setOpened(undefined)} /> : null}
    </section>
  );
}
