import type {
  ManagerPeriodType,
  ManagerType,
  ManagerStatus,
  ManagerRegistrationRouteType,
  ManagerSortDirection,
} from "./manager-list-contract";

export type ManagerSearch = {
  readonly keywords: {
    keywordType: "ID" | "NAME" | "PHONE" | "ORGANIZATION" | "PERMISSION";
    keyword: string;
  }[];
  readonly periodType: ManagerPeriodType;
  readonly types: ManagerType[];
  readonly statuses: ManagerStatus[];
  readonly agencyIds: number[];
  readonly registrationRouteTypes: ManagerRegistrationRouteType[];
  readonly sortType:
    | "ID"
    | "NAME"
    | "ORGANIZATION"
    | "PERMISSION"
    | "CREATED_AT"
    | "UPDATED_AT"
    | "TYPE"
    | "STATUS";
  readonly sortDirection: ManagerSortDirection;
  readonly page: number;
  readonly pageSize: number;
  readonly startDateTime: string | undefined;
  readonly endDateTime: string | undefined;
};
