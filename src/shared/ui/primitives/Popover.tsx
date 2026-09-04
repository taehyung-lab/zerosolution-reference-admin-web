import {
  cloneElement,
  type ReactElement,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type Ref,
} from "react";
import { Popover as RadixPopover } from "radix-ui";

/** Owns: Radix focus/dismiss/tokens. Rejects: content, copy and domain workflow. API: trigger,children,contentLabel,open?,onOpenChange?. Boundary: primitive keyboard/focus mechanics (§promotion). */
export function Popover({
  trigger,
  children,
  contentLabel,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger: ReactElement<{ ref?: Ref<HTMLButtonElement> }>;
  children: ReactElement | string;
  contentLabel: string;
  /**
   * Pass both to own the open state (a caller that must close after its own selection and
   * reflect the state on its trigger). Omit both and the popover owns it. Every dismissal path —
   * trigger toggle, Escape, outside pointer — reports through `onOpenChange`.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const dismiss = useEffectEvent(() => setOpen(false));
  useEffect(() => {
    if (!open) return;
    const dismissOutside = (event: MouseEvent) => {
      if (
        !contentRef.current?.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      )
        dismiss();
    };
    document.addEventListener("mousedown", dismissOutside, true);
    return () =>
      document.removeEventListener("mousedown", dismissOutside, true);
  }, [open]);
  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Trigger asChild>
        {cloneElement(trigger, { ref: triggerRef })}
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          ref={contentRef}
          aria-label={contentLabel}
          onCloseAutoFocus={() => triggerRef.current?.focus()}
          className="z-10 rounded border bg-white p-2 shadow-sm"
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
