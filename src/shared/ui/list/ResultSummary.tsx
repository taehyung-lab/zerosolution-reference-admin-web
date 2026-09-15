import { Fragment } from 'react';

export interface ResultSummaryItem {
  readonly key: string;
  readonly text: string;
}

export interface ResultSummaryGroup {
  readonly key: string;
  readonly items: readonly ResultSummaryItem[];
}

/**
 * These two glyphs are shared visual separators only; they are
 * hidden from the accessibility tree so each item stays one list item, and no sentence
 * character is ever composed here.
 */
const ITEM_SEPARATOR = ',';
const GROUP_SEPARATOR = '|';

/** Arranges completed summary sentences; the feature owns numbers, units and meaning. */
export function ResultSummary({
  groups,
}: {
  readonly groups: readonly ResultSummaryGroup[];
}) {
  const filled = groups.filter((group) => group.items.length > 0);
  if (filled.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      {filled.map((group, groupIndex) => (
        <Fragment key={group.key}>
          {groupIndex > 0 ? (
            <span aria-hidden="true" className="text-neutral-400">
              {GROUP_SEPARATOR}
            </span>
          ) : null}
          <ul role="list" className="flex flex-wrap items-center gap-x-2">
            {group.items.map((item, itemIndex) => (
              <li key={item.key}>
                {item.text}
                {itemIndex < group.items.length - 1 ? (
                  <span aria-hidden="true">{ITEM_SEPARATOR}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </div>
  );
}
