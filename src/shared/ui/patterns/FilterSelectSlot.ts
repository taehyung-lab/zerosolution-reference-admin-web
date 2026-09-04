/**
 * The leading single-select that most list filters place before a period range or keyword
 * input (a date criterion, a keyword target). It is a controlled surface of plain strings:
 * the feature owns the enum, its labels, and what a change means.
 */
export interface FilterSelectSlot<TValue extends string> {
  readonly label: string;
  readonly value: TValue;
  readonly options: readonly {
    readonly value: TValue;
    readonly label: string;
  }[];
  readonly onValueChange: (value: TValue) => void;
}
