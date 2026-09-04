/**
 * The product menu/permission contract is not confirmed yet. Replace this local
 * catalogue with the server-driven contract only after its shape and authority are agreed.
 */
export interface AppNavigationItem {
  readonly id: string;
  readonly labelKey: string;
  readonly to?: "/managers";
}

export const appNavigationItems: readonly AppNavigationItem[] = [
  { id: "dashboard", labelKey: "shell.navigation.dashboard" },
  { id: "members", labelKey: "shell.navigation.members" },
  { id: "performances", labelKey: "shell.navigation.performances" },
  { id: "ticketing", labelKey: "shell.navigation.ticketing" },
  { id: "exhibitions", labelKey: "shell.navigation.exhibitions" },
  { id: "promotions", labelKey: "shell.navigation.promotions" },
  { id: "community", labelKey: "shell.navigation.community" },
  { id: "statistics", labelKey: "shell.navigation.statistics" },
  { id: "settings", labelKey: "shell.navigation.settings", to: "/managers" },
];
