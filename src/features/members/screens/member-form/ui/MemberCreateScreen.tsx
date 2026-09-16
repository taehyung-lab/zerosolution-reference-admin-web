import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { createMemberMutation } from '@/features/members/api/mutations';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { memberCreateDefaults } from '../model/member-form-defaults';
import { toMemberCreateSettings } from '../model/member-form-request';
import { memberCreateFieldOrder, memberCreateSchema } from '../model/member-form-schema';
import { MemberCreateIdentityFields, MemberForm } from './MemberForm';

/**
 * 4.2.2 회원 등록. 검증 → 저장 확인 → mutation → 저장 완료 → 목록. 서버가 없는 동안 mutation 은
 * 도달만 기록하고 성공으로 끝난다(`api/scenario`).
 */
export function MemberCreateScreen({
  onSaved,
  onCancel,
}: {
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('members');
  const { locale } = useLocale();
  const create = useMutation(createMemberMutation(locale));
  const save = useSaveForm({
    schema: memberCreateSchema,
    defaultValues: memberCreateDefaults,
    sections: { info: memberCreateFieldOrder },
    save: {
      run: (values) => create.mutateAsync(toMemberCreateSettings(values)),
      isPending: create.isPending,
    },
    mapError: (error) => classifyFormError(error, memberCreateFieldOrder),
    onDone: onSaved,
  });

  return (
    <section>
      <PageHeader breadcrumbs={[t('path.members'), t('path.active'), t('path.create')]} title={t('form.createTitle')} />
      <MemberForm save={save} identity={<MemberCreateIdentityFields form={save.form} />} onCancel={onCancel} />
    </section>
  );
}
