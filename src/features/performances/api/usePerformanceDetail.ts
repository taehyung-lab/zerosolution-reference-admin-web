import { useDetailQuery } from "@/api/required-query";
import { useLocale } from "@/shared/i18n/locale-context";
import { performanceDetailQuery } from "./queries";

export function usePerformanceDetail(id: string) {
  const { locale } = useLocale();
  return useDetailQuery(performanceDetailQuery(locale, id));
}
