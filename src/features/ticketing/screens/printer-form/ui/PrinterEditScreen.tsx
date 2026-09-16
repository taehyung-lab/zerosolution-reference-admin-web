import { safeErrorKey } from '@/api/error-copy';
import { useTranslation } from 'react-i18next';
import { usePrinterDetail } from '@/features/ticketing/api/usePrinterDetail';
import type { PrinterSettings } from '@/features/ticketing/model/printer';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { ErrorTrace } from '@/shared/ui/feedback/ErrorTrace';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { toPrinterEditDefaults } from '../model/printer-form-defaults';
import type { PrinterFormInput } from '../model/printer-form-schema';
import { PrinterForm } from './PrinterForm';
import { usePrinterInputForm } from './usePrinterInputForm';

/**
 * 6.7.1.4 스마트프린터 수정(Figma, 2026-09-15 실측): 등록과 같은 항목을 조회 값으로 채워 보여 준다.
 * 조회 실패에도 제목이 남도록 헤더를 상태 경계 밖에 둔다. 폼은 조회가 성공한 뒤에만 mount 해
 * 서버 재조회가 입력 초안을 덮어쓰지 않게 한다. 진입 실패는 route loader 가 이미 처리했다.
 */
export function PrinterEditScreen({
  printerId,
  onConfirm,
  onCancel,
}: {
  readonly printerId: string;
  readonly onConfirm: (request: { printerId: string; input: PrinterSettings }) => void;
  readonly onCancel: () => void;
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
          t('printer.breadcrumb.edit'),
        ]}
        title={t('printer.form.editTitle')}
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
          <PrinterEditForm
            key={printerId}
            defaults={toPrinterEditDefaults(detail.data)}
            onConfirm={(input) => onConfirm({ printerId, input })}
            onCancel={onCancel}
          />
        ) : null}
      </DetailStateBoundary>
    </section>
  );
}

function PrinterEditForm({
  defaults,
  onConfirm,
  onCancel,
}: {
  readonly defaults: PrinterFormInput;
  readonly onConfirm: (values: PrinterSettings) => void;
  readonly onCancel: () => void;
}) {
  const input = usePrinterInputForm({ defaults, onConfirm });
  return (
    <PrinterForm
      dialogs={input.dialogs}
      form={input.form}
      onSubmit={input.submit}
      onCancel={() => input.guard.leave(onCancel)}
    />
  );
}
