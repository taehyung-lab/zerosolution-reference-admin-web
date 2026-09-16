import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { updatePrinterMutation } from '@/features/ticketing/api/mutations';
import { usePrinterDetail } from '@/features/ticketing/api/usePrinterDetail';
import type { PrinterDetail } from '@/features/ticketing/model/printer';
import { useLocale } from '@/shared/i18n/locale-context';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { toPrinterEditDefaults } from '../model/printer-form-defaults';
import { toPrinterSettings } from '../model/printer-form-request';
import { printerFormFieldOrder, printerFormSchema } from '../model/printer-form-schema';
import { PrinterForm } from './PrinterForm';

/**
 * 6.7.1.4 스마트프린터 수정(Figma, 2026-09-15 실측): 등록과 같은 항목을 조회 값으로 채워 보여 준다.
 * 조회 실패에도 제목이 남도록 헤더를 상태 경계 밖에 둔다. 폼은 조회가 성공한 뒤에만 mount 해
 * 서버 재조회가 입력 초안을 덮어쓰지 않게 한다. 진입 실패는 route loader 가 이미 처리했다.
 */
export function PrinterEditScreen({
  printerId,
  onSaved,
  onCancel,
}: {
  readonly printerId: string;
  readonly onSaved: (printerId: string) => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('ticketing');
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
      <DetailStateBoundary query={detail}>
        {(printer) => (
          <PrinterEditForm
            key={printer.id}
            printer={printer}
            onSaved={() => onSaved(printer.id)}
            onCancel={onCancel}
          />
        )}
      </DetailStateBoundary>
    </section>
  );
}

function PrinterEditForm({
  printer,
  onSaved,
  onCancel,
}: {
  readonly printer: PrinterDetail;
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { locale } = useLocale();
  const update = useMutation(updatePrinterMutation(locale, printer.id));
  const save = useSaveForm({
    schema: printerFormSchema,
    defaultValues: toPrinterEditDefaults(printer),
    sections: { info: printerFormFieldOrder },
    save: {
      run: (values) => update.mutateAsync(toPrinterSettings(values)),
      isPending: update.isPending,
    },
    mapError: (error) => classifyFormError(error, printerFormFieldOrder),
    onDone: onSaved,
  });
  return <PrinterForm save={save} onCancel={onCancel} />;
}
