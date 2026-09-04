import { formatDate } from '@/shared/lib/datetime';
import { DetailField } from '@/shared/ui/patterns/DetailField';
import { DetailStateBoundary } from '@/shared/ui/patterns/DetailStateBoundary';
import { ErrorTrace } from '@/shared/ui/patterns/ErrorTrace';
import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { SectionCard } from '@/shared/ui/patterns/SectionCard';
import { UpdateHistory } from '@/shared/ui/patterns/UpdateHistory';
import { Badge } from '@/shared/ui/primitives/Badge';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { ManagerDetail } from '../api/manager-detail-contract';
import { safeErrorKey } from '../model/error-copy';
import { managerStatusMeta } from '../model/status';
import { toManagerHistoryEntries } from './manager-history';
import { useManagerDetail } from './useManagerDetail';

export function ManagerDetailScreen({
  managerId,
}: {
  readonly managerId: string;
}) {
  const { t } = useTranslation('managers');
  const { t: sharedT } = useTranslation('shared');
  const detail = useManagerDetail(managerId);

  return (
    <section>
      <PageHeader
        breadcrumb={t('detail.breadcrumb')}
        title={t('detailTitle')}
      />
      <DetailStateBoundary
        state={detail.state}
        labels={{
          error: detail.error ? sharedT(safeErrorKey(detail.error.kind)) : t('detail.error'),
          notFound: t('detail.notFound'),
        }}
        retryLabel={t('result.retry')}
        onRetry={() => void detail.retry()}
        trace={detail.error ? <ErrorTrace value={detail.error} /> : null}
      >
        {detail.data ? (
          <ManagerDetailContent manager={detail.data} managerId={managerId} />
        ) : null}
      </DetailStateBoundary>
    </section>
  );
}

function ManagerDetailContent({
  manager,
  managerId,
}: {
  readonly manager: ManagerDetail;
  readonly managerId: string;
}) {
  const { t } = useTranslation('managers');
  const status = managerStatusMeta(manager.status?.id);
  const empty = t('detail.emptyValue');
  return (
    <>
      <SectionCard title={t('detail.section')}>
        <dl className="grid md:grid-cols-2 md:gap-x-8">
          <DetailField label={t('detail.type')}>
            {manager.type?.name ?? empty}
          </DetailField>
          <DetailField label={t('detail.id')}>{manager.id ?? empty}</DetailField>
          <DetailField label={t('detail.name')}>
            {manager.name ?? empty}
          </DetailField>
          <DetailField label={t('detail.phone')}>
            {manager.phone ?? empty}
          </DetailField>
          <DetailField label={t('detail.email')}>
            {manager.email ?? empty}
          </DetailField>
          <DetailField label={t('detail.organization')}>
            {manager.organization ?? manager.agency?.name ?? empty}
          </DetailField>
          <DetailField label={t('detail.permission')}>
            {manager.permission?.name ?? empty}
          </DetailField>
          <DetailField label={t('detail.registrationRoute')}>
            {manager.registrationRoute?.name ?? empty}
          </DetailField>
          <DetailField label={t('detail.status')}>
            <Badge tone={status.tone}>{t(status.labelKey)}</Badge>
          </DetailField>
          <DetailField label={t('detail.createdAt')}>
            {formatDate(manager.createdAt) || empty}
          </DetailField>
          {manager.status?.id === 'INACTIVE' && manager.statusReason ? (
            <DetailField label={t('detail.statusReason')}>
              {manager.statusReason}
            </DetailField>
          ) : null}
        </dl>
      </SectionCard>
      <div className="mt-5">
        <SectionCard title={t('detail.history')}>
          <UpdateHistory
            entries={toManagerHistoryEntries(manager.changeLogs, t)}
            labels={{
              date: t('detail.historyDate'),
              change: t('detail.historyChange'),
              manager: t('detail.historyManager'),
            }}
            emptyText={t('detail.historyEmpty')}
          />
        </SectionCard>
      </div>
      <div className="mt-8 flex justify-center">
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-neutral-900 px-8 text-sm font-medium text-white"
          params={{ managerId }}
          to="/managers/$managerId/edit"
        >
          {t('form.editAction')}
        </Link>
      </div>
    </>
  );
}
