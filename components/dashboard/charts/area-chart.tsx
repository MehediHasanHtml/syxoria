"use client";

import { useId, useMemo, useState, type PointerEvent } from "react";
import { areaPath, niceTicks, smoothPath, toPoints } from "@/lib/chart";
import { cn } from "@/lib/cn";
import { formatDateAs, formatValue as fmtValue, type DateFormat, type ValueFormat } from "@/lib/format";
import { useInView } from "@/lib/hooks/use-in-view";
import type { TimePoint } from "@/types";

type AreaChartProps = {
  data: TimePoint[];
  compare?: TimePoint[];
  label: string;
  valueFormat: ValueFormat;
  dateFormat?: DateFormat;
  seriesLabel?: string;
  compareLabel?: string;
  height?: number;
  showAxis?: boolean;
  /** Roughly how many date labels to show under the chart (fewer for narrow charts). */
  xLabels?: number;
  className?: string;
};

const W = 1000;

/**
 * Custom area chart. SVG uses a stretched viewBox with non-scaling strokes;
 * interactive markers are HTML positioned by percentage so they never distort.
 */
export function AreaChart({
  data,
  compare,
  label,
  valueFormat,
  dateFormat = "short",
  seriesLabel = "Current",
  compareLabel = "Previous",
  height = 260,
  showAxis = true,
  xLabels = 6,
  className,
}: AreaChartProps) {
  const formatValue = (v: number) => fmtValue(v, valueFormat);
  const formatDate = (iso: string) => formatDateAs(iso, dateFormat);
  const uid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "0px 0px -5% 0px" });
  const H = height;

  const geo = useMemo(() => {
    const values = data.map((d) => d.value);
    const all = compare ? values.concat(compare.map((d) => d.value)) : values;
    const ticks = niceTicks(Math.max(...all, 1));
    const max = ticks[ticks.length - 1];
    const pts = toPoints(values, W, H, { min: 0, max, padTop: 0 });
    const line = smoothPath(pts);
    const cmpPts = compare ? toPoints(compare.map((d) => d.value), W, H, { min: 0, max, padTop: 0 }) : null;
    return { ticks, max, pts, line, area: areaPath(line, pts, H), cmpLine: cmpPts ? smoothPath(cmpPts) : null };
  }, [data, compare, H]);

  if (!data.length) return null;

  const first = data[0];
  const last = data[data.length - 1];

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHover(Math.round(ratio * (data.length - 1)));
  }

  const hp = hover !== null ? geo.pts[hover] : null;
  const labelEvery = Math.ceil(data.length / xLabels);

  return (
    <figure className={cn("relative", className)}>
      <figcaption className="sr-only">
        {label}: from {formatValue(first.value)} on {formatDate(first.date)} to {formatValue(last.value)} on {formatDate(last.date)}.
      </figcaption>
      <div ref={ref} className={cn("relative", showAxis && "pl-12")} style={{ height: H }} aria-hidden="true">
        {/* grid + y labels */}
        {showAxis &&
          geo.ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 flex items-center" style={{ bottom: `${(t / geo.max) * 100}%` }}>
              <span className="tabular absolute left-0 w-10 -translate-y-px text-right text-[11px] text-fg-3">
                {formatValue(t)}
              </span>
              <span className="ml-12 h-px flex-1 border-t border-dashed border-line/80" />
            </div>
          ))}

        <div className="absolute inset-0" style={{ left: showAxis ? "3rem" : 0 }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <defs>
              <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
              </linearGradient>
              <clipPath id={`clip-${uid}`}>
                <rect
                  x="0"
                  y="-20"
                  width={W}
                  height={H + 40}
                  className="origin-left transition-transform duration-[1400ms] ease-out-soft [transform-box:fill-box]"
                  style={{ transform: inView ? "scaleX(1)" : "scaleX(0)" }}
                />
              </clipPath>
            </defs>
            {geo.cmpLine && (
              <path d={geo.cmpLine} fill="none" stroke="var(--color-fg-3)" strokeOpacity="0.55" strokeWidth="1.25" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
            )}
            <g clipPath={`url(#clip-${uid})`}>
              <path d={geo.area} fill={`url(#fill-${uid})`} />
              <path d={geo.line} fill="none" stroke="var(--color-accent)" strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </g>
          </svg>

          {/* hover layer */}
          <div className="absolute inset-0 cursor-crosshair touch-pan-y" onPointerMove={onMove} onPointerLeave={() => setHover(null)} onPointerDown={onMove} />
          {hp && hover !== null && (
            <>
              <div className="pointer-events-none absolute inset-y-0 w-px bg-fg/15" style={{ left: `${(hp.x / W) * 100}%` }} />
              <div
                className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-canvas bg-accent shadow-glow"
                style={{ left: `${(hp.x / W) * 100}%`, top: `${(hp.y / H) * 100}%` }}
              />
              <div
                className={cn(
                  "pointer-events-none absolute top-2 z-10 min-w-36 rounded-md border border-line bg-canvas-2/95 px-3 py-2 shadow-float backdrop-blur",
                  hp.x / W > 0.6 ? "-translate-x-[calc(100%+12px)]" : "translate-x-3",
                )}
                style={{ left: `${(hp.x / W) * 100}%` }}
              >
                <p className="text-[11px] text-fg-3">{formatDate(data[hover].date)}</p>
                <p className="tabular mt-1 flex items-center justify-between gap-4 text-[13px] text-fg">
                  <span className="flex items-center gap-1.5 text-fg-2">
                    <span className="size-1.5 rounded-full bg-accent" />
                    {seriesLabel}
                  </span>
                  {formatValue(data[hover].value)}
                </p>
                {compare?.[hover] && (
                  <p className="tabular mt-0.5 flex items-center justify-between gap-4 text-[13px] text-fg-2">
                    <span className="flex items-center gap-1.5 text-fg-3">
                      <span className="size-1.5 rounded-full bg-fg-3" />
                      {compareLabel}
                    </span>
                    {formatValue(compare[hover].value)}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {showAxis && (
        <div className="relative mt-3 h-4 pl-12" aria-hidden="true">
          {data.map((d, i) =>
            i % labelEvery === 0 || i === data.length - 1 ? (
              <span
                key={d.date}
                className={cn(
                  "tabular absolute whitespace-nowrap text-[11px] text-fg-3",
                  i === 0 ? "translate-x-0" : i === data.length - 1 ? "-translate-x-full" : "-translate-x-1/2",
                  // drop a label that would crowd the last one
                  i !== 0 && i !== data.length - 1 && data.length - 1 - i < labelEvery * 0.8 && "hidden",
                )}
                style={{ left: `calc(3rem + (100% - 3rem) * ${i / (data.length - 1)})` }}
              >
                {formatDate(d.date)}
              </span>
            ) : null,
          )}
        </div>
      )}
    </figure>
  );
}
