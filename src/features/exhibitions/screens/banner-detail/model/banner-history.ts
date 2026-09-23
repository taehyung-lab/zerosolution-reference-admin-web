/**
 * 배너 업데이트 이력(Figma 7.1.2 `업데이트 이력`)을 공용 UpdateHistory 가 표시할 행으로 옮긴다.
 * frame(2026-09-23 실측)은 `수정` 아래에 `- 게시순서 : 10 > 1` · `- 배너명 : 배너 > 광고형 배너` ·
 * `- 이동경로 URL : … > …` · `- 이미지 : image123.png > image.png` 를 쌓고, `등록` 은 한 낱말이다.
 * Notion 은 업데이트일을 `수정되어 저장된 날짜` 라 적는다.
 * 날짜 표시·라벨·값 어휘를 이 feature 가 소유하고, 3열 렌더는 공용 표면이 소유한다.
 */
import type { TFunction } from 'i18next';
import type { UpdateHistoryEntry } from '@/shared/ui/detail/UpdateHistory';
import type { BannerChangeLog } from '@/features/exhibitions/model/banner';
import { formatBannerDateTime } from '@/features/exhibitions/model/banner-datetime';

const kindLabels = {
  CREATE: 'banner.detail.historyCreated',
  UPDATE: 'banner.detail.historyUpdated',
} as const;

export function toBannerHistoryEntries(
  logs: readonly BannerChangeLog[],
  t: TFunction<'exhibitions'>,
): readonly UpdateHistoryEntry[] {
  const empty = t('banner.columns.emptyValue');
  return logs.map((log) => ({
    id: log.id,
    date: formatBannerDateTime(log.updatedAt) || empty,
    lines: [
      t(kindLabels[log.kind]),
      ...log.changes.map((change) =>
        t('banner.detail.historyChange', {
          field: t(`banner.detail.historyFields.${change.field}`),
          before: change.before || empty,
          after: change.after || empty,
        }),
      ),
    ],
    actor: log.manager || empty,
  }));
}
