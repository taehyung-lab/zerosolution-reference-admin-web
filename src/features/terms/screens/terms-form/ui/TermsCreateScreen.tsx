import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { createTermsMutation } from '@/features/terms/api/mutations';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { termsCreateDefaults } from '../model/terms-form-defaults';
import { toTermsWriteInput } from '../model/terms-form-request';
import { termsFormFieldOrder, termsFormSchema } from '../model/terms-form-schema';
import { TermsForm } from './TermsForm';

/**
 * 11.2.3 약관 등록(Figma, 2026-09-22 실측). 검증 → 저장 확인 → mutation → 저장 완료 → 목록
 * (Notion `저장 버튼 → 클릭시, 유효성 체크`). 서버가 없는 동안 mutation 은 미연결 실패로 끝나 폼 위에
 * 공용 실패 문구가 남고 그 다음은 일어나지 않는다. 취소는 원문의 취소 alert 을 공용 이탈 guard 가 연다.
 */
export function TermsCreateScreen({
  onSaved,
  onCancel,
}: {
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('terms');
  const { locale } = useLocale();
  const create = useMutation(createTermsMutation(locale));
  const save = useSaveForm({
    schema: termsFormSchema,
    defaultValues: termsCreateDefaults(),
    sections: { info: termsFormFieldOrder },
    save: {
      run: (values) => create.mutateAsync(toTermsWriteInput(values)),
      isPending: create.isPending,
    },
    mapError: (error) => classifyFormError(error, termsFormFieldOrder),
    onDone: onSaved,
  });

  return (
    <section>
      <PageHeader
        breadcrumbs={[
          t('terms.breadcrumb.settings'),
          t('terms.breadcrumb.terms'),
          t('terms.breadcrumb.create'),
        ]}
        title={t('terms.form.createTitle')}
      />
      <TermsForm save={save} onCancel={onCancel} />
    </section>
  );
}
