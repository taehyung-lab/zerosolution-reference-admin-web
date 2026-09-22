import { localizedQueryKey } from '@/api/query-key';
import type { TermsListRequest } from '../model/terms';

/** 캐시 주소만 소유하는 leaf 모듈. 화면·model·query 를 import 하지 않는다. */
export const termsQueryKeys = {
  /** 약관 계열 전체. 쓰기 성공 뒤 목록·조회를 함께 무효화하는 prefix 다. */
  all: (locale: string) => localizedQueryKey(locale, 'terms'),
  list: (locale: string, request: TermsListRequest) =>
    [...localizedQueryKey(locale, 'terms', 'list'), request] as const,
  detail: (locale: string, termsId: string) =>
    [...localizedQueryKey(locale, 'terms', 'detail'), termsId] as const,
};
