import { localizedQueryKey } from '@/api/query-key';
import type { BannerListRequest } from '../model/banner';

/** 캐시 주소만 소유하는 leaf 모듈. 화면·model·query 를 import 하지 않는다. */
export const bannerQueryKeys = {
  /** 배너 계열 전체. 쓰기 성공 뒤 목록·조회·미리보기를 함께 무효화하는 prefix 다. */
  all: (locale: string) => localizedQueryKey(locale, 'banners'),
  list: (locale: string, request: BannerListRequest) =>
    [...localizedQueryKey(locale, 'banners', 'list'), request] as const,
  detail: (locale: string, bannerId: string) =>
    [...localizedQueryKey(locale, 'banners', 'detail'), bannerId] as const,
  preview: (locale: string) => localizedQueryKey(locale, 'banners', 'preview'),
};
