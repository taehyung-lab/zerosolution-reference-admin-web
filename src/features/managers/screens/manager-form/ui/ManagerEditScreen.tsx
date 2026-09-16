import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { updateManagerMutation } from '@/features/managers/api/mutations';
import { useManagerDetail } from '@/features/managers/api/useManagerDetail';
import type { ManagerDetail } from '@/features/managers/model/manager';
import { useLocale } from '@/shared/i18n/locale-context';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { toManagerEditDefaults } from '../model/manager-form-defaults';
import { toManagerSettings } from '../model/manager-form-request';
import { managerEditFieldOrder, managerEditSchema } from '../model/manager-form-schema';
import { ManagerForm } from './ManagerForm';

/**
 * 11.1.4 운영자 수정: 등록과 같은 항목을 조회 값으로 채워 보여 주고 아이디는 읽기 전용이다.
 * 조회 실패에도 제목이 남도록 헤더를 상태 경계 밖에 둔다. 폼은 조회가 성공한 뒤에만 mount 해
 * 서버 재조회가 입력 초안을 덮어쓰지 않게 한다. 진입 실패는 route loader 가 이미 처리했다.
 */
export function ManagerEditScreen({
  managerId,
  onSaved,
  onCancel,
}: {
  readonly managerId: string;
  readonly onSaved: (managerId: string) => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('managers');
  const detail = useManagerDetail(managerId);

  return (
    <section>
      <PageHeader
        breadcrumbs={[t('path.settings'), t('path.managers'), t('path.detail'), t('path.edit')]}
        title={t('form.editTitle')}
      />
      <DetailStateBoundary query={detail}>
        {(manager) => (
          <ManagerEditForm key={manager.id} manager={manager} onSaved={() => onSaved(manager.id)} onCancel={onCancel} />
        )}
      </DetailStateBoundary>
    </section>
  );
}

function ManagerEditForm({
  manager,
  onSaved,
  onCancel,
}: {
  readonly manager: ManagerDetail;
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('managers');
  const { locale } = useLocale();
  const update = useMutation(updateManagerMutation(locale));
  const save = useSaveForm({
    schema: managerEditSchema,
    defaultValues: toManagerEditDefaults(manager),
    sections: { info: managerEditFieldOrder },
    save: {
      run: (values) => update.mutateAsync({ managerId: manager.id, settings: toManagerSettings(values) }),
      isPending: update.isPending,
    },
    mapError: (error) => classifyFormError(error, managerEditFieldOrder),
    onDone: onSaved,
  });
  return (
    <ManagerForm
      save={save}
      identity={<FormTextField readOnly label={t('form.id')} value={manager.id} />}
      onCancel={onCancel}
    />
  );
}
