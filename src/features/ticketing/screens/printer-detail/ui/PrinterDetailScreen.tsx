/**
 * 6.7.1.2 스마트프린터 조회 — Figma frame(2026-09-15 aside 렌더 실측): `기본정보` 섹션이 등록 항목을
 * 읽기 전용으로 frame 의 행 단위(기기명·시리얼번호 / 모델명·제조사 / 구매일 / 보관위치·상태 /
 * 조치사항 / 용도·사용상태)로 보여 주고, `업데이트 이력` 섹션과 하단 `수정`·`삭제` 가 따른다.
 * 삭제는 공통 삭제 확인 alert 를 거쳐 요청 함수에 닿는다.
 * 헤더는 상태 경계 밖에 두어 조회 실패에도 제목이 남는다. 진입 실패는 route loader 가 처리했다.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { safeErrorKey } from '@/api/error-copy';
import { usePrinterDetail } from '@/features/ticketing/api/usePrinterDetail';
import type { PrinterDetail } from '@/features/ticketing/model/printer';
import { useConfirmation } from '@/shared/model/use-confirmation';
import { ConfirmDialog } from '@/shared/ui/dialog/ConfirmDialog';
import { DetailField } from '@/shared/ui/detail/DetailField';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { UpdateHistory } from '@/shared/ui/detail/UpdateHistory';
import { ErrorTrace } from '@/shared/ui/feedback/ErrorTrace';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import { Button } from '@/shared/ui/primitives/Button';
import { toPrinterHistoryEntries } from '../model/printer-history';

export function PrinterDetailScreen({
  printerId,
  onEdit,
  onDelete,
}: {
  readonly printerId: string;
  readonly onEdit: (printerId: string) => void;
  readonly onDelete: (printerId: string) => void;
}) {
  const { t } = useTranslation('ticketing');
  const { t: shared } = useTranslation('shared');
  const detail = usePrinterDetail(printerId);

  return (
    <section>
      <PageHeader
        breadcrumbs={[
          t('printer.breadcrumb.ticketing'),
          t('printer.breadcrumb.extras'),
          t('printer.breadcrumb.printers'),
          t('printer.breadcrumb.detail'),
        ]}
        title={t('printer.detail.title')}
      />
      <DetailStateBoundary
        state={detail.state}
        labels={{
          error: shared(safeErrorKey(detail.error?.kind)),
          notFound: shared('error.kind.notFound'),
        }}
        retryLabel={shared('error.unexpected.retry')}
        onRetry={() => void detail.retry()}
        trace={detail.error ? <ErrorTrace value={detail.error} /> : null}
      >
        {detail.data ? (
          <PrinterDetailContent printer={detail.data} onEdit={onEdit} onDelete={onDelete} />
        ) : null}
      </DetailStateBoundary>
    </section>
  );
}

function PrinterDetailContent({
  printer,
  onEdit,
  onDelete,
}: {
  readonly printer: PrinterDetail;
  readonly onEdit: (printerId: string) => void;
  readonly onDelete: (printerId: string) => void;
}) {
  const { t } = useTranslation('ticketing');
  const { t: shared } = useTranslation('shared');
  const empty = t('printer.detail.emptyValue');
  const text = (value: string) => (value === '' ? empty : value);
  const deletion = useConfirmation<string>({ run: onDelete });

  return (
    <div className="space-y-5">
      <SectionCard title={t('printer.detail.section')}>
        <div className="space-y-4">
          <Fields>
            <DetailField label={t('printer.form.name')}>{text(printer.name)}</DetailField>
            <DetailField label={t('printer.form.serialNo')}>{text(printer.serialNo)}</DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('printer.form.model')}>{text(printer.model)}</DetailField>
            <DetailField label={t('printer.form.manufacturer')}>
              {text(printer.manufacturer)}
            </DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('printer.form.purchasedAt')}>
              {text(printer.purchasedAt)}
            </DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('printer.form.location')}>{text(printer.location)}</DetailField>
            <DetailField label={t('printer.form.status')}>
              {t(`printer.values.status.${printer.status}`)}
            </DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('printer.form.measures')}>{text(printer.measures)}</DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('printer.form.purpose')}>
              {t(`printer.values.purpose.${printer.purpose}`)}
            </DetailField>
            <DetailField label={t('printer.form.usage')}>
              {t(`printer.values.usage.${printer.usage}`)}
            </DetailField>
          </Fields>
        </div>
      </SectionCard>
      <SectionCard title={t('printer.detail.history')}>
        <UpdateHistory
          entries={toPrinterHistoryEntries(printer.changeLogs, t)}
          labels={{
            date: t('printer.detail.historyDate'),
            change: t('printer.detail.historyChange'),
            actor: t('printer.detail.historyManager'),
          }}
          emptyText={t('printer.detail.historyEmpty')}
        />
      </SectionCard>
      <div className="mt-8 flex justify-center gap-2">
        <Button onClick={() => onEdit(printer.id)}>{t('printer.detail.edit')}</Button>
        <Button
          className="bg-white text-neutral-900 ring-1 ring-neutral-300"
          onClick={() => deletion.requestConfirmation(printer.id)}
        >
          {t('printer.detail.delete')}
        </Button>
      </div>
      <ConfirmDialog
        open={deletion.state.kind === 'confirm'}
        title={shared('alert.title')}
        description={shared('deleteConfirm.description')}
        confirmLabel={shared('formSave.confirm')}
        cancelLabel={shared('formSave.cancel')}
        onOpenChange={(open) => {
          if (!open) deletion.close();
        }}
        onConfirm={deletion.confirm}
      />
    </div>
  );
}

/** frame 의 한 행. `dl` 은 dt/dd 쌍(DetailField)만 담아 content model 을 지킨다. */
function Fields({ children }: { readonly children: ReactNode }) {
  return <dl className="grid gap-x-8 md:grid-cols-2">{children}</dl>;
}
