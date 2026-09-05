/** Figma 4.1.1~4.1.3 are one screen whose filters, columns, and header differ by account status. */
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
