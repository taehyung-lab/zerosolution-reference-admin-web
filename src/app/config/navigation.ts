/**
 * The product menu/permission contract is not confirmed yet. Replace this local
 * catalogue with the server-driven contract only after its shape and authority are agreed.
 */
export interface AppNavigationItem {
  readonly id: string;
  readonly labelKey: string;
  readonly to?: "/performances" | "/performances/contents" | "/managers" | "/community/boards" | "/ticketing/printers" | "/members/active/all" | "/members/active/general" | "/members/active/flagged" | "/members/dormant" | "/members/withdrawn" | "/members/counsel" | "/members/appeals" | "/members/access";
}

export const appNavigationItems: readonly AppNavigationItem[] = [
  { id: "dashboard", labelKey: "shell.navigation.dashboard" },
  { id: "members", labelKey: "shell.navigation.members", to: "/members/active/all" },
  { id: "performances", labelKey: "shell.navigation.performances", to: "/performances" },
  // 발권 업무군에서 구현된 화면은 부가기능 > 스마트프린터 하나뿐이라 그 화면을 진입으로 쓴다(설정 → 운영자와 같다).
  { id: "ticketing", labelKey: "shell.navigation.ticketing", to: "/ticketing/printers" },
  { id: "exhibitions", labelKey: "shell.navigation.exhibitions" },
  { id: "promotions", labelKey: "shell.navigation.promotions" },
  { id: "community", labelKey: "shell.navigation.community", to: "/community/boards" },
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

/** LNB 공연 하위: Figma 5.1/5.2 가 `공연목록`·`콘텐츠` 두 화면을 같은 업무군으로 그린다. */
export const performanceNavigationItems: readonly AppNavigationLink[] = [
  { id: 'performanceList', labelKey: 'shell.navigation.performanceList', to: '/performances' },
  { id: 'performanceContents', labelKey: 'shell.navigation.performanceContents', to: '/performances/contents' },
];
