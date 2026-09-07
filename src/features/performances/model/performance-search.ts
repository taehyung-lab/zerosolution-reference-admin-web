export type PerformanceSearch = {
  readonly searched: false | undefined;
  readonly periodType: "updatedAt" | "performedAt" | "registeredAt";
  readonly startDateTime: string | undefined;
  readonly endDateTime: string | undefined;
  readonly keywords: {
    field: "title" | "performers" | "organizer";
    value: string;
  }[];
  readonly ticketKinds: string[];
  readonly performanceTypes: string[];
  readonly sellers: string[];
  readonly venueId: string | undefined;
  readonly sortType:
    | "title"
    | "updatedAt"
    | "registeredAt"
    | "performers"
    | "organizer"
    | "period"
    | "ticketKind"
    | "performanceType";
  readonly sortDirection: "asc" | "desc" | undefined;
  readonly page: number;
  readonly pageSize: 100 | 200 | 300 | 400 | 500 | 700 | 1000;
};
