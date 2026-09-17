import { Select as RadixSelect } from "radix-ui";
import { cn } from "@/shared/lib/cn";

/** Owns: Radix single-select listbox, focus/keyboard and tokens. Rejects: remote search, multi-select, `multiple`. API: value,onValueChange,options,placeholder. Boundary: explicit select contract (`shared-ui.md` Primitives). */
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  id,
  name,
  disabled,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  "aria-labelledby": labelledBy,
  "aria-label": ariaLabel,
  onBlur,
  ref,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
  options: readonly { value: string; label: string }[];
  /**
   * The empty state's visible text. Radix rejects an empty-string item value, so the empty
   * state is the trigger's placeholder rather than an option, and the public `null` maps to
   * Radix's controlled empty-string root value here. Callers never see that mapping. The wording
   * stays caller-owned.
   */
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-labelledby"?: string;
  "aria-label"?: string;
  onBlur?: () => void;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <RadixSelect.Root
      value={value ?? ""}
      onValueChange={(next) => onValueChange(next === "" ? null : next)}
      disabled={disabled}
      name={name}
    >
      <RadixSelect.Trigger
        ref={ref}
        id={id}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        onBlur={onBlur}
        className={cn(
          "flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-neutral-300 bg-white px-3 text-left text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-300 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400 aria-invalid:border-red-600 data-[placeholder]:text-neutral-500",
          className,
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon aria-hidden="true" className="text-neutral-500">
          ▾
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-neutral-200 bg-white shadow-md"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className="flex cursor-default select-none items-center rounded px-2 py-2 text-sm outline-none data-[disabled]:opacity-50 data-[highlighted]:bg-neutral-100 data-[state=checked]:font-medium"
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
