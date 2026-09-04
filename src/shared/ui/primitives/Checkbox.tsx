import { useEffect, useRef, type ComponentProps } from "react";
import { clsx } from "clsx";
/** Owns: native checkbox semantics, indeterminate state and tokens. Rejects: domain selection policy. API: CheckboxProps. Boundary: source primitive accessibility invariant (§UI layers). */
export interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  indeterminate?: boolean;
}
export function Checkbox({
  indeterminate = false,
  className,
  ref,
  ...props
}: CheckboxProps) {
  const localRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (localRef.current) localRef.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      {...props}
      ref={(node) => {
        localRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      type="checkbox"
      aria-checked={indeterminate ? "mixed" : props.checked}
      className={clsx(
        "size-4 rounded border border-neutral-400 accent-neutral-900",
        className,
      )}
    />
  );
}
