"use client";

import { useId, useMemo, type CSSProperties } from "react";
import { areaPath, smoothPath, toPoints } from "@/lib/chart";
import type { Priority } from "@/types";

const W = 620;
const H = 330;
const PAD = { top: 36, bottom: 34 };

const unitOf = (v: number, unit: Priority["graph"]["unit"]) => (unit === "%" ? `${v}%` : unit === "€" ? `€${v.toLocaleString("en-GB")}` : `${v} days`);

/**
 * The evidence behind the selected priority: twelve months of the number that matters, the level
 * worth comparing against, and — in emerald — the stretch Syxoria is pointing at. It morphs from
 * one priority to the next rather than redrawing.
 */
export function PriorityGraph({ priority, id }: { priority: Priority; id?: string }) {
  const uid = useId().replace(/:/g, "");
  const g = priority.graph;

  const geo = useMemo(() => {
    const values = [...g.series, ...(g.reference ? [g.reference.value] : [])];
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const span = hi - lo || 1;
    const min = lo - span * 0.35;
    const max = hi + span * 0.25;
    const inner = H - PAD.top - PAD.bottom;
    const pts = toPoints(g.series, W, inner, { min, max, padTop: 0 }).map((p) => ({ x: p.x, y: p.y + PAD.top }));
    const line = smoothPath(pts);
    const y = (v: number) => PAD.top + inner - ((v - min) / (max - min)) * inner;
    const [a, b] = g.focus;
    const end = g.series[g.series.length - 1];
    // the reference is named at the right, on whichever side of its line the series leaves free
    const refAbove = !g.reference || end < g.reference.value;
    return { pts, line, area: areaPath(line, pts, H - PAD.bottom), ref: g.reference ? y(g.reference.value) : null, refAbove, fx0: pts[a].x, fx1: pts[b].x };
  }, [g]);

  const last = geo.pts[geo.pts.length - 1];
  const d = (path: string) => ({ d: `path("${path}")` }) as CSSProperties;

  return (
    <figure id={id} className="onb-graph relative" aria-label={`${g.label}: ${g.series.map((v, i) => `${g.months[i]} ${unitOf(v, g.unit)}`).join(", ")}`}>
      <figcaption className="flex items-end justify-between gap-4">
        <span>
          <span className="block text-[13px] text-fg-2">{g.label}</span>
          <span key={priority.id} className="onb-word tabular mt-1.5 block font-display text-[2rem] font-light leading-none tracking-[-0.02em] text-fg">
            {unitOf(g.series[g.series.length - 1], g.unit)}
          </span>
        </span>
        <span className="text-[12px] text-fg-3">Last 12 months</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 block h-auto w-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-focus`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--core-light)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--core-light)" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${uid}-band`}>
            <rect className="onb-graph__band-clip" x={geo.fx0} y="0" width={geo.fx1 - geo.fx0 + 2} height={H} />
          </clipPath>
        </defs>

        {/* the baseline and the months */}
        <line x1="0" x2={W} y1={H - PAD.bottom} y2={H - PAD.bottom} className="stroke-white/[0.07]" />
        {g.months.map((m, i) =>
          i % 2 === 1 || i === g.months.length - 1 ? (
            <text key={m} x={geo.pts[i].x} y={H - 8} textAnchor={i === g.months.length - 1 ? "end" : "middle"} className="fill-fg-3 text-[12.5px]">
              {m}
            </text>
          ) : null,
        )}

        {/* the level worth comparing against */}
        {geo.ref !== null && g.reference && (
          <g className="onb-graph__ref">
            <line x1="0" x2={W} y1={geo.ref} y2={geo.ref} className="stroke-white/20" strokeDasharray="3 5" />
            <text x={geo.fx0 - 12} y={geo.refAbove ? geo.ref - 9 : geo.ref + 19} textAnchor="end" className="fill-fg-3 text-[12.5px]">
              {g.reference.label} · {unitOf(g.reference.value, g.unit)}
            </text>
          </g>
        )}

        {/* what Syxoria points at */}
        <rect x={geo.fx0} y={PAD.top - 14} width={geo.fx1 - geo.fx0} height={H - PAD.bottom - PAD.top + 14} fill={`url(#${uid}-focus)`} className="onb-graph__band" />
        <line x1={geo.fx0} x2={geo.fx0} y1={PAD.top - 14} y2={H - PAD.bottom} className="onb-graph__band-edge" />
        <text key={g.focusLabel} x={geo.fx0 + 10} y={PAD.top - 2} className="onb-word fill-accent-strong text-[13px] italic">
          {g.focusLabel}
        </text>

        <path className="onb-graph__area" style={d(geo.area)} fill={`url(#${uid}-area)`} />
        <path className="onb-graph__line" style={d(geo.line)} />
        <g clipPath={`url(#${uid}-band)`}>
          <path className="onb-graph__line onb-graph__line--focus" style={d(geo.line)} />
        </g>
        <circle className="onb-graph__dot" cx={last.x} cy={last.y} r="4" />
      </svg>
    </figure>
  );
}
