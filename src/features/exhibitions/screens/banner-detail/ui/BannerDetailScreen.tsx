/**
 * 7.1.2 배너 조회 — Figma frame(2026-09-23 aside 실측). `기본정보` 섹션이 구분·게시순서·배너명·
 * 이동경로(유형 · URL)·이미지·게시기간 · 게시 상태를 읽기 전용으로 보여 주고, `업데이트 이력` 섹션이
 * 3열 표를 보여 준다. 하단은 `수정`·`삭제`.
 *
 * 이미지 파일명은 링크다 — Notion `이미지 → 클릭시, 브라우저 기본 프로세스에 따라 로컬 다운로드 진행됨`.
 * 삭제는 원문의 `삭제하시겠습니까? / 확인, 취소` 를 지난 뒤 목록으로 간다. 확인창은 조회가 성공한 뒤
 * 그려지는 내용 컴포넌트가 소유한다(약관 조회와 같은 배치). 삭제 성공 뒤의 무효화 재조회는 곧바로 목록
 * 이동이 뒤따르므로 이 화면이 그 결과를 그리지 않는다.
 * 하단 `삭제` 는 frame 대로 밑줄 텍스트다.
 *
 * frame 이 게시 상태 옆에 그린 `즉시중단` 버튼은 원문이 동작(바뀌는 상태·확인 문구)을 적지 않아
 * 만들지 않는다(BANNER-DETAIL 미확인 1).
 *
 * 헤더는 상태 경계 밖에 두어 조회 실패에도 제목이 남는다. 진입 실패는 route loader 가 처리했다.
 */
import { useMutation } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteBannerMutation } from '@/features/exhibitions/api/mutations';
import { useBannerDetail } from '@/features/exhibitions/api/useBannerDetail';
import type { BannerDetail } from '@/features/exhibitions/model/banner';
import { formatBannerDateTime } from '@/features/exhibitions/model/banner-datetime';
import { useLocale } from '@/shared/i18n/locale-context';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { DetailField } from '@/shared/ui/detail/DetailField';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { UpdateHistory } from '@/shared/ui/detail/UpdateHistory';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import { Button } from '@/shared/ui/primitives/Button';
import { toBannerHistoryEntries } from '../model/banner-history';

export function BannerDetailScreen({
  bannerId,
  onEdit,
  onDeleted,
}: {
  readonly bannerId: string;
  readonly onEdit: (bannerId: string) => void;
  /** 삭제가 성공한 뒤의 이동. 원문 `확인 : alert 닫히고, 리스트 화면으로 이동`. */
  readonly onDeleted: () => void;
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
        ]}
        title={t('banner.detail.title')}
      />
      <DetailStateBoundary query={detail}>
        {(banner) => <BannerDetailContent banner={banner} onEdit={onEdit} onDeleted={onDeleted} />}
      </DetailStateBoundary>
    </section>
  );
}

function BannerDetailContent({
  banner,
  onEdit,
  onDeleted,
}: {
  readonly banner: BannerDetail;
  readonly onEdit: (bannerId: string) => void;
  readonly onDeleted: () => void;
}) {
  const { t } = useTranslation('exhibitions');
  const { t: shared } = useTranslation('shared');
  const { locale } = useLocale();
  const remove = useMutation(deleteBannerMutation(locale));
  const deletion = useConfirmation<string>({
    run: (bannerId) => remove.mutateAsync(bannerId).then(onDeleted),
    description: shared('deleteConfirm.description'),
  });
  const empty = t('banner.columns.emptyValue');
  const start = formatBannerDateTime(banner.postStartAt) || empty;
  const end = formatBannerDateTime(banner.postEndAt) || empty;

  return (
    <div className="space-y-5">
      <SectionCard title={t('banner.detail.section')}>
        <div className="space-y-4">
          <Fields>
            <DetailField label={t('banner.columns.category')}>
              {t(`banner.values.category.${banner.category}`)}
            </DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('banner.columns.order')}>{banner.order}</DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('banner.columns.name')}>{banner.name || empty}</DetailField>
          </Fields>
          <div>
            <p className="text-sm font-medium">{t('banner.detail.link')}</p>
            <Fields>
              <DetailField label={t('banner.detail.linkType')}>
                {t(`banner.values.linkType.${banner.linkType}`)}
              </DetailField>
              <DetailField label={t('banner.detail.linkUrl')}>{banner.linkUrl || empty}</DetailField>
            </Fields>
          </div>
          <Fields>
            <DetailField label={t('banner.detail.image')}>
              <a className="underline" download={banner.image.name} href={banner.image.url}>
                {banner.image.name}
              </a>
            </DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('banner.columns.postPeriod')}>
              {t('banner.detail.period', { start, end })}
            </DetailField>
            <DetailField label={t('banner.columns.status')}>
              {t(`banner.values.status.${banner.status}`)}
            </DetailField>
          </Fields>
        </div>
      </SectionCard>

      <SectionCard title={t('banner.detail.history')}>
        <UpdateHistory
          entries={toBannerHistoryEntries(banner.changeLogs, t)}
          labels={{
            date: t('banner.detail.historyDate'),
            change: t('banner.detail.historyChangeColumn'),
            actor: t('banner.detail.historyManager'),
          }}
          emptyText={empty}
        />
      </SectionCard>

      <div className="flex justify-center gap-2">
        <Button onClick={() => onEdit(banner.id)}>{t('banner.detail.edit')}</Button>
        <button
          type="button"
          className="px-3 text-sm text-neutral-900 underline"
          onClick={() => deletion.request(banner.id)}
        >
          {t('banner.detail.delete')}
        </button>
      </div>
      {deletion.dialog}
    </div>
  );
}

/** frame 의 한 행은 `dl` 하나다. `dl` 은 `dt`/`dd` 만 담으므로 그룹 소제목은 밖에 둔다. */
function Fields({ children }: { readonly children: ReactNode }) {
  return <dl className="grid gap-x-8 md:grid-cols-2">{children}</dl>;
}
