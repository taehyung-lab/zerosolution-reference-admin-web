import { queryOptions } from '@tanstack/react-query';
import { inlineProgress } from '@/api/query-meta';
import type { UiLocale } from '@/shared/i18n/locale';
import { bannerQueryKeys } from './keys';
import { readBannerDetail, readBannerListPage, readPostingBanners } from '../fixtures/banners';
import type {
  BannerDetail,
  BannerListPage,
  BannerListRequest,
  BannerPreviewItem,
} from '../model/banner';

/**
 * 배너 목록 조회의 유일한 query 선언. route 와 화면이 같은 정의를 소비한다.
 *
 * TRANSPLANT_PENDING_BANNER_QUERY: queryFn 은 아직 임시 응답 함수다. 실제 endpoint 가 확정되면 여기서
 * 생성된 operation 을 호출하고 fixtures 를 지운다. 요청 입력과 캐시 키는 화면이 해소한 같은 값이므로
 * 그때도 바뀌지 않는다.
 */
export function bannerListQueryOptions(locale: UiLocale, request: BannerListRequest) {
  return queryOptions<BannerListPage>({
    queryKey: bannerQueryKeys.list(locale, request),
    queryFn: () => readBannerListPage(request),
  });
}

/** 배너 한 건의 조회 query. 조회 화면과 수정 화면이 같은 정의를 쓴다. */
export function bannerDetailQueryOptions(locale: UiLocale, bannerId: string) {
  return queryOptions<BannerDetail>({
    queryKey: bannerQueryKeys.detail(locale, bannerId),
    queryFn: () => readBannerDetail(bannerId),
  });
}

/**
 * 미리보기 팝업의 조회 — Notion `미리보기 버튼 → 클릭시, 미리보기 팝업 제공 → 현재 APP에 게시 중인
 * 배너 조회`. 목록의 검색 조건과 선택 행에 묶이지 않는 별도 집합이라 목록 query 를 재사용하지 않는다.
 * 팝업이 열릴 때만 조회하고 진행·실패는 팝업 안에서 그린다(`inlineProgress`).
 */
export function bannerPreviewQueryOptions(locale: UiLocale) {
  return queryOptions<readonly BannerPreviewItem[]>({
    queryKey: bannerQueryKeys.preview(locale),
    queryFn: () => readPostingBanners(),
    ...inlineProgress,
  });
}
