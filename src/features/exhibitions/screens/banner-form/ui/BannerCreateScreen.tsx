import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { createBannerMutation } from '@/features/exhibitions/api/mutations';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { bannerCreateDefaults } from '../model/banner-form-defaults';
import { toBannerWriteInput } from '../model/banner-form-request';
import { bannerFormFieldOrder, bannerFormSchema } from '../model/banner-form-schema';
import { BannerForm } from './BannerForm';

/**
 * 7.1.3 배너 등록(Figma, 2026-09-23 실측). 검증 → 저장 확인 → mutation → 저장 완료 → 목적지.
 * 목적지는 저장 완료 alert 의 `확인 : 등록된 조회 화면으로 이동` 이다(화면 간 원문 행, BANNER-FORM 추론 1) —
 * 응답이 새 배너 ID 를 주면 그 조회로, 주지 않으면(서버 미연결의 시나리오 요청) caller 가 목록으로 보낸다.
 * 취소는 원문의 취소 alert 을 공용 이탈 guard 가 연다.
 */
export function BannerCreateScreen({
  onSaved,
  onCancel,
}: {
  readonly onSaved: (bannerId: string | undefined) => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('exhibitions');
  const { locale } = useLocale();
  const create = useMutation(createBannerMutation(locale));
  const save = useSaveForm({
    schema: bannerFormSchema,
    defaultValues: bannerCreateDefaults(),
    sections: { info: bannerFormFieldOrder },
    save: {
      run: (values) => create.mutateAsync(toBannerWriteInput(values)),
      isPending: create.isPending,
    },
    mapError: (error) => classifyFormError(error, bannerFormFieldOrder),
    onDone: () => onSaved(create.data?.id),
  });

  return (
    <section>
      <PageHeader
        breadcrumbs={[
          t('banner.breadcrumb.exhibitions'),
          t('banner.breadcrumb.banners'),
          t('banner.breadcrumb.create'),
        ]}
        title={t('banner.form.createTitle')}
      />
      <BannerForm save={save} onCancel={onCancel} />
    </section>
  );
}
