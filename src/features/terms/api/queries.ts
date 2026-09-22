import { queryOptions } from '@tanstack/react-query';
import type { UiLocale } from '@/shared/i18n/locale';
import { termsQueryKeys } from './keys';
import { readTermsDetail, readTermsListPage } from '../fixtures/terms';
import type { TermsDetail, TermsListPage, TermsListRequest } from '../model/terms';

/**
 * 약관 목록 조회의 유일한 query 선언. route 와 화면이 같은 정의를 소비한다.
 *
 * TRANSPLANT_PENDING_TERMS_QUERY: queryFn 은 아직 임시 응답 함수다. 실제 endpoint 가 확정되면 여기서
 * 생성된 operation 을 호출하고 fixtures 를 지운다. 요청 입력과 캐시 키는 화면이 해소한 같은 값이므로
 * 그때도 바뀌지 않는다.
 */
export function termsListQueryOptions(locale: UiLocale, request: TermsListRequest) {
  return queryOptions<TermsListPage>({
    queryKey: termsQueryKeys.list(locale, request),
    queryFn: () => readTermsListPage(request),
  });
}

/** 약관 한 건의 조회 query. 조회 화면과 수정 화면이 같은 정의를 쓴다. */
export function termsDetailQueryOptions(locale: UiLocale, termsId: string) {
  return queryOptions<TermsDetail>({
    queryKey: termsQueryKeys.detail(locale, termsId),
    queryFn: () => readTermsDetail(termsId),
  });
}
