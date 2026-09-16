import type { MemberListVariant } from '@/features/members/model/member';

/**
 * 전체·일반·불량 회원은 같은 목록 workflow 의 세 진입이다(Figma 4.1.1~4.1.3). 실제로 다른 것은 제목·필터 노출·
 * 컬럼 노출·안내 아이콘, 그리고 요청이 고정하는 계정 상태뿐이라 화면 하나와 정의 세 개로 둔다.
 * API·권한·mutation 을 고르는 범용 화면 설정이 아니다.
 */
export interface MemberListDefinition {
  readonly variant: MemberListVariant;
  readonly titleKey: 'screens.all' | 'screens.general' | 'screens.flagged';
  /** 전체회원만 계정 상태를 조건으로 고른다. 나머지는 route 가 상태를 고정한다. */
  readonly accountStatusFilter: boolean;
  /** 일반회원 화면에는 활동제한 조건·컬럼이 없다. */
  readonly restrictionFilter: boolean;
  readonly restrictionColumn: boolean;
  readonly tooltip: boolean;
}

export const memberListDefinitions: Readonly<Record<MemberListVariant, MemberListDefinition>> = {
  all: {
    variant: 'all',
    titleKey: 'screens.all',
    accountStatusFilter: true,
    restrictionFilter: true,
    restrictionColumn: false,
    tooltip: true,
  },
  general: {
    variant: 'general',
    titleKey: 'screens.general',
    accountStatusFilter: false,
    restrictionFilter: false,
    restrictionColumn: false,
    tooltip: false,
  },
  flagged: {
    variant: 'flagged',
    titleKey: 'screens.flagged',
    accountStatusFilter: false,
    restrictionFilter: true,
    restrictionColumn: true,
    tooltip: false,
  },
};
