/**
 * 배너 등록·수정 폼 — Figma 7.1.3 등록 / 7.1.4 수정 frame 의 `기본정보` 섹션을 화면 순서대로 조립한다
 * (2026-09-23 aside 실측): 구분 * → 게시순서 *(안내 `숫자만 입력 가능합니다.`) → 배너명 * →
 * 이동경로(유형 * · URL *) → 이미지 *(안내 `권장 사이즈 … png, 1MB 이하`) → 게시기간 * · 게시 상태 * →
 * 저장·취소. 규칙(필수·글자수·입력가능문자·기본값)은 스키마·기본값 파일이 소유한다.
 */
import { useTranslation } from 'react-i18next';
import {
  bannerCategories,
  bannerLinkTypes,
  bannerStatuses,
} from '@/features/exhibitions/model/banner';
import { FormCancelButton } from '@/shared/ui/form/FormCancelButton';
import { FormDateRangeField } from '@/shared/ui/form/FormDateRangeField';
import { FormFileField } from '@/shared/ui/form/FormFileField';
import { FormSaveFailureMessage } from '@/shared/ui/form/FormSaveDialogs';
import { FormSelectField } from '@/shared/ui/form/FormSelectField';
import { FormSubmitButton } from '@/shared/ui/form/FormSubmitButton';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import type { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import {
  BANNER_IMAGE_ACCEPT,
  BANNER_NAME_MAX_LENGTH,
  BANNER_ORDER_MAX_LENGTH,
  type BannerFormInput,
  type BannerFormValues,
} from '../model/banner-form-schema';

export type BannerSaveForm = ReturnType<typeof useSaveForm<BannerFormInput, BannerFormValues, 'info'>>;

export function BannerForm({
  save,
  onCancel,
}: {
  readonly save: BannerSaveForm;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('exhibitions');
  const { form } = save;

  return (
    <>
      {save.dialogs}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save.submit.run();
        }}
      >
        {save.stage.kind === 'failed' ? <FormSaveFailureMessage failure={save.stage.root} /> : null}
        <SectionCard title={t('banner.form.section')} {...save.sections.sectionProps('info')}>
          <div className="space-y-6">
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <FormSelectField
                form={form}
                label={t('banner.columns.category')}
                name="category"
                options={bannerCategories.map((value) => ({
                  value,
                  label: t(`banner.values.category.${value}`),
                }))}
                required
              />
            </div>
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <FormTextField
                form={form}
                label={t('banner.columns.order')}
                name="order"
                description={t('banner.form.orderHint')}
                inputMode="numeric"
                maxLength={BANNER_ORDER_MAX_LENGTH}
                required
              />
            </div>
            <FormTextField
              form={form}
              label={t('banner.columns.name')}
              name="name"
              placeholder={t('banner.form.namePlaceholder')}
              maxLength={BANNER_NAME_MAX_LENGTH}
              required
            />
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-neutral-800">{t('banner.detail.link')}</legend>
              <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
                <FormSelectField
                  form={form}
                  label={t('banner.detail.linkType')}
                  name="linkType"
                  options={bannerLinkTypes.map((value) => ({
                    value,
                    label: t(`banner.values.linkType.${value}`),
                  }))}
                  required
                />
                <FormTextField
                  form={form}
                  label={t('banner.detail.linkUrl')}
                  name="linkUrl"
                  placeholder={t('banner.detail.linkUrl')}
                  required
                />
              </div>
            </fieldset>
            <FormFileField
              form={form}
              name="image"
              label={t('banner.detail.image')}
              selectLabel={t('banner.form.selectFile')}
              removeLabel={t('banner.form.removeFile')}
              accept={BANNER_IMAGE_ACCEPT}
              description={t('banner.form.imageHint')}
              required
            />
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <FormDateRangeField
                form={form}
                name="postPeriod"
                label={t('banner.columns.postPeriod')}
                fromLabel={t('banner.form.periodFrom')}
                toLabel={t('banner.form.periodTo')}
                required
              />
              <FormSelectField
                form={form}
                label={t('banner.columns.status')}
                name="status"
                options={bannerStatuses.map((value) => ({
                  value,
                  label: t(`banner.values.status.${value}`),
                }))}
                required
              />
            </div>
          </div>
        </SectionCard>
        <div className="mt-6 flex justify-center gap-2">
          <FormSubmitButton pending={save.submit.isPending} />
          <FormCancelButton disabled={save.submit.isPending} onClick={() => save.guard.leave(onCancel)} />
        </div>
      </form>
    </>
  );
}
