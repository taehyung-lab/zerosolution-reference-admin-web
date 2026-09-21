/**
 * 5.2 공연 조회. `입장안내정보`(도면·안내 가이드, 없으면 안내 문구 + 수정)와 `기본정보`(언어 탭·회차·이벤트·좌석·등급),
 * `업데이트 내역`(있을 때만) 순이다. 헤더는 상태 경계 밖에 두어 조회 실패에도 제목이 남는다.
 * 진입 실패는 route loader 가 처리했다.
 */
import { useTranslation } from 'react-i18next';
import { usePerformanceDetail } from '@/features/performances/api/usePerformanceDetail';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { UpdateHistory } from '@/shared/ui/detail/UpdateHistory';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import { PerformanceBasicSection } from '@/features/performances/shared/basic-info/ui/PerformanceBasicSection';
import { toPerformanceHistoryEntries } from '../model/performance-history';
import { PerformanceAdmissionSection } from './PerformanceAdmissionSection';

export function PerformanceDetailScreen({
  performanceId,
  onEdit,
}: {
  readonly performanceId: string;
  readonly onEdit: (performanceId: string) => void;
}) {
  const { t } = useTranslation('performances');
  const detail = usePerformanceDetail(performanceId);

  return (
    <section>
      <PageHeader title={t('detail.title')} breadcrumbs={[t('detail.path'), t('title'), t('detail.view')]} />
      <DetailStateBoundary query={detail}>
        {(performance) => (
          <div className="space-y-5">
            <PerformanceAdmissionSection admission={performance.admission} onEdit={() => onEdit(performance.id)} />
            <PerformanceBasicSection key={performance.id} basic={performance.basic} />
            {performance.history.length > 0 ? (
              <SectionCard title={t('detail.history')}>
                <UpdateHistory
                  entries={toPerformanceHistoryEntries(performance.history, t)}
                  labels={{
                    date: t('detail.historyDate'),
                    change: t('detail.historyChange'),
                    actor: t('detail.historyManager'),
                  }}
                  emptyText={t('detail.emptyValue')}
                />
              </SectionCard>
            ) : null}
          </div>
        )}
      </DetailStateBoundary>
    </section>
  );
}
