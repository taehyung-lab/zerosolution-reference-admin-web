import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/primitives/Button';
import { Select } from '@/shared/ui/primitives/Select';
import type { MemberDownloadControls } from '../model/useMemberDownload';

/** 다운로드 범위 select 와 `다운로드`. 범위를 고르기 전에는 보낼 요청이 없어 버튼을 잠근다. */
export function MemberDownloadControl({ download }: { readonly download: MemberDownloadControls }) {
  const { t } = useTranslation('members');
  return (
    <>
      <Select
        aria-label={t('download.scope')}
        className="w-auto"
        value={download.scope}
        placeholder={t('download.choose')}
        options={[
          { value: 'selected', label: t('download.selected') },
          { value: 'all', label: t('download.allResults') },
        ]}
        onValueChange={(value) => download.setScope(value === 'selected' || value === 'all' ? value : null)}
      />
      <Button type="button" disabled={download.scope === null} onClick={download.request}>
        {t('download.action')}
      </Button>
    </>
  );
}
