/**
 * 11.2.2 약관 조회 — Figma frame(2026-09-22 aside 실측). `기본정보` 섹션이 버전·시행일·게시 상태
 * (+반대 상태로 바꾸는 버튼)·게시일·본문을 읽기 전용으로 보여 주고, `업데이트 이력` 섹션이 3열 표를
 * 보여 준다. 하단은 `수정`·`삭제`.
 *
 * 두 전이 모두 원문이 확인 alert 을 적는다 — 상태 전환은 `게시안함으로 변경하시겠습니까? / 확인, 취소`,
 * 삭제는 `삭제하시겠습니까? / 확인, 취소`. 확인창은 상태 경계 안쪽의 분기가 아니라 늘 mount 되는 이
 * 컴포넌트가 소유해 재조회가 열린 팝업을 떨어뜨리지 않는다.
 *
 * 헤더는 상태 경계 밖에 두어 조회 실패에도 제목이 남는다. 진입 실패는 route loader 가 처리했다.
 */
import { useMutation } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteTermsMutation, updateTermsStatusMutation } from '@/features/terms/api/mutations';
import { useTermsDetail } from '@/features/terms/api/useTermsDetail';
import type { TermsDetail } from '@/features/terms/model/terms';
import { useLocale } from '@/shared/i18n/locale-context';
import { displayTimeZone, formatDate, formatTimeInTimeZone } from '@/shared/lib/datetime';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { DetailField } from '@/shared/ui/detail/DetailField';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { UpdateHistory } from '@/shared/ui/detail/UpdateHistory';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import { Button } from '@/shared/ui/primitives/Button';
import { toTermsHistoryEntries } from '../model/terms-history';

export function TermsDetailScreen({
  termsId,
  onEdit,
  onDeleted,
}: {
  readonly termsId: string;
  readonly onEdit: (termsId: string) => void;
  /** 삭제가 실제로 성공한 뒤의 이동. 서버가 없는 동안은 닿지 않는다. */
  readonly onDeleted: () => void;
}) {
  const { t } = useTranslation('terms');
  const detail = useTermsDetail(termsId);

  return (
    <section>
      <PageHeader
        breadcrumbs={[
          t('terms.breadcrumb.settings'),
          t('terms.breadcrumb.terms'),
          t('terms.breadcrumb.detail'),
        ]}
        title={t('terms.detail.title')}
      />
      <DetailStateBoundary query={detail}>
        {(terms) => <TermsDetailContent terms={terms} onEdit={onEdit} onDeleted={onDeleted} />}
      </DetailStateBoundary>
    </section>
  );
}

function TermsDetailContent({
  terms,
  onEdit,
  onDeleted,
}: {
  readonly terms: TermsDetail;
  readonly onEdit: (termsId: string) => void;
  readonly onDeleted: () => void;
}) {
  const { t } = useTranslation('terms');
  const { t: shared } = useTranslation('shared');
  const { locale } = useLocale();
  const remove = useMutation(deleteTermsMutation(locale));
  const changeStatus = useMutation(updateTermsStatusMutation(locale));
  const nextStatus = terms.status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
  const statusChange = useConfirmation({
    run: (status: typeof nextStatus) => changeStatus.mutateAsync({ termsId: terms.id, status }),
    description: (status) => t(`terms.detail.statusConfirm.${status}`),
  });
  const deletion = useConfirmation<string>({
    run: (termsId) => remove.mutateAsync(termsId).then(onDeleted),
    description: shared('deleteConfirm.description'),
  });
  const empty = t('terms.columns.emptyValue');

  return (
    <div className="space-y-5">
      <SectionCard title={t('terms.detail.section')}>
        <div className="space-y-4">
          <Fields>
            <DetailField label={t('terms.columns.version')}>
              {t('terms.detail.version', { version: terms.version })}
            </DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('terms.columns.effectiveAt')}>
              {formatDateTime(terms.effectiveAt) || empty}
            </DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('terms.columns.status')}>
              <span className="inline-flex flex-wrap items-center gap-3">
                {t(`terms.values.status.${terms.status}`)}
                <Button
                  type="button"
                  className="bg-white text-neutral-900 ring-1 ring-neutral-300"
                  onClick={() => statusChange.request(nextStatus)}
                >
                  {t(`terms.values.status.${nextStatus}`)}
                </Button>
              </span>
            </DetailField>
            <DetailField label={t('terms.columns.publishedAt')}>
              {formatDateTime(terms.publishedAt) || empty}
            </DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('terms.columns.body')}>
              <p className="whitespace-pre-line">{terms.body}</p>
            </DetailField>
          </Fields>
        </div>
      </SectionCard>

      <SectionCard title={t('terms.detail.history')}>
        <UpdateHistory
          entries={toTermsHistoryEntries(terms.changeLogs, t)}
          labels={{
            date: t('terms.detail.historyDate'),
            change: t('terms.detail.historyChange'),
            actor: t('terms.detail.historyManager'),
          }}
          emptyText={t('terms.detail.historyEmpty')}
        />
      </SectionCard>

      <div className="flex justify-center gap-2">
        <Button onClick={() => onEdit(terms.id)}>{t('terms.detail.edit')}</Button>
        <Button
          className="bg-white text-neutral-900 ring-1 ring-neutral-300"
          onClick={() => deletion.request(terms.id)}
        >
          {t('terms.detail.delete')}
        </Button>
      </div>
      {statusChange.dialog}
      {deletion.dialog}
    </div>
  );
}

/** frame 의 한 행은 `dl` 하나다. `dl` 은 `dt`/`dd` 만 담으므로 그룹 소제목은 밖에 둔다. */
function Fields({ children }: { readonly children: ReactNode }) {
  return <dl className="grid gap-x-8 md:grid-cols-2">{children}</dl>;
}

/** frame 의 `2026-06-01 12:12:00` 표기. */
function formatDateTime(instant: string): string {
  const day = formatDate(instant);
  if (day === '') return '';
  return `${day} ${formatTimeInTimeZone(instant, displayTimeZone(), 'second')}`;
}
