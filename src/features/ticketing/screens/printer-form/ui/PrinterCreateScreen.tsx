import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { createPrinterMutation } from '@/features/ticketing/api/mutations';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { printerCreateDefaults } from '../model/printer-form-defaults';
import { toPrinterSettings } from '../model/printer-form-request';
import { printerFormFieldOrder, printerFormSchema } from '../model/printer-form-schema';
import { PrinterForm } from './PrinterForm';

/**
 * 6.7.1.3 스마트프린터 등록(Figma, 2026-09-15 실측). 검증 → 저장 확인 → mutation → 저장 완료 → 목록.
 * 서버가 없는 동안 mutation 은 미연결 실패로 끝나 폼 위에 공용 실패 문구가 남고 그 다음은 일어나지 않는다.
 */
export function PrinterCreateScreen({
  onSaved,
  onCancel,
}: {
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('ticketing');
  const { locale } = useLocale();
  const create = useMutation(createPrinterMutation(locale));
  const save = useSaveForm({
    schema: printerFormSchema,
    defaultValues: printerCreateDefaults,
    sections: { info: printerFormFieldOrder },
    save: {
      run: (values) => create.mutateAsync(toPrinterSettings(values)),
      isPending: create.isPending,
    },
    mapError: (error) => classifyFormError(error, printerFormFieldOrder),
    onDone: onSaved,
  });

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
      <PrinterForm save={save} onCancel={onCancel} />
    </section>
  );
}
