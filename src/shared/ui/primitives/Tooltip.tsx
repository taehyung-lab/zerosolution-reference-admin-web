import type { ReactElement } from 'react';
import { Tooltip as RadixTooltip } from 'radix-ui';

export function Tooltip({
  children,
  content,
}: {
  readonly children: ReactElement;
  readonly content: string;
}) {
  return (
    <RadixTooltip.Provider delayDuration={0}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className="rounded bg-neutral-900 px-2 py-1 text-sm text-white shadow-sm"
            sideOffset={4}
          >
            {content}
            <RadixTooltip.Arrow className="fill-neutral-900" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
