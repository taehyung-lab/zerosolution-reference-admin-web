import { useTranslation } from "react-i18next";

export interface KeywordChipFieldProps<TField extends string | undefined> {
  readonly items: readonly { field: TField; value: string }[];
  /** The chip text: the caller composes the field's human label with the value. */
  readonly formatItem: (item: { field: TField; value: string }) => string;
  readonly pendingValue: string;
  readonly onPendingValueChange: (value: string) => void;
  readonly onAdd: () => void;
  readonly onRemoveAt: (index: number) => void;
  readonly ariaLabelledby?: string;
}

export function KeywordChipField<TField extends string | undefined>({
  items,
  formatItem,
  pendingValue,
  onPendingValueChange,
  onAdd,
  onRemoveAt,
  ariaLabelledby,
}: KeywordChipFieldProps<TField>) {
  const { t } = useTranslation("shared");
  return (
    <div
      role={ariaLabelledby ? "group" : undefined}
      aria-labelledby={ariaLabelledby}
      className="flex flex-wrap gap-2"
    >
      <input
        aria-label={t("filter.keyword.input")}
        className="min-h-10 min-w-72 rounded border border-neutral-300 px-3 text-sm"
        value={pendingValue}
        onChange={(event) => onPendingValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
          // 검색 패널이 <form>이라 엔터는 기본적으로 검색으로 새어 나가고 입력값이 chip이 되지 않은 채 사라진다.
          event.preventDefault();
          onAdd();
        }}
      />
      <button
        className="min-h-10 rounded border px-3 text-sm"
        type="button"
        onClick={onAdd}
      >
        {t("filter.keyword.add")}
      </button>
      <div className="basis-full flex flex-wrap gap-2">
        {items.map((item, index) => (
          <button
            className="rounded border border-neutral-300 px-2 py-1 text-sm"
            key={`${item.field}-${item.value}-${index}`}
            type="button"
            aria-label={t("filter.keyword.remove", { value: item.value })}
            onClick={() => onRemoveAt(index)}
          >
            {formatItem(item)} {'×'}
          </button>
        ))}
      </div>
    </div>
  );
}
