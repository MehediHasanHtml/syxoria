import { cn } from "@/lib/cn";
import { formatValue, type ValueFormat } from "@/lib/format";
import { ModuleIcon } from "@/components/shared/module-icon";
import type { AnalyticsBreakdown } from "@/types";

/** Horizontal ranked bars — readable on any width, value always printed. */
export function BarList({
  items,
  valueFormat,
  className,
  label,
}: {
  items: AnalyticsBreakdown[];
  valueFormat: ValueFormat;
  className?: string;
  label: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul aria-label={label} className={cn("space-y-3.5", className)}>
      {items.map((item, idx) => (
        <li key={item.label} className="group">
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-2 text-fg-2">
              <ModuleIcon module={item.module} className="size-3.5 text-fg-3" />
              {item.label}
            </span>
            <span className="tabular text-fg">{formatValue(item.value, valueFormat)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className={cn(
                "h-full origin-left rounded-full transition-transform duration-700 ease-out-soft",
                idx === 0 ? "bg-accent" : "bg-fg/35 group-hover:bg-fg/50",
              )}
              style={{ transform: `scaleX(${item.value / max})` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
