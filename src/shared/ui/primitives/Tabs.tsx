import { Tabs as RadixTabs } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export function Tabs(props: {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly children: React.ReactNode;
}) {
  return <RadixTabs.Root {...props} />;
}

export function TabsList({
  className,
  ...props
}: ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      {...props}
      className={cn("flex gap-1 border-b border-neutral-200", className)}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      {...props}
      className={cn(
        "rounded-t px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 data-[state=active]:bg-neutral-100 data-[state=active]:font-medium",
        className,
      )}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof RadixTabs.Content>) {
  return (
    <RadixTabs.Content
      {...props}
      className={cn(
        "py-3 outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 data-[state=inactive]:hidden",
        className,
      )}
    />
  );
}
