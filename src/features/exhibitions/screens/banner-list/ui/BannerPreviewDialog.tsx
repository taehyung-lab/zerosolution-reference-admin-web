import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { bannerPreviewQueryOptions } from '@/features/exhibitions/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { errorMessageKey, errorTraceOf } from '@/shared/lib/error-copy';
import { Dialog } from '@/shared/ui/primitives/Dialog';
import { Button } from '@/shared/ui/primitives/Button';

/**
 * Figma `7.1.5.1. 팝업 : 미리보기`(402×874, 2026-09-23 aside 실측): 제목 `미리보기` 와 닫기 ⓧ, 그 아래
 * 이미지 영역이 세로로 쌓이고 스크롤된다. 버튼·배너명·링크는 그리지 않는다.
 * 무엇을 쌓는지는 Notion `현재 APP에 게시 중인 배너 조회` 이고 선택 행과 무관하다.
 *
 * 팝업이 열릴 때만 조회한다. 게시 중인 배너가 하나도 없을 때의 안내 문구는 원문에 없어(BANNER-LIST
 * 미확인 5) 빈 목록을 그대로 둔다.
 */
export function BannerPreviewDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('exhibitions');
  const { t: shared } = useTranslation('shared');
  const { locale } = useLocale();
  const preview = useQuery({ ...bannerPreviewQueryOptions(locale), enabled: open });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('banner.preview.title')}
      closeLabel={t('banner.preview.close')}
    >
      {preview.isPending ? (
        <p className="text-sm text-neutral-600" role="status">
          {shared('progress.loading')}
        </p>
      ) : preview.isError ? (
        <div role="alert" className="space-y-2 text-sm text-red-700">
          <p>{shared(errorMessageKey(errorTraceOf(preview.error).kind))}</p>
          <Button type="button" onClick={() => void preview.refetch()}>
            {shared('asyncField.retry')}
          </Button>
        </div>
      ) : (
        <ul aria-label={t('banner.preview.title')} className="max-h-[70vh] space-y-4 overflow-y-auto">
          {preview.data.map((item) => (
            <li key={item.id}>
              <img alt={item.name} className="w-full rounded-lg bg-neutral-200" src={item.image.url} />
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
