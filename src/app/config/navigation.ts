/**
 * The product menu/permission contract is not confirmed yet. Replace this local
 * catalogue with the server-driven contract only after its shape and authority are agreed.
 */
export interface AppNavigationItem {
  readonly id: string;
  readonly labelKey: string;
  readonly to?: "/performances" | "/performances/contents" | "/managers" | "/exhibitions/banners" | "/community/boards" | "/community/posts" | "/ticketing/issues" | "/ticketing/printers" | "/terms" | "/members/active/all" | "/members/active/general" | "/members/active/flagged" | "/members/dormant" | "/members/withdrawn" | "/members/counsel" | "/members/appeals" | "/members/access";
}

export const appNavigationItems: readonly AppNavigationItem[] = [
  { id: "dashboard", labelKey: "shell.navigation.dashboard" },
  { id: "members", labelKey: "shell.navigation.members", to: "/members/active/all" },
  { id: "performances", labelKey: "shell.navigation.performances", to: "/performances" },
  // 발권 업무군의 진입은 LNB 에서 첫 번째로 구현된 화면인 전체발권이다(설정 → 운영자와 같다).
  { id: "ticketing", labelKey: "shell.navigation.ticketing", to: "/ticketing/issues" },
  { id: "exhibitions", labelKey: "shell.navigation.exhibitions", to: "/exhibitions/banners" },
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

/** LNB 커뮤니티 하위: Figma 9.2.1 frame 의 LNB 가 `게시판`·`게시물` 두 화면을 그린다(2026-09-22 실측). */
export const communityNavigationItems: readonly AppNavigationLink[] = [
  { id: 'boards', labelKey: 'shell.navigation.boards', to: '/community/boards' },
  { id: 'posts', labelKey: 'shell.navigation.posts', to: '/community/posts' },
];

/**
 * LNB 발권 하위: frame 은 등록(일반발권·대량재발권) · 전체발권 · 발권대기 · 발권완료(신규발권·재발권) ·
 * 분실 · 부가기능(스마트프린터)를 그린다. 지금 구현된 두 화면만 그 순서대로 둔다.
 */
export const ticketingNavigationItems: readonly AppNavigationLink[] = [
  { id: 'ticketIssues', labelKey: 'shell.navigation.ticketIssues', to: '/ticketing/issues' },
  { id: 'smartPrinters', labelKey: 'shell.navigation.smartPrinters', to: '/ticketing/printers' },
];

/**
 * LNB 설정 하위: Figma 11.2 frame 의 LNB 가 `운영자` · `약관` · `정책`(메뉴/기능·접근권한·회원·마케팅·
 * 전시·다국어) · `로그` 를 그린다(2026-09-22 실측). 지금 구현된 두 화면만 그 순서대로 둔다.
 * `약관` 아래에 다시 `{약관1}` 항목이 있으나 그 목록의 출처가 미확인이라(TERMS-LIST 미확인 6)
 * 여기서는 `약관` 화면 하나만 연결한다.
 */
export const settingsNavigationItems: readonly AppNavigationLink[] = [
  { id: 'managers', labelKey: 'shell.navigation.managers', to: '/managers' },
  { id: 'terms', labelKey: 'shell.navigation.terms', to: '/terms' },
];

/**
 * LNB 전시 하위: Figma 7.1 frame 의 LNB 가 `배너` · `APP Splash` 를 그린다(2026-09-23 실측).
 * 지금 구현된 배너 화면만 둔다.
 */
export const exhibitionNavigationItems: readonly AppNavigationLink[] = [
  { id: 'banners', labelKey: 'shell.navigation.banners', to: '/exhibitions/banners' },
];

/** LNB 공연 하위: Figma 5.1/5.2 가 `공연목록`·`콘텐츠` 두 화면을 같은 업무군으로 그린다. */
export const performanceNavigationItems: readonly AppNavigationLink[] = [
  { id: 'performanceList', labelKey: 'shell.navigation.performanceList', to: '/performances' },
  { id: 'performanceContents', labelKey: 'shell.navigation.performanceContents', to: '/performances/contents' },
];
