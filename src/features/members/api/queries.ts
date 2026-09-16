import { queryOptions } from '@tanstack/react-query';
import { blockingProgress, contentProgress, inlineProgress } from '@/api/query-meta';
import type { UiLocale } from '@/shared/i18n/locale';
import {
  readAccessListPage,
  readAppealDetail,
  readAppealListPage,
  readCounselDetail,
  readCounselInquiryOptions,
  readCounselListPage,
  readCounselReissueInput,
  readDormantListPage,
  readWithdrawnDetail,
  readWithdrawnListPage,
} from '../fixtures/member-records';
import {
  readMemberActivityPage,
  readMemberCounselRecords,
  readMemberDetail,
  readMemberListPage,
} from '../fixtures/members';
import type { MemberListRequest } from '../model/member';
import type { MemberActivitySearch } from '../model/member-activity';
import type {
  AccessListRequest,
  AppealListRequest,
  CounselListRequest,
  DormantListRequest,
  WithdrawnListRequest,
} from '../model/member-records';
import { memberQueryKeys } from './keys';

/**
 * 회원 조회의 유일한 query 선언들. 화면·route loader·테스트가 같은 정의를 소비한다.
 *
 * TRANSPLANT_PENDING_MEMBER_QUERY: queryFn 은 아직 임시 응답 함수다. 실제 endpoint 가 확정되면 여기서
 * 생성된 operation 을 호출하고 fixtures 를 지운다. 요청 입력과 캐시 키는 화면이 해소한 같은 값이라 그때도 바뀌지 않는다.
 */
export function memberListQueryOptions(locale: UiLocale, request: MemberListRequest) {
  return queryOptions({
    queryKey: memberQueryKeys.list(locale, request),
    queryFn: () => readMemberListPage(request),
  });
}

/** 회원 한 건. 조회 화면과 수정 화면, 두 route loader 가 같은 정의를 쓴다. */
export function memberDetailQueryOptions(locale: UiLocale, memberId: string) {
  return queryOptions({
    queryKey: memberQueryKeys.detail(locale, memberId),
    queryFn: () => readMemberDetail(memberId),
  });
}

/** 상세 안의 페이지 목록. 진입은 상세 query 가 막았으므로 탭·검색·페이지 요청은 내용 표면에 머문다. */
export function memberActivityQueryOptions(locale: UiLocale, memberId: string, search: MemberActivitySearch) {
  return queryOptions({
    queryKey: memberQueryKeys.activity(locale, memberId, search),
    queryFn: () => readMemberActivityPage(memberId, search),
    ...contentProgress,
  });
}

export function memberCounselRecordsQueryOptions(locale: UiLocale, memberId: string) {
  return queryOptions({
    queryKey: memberQueryKeys.counselRecords(locale, memberId),
    queryFn: () => readMemberCounselRecords(memberId),
    ...contentProgress,
  });
}

export function dormantListQueryOptions(locale: UiLocale, request: DormantListRequest) {
  return queryOptions({
    queryKey: memberQueryKeys.dormantList(locale, request),
    queryFn: () => readDormantListPage(request),
  });
}

export function withdrawnListQueryOptions(locale: UiLocale, request: WithdrawnListRequest) {
  return queryOptions({
    queryKey: memberQueryKeys.withdrawnList(locale, request),
    queryFn: () => readWithdrawnListPage(request),
  });
}

export function withdrawnDetailQueryOptions(locale: UiLocale, memberId: string) {
  return queryOptions({
    queryKey: memberQueryKeys.withdrawnDetail(locale, memberId),
    queryFn: () => readWithdrawnDetail(memberId),
  });
}

export function accessListQueryOptions(locale: UiLocale, request: AccessListRequest) {
  return queryOptions({
    queryKey: memberQueryKeys.accessList(locale, request),
    queryFn: () => readAccessListPage(request),
  });
}

export function counselListQueryOptions(locale: UiLocale, request: CounselListRequest) {
  return queryOptions({
    queryKey: memberQueryKeys.counselList(locale, request),
    queryFn: () => readCounselListPage(request),
  });
}

/** 목록 위에 팝업으로 여는 상세. 화면 진입 뒤의 요청이지만 팝업 내용 전체를 기다리므로 blocking 이다. */
export function counselDetailQueryOptions(locale: UiLocale, counselId: string) {
  return queryOptions({
    queryKey: memberQueryKeys.counselDetail(locale, counselId),
    queryFn: () => readCounselDetail(counselId),
    ...blockingProgress,
  });
}

export function appealListQueryOptions(locale: UiLocale, request: AppealListRequest) {
  return queryOptions({
    queryKey: memberQueryKeys.appealList(locale, request),
    queryFn: () => readAppealListPage(request),
  });
}

export function appealDetailQueryOptions(locale: UiLocale, appealId: string) {
  return queryOptions({
    queryKey: memberQueryKeys.appealDetail(locale, appealId),
    queryFn: () => readAppealDetail(appealId),
  });
}

/** 문의유형 옵션은 선행 조건이 없어 목록 필터와 컬럼이 같은 캐시를 쓴다. */
export function counselInquiryOptionsQuery(locale: UiLocale) {
  return queryOptions({
    queryKey: memberQueryKeys.counselInquiryOptions(locale),
    queryFn: () => readCounselInquiryOptions(),
    staleTime: Infinity,
    ...inlineProgress,
  });
}

/** 재발권 팝업의 프린터 목록과 미리보기. 조회는 필드 안에 머물러야 하므로 진입 overlay 를 열지 않는다. */
export function counselReissueInputQuery(locale: UiLocale) {
  return queryOptions({
    queryKey: memberQueryKeys.counselReissueInput(locale),
    queryFn: () => readCounselReissueInput(),
    ...inlineProgress,
  });
}
