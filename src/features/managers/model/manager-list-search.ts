export type ManagerListSearch = {
  periodType?: "joinedAt" | "lastAccessAt" | undefined;
  keywords?:
    { field: "email" | "name" | "phone" | "id"; value: string }[] | undefined;
  types?: string[] | undefined;
  permission?: string | undefined;
  statuses?:
    ("rejected" | "awaiting" | "active" | "inactive" | "locked")[] | undefined;
  registrationRoutes?: ("APP" | "WEB")[] | undefined;
  startDateTime?: string | undefined;
  endDateTime?: string | undefined;
  sort?:
    | "type"
    | "email"
    | "name"
    | "phone"
    | "accountStatus"
    | "id"
    | "organization"
    | "permission"
    | "registrationRoute"
    | "joinedAt"
    | "lastAccessAt"
    | undefined;
  direction?: "asc" | "desc" | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
};
