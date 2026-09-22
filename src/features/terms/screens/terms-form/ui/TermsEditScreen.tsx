import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { updateTermsMutation } from '@/features/terms/api/mutations';
import { useTermsDetail } from '@/features/terms/api/useTermsDetail';
import type { TermsDetail } from '@/features/terms/model/terms';
import { useLocale } from '@/shared/i18n/locale-context';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { toTermsEditDefaults } from '../model/terms-form-defaults';
import { toTermsWriteInput } from '../model/terms-form-request';
import { termsFormFieldOrder, termsFormSchema } from '../model/terms-form-schema';
import { TermsForm } from './TermsForm';

/**
 * 11.2.4 약관 수정(Figma, 2026-09-22 실측): 등록과 같은 항목을 조회 값으로 채워 보여 준다.
 * 브레드크럼도 frame 그대로 `조회 > 수정` 이다.
 * 조회 실패에도 제목이 남도록 헤더를 상태 경계 밖에 둔다. 폼은 조회가 성공한 뒤에만 mount 해
 * 서버 재조회가 입력 초안을 덮어쓰지 않게 한다. 진입 실패는 route loader 가 이미 처리했다.
 */
export function TermsEditScreen({
  termsId,
  onSaved,
  onCancel,
}: {
  readonly termsId: string;
  readonly onSaved: (termsId: string) => void;
  readonly onCancel: () => void;
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
          t('terms.breadcrumb.edit'),
        ]}
        title={t('terms.form.editTitle')}
      />
      <DetailStateBoundary query={detail}>
        {(terms) => (
          <TermsEditForm
            key={terms.id}
            terms={terms}
            onSaved={() => onSaved(terms.id)}
            onCancel={onCancel}
          />
        )}
      </DetailStateBoundary>
    </section>
  );
}

function TermsEditForm({
  terms,
  onSaved,
  onCancel,
}: {
  readonly terms: TermsDetail;
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { locale } = useLocale();
  const update = useMutation(updateTermsMutation(locale));
  const save = useSaveForm({
    schema: termsFormSchema,
    defaultValues: toTermsEditDefaults(terms),
    sections: { info: termsFormFieldOrder },
    save: {
      run: (values) => update.mutateAsync({ termsId: terms.id, input: toTermsWriteInput(values) }),
      isPending: update.isPending,
    },
    mapError: (error) => classifyFormError(error, termsFormFieldOrder),
    onDone: onSaved,
  });

  return <TermsForm save={save} onCancel={onCancel} />;
}
