"use client";

import { useId, useMemo, useState, type CSSProperties } from "react";
import { areaPath, smoothPath, toPoints } from "@/lib/chart";
import type { Priority } from "@/types";

const W = 620;
const H = 330;
const PAD = { top: 36, bottom: 34 };

const unitOf = (v: number, unit: Priority["graph"]["unit"]) => (unit === "%" ? `${v}%` : unit === "€" ? `€${v.toLocaleString("en-GB")}` : `${v} days`);

/** Where everything of one priority's graph sits — its own scale, from its own twelve months */
function geometry(g: Priority["graph"]) {
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
  return {
    pts,
    line,
    area: areaPath(line, pts, H - PAD.bottom),
    ref: g.reference ? y(g.reference.value) : null,
    // the reference is named on whichever side of its line the series leaves free
    refAbove: !g.reference || end < g.reference.value,
    fx0: pts[a].x,
    fx1: pts[b].x,
  };
}

/**
 * The evidence behind the selected priority: twelve months of the number that matters, the level
 * worth comparing against, and — in emerald — the stretch Syxoria is pointing at.
 *
 * Choosing a priority plays one sequence, all CSS keyed to the priority (styles: "Priorities"):
 * the previous curve steps back → the new one draws itself from the left (--flow-draw), the area
 * filling in behind its pen → the emerald stretch lights as the pen reaches it → the latest figure
 * arrives as the curve does → then what Syxoria points at. Choosing again mid-way simply starts over.
 */
export function PriorityGraph({ priority }: { priority: Priority }) {
  const uid = useId().replace(/:/g, "");
  const g = priority.graph;
  const geo = useMemo(() => geometry(g), [g]);

  // the curve being replaced, so it can step back while the new one draws (derived during render)
  const [current, setCurrent] = useState(priority);
  const [leaving, setLeaving] = useState<Priority | null>(null);
  if (current !== priority) {
    setLeaving(current);
    setCurrent(priority);
  }

  const latest = unitOf(g.series[g.series.length - 1], g.unit);

  return (
    <figure className="onb-graph relative" aria-label={`${g.label}: ${g.series.map((v, i) => `${g.months[i]} ${unitOf(v, g.unit)}`).join(", ")}`}>
      <figcaption className="flex items-end justify-between gap-4">
        <span>
          <span key={`l-${priority.id}`} className="onb-word block text-[13px] text-fg-2">
            {g.label}
          </span>
          <span key={priority.id} className="onb-graph__figure tabular mt-1.5 block font-display text-[2rem] font-light leading-none tracking-[-0.02em] text-fg">
            {latest}
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
        </defs>

        {/* the baseline and the months (the same twelve for every priority) */}
        <line x1="0" x2={W} y1={H - PAD.bottom} y2={H - PAD.bottom} className="stroke-white/[0.07]" />
        {g.months.map((m, i) =>
          i % 2 === 1 || i === g.months.length - 1 ? (
            <text key={m} x={geo.pts[i].x} y={H - 8} textAnchor={i === g.months.length - 1 ? "end" : "middle"} className="fill-fg-3 text-[12.5px]">
              {m}
            </text>
          ) : null,
        )}

        {/* the level worth comparing against: it glides to the new priority's level */}
        <line x1="0" x2={W} y1="0" y2="0" className="onb-graph__ref stroke-white/20" strokeDasharray="3 5" style={{ transform: `translateY(${geo.ref ?? H - PAD.bottom}px)`, opacity: geo.ref === null ? 0 : 1 }} />

        {leaving && leaving.id !== priority.id && <Drawing key={`out-${leaving.id}`} priority={leaving} uid={uid} leaving />}
        <Drawing key={priority.id} priority={priority} uid={uid} />
      </svg>

      <p className="sr-only" aria-live="polite">
        {g.label}: {latest} now. {g.focusLabel}.
      </p>
    </figure>
  );
}

/** One priority's curve, drawn: keyed by the priority, so each one draws itself from the start */
function Drawing({ priority, uid, leaving }: { priority: Priority; uid: string; leaving?: boolean }) {
  const g = priority.graph;
  const geo = useMemo(() => geometry(g), [g]);
  const last = geo.pts[geo.pts.length - 1];
  // its own clip ids (the leaving curve may be the same priority drawn earlier); the shared fills
  const id = `${uid}-${leaving ? "out" : "in"}-${priority.id}`;
  // when the pen reaches the emerald stretch, as a share of the drawing
  const timing = { "--at": (geo.fx0 / W).toFixed(3) } as CSSProperties;

  return (
    <g className={leaving ? "onb-graph__drawing onb-graph__drawing--out" : "onb-graph__drawing"} style={timing}>
      <defs>
        {/* the pen: what has been drawn so far (the area fills in behind it) */}
        <clipPath id={`${id}-pen`}>
          <rect className="onb-graph__pen" x="0" y="0" width={W} height={H} />
        </clipPath>
        <clipPath id={`${id}-band`}>
          <rect x={geo.fx0} y="0" width={geo.fx1 - geo.fx0 + 2} height={H} />
        </clipPath>
      </defs>

      {/* what Syxoria points at */}
      <g className="onb-graph__band">
        <rect x={geo.fx0} y={PAD.top - 14} width={geo.fx1 - geo.fx0} height={H - PAD.bottom - PAD.top + 14} fill={`url(#${uid}-focus)`} />
        <line x1={geo.fx0} x2={geo.fx0} y1={PAD.top - 14} y2={H - PAD.bottom} className="onb-graph__band-edge" />
      </g>

      <path className="onb-graph__area" d={geo.area} fill={`url(#${uid}-area)`} clipPath={`url(#${id}-pen)`} />
      <path className="onb-graph__line" d={geo.line} pathLength={1} />
      <path className="onb-graph__line onb-graph__line--focus" d={geo.line} pathLength={1} clipPath={`url(#${id}-band)`} />
      <circle className="onb-graph__dot" cx={last.x} cy={last.y} r="4" />

      {/* the observation, once the curve is there: what the stretch means, and what it is measured against */}
      <g className="onb-graph__note">
        <text x={geo.fx0 + 10} y={PAD.top - 2} className="fill-accent-strong text-[13px] italic">
          {g.focusLabel}
        </text>
        {geo.ref !== null && g.reference && (
          <text x={geo.fx0 - 12} y={geo.refAbove ? geo.ref - 9 : geo.ref + 19} textAnchor="end" className="fill-fg-3 text-[12.5px]">
            {g.reference.label} · {unitOf(g.reference.value, g.unit)}
          </text>
        )}
      </g>
    </g>
  );
}
