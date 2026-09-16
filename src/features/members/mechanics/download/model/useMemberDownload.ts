import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MemberDownloadRequest } from '@/features/members/model/member';
import { errorMessageKey, errorTraceOf } from '@/shared/lib/error-copy';
import type { useSelectionGate } from '@/shared/model/use-selection-gate';

export type MemberDownloadScope = MemberDownloadRequest<unknown>['scope'];

export interface MemberDownloadControls {
  readonly scope: MemberDownloadScope | null;
  readonly setScope: (scope: MemberDownloadScope | null) => void;
  readonly request: () => void;
}

/**
 * `다운로드 범위 ▾(선택한 항목 | 검색결과 전체) + 다운로드`. 선택 범위는 행이 있어야 하고, 전체 범위는 확정한
 * 검색 조건(페이지 제외)을 보낸다. 회원접속과 회원상담이 같은 절차를 쓰고 mutation 만 다르다. 실패는 같은 alert 로 남는다.
 */
export function useMemberDownload<TSearch>({
  selectedIds,
  gate,
  search,
  run,
}: {
  readonly selectedIds: readonly string[];
  readonly gate: ReturnType<typeof useSelectionGate>;
  readonly search: TSearch;
  readonly run: (request: MemberDownloadRequest<TSearch>) => Promise<unknown>;
}): MemberDownloadControls {
  const { t } = useTranslation('members');
  const { t: shared } = useTranslation('shared');
  const [scope, setScope] = useState<MemberDownloadScope | null>(null);
  const start = (request: MemberDownloadRequest<TSearch>) =>
    run(request).catch((error: unknown) => gate.reject(shared(errorMessageKey(errorTraceOf(error).kind))));

  return {
    scope,
    setScope,
    request: () => {
      if (scope === 'selected' && gate.requireSelection(t('download.required'))) {
        void start({ scope: 'selected', ids: [...selectedIds] });
      }
      if (scope === 'all') void start({ scope: 'all', search });
    },
  };
}
