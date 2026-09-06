import {
  displayTimeZone,
  formatDate,
  formatTimeInTimeZone,
} from "@/shared/lib/datetime";

export function formatMemberInstant(instant: string) {
  return `${formatDate(instant)} ${formatTimeInTimeZone(instant, displayTimeZone())}`;
}
