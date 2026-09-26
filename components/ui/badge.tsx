import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "accent" | "positive" | "negative" | "caution" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "border-line-strong bg-white/[0.03] text-fg-2",
  accent: "border-accent-line bg-accent-soft text-accent-strong",
  positive: "border-positive/25 bg-positive-soft text-positive",
  negative: "border-negative/25 bg-negative-soft text-negative",
  caution: "border-caution/25 bg-caution-soft text-caution",
  info: "border-info/25 bg-info-soft text-info",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  icon,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 text-xs font-medium [&_svg]:size-3",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
