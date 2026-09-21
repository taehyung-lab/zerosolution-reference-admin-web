import { localizedQueryKey } from '@/api/query-key';

/** 캐시 주소만 소유하는 leaf 모듈. 화면·model·query 를 import 하지 않는다. */
export const profileQueryKeys = {
  /** 내정보 계열 전체. 쓰기 성공 뒤 조회를 무효화하는 prefix 다. */
  profile: (locale: string) => localizedQueryKey(locale, 'profile'),
  /** 내 계정 한 건. 대상은 세션이 정하므로 ID segment 가 없다. */
  detail: (locale: string) => localizedQueryKey(locale, 'profile', 'detail'),
};
