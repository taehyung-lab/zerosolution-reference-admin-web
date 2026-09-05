import { useState } from 'react';

/** What a column builder needs to render the header and row checkboxes. */
export interface PageRowSelection<TRow> {
  readonly selectedIds: readonly string[];
  readonly isChecked: (row: TRow) => boolean;
  readonly isAllChecked: boolean;
  readonly isMixed: boolean;
  readonly toggleRow: (row: TRow, checked: boolean) => void;
  readonly togglePage: (checked: boolean) => void;
  readonly clear: () => void;
}

/**
 * Selection covers the current page of one committed view: every list that has row
 * checkboxes drops the selection when the committed view changes, and keeps only the ids
 * that still exist and are still selectable when the same view is fetched again.
 */
export function usePageRowSelection<TRow>({
  rows,
  getId,
  isSelectable,
  resetKey,
}: {
  readonly rows: readonly TRow[];
  readonly getId: (row: TRow) => string;
  readonly isSelectable?: (row: TRow) => boolean;
  readonly resetKey: string;
}): PageRowSelection<TRow> {
  // Compared by content, not array identity: a list hook that maps rows every render still
  // gets a stable page, and a row that actually left is the only thing that prunes.
  const selectableIds = rows.filter((row) => isSelectable?.(row) !== false).map(getId);
  const sourceKey = selectableIds.join('\u0000');
  const [state, setState] = useState<{
    readonly resetKey: string;
    readonly sourceKey: string;
    readonly ids: ReadonlySet<string>;
  }>({ resetKey, sourceKey, ids: new Set() });

  let stored = state.ids;
  if (state.resetKey !== resetKey) {
    stored = new Set();
    setState({ resetKey, sourceKey, ids: stored });
  } else if (state.sourceKey !== sourceKey) {
    stored = pruneToSelectable(state.ids, selectableIds);
    setState({ resetKey, sourceKey, ids: stored });
  }

  const selected = pruneToSelectable(stored, selectableIds);
  const commit = (ids: ReadonlySet<string>) => setState({ resetKey, sourceKey, ids });
  const toggle = (ids: readonly string[], checked: boolean) => {
    const next = new Set(selected);
    for (const id of ids) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    commit(next);
  };
  const isAllChecked = selectableIds.length > 0 && selected.size === selectableIds.length;

  return {
    selectedIds: [...selected],
    isChecked: (row: TRow) => selected.has(getId(row)),
    isAllChecked,
    isMixed: selected.size > 0 && !isAllChecked,
    toggleRow: (row: TRow, checked: boolean) => toggle([getId(row)], checked),
    togglePage: (checked: boolean) => toggle(selectableIds, checked),
    clear: () => commit(new Set()),
  };
}

function pruneToSelectable(
  selected: ReadonlySet<string>,
  selectableIds: readonly string[],
): ReadonlySet<string> {
  const allowed = new Set(selectableIds);
  return new Set([...selected].filter((id) => allowed.has(id)));
}
