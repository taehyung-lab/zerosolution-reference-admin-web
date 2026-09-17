import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { updateMemberMutation } from '@/features/members/api/mutations';
import { useMemberDetail } from '@/features/members/api/useMemberDetail';
import type { MemberProfile } from '@/features/members/model/member';
import { useLocale } from '@/shared/i18n/locale-context';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { toMemberEditDefaults } from '../model/member-form-defaults';
import { toMemberSettings } from '../model/member-form-request';
import { memberEditFieldOrder, memberEditSchema } from '../model/member-form-schema';
import { MemberEditOnlyFields, MemberForm } from './MemberForm';

/**
 * 4.2.3 회원 수정: 조회 값으로 항목을 채우고 이메일은 읽기 전용, 계정 상태에 따라 활동제한이 열린다.
 * 조회 실패에도 제목이 남도록 헤더를 상태 경계 밖에 둔다. 폼은 조회가 성공한 뒤에만 mount 해 서버 재조회가
 * 입력 초안을 덮어쓰지 않게 한다. 진입 실패는 route loader 가 이미 처리했다.
 */
export function MemberEditScreen({
  memberId,
  onSaved,
  onCancel,
}: {
  readonly memberId: string;
  readonly onSaved: (memberId: string) => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('members');
  const detail = useMemberDetail(memberId);

  return (
    <section>
      <PageHeader
        breadcrumbs={[t('path.members'), t('path.active'), t('path.detail'), t('path.edit')]}
        title={t('form.editTitle')}
      />
      <DetailStateBoundary query={detail}>
        {(member) => <MemberEditForm key={member.id} member={member} onSaved={() => onSaved(member.id)} onCancel={onCancel} />}
      </DetailStateBoundary>
    </section>
  );
}

function MemberEditForm({
  member,
  onSaved,
  onCancel,
}: {
  readonly member: MemberProfile;
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { locale } = useLocale();
  const update = useMutation(updateMemberMutation(locale));
  const save = useSaveForm({
    schema: memberEditSchema,
    defaultValues: toMemberEditDefaults(member),
    sections: { info: memberEditFieldOrder },
    save: {
      run: (values) => update.mutateAsync({ memberId: member.id, settings: toMemberSettings(values) }),
      isPending: update.isPending,
    },
    mapError: (error) => classifyFormError(error, memberEditFieldOrder),
    onDone: onSaved,
  });

  return (
    <MemberForm save={save} onCancel={onCancel}>
      <MemberEditOnlyFields form={save.form} email={member.email} />
    </MemberForm>
  );
}
