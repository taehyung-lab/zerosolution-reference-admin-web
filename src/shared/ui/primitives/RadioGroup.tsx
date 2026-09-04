import { createContext, useContext, useId, type ReactNode } from "react";

interface RadioGroupContextValue {
  readonly name: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/** Owns: native radio keyboard semantics and tokens. Rejects: option meaning/preset calculation. API: value,onValueChange,children. Boundary: source primitive §UI layers. */
export function RadioGroup({
  value,
  onValueChange,
  children,
  label,
  ariaLabelledby,
  id,
  ariaDescribedby,
  ariaInvalid,
  onBlur,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  label?: string;
  ariaLabelledby?: string;
  id?: string;
  ariaDescribedby?: string;
  ariaInvalid?: boolean;
  onBlur?: () => void;
}) {
  const name = `radio-group-${useId()}`;
  return (
    <fieldset aria-describedby={ariaDescribedby} aria-invalid={ariaInvalid} aria-labelledby={ariaLabelledby} id={id} onBlur={onBlur}>
      {label ? <legend className="sr-only">{label}</legend> : null}
      <RadioGroupContext.Provider value={{ name, value, onValueChange }}>
        <div className="flex flex-wrap items-center gap-5">{children}</div>
      </RadioGroupContext.Provider>
    </fieldset>
  );
}
export function RadioGroupItem({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  const group = useContext(RadioGroupContext);
  if (group === null) {
    throw new Error("RadioGroupItem must be rendered inside RadioGroup");
  }

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-neutral-900">
      <input
        type="radio"
        name={group.name}
        value={value}
        checked={group.value === value}
        onChange={() => group.onValueChange(value)}
        className="peer sr-only"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="invisible size-4 shrink-0 peer-checked:visible"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 8.5 3.5 3.5L13 4.5" />
      </svg>
      <span className="underline">{children}</span>
    </label>
  );
}
