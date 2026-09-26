import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ProgressProps = {
  value: number; // 0–100
  label: string; // accessible name
  tone?: "fg" | "accent" | "positive" | "negative" | "caution";
  size?: "xs" | "sm";
  className?: string;
};

const toneFill = {
  fg: "bg-fg/80",
  accent: "bg-accent",
  positive: "bg-positive",
  negative: "bg-negative",
  caution: "bg-caution",
};

/** Linear progress. Fill animates with transform (scaleX), not width. */
export function Progress({ value, label, tone = "fg", size = "xs", className }: ProgressProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative w-full overflow-hidden rounded-full bg-white/[0.06]", size === "xs" ? "h-1" : "h-1.5", className)}
    >
      <div
        className={cn("absolute inset-0 origin-left rounded-full transition-transform duration-700 ease-out-soft", toneFill[tone])}
        style={{ transform: `scaleX(${v / 100})` }}
      />
    </div>
  );
}

/** Circular progress ring — used for stage/progress summaries. */
export function ProgressRing({
  value,
  size = 44,
  stroke = 3,
  label,
  className,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  className?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out-soft"
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  );
}
