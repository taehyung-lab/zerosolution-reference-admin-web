export type CheckboxTreeNode =
  | {
      readonly value: string;
      readonly label: string;
      readonly children?: undefined;
    }
  | {
      readonly label: string;
      readonly children: readonly CheckboxTreeNode[];
      readonly value?: undefined;
    };
/**
 * Owns: controlled leaf-value selection. Select-all is checked only when every leaf
 * is selected; a parent is checked when any descendant is selected.
 * Rejects: URL serialization, enum meaning, API meaning of all.
 * API: nodes, values, onValueChange.
 * Boundary: domain-free selection mechanics per shared-ui-contract §promotion.
 */
export function CheckboxTree({
  nodes,
  values,
  onValueChange,
  selectAllLabel,
  emptyMeansAll = false,
  ariaLabelledby,
  id,
  ariaDescribedby,
  ariaInvalid,
  onBlur,
}: {
  nodes: readonly CheckboxTreeNode[];
  values: readonly string[];
  onValueChange: (values: string[]) => void;
  selectAllLabel: string;
  emptyMeansAll?: boolean;
  ariaLabelledby?: string;
  id?: string;
  ariaDescribedby?: string;
  ariaInvalid?: boolean;
  onBlur?: () => void;
}) {
  const leaves = (items: readonly CheckboxTreeNode[]): string[] =>
    items.flatMap((item) =>
      item.children ? leaves(item.children) : [item.value]
    );
  const all = leaves(nodes);
  const selected = new Set(emptyMeansAll && values.length === 0 ? all : values);
  const set = (targets: readonly string[], checked: boolean) => {
    const next = new Set(selected);
    targets.forEach((value) =>
      checked ? next.add(value) : next.delete(value)
    );
    const nextValues = all.filter((value) => next.has(value));
    onValueChange(
      emptyMeansAll && nextValues.length === all.length ? [] : nextValues
    );
  };
  const control = (
    label: string,
    descendants: readonly string[],
    requireAll: boolean
  ) => {
    const count = descendants.filter((value) => selected.has(value)).length;
    const checked = requireAll
      ? count === descendants.length && count > 0
      : count > 0;
    return (
      <button
        type="button"
        role="checkbox"
        aria-label={label}
        aria-checked={checked}
        className="inline-flex cursor-pointer items-center gap-2 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        onClick={() => set(descendants, !checked)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className={`size-4 shrink-0 ${checked ? '' : 'invisible'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 8.5 3.5 3.5L13 4.5" />
        </svg>
        <span className="underline">{label}</span>
      </button>
    );
  };
  const branch = (node: CheckboxTreeNode) => (
    <li key={node.value ?? node.label}>
      {control(
        node.label,
        node.children ? leaves(node.children) : [node.value],
        false
      )}
      {node.children ? (
        <ul className="ml-5">{node.children.map(branch)}</ul>
      ) : null}
    </li>
  );
  const isFlat = nodes.every((node) => node.children === undefined);
  return (
    <div
      aria-describedby={ariaDescribedby}
      aria-invalid={ariaInvalid}
      aria-labelledby={ariaLabelledby}
      className={isFlat ? 'flex flex-wrap items-center gap-5' : 'grid gap-2'}
      id={id}
      onBlur={onBlur}
      role="group"
    >
      {control(selectAllLabel, all, true)}
      {isFlat ? (
        <span aria-hidden="true" className="h-3 w-px shrink-0 bg-neutral-300" />
      ) : null}
      <ul
        className={isFlat ? 'flex flex-wrap items-center gap-5' : 'grid gap-2'}
      >
        {nodes.map(branch)}
      </ul>
    </div>
  );
}
