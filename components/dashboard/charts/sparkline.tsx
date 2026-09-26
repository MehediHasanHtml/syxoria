import { areaPath, smoothPath, toPoints } from "@/lib/chart";
import { cn } from "@/lib/cn";

const W = 120;
const H = 32;

/** Decorative trend line (values are also shown as text next to it). */
export function Sparkline({ values, tone = "accent", className }: { values: number[]; tone?: "accent" | "muted"; className?: string }) {
  if (values.length < 2) return null;
  const pts = toPoints(values, W, H, { padTop: 0.15 });
  const line = smoothPath(pts);
  const color = tone === "accent" ? "var(--color-accent)" : "var(--color-fg-3)";
  const gid = `spark-${values.join("-").slice(0, 24).replace(/\./g, "")}-${tone}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" className={cn("h-8 w-full overflow-visible", className)}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath(line, pts, H)} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
