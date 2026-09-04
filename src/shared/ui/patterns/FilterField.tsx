import { useId, type ReactNode } from 'react';

export interface FilterFieldIds {
  readonly labelId: string;
  readonly controlId: string;
}

/**
 * Owns filter-row layout and its accessible name; the feature owns values and policy.
 *
 * Both name paths are provided because Figma filter rows hold either a single native
 * control or a composite one. Which label element is correct depends on
 * the path the caller takes, so the consumed id is observed while the row renders:
 * `controlId` means one native control and `<label htmlFor>`, `labelId` alone means a
 * composite control naming itself with `aria-labelledby`.
 *
 * `group` covers the third shape every list filter repeats: several sibling controls (a
 * criterion select beside a period range, a target select beside keyword chips) that share
 * one row label. The field then owns the `role="group"` wrapper named by that label, so the
 * caller only renders the controls. Controls that already name themselves with `labelId`
 * (`CheckboxTree`) must not use `group`, or the name would be announced twice.
 */
export function FilterField({
  label,
  group = false,
  children,
}: {
  readonly label: string;
  readonly group?: boolean;
  readonly children: (ids: FilterFieldIds) => ReactNode;
}) {
  const labelId = useId();
  const controlId = useId();
  const field = renderControl(children, labelId, controlId);
  const content = group ? (
    <div
      role="group"
      aria-labelledby={labelId}
      className="flex flex-wrap items-start gap-2"
    >
      {field.content}
    </div>
  ) : (
    field.content
  );

  return (
    <div className="flex flex-col items-start gap-1 text-sm">
      {field.usesControlId ? (
        <label id={labelId} htmlFor={controlId}>
          {label}
        </label>
      ) : (
        <span id={labelId}>{label}</span>
      )}
      <div className="w-full min-w-0">{content}</div>
    </div>
  );
}

function renderControl(
  children: (ids: FilterFieldIds) => ReactNode,
  labelId: string,
  controlId: string
): { readonly content: ReactNode; readonly usesControlId: boolean } {
  let usesControlId = false;
  const content = children({
    labelId,
    get controlId() {
      usesControlId = true;
      return controlId;
    },
  });
  return { content, usesControlId };
}
