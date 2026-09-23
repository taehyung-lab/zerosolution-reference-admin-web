import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  bulkChangeBannersMutation,
  type BannerBulkChangeRequest,
} from '@/features/exhibitions/api/mutations';
import { bannerStatuses, type BannerBulkChange } from '@/features/exhibitions/model/banner';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSelectionGate } from '@/shared/hooks/use-selection-gate';

/**
 * Case 정의의 cascade `선택 ▾ > 게시 상태 > 대기 · 게시중 · 종료` 가 가진 leaf 전부. 공용 `Select` 는
 * 단일 계층 계약이라 leaf 를 한 목록으로 펼쳐 고르고, 축과 값의 쌍은 그대로 요청 입력에 실린다.
 */
export const bannerBulkChanges: readonly BannerBulkChange[] = bannerStatuses.map(
  (value) => ({ field: 'status', value }) as const,
);

/** select 값 ↔ cascade leaf. `field:value` 한 문자열이며 URL 로 나가지 않는다. */
export function bannerBulkChangeValue(change: BannerBulkChange): string {
  return `${change.field}:${change.value}`;
}

export function parseBannerBulkChange(value: string | null): BannerBulkChange | undefined {
  return bannerBulkChanges.find((change) => bannerBulkChangeValue(change) === value);
}

/**
 * 결과 toolbar 의 `선택 ▾ + 변경` 이 가진 **선택 전제와 실행**을 소유한다. 확인창의 상태와 렌더는 늘
 * mount 되는 Actions 컴포넌트가 갖는다 — 이 훅은 JSX 를 모른다.
 * 원문 Case01 은 미선택 오류 alert, Case02 는 변경 확인 alert 과 변경 완료 alert 이다.
 * `미리보기` 는 선택과 무관하다(Notion `현재 APP에 게시 중인 배너 조회`) — 이 훅이 거르지 않는다.
 */
export function useBannerListActions(selectedIds: readonly string[]) {
  const { t } = useTranslation('shared');
  const { locale } = useLocale();
  const [target, setTarget] = useState<BannerBulkChange | undefined>(undefined);
  const gate = useSelectionGate(selectedIds.length);
  const bulkChange = useMutation(bulkChangeBannersMutation(locale));

  return {
    gate,
    target,
    setTarget,
    /** 변경할 값을 고르지 않았으면 보낼 업무가 없으므로 요청도 만들지 않는다. */
    prepareBulkChange: (): BannerBulkChangeRequest | undefined => {
      if (!gate.requireSelection(t('bulkAction.missingSelection'))) return undefined;
      if (target === undefined) return undefined;
      return { targetIds: [...selectedIds], change: target };
    },
    runBulkChange: (request: BannerBulkChangeRequest) => bulkChange.mutateAsync(request),
  };
}
