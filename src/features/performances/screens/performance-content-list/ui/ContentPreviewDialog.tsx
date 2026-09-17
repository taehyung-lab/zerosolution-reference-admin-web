import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { contentPreviewQueryOptions } from '@/features/performances/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { Dialog } from '@/shared/ui/primitives/Dialog';
import { Select } from '@/shared/ui/primitives/Select';

/**
 * Figma `5.1.4.1. 팝업 : 미리보기`(`129:21393`): 제목 · 닫기 · 회차 select · 언어 select ·
 * 타이틀 · 이미지 영역 + 이미지 타이틀 · 영상 썸네일 + 영상 타이틀.
 * Notion: 회차 셀렉박스는 `입력방식 : 회차별 개별 등록` 일 때만 제공하고, 언어를 고르면 그 언어의 콘텐츠를 본다.
 * 회차·언어 선택은 이 팝업이 살아 있는 동안만의 상호작용이라 가장 가까운 component 가 소유한다.
 *
 * TRANSPLANT_PENDING_CONTENT_PREVIEW: 실제 미리보기 대상(이미지·영상 파일)과 그 계약은 미확인이라
 * frame 이 그린 영역만 자리표시자로 둔다.
 */
export function ContentPreviewDialog({
  contentId,
  onClose,
}: {
  readonly contentId: string;
  readonly onClose: () => void;
}) {
  const { t } = useTranslation('performances');
  const { t: shared } = useTranslation('shared');
  const { locale } = useLocale();
  const preview = useQuery(contentPreviewQueryOptions(locale, contentId));
  const [session, setSession] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);

  const sessions = preview.data?.sessions ?? [];
  const languages = preview.data?.languages ?? [];
  const currentSession = session ?? sessions[0] ?? '';
  const currentLanguage = language ?? languages[0] ?? '';
  const card = preview.data?.cards.find(
    (item) => (sessions.length === 0 || item.session === currentSession) && item.language === currentLanguage,
  );

  return (
    <Dialog
      open
      title={t('content.preview.title')}
      closeLabel={t('content.preview.close')}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          {sessions.length > 0 ? (
            <Select
              aria-label={t('content.preview.session')}
              className="w-auto"
              value={currentSession}
              options={sessions.map((value) => ({ value, label: value }))}
              onValueChange={setSession}
            />
          ) : null}
          <Select
            aria-label={t('content.preview.language')}
            className="w-auto"
            value={currentLanguage}
            options={languages.map((value) => ({ value, label: t(`content.preview.languages.${value}`) }))}
            onValueChange={setLanguage}
          />
        </div>
        {preview.isPending ? <p aria-live="polite">{shared('progress.loading')}</p> : null}
        {card ? (
          <div className="space-y-3">
            <h3 className="text-base font-semibold">{card.title}</h3>
            <div className="flex h-40 items-center justify-center bg-neutral-100 text-sm text-neutral-500">
              {t('content.preview.imageArea')}
            </div>
            <p className="text-sm">{card.imageTitle}</p>
            <div className="flex h-40 items-center justify-center bg-neutral-100 text-sm text-neutral-500">
              {t('content.preview.videoArea')}
            </div>
            <p className="text-sm">{card.videoTitle}</p>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
