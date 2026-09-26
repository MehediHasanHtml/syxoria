"use client";

import { useId, useMemo, useState } from "react";
import { areaPath, smoothPath, toPoints } from "@/lib/chart";
import { cn } from "@/lib/cn";
import { useInView } from "@/lib/hooks/use-in-view";
import type { CurveStage } from "@/types";

const W = 1200;
const H = 420;

/**
 * Organic progression curve: Starting point → Development → Progression →
 * Acceleration → Outcome. Pass any `points` (e.g. real growth data from the
 * API) and stage indices; the component normalises the rest.
 */
export function ProgressCurve({
  points,
  baseline,
  stages,
  className,
}: {
  points: number[];
  baseline?: number[];
  stages: CurveStage[];
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "0px 0px -25% 0px" });
  const [active, setActive] = useState(stages.length - 2);

  const geo = useMemo(() => {
    const max = Math.max(...points, ...(baseline ?? []));
    const pts = toPoints(points, W, H, { min: 0, max, padTop: 0.1 });
    const line = smoothPath(pts);
    const base = baseline ? smoothPath(toPoints(baseline, W, H, { min: 0, max, padTop: 0.1 })) : null;
    return { pts, line, area: areaPath(line, pts, H), base };
  }, [points, baseline]);

  const current = stages[active];
  const activePt = geo.pts[current.index];

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div className="relative" style={{ aspectRatio: `${W} / ${H}` }}>
        {/* vertical stage guides */}
        {stages.map((s, i) => {
          const p = geo.pts[s.index];
          return (
            <div
              key={s.id}
              aria-hidden="true"
              className={cn("absolute bottom-0 w-px transition-colors duration-500", i === active ? "bg-accent/40" : "bg-line/70")}
              style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
            />
          );
        })}

        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={`pc-fill-${uid}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#d6a871" stopOpacity="0.2" />
              <stop offset="1" stopColor="#d6a871" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`pc-stroke-${uid}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#7d8184" />
              <stop offset="0.45" stopColor="#d6a871" />
              <stop offset="1" stopColor="#ffe3b8" />
            </linearGradient>
          </defs>
          {geo.base && (
            <path d={geo.base} fill="none" stroke="#7d8184" strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
          )}
          <path
            d={geo.area}
            fill={`url(#pc-fill-${uid})`}
            className="transition-opacity delay-700 duration-1000 ease-out-soft"
            style={{ opacity: inView ? 1 : 0 }}
          />
          <path
            d={geo.line}
            fill="none"
            stroke={`url(#pc-stroke-${uid})`}
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            strokeDasharray="1 1"
            className="transition-[stroke-dashoffset] duration-[2200ms] ease-in-out-soft"
            style={{ strokeDashoffset: inView ? 0 : 1 }}
          />
        </svg>

        {/* Stage nodes — real buttons so they are keyboard & touch accessible */}
        {stages.map((s, i) => {
          const p = geo.pts[s.index];
          const selected = i === active;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={selected}
              aria-label={`${s.label}, ${s.when}: ${s.title}`}
              onClick={() => setActive(i)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
              onFocus={() => setActive(i)}
              className="group absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-opacity duration-700"
              style={{
                left: `${(p.x / W) * 100}%`,
                top: `${(p.y / H) * 100}%`,
                opacity: inView ? 1 : 0,
                transitionDelay: inView ? `${400 + i * 320}ms` : "0ms",
              }}
            >
              <span
                className={cn(
                  "absolute size-7 rounded-full border transition-[transform,border-color,opacity] duration-500 ease-out-soft",
                  selected ? "scale-100 border-accent/60 opacity-100" : "scale-50 border-transparent opacity-0 group-hover:scale-75 group-hover:opacity-100 group-hover:border-line-strong",
                )}
              />
              <span className={cn("size-2.5 rounded-full border-2 border-canvas transition-colors", selected ? "bg-accent-strong shadow-glow" : "bg-fg-2 group-hover:bg-fg")} />
            </button>
          );
        })}

        {/* moving highlight at the active node */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(214_168_113/0.18),transparent)] transition-[left,top] duration-700 ease-out-soft"
          style={{ left: `${(activePt.x / W) * 100}%`, top: `${(activePt.y / H) * 100}%` }}
        />
      </div>

      {/* Stage labels (x axis) */}
      <ol className="relative mt-5 hidden h-10 sm:block" aria-hidden="true">
        {stages.map((s, i) => {
          const p = geo.pts[s.index];
          const edge = i === 0 ? "translate-x-0 text-left" : i === stages.length - 1 ? "-translate-x-full text-right" : "-translate-x-1/2 text-center";
          return (
            <li key={s.id} className={cn("absolute top-0", edge)} style={{ left: `${(p.x / W) * 100}%` }}>
              <p className={cn("text-[11px] uppercase tracking-label transition-colors", i === active ? "text-accent" : "text-fg-3")}>{s.label}</p>
              <p className="tabular mt-1 text-xs text-fg-3">{s.when}</p>
            </li>
          );
        })}
      </ol>

      {/* Active stage detail */}
      <div className="mt-8 grid gap-6 border-t border-line pt-8 sm:grid-cols-[1fr_auto] sm:items-end" aria-live="polite">
        <div key={current.id} className="animate-fade-in">
          <p className="eyebrow text-accent">
            {current.label} · {current.when}
          </p>
          <p className="mt-3 text-title font-medium text-fg">{current.title}</p>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-fg-2">{current.body}</p>
        </div>
        <div key={`${current.id}-m`} className="animate-fade-in sm:text-right">
          <p className="tabular text-4xl font-medium tracking-tight text-fg sm:text-5xl">{current.metric.value}</p>
          <p className="mt-1 text-[13px] text-fg-3">{current.metric.label}</p>
        </div>
      </div>
    </div>
  );
}
