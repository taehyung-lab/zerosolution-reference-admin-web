import type { ReactNode } from "react";
/** Owns: tone and badge token. Rejects: status-to-tone mapping. API: tone,children. Boundary: feature retains status semantics §promotion. */
export function Badge({
  tone,
  children,
}: {
  tone: "neutral" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-700",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
  };
  return (
    <span className={`rounded px-2 py-1 text-xs ${tones[tone]}`}>
      {children}
    </span>
  );
}
