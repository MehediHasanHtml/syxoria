import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { buildTree, TREE_BASE, TREE_CROP, TREE_VIEWBOX } from "@/lib/tree-geometry";

/**
 * The Syxoria growth tree — server-rendered SVG, CSS-only motion
 * (see "GROWTH TREE" in globals.css).
 *
 * Rendered as stacked layers so continuous motion never forces the dense
 * tree to re-rasterise:
 *   1. base    — atmosphere, prism, ground, orbit, roots (mostly static)
 *   2. tree    — trunk, branches, canopy, nodes, labels; swayed as a GPU-composited layer
 *   3. flows   — light pulses; own layer, sways in sync with (2)
 *   4. dust    — a handful of drifting particles
 *
 * Parent contract:
 *   `--grow` (0..1)    nodes & module labels appear progressively
 *   `data-focus`       spotlights roots | trunk | branches | canopy | fruit
 *   `data-paused`      pauses all loops (set when offscreen)
 */
const tree = buildTree();
const canopy = tree.foliage.reduce<(typeof tree.foliage)[]>((pads, dot) => {
  (pads[dot.cluster] ??= []).push(dot);
  return pads;
}, []);

const v = (vars: Record<string, string | number>) => vars as CSSProperties;
const VIEWBOX = `${TREE_CROP.x} ${TREE_CROP.y} ${TREE_CROP.w} ${TREE_CROP.h}`;
// Sway pivots on the trunk base, expressed in % of the cropped box.
const swayOrigin = `${(((TREE_BASE.x - TREE_CROP.x) / TREE_CROP.w) * 100).toFixed(2)}% ${(((TREE_BASE.y - TREE_CROP.y) / TREE_CROP.h) * 100).toFixed(2)}%`;
const layer = "absolute inset-0 size-full overflow-visible";

