import type { ReactNode } from 'react';
import { Accordion as RadixAccordion } from 'radix-ui';
import { cn } from '@/shared/lib/cn';

const ITEM_VALUE = 'section';

/**
 * Owns: Radix disclosure wiring — `aria-expanded`, `aria-controls`, the content's `region` role and
 * its association with the trigger, keyboard activation and `data-state`.
 * Rejects: content meaning, copy, surface chrome.
 * API: open,onOpenChange,trigger,triggerAriaLabel,headerEnd,children.
 * Boundary: primitive mechanics (§promotion, ADR 0008).
 *
 * One section per instance. Radix arrow-key movement between sibling triggers needs several items
 * under one Root, which no confirmed screen requires yet; revisit when one does.
 *
 * Closed content is unmounted by default, as it is in a hand-rolled disclosure. `keepMounted`
 * keeps the closed content in the DOM as `hidden` (out of the accessibility tree and tab order)
 * so registrations inside it survive — a form uses it so TanStack Form keeps field errors while a
 * section is closed. Hidden content is still invisible: a caller that needs an error seen or
 * focused must reopen the section first.
 */
export function Accordion({
  open,
  onOpenChange,
  trigger,
  triggerAriaLabel,
  headerEnd,
  children,
  className,
  headerClassName,
  triggerClassName,
  contentClassName,
  keepMounted = false,
}: {
  readonly open: boolean;
  readonly keepMounted?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly trigger: ReactNode;
  readonly triggerAriaLabel?: string;
  readonly headerEnd?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  readonly headerClassName?: string;
  readonly triggerClassName?: string;
  readonly contentClassName?: string;
}) {
  return (
    <RadixAccordion.Root
      className={className}
      collapsible
      onValueChange={(value) => onOpenChange(value === ITEM_VALUE)}
      type="single"
      value={open ? ITEM_VALUE : ''}
    >
      <RadixAccordion.Item value={ITEM_VALUE}>
        <div className={cn('flex items-center justify-between gap-3', headerClassName)}>
          <RadixAccordion.Header className="flex min-w-0 flex-1">
            <RadixAccordion.Trigger
              aria-label={triggerAriaLabel}
              className={cn('w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-300', triggerClassName)}
            >
              {trigger}
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>
          {headerEnd}
        </div>
        {keepMounted ? (
          <RadixAccordion.Content className={contentClassName} forceMount hidden={!open}>
            {children}
          </RadixAccordion.Content>
        ) : (
          <RadixAccordion.Content className={contentClassName}>{children}</RadixAccordion.Content>
        )}
      </RadixAccordion.Item>
    </RadixAccordion.Root>
  );
}
