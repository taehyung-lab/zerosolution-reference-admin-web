import { useDraftCommit } from './use-draft-commit';

export interface KeywordFilterItem<TField extends string | undefined> {
  readonly field: TField;
  readonly value: string;
}

export interface KeywordDraft<TField extends string | undefined> {
  readonly items: readonly KeywordFilterItem<TField>[];
  readonly pending: KeywordFilterItem<TField>;
}

export function createKeywordDraft<TField extends string | undefined>({
  items,
  initialField,
}: {
  readonly items: readonly KeywordFilterItem<TField>[];
  readonly initialField: TField;
}): KeywordDraft<TField> {
  return {
    items: [...items],
    pending: { field: initialField, value: '' },
  };
}

/**
 * Owns the uncommitted keyword list in its neutral `{ field, value }` shape. The caller
 * projects committed values in and converts to its server shape at the request boundary
 * only, so no per-keystroke round trip through the caller's state exists.
 */
export function useKeywordDraft<TField extends string | undefined>({
  committedItems,
  initialField,
  resetKey,
}: {
  readonly committedItems: readonly KeywordFilterItem<TField>[];
  readonly initialField: TField;
  readonly resetKey: unknown;
}) {
  const { draft, setDraft, resetDraft } = useDraftCommit({
    committed: committedItems,
    keyOf: () => resetKey,
    createDraft: (items) => createKeywordDraft({ items, initialField }),
  });

  const setPendingField = (field: TField) =>
    setDraft((current) => ({
      ...current,
      pending: { ...current.pending, field },
    }));

  const setPendingValue = (value: string) =>
    setDraft((current) => ({
      ...current,
      pending: { ...current.pending, value },
    }));

  const itemsIncludingPending = () => {
    const value = draft.pending.value.trim();
    return value === ''
      ? draft.items
      : [...draft.items, { field: draft.pending.field, value }];
  };

  const addPending = () => {
    const items = itemsIncludingPending();
    if (items === draft.items) return items;

    setDraft((current) => ({
      items,
      pending: { ...current.pending, value: '' },
    }));
    return items;
  };

  const removeAt = (index: number) =>
    setDraft((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));

  const clear = () => setDraft((current) => ({ ...current, items: [] }));

  return {
    items: draft.items,
    pending: draft.pending,
    setPendingField,
    setPendingValue,
    addPending,
    removeAt,
    clear,
    reset: resetDraft,
    itemsIncludingPending,
  };
}
