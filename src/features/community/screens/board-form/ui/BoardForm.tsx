import { useTranslation } from 'react-i18next';
import { boardPermissions, boardRecordCategories } from '@/features/community/model/board';
import { FormCancelButton } from '@/shared/ui/form/FormCancelButton';
import type { FieldForm } from '@/shared/ui/form/FormField';
import { FormSelectField } from '@/shared/ui/form/FormSelectField';
import { FormSubmitButton } from '@/shared/ui/form/FormSubmitButton';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import { SectionCard } from '@/shared/ui/patterns/SectionCard';
import type { BoardFormInput } from '../model/board-form-schema';

/**
 * 등록·수정이 공유하는 입력 필드와 저장·취소 표면이다. 원문이 등록 절에 열거한 세 필드만 있고
 * 선택지는 서버가 아니라 도메인 상수라 옵션 Query 가 없다(그래서 route loader 예열도 없다).
 * schema·초기값·확인창·완료 이동은 각 화면이 선언한다.
 */
export function BoardForm({
  form,
  onSubmit,
  onCancel,
}: {
  readonly form: FieldForm<BoardFormInput>;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('community');

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <SectionCard title={t('board.form.section')} collapsible={false}>
        <div className="space-y-4 md:w-1/2">
          <FormSelectField
            form={form}
            label={t('board.columns.category')}
            name="category"
            options={boardRecordCategories.map((value) => ({
              value,
              label: t(`board.values.category.${value}`),
            }))}
            placeholder={t('board.form.selectPlaceholder')}
            required
          />
          <FormTextField
            form={form}
            label={t('board.columns.name')}
            name="name"
            required
          />
          <FormSelectField
            form={form}
            label={t('board.detail.writePermission')}
            name="writePermission"
            options={boardPermissions.map((value) => ({
              value,
              label: t(`board.values.permission.${value}`),
            }))}
            placeholder={t('board.form.selectPlaceholder')}
            required
          />
        </div>
      </SectionCard>
      <div className="mt-6 flex justify-center gap-2">
        <FormSubmitButton pending={false} />
        <FormCancelButton onClick={onCancel} />
      </div>
    </form>
  );
}
