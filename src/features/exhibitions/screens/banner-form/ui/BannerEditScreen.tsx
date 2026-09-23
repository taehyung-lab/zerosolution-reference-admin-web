import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { updateBannerMutation } from '@/features/exhibitions/api/mutations';
import { useBannerDetail } from '@/features/exhibitions/api/useBannerDetail';
import type { BannerDetail } from '@/features/exhibitions/model/banner';
import { useLocale } from '@/shared/i18n/locale-context';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { toBannerEditDefaults } from '../model/banner-form-defaults';
import { toBannerWriteInput } from '../model/banner-form-request';
import { bannerFormFieldOrder, bannerFormSchema } from '../model/banner-form-schema';
import { BannerForm } from './BannerForm';

/**
 * 7.1.4 배너 수정(Figma, 2026-09-23 실측): 등록과 같은 항목을 조회 값으로 채워 보여 준다.
 * 브레드크럼도 frame 그대로 `조회 > 수정` 이다.
 * 조회 실패에도 제목이 남도록 헤더를 상태 경계 밖에 둔다. 폼은 조회가 성공한 뒤에만 mount 해
 * 서버 재조회가 입력 초안을 덮어쓰지 않게 한다. 진입 실패는 route loader 가 이미 처리했다.
 */
export function BannerEditScreen({
  bannerId,
  onSaved,
  onCancel,
}: {
  readonly bannerId: string;
  readonly onSaved: (bannerId: string) => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('exhibitions');
  const detail = useBannerDetail(bannerId);

  return (
    <section>
      <PageHeader
        breadcrumbs={[
          t('banner.breadcrumb.exhibitions'),
          t('banner.breadcrumb.banners'),
          t('banner.breadcrumb.detail'),
          t('banner.breadcrumb.edit'),
        ]}
        title={t('banner.form.editTitle')}
      />
      <DetailStateBoundary query={detail}>
        {(banner) => (
          <BannerEditForm
            key={banner.id}
            banner={banner}
            onSaved={() => onSaved(banner.id)}
            onCancel={onCancel}
          />
        )}
      </DetailStateBoundary>
    </section>
  );
}

function BannerEditForm({
  banner,
  onSaved,
  onCancel,
}: {
  readonly banner: BannerDetail;
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { locale } = useLocale();
  const update = useMutation(updateBannerMutation(locale));
  const save = useSaveForm({
    schema: bannerFormSchema,
    defaultValues: toBannerEditDefaults(banner),
    sections: { info: bannerFormFieldOrder },
    save: {
      run: (values) => update.mutateAsync({ bannerId: banner.id, input: toBannerWriteInput(values) }),
      isPending: update.isPending,
    },
    mapError: (error) => classifyFormError(error, bannerFormFieldOrder),
    onDone: onSaved,
  });

  return <BannerForm save={save} onCancel={onCancel} />;
}
