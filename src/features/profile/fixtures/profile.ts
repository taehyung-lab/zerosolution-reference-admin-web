import type { ProfileDetail } from '../model/profile';

/**
 * TRANSPLANT_PENDING_PROFILE_QUERY: 내 계정 조회 API 가 없다. 아래 값은 예시이며 endpoint·DTO·
 * enum 을 확정 계약으로 표현하지 않는다. 실제 계약이 확정되면 `api/queries.ts` 의 queryFn 과 함께
 * 교체하고 이 파일을 지운다.
 */
const profile: ProfileDetail = {
  id: 'example-operator',
  name: 'Example',
  phone: '010-0000-0000',
  email: 'operator@example.com',
  organization: 'Example org',
  registrationRoute: 'WEB',
  accountStatus: 'Example status',
};

export function readProfileDetail(): Promise<ProfileDetail> {
  return Promise.resolve(profile);
}
