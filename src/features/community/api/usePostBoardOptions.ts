/**
 * 게시판 선택지 조회를 선택 필드 하나의 표시 상태로 바꾼다. 실패를 빈 목록으로 접지 않고 로딩·실패·
 * 재시도를 필드까지 전달한다(`data ?? []` 금지). 캐시된 값이 있으면 ready 다.
 */
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/shared/i18n/locale-context';
import type { AsyncFieldState } from '@/shared/ui/feedback/AsyncFieldBoundary';
import type { PostBoardCategoryOption, PostBoardOption } from '../model/post';
import { postBoardCategoryOptionsQuery, postBoardOptionsQuery } from './queries';

export interface PostBoardSelectOptions {
  readonly state: AsyncFieldState;
  readonly items: readonly PostBoardOption[];
  readonly retry: () => void;
}

export function usePostBoardOptions(): PostBoardSelectOptions {
  const { locale } = useLocale();
  const query = useQuery(postBoardOptionsQuery(locale));
  return {
    state: query.data !== undefined ? 'ready' : query.isError ? 'error' : 'loading',
    items: query.data ?? [],
    retry: () => void query.refetch(),
  };
}

export interface PostBoardCategorySelectOptions {
  readonly state: AsyncFieldState;
  readonly items: readonly PostBoardCategoryOption[];
  readonly retry: () => void;
}

/**
 * 고른 게시판의 카테고리 선택지. 게시판을 고르기 전에는 조회하지 않은 빈 ready 다 —
 * 선행 조건이 없는 것은 실패가 아니다.
 */
export function usePostBoardCategoryOptions(boardId: string): PostBoardCategorySelectOptions {
  const { locale } = useLocale();
  const query = useQuery(postBoardCategoryOptionsQuery(locale, boardId));
  if (boardId === '') return { state: 'ready', items: [], retry: () => undefined };
  return {
    state: query.data !== undefined ? 'ready' : query.isError ? 'error' : 'loading',
    items: query.data ?? [],
    retry: () => void query.refetch(),
  };
}
