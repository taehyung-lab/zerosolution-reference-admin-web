import { useTranslation } from 'react-i18next';
import type { PrinterSettings } from '@/features/ticketing/model/printer';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { printerCreateDefaults } from '../model/printer-form-defaults';
import { PrinterForm } from './PrinterForm';
import { usePrinterInputForm } from './usePrinterInputForm';

/**
 * 6.7.1.3 스마트프린터 등록(Figma, 2026-09-15 실측). 저장은 검증 → 확인 alert → 요청 함수 도달까지이고
 * 성공 이후는 만들지 않는다. 취소·dirty 이탈은 공용 가드가 묻는다.
 */
export function PrinterCreateScreen({
  onConfirm,
  onCancel,
}: {
  readonly onConfirm: (values: PrinterSettings) => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('ticketing');
  const input = usePrinterInputForm({ defaults: printerCreateDefaults, onConfirm });

  return (
    <section>
      <PageHeader
        breadcrumbs={[
          t('printer.breadcrumb.ticketing'),
          t('printer.breadcrumb.extras'),
          t('printer.breadcrumb.printers'),
          t('printer.breadcrumb.create'),
        ]}
        title={t('printer.form.createTitle')}
      />
      <PrinterForm
        dialogs={input.dialogs}
        form={input.form}
        onSubmit={input.submit}
        onCancel={() => input.guard.leave(onCancel)}
      />
    </section>
  );
}
