import { messagePolicyFixture } from '@/features/messaging/fixtures/message-policy';
import { ManagerDetailScreen, ManagerDetailContent } from '@/features/managers/detail/ManagerDetailScreen';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { useState } from 'react';
import { env } from '@/env';
import { findManagerFixture } from '@/features/managers/fixtures/managers';
import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { Button } from '@/shared/ui/primitives/Button';
import { useTranslation } from 'react-i18next';
import { DevelopmentNotice } from '@/app/shell/DevelopmentNotice';
import { MessageDialog } from '@/features/messaging/MessageDialog';

export const Route = createFileRoute('/_app/managers/$managerId/')({ component: ManagerDetailRoute });

function ManagerDetailRoute() {
  const { managerId } = Route.useParams();
  const { t } = useTranslation('managers');
  const { t: messaging } = useTranslation('messaging');
  const [ready, setReady] = useState(false);
  const [channel, setChannel] = useState<'sms' | 'email'>();
  if (!env.VITE_REFERENCE_SCENARIOS) return <ManagerDetailScreen managerId={managerId} />;
  const record = findManagerFixture(managerId);
  if (record === undefined) return notFound({ throw: true });
  // TRANSPLANT_PENDING_MANAGER_DETAIL_INPUT: no server mutation or fake result at this boundary.
  return <section>
    <DevelopmentNotice ready={ready} />
    <PageHeader title={t('detailTitle')} breadcrumb={t('detail.breadcrumb')} actions={<>
      <Button onClick={() => setChannel('sms')}>{messaging('messages.smsTitle')}</Button>
      {record.accountStatus !== 'awaiting' ? <Button onClick={() => setChannel('email')}>{messaging('messages.emailTitle')}</Button> : null}
    </>} />
    {channel === undefined ? null : <MessageDialog channel={channel} policy={messagePolicyFixture(channel)} recipients={[{ address: (channel === 'sms' ? record.detail.phone : record.detail.email) ?? '', name: record.detail.name ?? '' }]} onClose={() => setChannel(undefined)} onConfirm={() => setReady(true)} />}
    <ManagerDetailContent key={managerId} managerId={managerId} manager={record.detail} accountStatus={record.accountStatus} onActionRequest={() => setReady(true)} />
  </section>;
}