export function GrowthTree({ className, showLabels = true, idPrefix = "gt" }: { className?: string; showLabels?: boolean; idPrefix?: string }) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const { w, h } = TREE_VIEWBOX;

  return (
    <div
      role="img"
      aria-label="A luminous tree growing inside a glass prism: roots of connected tools, a trunk of shared understanding, branches of automation and a canopy of results."
      className={cn("relative w-full", className)}
      style={{ aspectRatio: `${TREE_CROP.w} / ${TREE_CROP.h}`, ["--sway-origin" as string]: swayOrigin }}
    >
      {/* 1 · Base */}
      <svg viewBox={VIEWBOX} className={layer} aria-hidden="true">
        <defs>
          <radialGradient id={id("crown")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#d6a871" stopOpacity="0.28" />
            <stop offset="1" stopColor="#d6a871" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id("ground")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ecc896" stopOpacity="0.26" />
            <stop offset="0.6" stopColor="#d6a871" stopOpacity="0.06" />
            <stop offset="1" stopColor="#d6a871" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id("beam")} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fff4e0" stopOpacity="0.16" />
            <stop offset="1" stopColor="#fff4e0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id("edge")} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f5f5f2" stopOpacity="0.5" />
            <stop offset="0.5" stopColor="#f5f5f2" stopOpacity="0.12" />
            <stop offset="1" stopColor="#f5f5f2" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={id("root-fade")} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id={id("roots-mask")} maskUnits="userSpaceOnUse" x="0" y={TREE_BASE.y - 20} width={w} height={h - TREE_BASE.y + 20}>
            <rect x="0" y={TREE_BASE.y - 20} width={w} height={h - TREE_BASE.y + 20} fill={`url(#${id("root-fade")})`} />
          </mask>
        </defs>

        <ellipse cx="400" cy="300" rx="260" ry="210" fill={`url(#${id("crown")})`} />
        <path d="M352 82 L456 82 L570 600 L238 600 Z" fill={`url(#${id("beam")})`} className="gt-fade" style={v({ "--d": 0.2 })} />

        {/* Prism — "a new dimension" */}
        <g className="gt-part gt-prism" fill="none" strokeLinejoin="round">
          <g stroke="#f5f5f2" strokeOpacity="0.07" strokeWidth="1">
            <path d="M236 44 H676 V574" pathLength={1} className="gt-draw" style={v({ "--d": 0.05 })} />
            <path d="M184 80 L236 44 M624 80 L676 44 M624 610 L676 574" pathLength={1} className="gt-draw" style={v({ "--d": 0.1 })} />
          </g>
          <path d="M184 80 H624 V610 H184 Z" stroke="#f5f5f2" strokeOpacity="0.16" pathLength={1} className="gt-draw" style={v({ "--d": 0 })} />
          <path d="M624 84 V606" stroke={`url(#${id("edge")})`} strokeWidth="1.2" pathLength={1} className="gt-draw" style={v({ "--d": 0.15 })} />
          <ellipse cx="404" cy="82" rx="54" ry="3.5" fill="#fff4e0" opacity="0.85" className="gt-fade" style={v({ "--d": 0.1 })} />
        </g>

        {/* Ground light & plinth */}
        <ellipse cx="400" cy={TREE_BASE.y + 6} rx="300" ry="34" fill={`url(#${id("ground")})`} />
        <path d={`M120 ${TREE_BASE.y + 14} H680`} stroke="#f5f5f2" strokeOpacity="0.08" />

        {/* Orbit */}
        <ellipse
          cx="400"
          cy="330"
          rx="318"
          ry="54"
          fill="none"
          stroke="#d6a871"
          strokeOpacity="0.32"
          strokeDasharray="1.5 7"
          transform="rotate(-7 400 330)"
          className="gt-fade"
          style={v({ "--d": 0.5 })}
        />

        {/* Roots */}
        <g className="gt-part gt-roots" mask={`url(#${id("roots-mask")})`} fill="none" strokeLinecap="round">
          {tree.roots.map((r, i) => (
            <path
              key={i}
              d={r.d}
              pathLength={1}
              stroke="#d6a871"
              strokeOpacity={0.75 - r.depth * 0.14}
              strokeWidth={r.width}
              className="gt-draw"
              style={v({ "--d": r.delay })}
            />
          ))}
        </g>
      </svg>

      {/* 2 · Tree (composited sway) */}
      <div className={cn(layer, "gt-sway")} aria-hidden="true">
        <svg viewBox={VIEWBOX} className={layer}>
          <defs>
            <linearGradient id={id("bark")} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#15130f" />
              <stop offset="0.55" stopColor="#4a3f33" />
              <stop offset="1" stopColor="#a38662" />
            </linearGradient>
          </defs>

          <g className="gt-part gt-trunk" fill="none" strokeLinecap="round">
            {tree.trunk.map((t, i) => (
              <path key={i} d={t.d} pathLength={1} stroke={`url(#${id("bark")})`} strokeWidth={t.width} className="gt-draw" style={v({ "--d": 0.12 + t.delay })} />
            ))}
          </g>

          <g className="gt-part gt-branches" fill="none" strokeLinecap="round">
            {tree.branches.map((b, i) => (
              <path
                key={i}
                d={b.d}
                pathLength={1}
                stroke={b.depth < 2 ? `url(#${id("bark")})` : "#cdbb9f"}
                strokeOpacity={b.depth < 2 ? 1 : 0.5 - (b.depth - 2) * 0.12}
                strokeWidth={b.width}
                className="gt-draw"
                style={v({ "--d": 0.3 + b.delay })}
              />
            ))}
          </g>

          {/* Canopy — one animated group per pad, never per dot */}
          <g className="gt-part gt-canopy">
            {canopy.map((pad, i) => (
              <g key={i} className="gt-leaf" style={v({ "--d": 1.1 + (i % 12) * 0.06 })}>
                {pad.map((dot, j) => (
                  <circle key={j} cx={dot.x} cy={dot.y} r={dot.r} fill={dot.warm ? "#ecc896" : "#ece7dd"} fillOpacity={dot.o} />
                ))}
              </g>
            ))}
          </g>

          {/* Growth nodes — appear with --grow */}
          <g className="gt-part gt-nodes">
            {tree.tips
              .filter((_, i) => i % 2 === 0)
              .map((t, i) => (
                <g key={i} className="gt-node" style={v({ "--t": t.order })}>
                  <circle cx={t.x} cy={t.y} r="7" fill="#d6a871" fillOpacity="0.16" />
                  <circle cx={t.x} cy={t.y} r="2.1" fill="#ffe3b8" />
                </g>
              ))}
          </g>

          {/* Module labels — the product relationship becomes explicit */}
          {showLabels && (
            <g className="gt-part gt-labels max-sm:hidden">
              {tree.anchors.map((a) => {
                const dir = a.side === "left" ? -1 : 1;
                const x2 = a.x + dir * 40;
                return (
                  <g key={a.label} className="gt-label" style={v({ "--t": a.t })}>
                    <path d={`M${a.x} ${a.y} L${x2} ${a.y}`} stroke="#d6a871" strokeOpacity="0.55" strokeWidth="0.8" />
                    <circle cx={a.x} cy={a.y} r="2.6" fill="none" stroke="#ecc896" strokeWidth="0.9" />
                    <text
                      x={x2 + dir * 6}
                      y={a.y + 3.5}
                      textAnchor={a.side === "left" ? "end" : "start"}
                      fill="#a5a8aa"
                      fontSize="11"
                      letterSpacing="2"
                      style={{ fontFamily: "var(--font-sans)", textTransform: "uppercase" }}
                    >
                      {a.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* 3 · Light pulses (own layer, sways in sync) */}
      <div className={cn(layer, "gt-sway gt-flows")} aria-hidden="true">
        <svg viewBox={VIEWBOX} className={layer} fill="none" strokeLinecap="round">
          {tree.flows.map((f, i) => (
            <path
              key={i}
              d={f.d}
              pathLength={1}
              stroke="#ffe3b8"
              strokeWidth="1.6"
              className={f.reverse ? "gt-pulse gt-pulse-rev" : "gt-pulse"}
              style={v({ "--d": f.delay })}
            />
          ))}
        </svg>
      </div>

      {/* 4 · Drifting dust */}
      <svg viewBox={VIEWBOX} className={layer} aria-hidden="true">
        {tree.particles.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#f3dcb8" className="gt-dust" style={v({ "--d": p.delay, "--dur": p.duration })} />
        ))}
      </svg>
    </div>
  );
}
