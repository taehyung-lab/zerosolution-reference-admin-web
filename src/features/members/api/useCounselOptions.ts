/**
 * 회원상담의 서버 옵션(문의유형·재발권 프린터)을 필드 하나의 표시 상태로 바꾼다. 실패를 빈 목록으로 접지 않고
 * 로딩·실패·재시도를 필드까지 전달한다. 이미 받은 값이 있으면 뒤의 갱신 실패로 선택지를 빼앗지 않는다.
 */
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/shared/i18n/locale-context';
import type { AsyncFieldState } from '@/shared/ui/feedback/AsyncFieldBoundary';
import type { CounselOption, CounselPrinter } from '../model/member-records';
import { counselInquiryOptionsQuery, counselReissueInputQuery } from './queries';

export interface CounselSelectOptions {
  readonly state: AsyncFieldState;
  readonly items: readonly CounselOption[];
  readonly retry: () => void;
}

export function useCounselInquiryOptions(): CounselSelectOptions {
  const { locale } = useLocale();
  const query = useQuery(counselInquiryOptionsQuery(locale));
  return {
    state: query.data !== undefined ? 'ready' : query.isError ? 'error' : 'loading',
    items: query.data ?? [],
    retry: () => void query.refetch(),
  };
}

export interface CounselReissuePrinting {
  readonly state: AsyncFieldState;
  readonly printers: readonly CounselPrinter[];
  readonly preview: string | undefined;
  readonly retry: () => void;
}

export function useCounselReissueInput(): CounselReissuePrinting {
  const { locale } = useLocale();
  const query = useQuery(counselReissueInputQuery(locale));
  return {
    state: query.data !== undefined ? 'ready' : query.isError ? 'error' : 'loading',
    printers: query.data?.printers ?? [],
    preview: query.data?.preview,
    retry: () => void query.refetch(),
  };
}
