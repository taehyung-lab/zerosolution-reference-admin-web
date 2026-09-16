import { mutationOptions } from '@tanstack/react-query';
import { scenarioRequest } from '@/api/scenario';
import type { UiLocale } from '@/shared/i18n/locale';
import type {
  MemberBulkChangeRequest,
  MemberCreateSettings,
  MemberDetailAction,
  MemberDownloadRequest,
  MemberSettings,
} from '../model/member';
import type { MemberActivityDelete } from '../model/member-activity';
import type { MemberCounselInput } from '../model/member-counsel';
import type {
  AccessListRequest,
  AppealProcessing,
  CounselListRequest,
  CounselReissueRequest,
} from '../model/member-records';
import { memberQueryKeys } from './keys';

/**
 * 회원의 쓰기. 검증 → 확인까지가 화면의 책임이고 그 다음이 여기다. 모든 입력이 대상 ID 를 함께 싣는다.
 *
 * TRANSPLANT_PENDING_MEMBER_MUTATION: 이 저장소에는 서버 계약이 없어 `mutationFn` 은 도달만 기록하고
 * 성공으로 끝난다. endpoint 가 확정되면 그 함수 본문만 바꾼다. 성공 시 무효화할 캐시는 `meta.invalidates` 가
 * 이미 선언한다. 비밀번호·연락처·상담 내용은 로그에 싣지 않는다.
 */
function invalidates(locale: UiLocale) {
  return { meta: { invalidates: [memberQueryKeys.members(locale)] } };
}

export function createMemberMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<MemberCreateSettings>('회원 등록'),
    ...invalidates(locale),
  });
}

export function updateMemberMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly memberId: string; readonly settings: MemberSettings }>('회원 수정'),
    ...invalidates(locale),
  });
}

const actionLabels: Readonly<Record<MemberDetailAction['type'], string>> = {
  password: '회원 비밀번호 변경',
  reveal: '회원 개인정보 조회 재인증',
  verifyWithdrawal: '회원 탈퇴 재인증',
};

/** 상세 화면의 입력 액션 하나. 종류별 endpoint 는 미확인이라 한 함수가 종류를 받아 기록한다. */
export function memberActionMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: (action: MemberDetailAction) => scenarioRequest<MemberDetailAction>(actionLabels[action.type])(action),
    ...invalidates(locale),
  });
}

export function bulkChangeMembersMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<MemberBulkChangeRequest>('회원 일괄변경'),
    ...invalidates(locale),
  });
}

/** 활성·탈퇴 회원 조회가 같은 활동정보 선택삭제를 쓴다. */
export function deleteMemberActivityMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<MemberActivityDelete & { readonly memberId: string }>('회원 활동정보 선택삭제'),
    ...invalidates(locale),
  });
}

export function createMemberCounselMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly memberId: string; readonly input: MemberCounselInput }>('회원 상세 상담 등록'),
    ...invalidates(locale),
  });
}

export function updateMemberCounselMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly memberId: string; readonly id: string; readonly input: MemberCounselInput }>(
      '회원 상세 상담 수정',
    ),
    ...invalidates(locale),
  });
}

export function deleteMemberCounselMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly memberId: string; readonly id: string }>('회원 상세 상담 삭제'),
    ...invalidates(locale),
  });
}

export function downloadAccessListMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<MemberDownloadRequest<Omit<AccessListRequest, 'page' | 'pageSize'>>>('회원접속 다운로드'),
    ...invalidates(locale),
  });
}

export function downloadCounselListMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<MemberDownloadRequest<Omit<CounselListRequest, 'page' | 'pageSize'>>>('회원상담 다운로드'),
    ...invalidates(locale),
  });
}

/** 회원상담 팝업 안의 상담 기록. 대상은 목록의 상담 ID 와 기록 ID 다. */
export function createCounselNoteMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly counselId: string; readonly input: MemberCounselInput }>('회원상담 등록'),
    ...invalidates(locale),
  });
}

export function updateCounselNoteMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly counselId: string; readonly noteId: string; readonly input: MemberCounselInput }>(
      '회원상담 수정',
    ),
    ...invalidates(locale),
  });
}

export function deleteCounselNoteMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly counselId: string; readonly noteId: string }>('회원상담 삭제'),
    ...invalidates(locale),
  });
}

/** 테스트 발권과 실제 재발권은 같은 입력, 다른 요청이다. */
export function reissueTicketMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: (request: CounselReissueRequest) =>
      scenarioRequest<CounselReissueRequest>(request.test ? '티켓 테스트 발권' : '티켓 재발권')(request),
    ...invalidates(locale),
  });
}

export function saveAppealProcessingMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly appealId: string; readonly processing: AppealProcessing }>('소명 처리 저장'),
    ...invalidates(locale),
  });
}

/** 통보는 저장된 처리 결과를 보낸다. 작성 중인 값은 통보 대상이 아니다. */
export function notifyAppealMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly appealId: string; readonly processing: AppealProcessing }>('소명 결과 통보'),
    ...invalidates(locale),
  });
}

export function bulkChangeAppealsMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<MemberBulkChangeRequest>('소명 회원 일괄변경'),
    ...invalidates(locale),
  });
}
