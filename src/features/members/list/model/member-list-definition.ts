/**
 * 전체·일반·불량 회원 화면에서 실제로 다른 제목·필터·컬럼 노출만 정의한다.
 * 같은 workflow의 표시 차이를 공유하는 설정이며 API·권한·mutation을 선택하는 범용 화면 설정은 아니다.
 */
/**
 * Figma 4.1.1~4.1.3의 같은 workflow에서 확인된 제목·필터·컬럼 차이만 공유한다.
 */
export interface MemberListDefinition {
  readonly identity: 'all' | 'general' | 'flagged';
  readonly titleKey: 'screens.all' | 'screens.general' | 'screens.flagged';
  readonly accountStatusFilter: boolean;
  readonly restrictionFilter: boolean;
  readonly restrictionColumn: boolean;
  readonly tooltip: boolean;
}

export const memberListDefinitions = {
  all: {
    identity: 'all',
    titleKey: 'screens.all',
    accountStatusFilter: true,
    restrictionFilter: true,
    restrictionColumn: false,
    tooltip: true,
  },
  general: {
    identity: 'general',
    titleKey: 'screens.general',
    accountStatusFilter: false,
    restrictionFilter: false,
    restrictionColumn: false,
    tooltip: false,
  },
  flagged: {
    identity: 'flagged',
    titleKey: 'screens.flagged',
    accountStatusFilter: false,
    restrictionFilter: true,
    restrictionColumn: true,
    tooltip: false,
  },
} as const satisfies Record<string, MemberListDefinition>;
