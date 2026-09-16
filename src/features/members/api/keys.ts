import { localizedQueryKey } from '@/api/query-key';
import type { MemberListRequest } from '../model/member';
import type { MemberActivitySearch } from '../model/member-activity';
import type {
  AccessListRequest,
  AppealListRequest,
  CounselListRequest,
  DormantListRequest,
  WithdrawnListRequest,
} from '../model/member-records';

/** 캐시 주소만 소유하는 leaf 모듈. 화면·model·query 를 import 하지 않는다. */
export const memberQueryKeys = {
  /** 회원 계열 전체. 쓰기 성공 뒤 목록·상세·기록을 함께 무효화하는 prefix 다. 옵션은 포함하지 않는다. */
  members: (locale: string) => localizedQueryKey(locale, 'members', 'records'),
  list: (locale: string, request: MemberListRequest) =>
    [...localizedQueryKey(locale, 'members', 'records', 'list'), request] as const,
  detail: (locale: string, memberId: string) =>
    [...localizedQueryKey(locale, 'members', 'records', 'detail'), memberId] as const,
  activity: (locale: string, memberId: string, search: MemberActivitySearch) =>
    [...localizedQueryKey(locale, 'members', 'records', 'activity'), memberId, search] as const,
  counselRecords: (locale: string, memberId: string) =>
    [...localizedQueryKey(locale, 'members', 'records', 'counsel-records'), memberId] as const,
  dormantList: (locale: string, request: DormantListRequest) =>
    [...localizedQueryKey(locale, 'members', 'records', 'dormant'), request] as const,
  withdrawnList: (locale: string, request: WithdrawnListRequest) =>
    [...localizedQueryKey(locale, 'members', 'records', 'withdrawn'), request] as const,
  withdrawnDetail: (locale: string, memberId: string) =>
    [...localizedQueryKey(locale, 'members', 'records', 'withdrawn-detail'), memberId] as const,
  accessList: (locale: string, request: AccessListRequest) =>
    [...localizedQueryKey(locale, 'members', 'records', 'access'), request] as const,
  counselList: (locale: string, request: CounselListRequest) =>
    [...localizedQueryKey(locale, 'members', 'records', 'counsel'), request] as const,
  counselDetail: (locale: string, counselId: string) =>
    [...localizedQueryKey(locale, 'members', 'records', 'counsel-detail'), counselId] as const,
  appealList: (locale: string, request: AppealListRequest) =>
    [...localizedQueryKey(locale, 'members', 'records', 'appeals'), request] as const,
  appealDetail: (locale: string, appealId: string) =>
    [...localizedQueryKey(locale, 'members', 'records', 'appeal-detail'), appealId] as const,
  counselInquiryOptions: (locale: string) => localizedQueryKey(locale, 'members', 'options', 'counsel-inquiry'),
  counselReissueInput: (locale: string) => localizedQueryKey(locale, 'members', 'options', 'counsel-reissue'),
};
