import { niceTicks } from "@/lib/chart";
import { cn } from "@/lib/cn";
import { formatDateAs, formatValue as fmtValue, type DateFormat, type ValueFormat } from "@/lib/format";
import type { TimePoint } from "@/types";

/** Compact column chart with value labels available to assistive tech. */
export function ColumnChart({
  data,
  valueFormat,
  dateFormat = "short",
  label,
  height = 180,
  className,
}: {
  data: TimePoint[];
  valueFormat: ValueFormat;
  dateFormat?: DateFormat;
  label: string;
  height?: number;
  className?: string;
}) {
  const formatValue = (v: number) => fmtValue(v, valueFormat);
  const formatDate = (iso: string) => formatDateAs(iso, dateFormat);
  const ticks = niceTicks(Math.max(...data.map((d) => d.value), 1), 3);
  const max = ticks[ticks.length - 1];
  return (
    <figure className={className}>
      <figcaption className="sr-only">{label}</figcaption>
      <ol className="flex items-end gap-1.5 sm:gap-2.5" style={{ height }}>
        {data.map((d, i) => {
          const isLast = i === data.length - 1;
          return (
            <li key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
              <span className="sr-only">
                {formatDate(d.date)}: {formatValue(d.value)}
              </span>
              <span
                aria-hidden="true"
                className="tabular pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-6 whitespace-nowrap rounded-xs bg-canvas-3 px-1.5 py-0.5 text-[11px] text-fg opacity-0 transition-opacity group-hover:opacity-100"
                style={{ bottom: `${(d.value / max) * 100}%` }}
              >
                {formatValue(d.value)}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "block w-full rounded-t-[3px] transition-colors duration-200",
                  isLast ? "bg-accent" : "bg-fg/15 group-hover:bg-fg/30",
                )}
                style={{ height: `${(d.value / max) * 100}%` }}
              />
            </li>
          );
        })}
      </ol>
      <div aria-hidden="true" className="mt-2 flex gap-1.5 sm:gap-2.5">
        {data.map((d, i) => (
          <span key={d.date} className={cn("tabular flex-1 text-center text-[10px] text-fg-3", i % 2 === 1 && "max-sm:invisible")}>
            {formatDate(d.date)}
          </span>
        ))}
      </div>
    </figure>
  );
}
