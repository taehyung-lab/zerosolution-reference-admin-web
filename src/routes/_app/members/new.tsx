import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_app/members/new')({
  component: MemberCreatePlaceholder,
});

function MemberCreatePlaceholder() {
  const { t } = useTranslation('members');
  // #6이 이 placeholder를 회원 등록 폼과 데이터 흐름으로 교체한다.
  return <PageHeader title={t('stubs.create')} />;
}
