import { standardPageSizeOptions } from "@/shared/model/list-options";
import type {
  memberAccountStatuses,
  memberRestrictions,
  memberSignupMethods,
} from "./account";

export const memberPeriodTypes = ["joinedAt", "lastAccessedAt"] as const;

export const memberKeywordTypes = ["email", "name", "phone"] as const;

export const memberSortTypes = [
  "joinedAt",
  "lastAccessedAt",
  "signupMethod",
  "email",
  "name",
  "phone",
] as const;

export const memberSortDirections = ["asc", "desc"] as const;

export const memberPageSizes = standardPageSizeOptions;

export interface MemberSearch {
  readonly periodType: (typeof memberPeriodTypes)[number];
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly keywords: readonly {
    readonly field: (typeof memberKeywordTypes)[number];
    readonly value: string;
  }[];
  readonly signupMethods: readonly (typeof memberSignupMethods)[number][];
  readonly accountStatuses: readonly (typeof memberAccountStatuses)[number][];
  readonly restrictions: readonly (typeof memberRestrictions)[number][];
  readonly sortType: (typeof memberSortTypes)[number];
  readonly sortDirection: (typeof memberSortDirections)[number];
  readonly page: number;
  readonly pageSize: (typeof memberPageSizes)[number];
}
