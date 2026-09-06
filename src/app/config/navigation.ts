/**
 * The product menu/permission contract is not confirmed yet. Replace this local
 * catalogue with the server-driven contract only after its shape and authority are agreed.
 */
export interface AppNavigationItem {
  readonly id: string;
  readonly labelKey: string;
  readonly to?: "/managers" | "/members/active/all" | "/members/active/general" | "/members/active/flagged" | "/members/dormant" | "/members/withdrawn" | "/members/counsel" | "/members/appeals" | "/members/access";
}

export const appNavigationItems: readonly AppNavigationItem[] = [
  { id: "dashboard", labelKey: "shell.navigation.dashboard" },
  { id: "members", labelKey: "shell.navigation.members", to: "/members/active/all" },
  { id: "performances", labelKey: "shell.navigation.performances" },
  { id: "ticketing", labelKey: "shell.navigation.ticketing" },
  { id: "exhibitions", labelKey: "shell.navigation.exhibitions" },
  { id: "promotions", labelKey: "shell.navigation.promotions" },
  { id: "community", labelKey: "shell.navigation.community" },
  { id: "statistics", labelKey: "shell.navigation.statistics" },
  { id: "settings", labelKey: "shell.navigation.settings", to: "/managers" },
];

export type AppNavigationLink = AppNavigationItem & {
  readonly to: NonNullable<AppNavigationItem['to']>;
};

export const memberNavigationItems: readonly AppNavigationLink[] = [
  { id: 'allMembers', labelKey: 'shell.navigation.allMembers', to: '/members/active/all' },
  { id: 'generalMembers', labelKey: 'shell.navigation.generalMembers', to: '/members/active/general' },
  { id: 'flaggedMembers', labelKey: 'shell.navigation.flaggedMembers', to: '/members/active/flagged' },
  { id: 'dormantMembers', labelKey: 'shell.navigation.dormantMembers', to: '/members/dormant' },
  { id: 'withdrawnMembers', labelKey: 'shell.navigation.withdrawnMembers', to: '/members/withdrawn' },
  { id: 'memberCounsel', labelKey: 'shell.navigation.memberCounsel', to: '/members/counsel' },
  { id: 'memberAppeals', labelKey: 'shell.navigation.memberAppeals', to: '/members/appeals' },
  { id: 'memberAccess', labelKey: 'shell.navigation.memberAccess', to: '/members/access' },
];
