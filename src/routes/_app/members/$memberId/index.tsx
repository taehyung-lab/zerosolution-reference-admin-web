import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_app/members/$memberId/')({
  component: MemberDetailPlaceholder,
});

function MemberDetailPlaceholder() {
  const { t } = useTranslation('members');
  // #5가 이 placeholder를 회원 조회 본문과 데이터 흐름으로 교체한다.
  return <PageHeader title={t('stubs.detail')} />;
}
