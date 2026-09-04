import { DayPicker } from "react-day-picker";
import { enUS, ja, ko } from "react-day-picker/locale";
import { useTranslation } from "react-i18next";
import "react-day-picker/style.css";

function toLocalDateValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Owns: react-day-picker keyboard/date presentation. Rejects: timezone/boundary/preset policy. API: value,onValueChange. Boundary: date rendering (§date-file-fields). */
export function Calendar({
  value,
  min,
  max,
  onValueChange,
  id,
  ariaDescribedby,
  ariaInvalid,
  ariaLabelledby,
  onBlur,
}: {
  value?: string;
  min?: string;
  max?: string;
  onValueChange: (value: string | undefined) => void;
  id?: string;
  ariaDescribedby?: string;
  ariaInvalid?: boolean;
  ariaLabelledby?: string;
  onBlur?: () => void;
}) {
  const { i18n, t } = useTranslation("shared");
  const locale = i18n.language === "ja" ? ja : i18n.language === "ko" ? ko : enUS;
  const selected =
    value === undefined ? undefined : new Date(`${value}T00:00:00`);
  const disabled = [
    ...(min ? [{ before: new Date(`${min}T00:00:00`) }] : []),
    ...(max ? [{ after: new Date(`${max}T00:00:00`) }] : []),
  ];
  return (
    <div aria-describedby={ariaDescribedby} aria-invalid={ariaInvalid} aria-labelledby={ariaLabelledby} id={id} onBlur={onBlur} role="group">
    <DayPicker
      mode="single"
      locale={locale}
      labels={{
        labelNav: () => t("calendar.navigation"),
        labelNext: () => t("calendar.nextMonth"),
        labelPrevious: () => t("calendar.previousMonth"),
      }}
      disabled={disabled}
      // Without this the grid always opens on the current month, so a field that already holds a
      // date shows a month that does not contain it. react-day-picker does not derive the month
      // from `selected`.
      defaultMonth={selected}
      selected={selected}
      onSelect={(date) =>
        onValueChange(date === undefined ? undefined : toLocalDateValue(date))
      }
    />
    </div>
  );
}
