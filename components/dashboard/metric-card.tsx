import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatValue, type ValueFormat } from "@/lib/format";
import { ModuleIcon } from "@/components/shared/module-icon";
import type { Metric } from "@/types";
import { Sparkline } from "./charts/sparkline";

const metricFormat: Record<Metric["format"], ValueFormat> = {
  currency: "currency",
  number: "number",
  duration: "duration",
  percent: "percent",
};

/** Delta with arrow + sign + "good/bad" semantics (not colour alone). */
export function Delta({ value, positiveIsGood = true, className }: { value: number; positiveIsGood?: boolean; className?: string }) {
  const up = value >= 0;
  const good = up === positiveIsGood;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("tabular inline-flex items-center gap-0.5 text-xs font-medium", good ? "text-positive" : "text-negative", className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {up ? "+" : "−"}
      {Math.abs(value).toFixed(1)}%<span className="sr-only">{good ? " (improvement)" : " (decline)"}</span>
    </span>
  );
}

export function MetricCard({ metric, compact = false, className }: { metric: Metric; compact?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-lg border border-line bg-surface/60 transition-[border-color,background-color] duration-300 hover:border-line-strong hover:bg-surface",
        compact ? "gap-3 p-3.5" : "gap-5 p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn("truncate text-fg-3", compact ? "text-[11px]" : "text-[13px]")}>{metric.label}</p>
        <ModuleIcon module={metric.module} className={cn("shrink-0 text-fg-3", compact ? "size-3.5" : "size-4")} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("tabular whitespace-nowrap font-display font-medium tracking-tight text-fg", compact ? "text-lg" : "text-[26px] leading-none")}>
            {formatValue(metric.value, metricFormat[metric.format])}
          </p>
          <Delta value={metric.delta} positiveIsGood={metric.positiveIsGood} className={compact ? "mt-1" : "mt-2.5"} />
        </div>
        <Sparkline values={metric.trend} className={cn("shrink-0", compact ? "h-6 w-14" : "h-9 w-24")} tone={metric.delta >= 0 === metric.positiveIsGood ? "accent" : "muted"} />
      </div>
    </div>
  );
}
