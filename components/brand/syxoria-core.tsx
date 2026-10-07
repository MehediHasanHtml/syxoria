"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import { coreLooks, coreStateNames, type CoreState } from "@/lib/core/core-states";
import { cn } from "@/lib/cn";

/*
 * The Core, drawn: a dark stone in two halves — like the two hemispheres of a brain — whose
 * folds carry the Core's deep emerald light once it understands what they hold. One drawing for
 * every size and every state (lib/core/core-states.ts); styles: "SYXORIA CORE" in globals.css.
 *
 * Three stacked layers, so motion never repaints the stone: the light behind (aura, heart,
 * seam), the stone itself (static, with its grain), and the light in its folds (animated).
 * 120 × 120 frame; the seam runs top to bottom through the middle.
 */

/* ---------- Geometry (computed once, rounded so server and browser agree) ---------- */

type P = [number, number];
const CX = 60;
const CY = 59.5;
const RX = 42.5;
const RY = 45;
const GAP = 0.8;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Catmull-Rom through the points, as cubic Béziers (no leading M) */
function spline(pts: P[]) {
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += `C${r2(p1[0] + (p2[0] - p0[0]) / 6)} ${r2(p1[1] + (p2[1] - p0[1]) / 6)} ${r2(p2[0] - (p3[0] - p1[0]) / 6)} ${r2(p2[1] - (p3[1] - p1[1]) / 6)} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return d;
}

/** The seam's gentle waver, the same for both halves so they fit together */
const waver = (y: number) => 0.9 * Math.sin(y * 0.19 + 0.6) + 0.4 * Math.sin(y * 0.47 + 2.1);

function halfShape(side: -1 | 1) {
  // lobes: a few slow ripples in the outline, different on each side
  const lobe = (f: number) =>
    side < 0
      ? 1 + 0.03 * Math.sin(3 * f + 0.4) + 0.018 * Math.sin(5 * f + 1.9) + 0.01 * Math.sin(8 * f + 0.7)
      : 1 + 0.028 * Math.sin(3 * f + 1.2) + 0.02 * Math.sin(5 * f + 0.3) + 0.01 * Math.sin(8 * f + 2.4);
  const outer: P[] = [];
  const N = 22;
  for (let i = 0; i <= N; i++) {
    const f = (i / N) * Math.PI;
    const r = lobe(f);
    // the outline dips into the seam at the top and the bottom
    const notch = 3.4 * Math.exp(-((f / 0.24) ** 2)) - 2.4 * Math.exp(-(((Math.PI - f) / 0.24) ** 2));
    outer.push([CX + side * (GAP / 2 + RX * r * Math.sin(f)) + (i === 0 || i === N ? waver(CY - RY * r * Math.cos(f) + notch) : 0), CY - RY * r * Math.cos(f) + notch]);
  }
  const top = outer[0][1];
  const bottom = outer[N][1];
  const seam: P[] = [];
  for (let i = 0; i <= 12; i++) {
    const y = bottom - ((bottom - top) * i) / 12;
    seam.push([CX + (side * GAP) / 2 + waver(y), y]);
  }
  return { d: `M${r2(outer[0][0])} ${r2(outer[0][1])}${spline(outer)}${spline(seam)}Z`, edge: `M${r2(seam[0][0])} ${r2(seam[0][1])}${spline(seam)}`, top, bottom };
}

const L = halfShape(-1);
const R = halfShape(1);
const HALF = { l: L.d, r: R.d };
const EDGE = { l: L.edge, r: R.edge };
const SEAM = (() => {
  const pts: P[] = [];
  for (let i = 0; i <= 12; i++) {
    const y = L.top + 2 + ((L.bottom - L.top - 4) * i) / 12;
    pts.push([CX + waver(y), y]);
  }
  return `M${r2(pts[0][0])} ${r2(pts[0][1])}${spline(pts)}`;
})();

type Fold = { d: string; side: "l" | "r"; minor?: boolean };

/** The folds, in the order they light — from the middle of the Core outwards. Each runs from the seam. */
const FOLDS: Fold[] = [
  { side: "l", d: "M57 42C52 43.5 48.5 40 44 43S36.5 52 30 51.5S22 50 18.5 54" },
  { side: "r", d: "M63 38C68 39 71 35 75.5 37.5S83 46 89.5 44.5S97 41 101 44" },
  { side: "l", d: "M56.5 58C51 57 48.5 62.5 43 62S35 58.5 31 62S24 68 19.5 67" },
  { side: "r", d: "M63.5 52C69 51.5 71.5 57 77 56.5S85 52 89.5 55.5S96.5 61.5 101.5 60.5" },
  { side: "l", d: "M57 29C53 28 51 31.5 47 30.5S41 25 36 27.5" },
  { side: "r", d: "M63 25C67.5 24.5 69.5 28 74 27S80 22.5 85 24.5" },
  { side: "l", d: "M56 74C50.5 74.5 49 79.5 44 79S38 73 33.5 75.5" },
  { side: "r", d: "M64 67C69.5 68 71.5 63.5 76.5 64.5S83 70.5 88 69S95 66 99.5 69" },
  { side: "l", d: "M55 87C50 86 47.5 90 43 89.5S37.5 93 34 95" },
  { side: "r", d: "M64.5 81C69.5 80 72 84.5 77 84S83 80 87.5 82.5" },
  { side: "l", minor: true, d: "M44 43C41 39.5 37 40 34 36.5" },
  { side: "r", minor: true, d: "M75.5 37.5C78 33.5 82 33 84.5 29.5" },
  { side: "l", minor: true, d: "M43 62C44.5 66 42 69 43.5 72" },
  { side: "r", minor: true, d: "M88 69C90 72.5 93 73 95.5 76.5" },
  { side: "l", minor: true, d: "M27 32C25 36 26.5 39.5 23.5 43" },
  { side: "r", minor: true, d: "M93 28C95 31.5 94 35 97 38.5" },
  { side: "l", minor: true, d: "M33.5 75.5C31 72 28 72.5 25 70.5" },
  { side: "r", minor: true, d: "M65 93C69 93.5 72.5 91 76 93" },
];

type Props = {
  state: CoreState;
  /** Within learning: how far it has come (0–1) — more folds light as it reads */
  progress?: number;
  /** Scales its light (e.g. with the autonomy it is given) */
  intensity?: number;
  /** Change this number to make the Core react once — something just reached it */
  pulse?: number;
  /** "mark": the small Core of a bar — fewer, bolder folds and no grain. "full": every detail. */
  detail?: "mark" | "full";
  /** Shared-element name, so the Core can move between places (View Transitions) */
  vtName?: string;
  /** Announced to assistive tech; otherwise the Core is decorative */
  label?: string;
  className?: string;
};

export function SyxoriaCore({ state, progress, intensity = 1, pulse = 0, detail = "full", vtName, label, className }: Props) {
  const id = useId().replace(/:/g, "");
  const look = coreLooks[state];
  const full = detail === "full";
  const folds = full ? FOLDS : FOLDS.filter((f) => !f.minor);
  const share = state === "learning" && progress !== undefined ? 0.3 + 0.65 * Math.max(0, Math.min(1, progress)) : look.lit;
  const lit = Math.round(share * folds.length);
  const light = Math.max(0, Math.min(1, look.light * intensity));
  const ref = (s: string) => `url(#${id}-${s})`;
  const sides = ["l", "r"] as const;

  /** a layer: one SVG over the whole Core */
  const layer = (name: string, children: ReactNode) => (
    <svg viewBox="0 0 120 120" className={`syx-core__layer syx-core__layer--${name}`} aria-hidden="true">
      {children}
    </svg>
  );
  /** one half, as each layer draws it — the same hinge, so the halves part together */
  const half = (side: "l" | "r", children: ReactNode) => (
    <g key={side} className={`syx-core__half syx-core__half--${side}`}>
      {children}
    </g>
  );

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label ? `${label}: ${coreStateNames[state]}` : undefined}
      aria-hidden={label ? undefined : true}
      data-state={state}
      data-motion={look.motion}
      data-detail={detail}
      className={cn("syx-core", className)}
      style={{ "--light": light.toFixed(3), "--open": look.open, viewTransitionName: vtName } as CSSProperties}
    >
      {layer(
        "under",
        <>
          <defs>
            <radialGradient id={`${id}-aura`}>
              <stop offset="30%" stopColor="var(--core-light)" stopOpacity="0.42" />
              <stop offset="100%" stopColor="var(--core-light)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-heart`}>
              <stop offset="0%" stopColor="#c6efdb" stopOpacity="0.85" />
              <stop offset="30%" stopColor="#2f9a6e" stopOpacity="0.7" />
              <stop offset="100%" stopColor="var(--core-light)" stopOpacity="0" />
            </radialGradient>
            <filter id={`${id}-bloom`} x="-50%" y="-20%" width="200%" height="140%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
            {/* the light stays inside the stone's outline */}
            <clipPath id={`${id}-body`}>
              <ellipse cx={CX} cy={CY} rx={RX} ry={RY} />
            </clipPath>
          </defs>
          <circle className="syx-core__aura" cx="60" cy="60" r="64" fill={ref("aura")} />
          <g clipPath={ref("body")}>
            <ellipse className="syx-core__heart" cx="60" cy="56" rx="20" ry="30" fill={ref("heart")} />
            <path d={SEAM} className="syx-core__seam-glow" filter={ref("bloom")} />
            <path d={SEAM} className="syx-core__seam" />
          </g>
        </>,
      )}

      {layer(
        "stone",
        <>
          <defs>
            {/* each half is a rounded mass: lit from the top left, falling into shadow at its edge and at the seam */}
            <radialGradient id={`${id}-stone-l`} gradientUnits="userSpaceOnUse" cx="38" cy="34" r="52" fx="36" fy="30">
              <stop offset="0%" stopColor="#3d3e3f" />
              <stop offset="40%" stopColor="#1e1f20" />
              <stop offset="78%" stopColor="#0d0e0f" />
              <stop offset="100%" stopColor="#050506" />
            </radialGradient>
            <radialGradient id={`${id}-stone-r`} gradientUnits="userSpaceOnUse" cx="80" cy="36" r="52" fx="76" fy="30">
              <stop offset="0%" stopColor="#323334" />
              <stop offset="40%" stopColor="#191a1b" />
              <stop offset="78%" stopColor="#0b0c0d" />
              <stop offset="100%" stopColor="#040405" />
            </radialGradient>
            <linearGradient id={`${id}-crevice-l`} gradientUnits="userSpaceOnUse" x1="48" y1="0" x2="60" y2="0">
              <stop offset="0%" stopColor="#000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id={`${id}-crevice-r`} gradientUnits="userSpaceOnUse" x1="72" y1="0" x2="60" y2="0">
              <stop offset="0%" stopColor="#000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0.7" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
              <stop offset="38%" stopColor="#fff" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            {full && (
              // the stone's relief: soft noise, lit from the top left like the rest of it
              <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
                <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="4" seed="9" result="noise" />
                <feDiffuseLighting in="noise" surfaceScale="2.2" diffuseConstant="1.1" lightingColor="#ffffff" result="lit">
                  <feDistantLight azimuth="235" elevation="46" />
                </feDiffuseLighting>
                <feColorMatrix in="lit" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.38 0 0 0 -0.25" />
              </filter>
            )}
            {sides.map((s) => (
              <clipPath key={s} id={`${id}-clip-${s}`}>
                <path d={HALF[s]} />
              </clipPath>
            ))}
          </defs>
          {sides.map((s) =>
            half(
              s,
              <>
                <path d={HALF[s]} fill={ref(`stone-${s}`)} />
                <g clipPath={ref(`clip-${s}`)}>
                  {full && <rect width="120" height="120" filter={ref("grain")} className="syx-core__grain" />}
                  {/* the folds, carved: a dark groove with a faint lit lip below it */}
                  {folds.map((f, i) =>
                    f.side === s ? (
                      <g key={i}>
                        {full && <path d={f.d} className="syx-core__lip" />}
                        <path d={f.d} className="syx-core__groove" />
                      </g>
                    ) : null,
                  )}
                  <rect width="120" height="120" fill={ref(`crevice-${s}`)} />
                </g>
                <path d={HALF[s]} fill="none" stroke={ref("rim")} className="syx-core__rim" />
              </>,
            ),
          )}
        </>,
      )}

      {layer(
        "light",
        <>
          <defs>
            <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={full ? 1.3 : 2} />
            </filter>
            {sides.map((s) => (
              <clipPath key={s} id={`${id}-lclip-${s}`}>
                <path d={HALF[s]} />
              </clipPath>
            ))}
          </defs>
          {sides.map((s) =>
            half(
              s,
              <g clipPath={ref(`lclip-${s}`)}>
                <g filter={ref("glow")}>
                  {folds.map((f, i) => (f.side === s ? <path key={i} d={f.d} className="syx-core__fold syx-core__fold-glow" data-lit={i < lit || undefined} /> : null))}
                </g>
                {folds.map((f, i) => (f.side === s ? <path key={i} d={f.d} className="syx-core__fold syx-core__fold-line" data-lit={i < lit || undefined} style={{ transitionDelay: `${(i % 4) * 90}ms` }} /> : null))}
                {folds.map((f, i) =>
                  f.side === s && i < lit ? <path key={i} d={f.d} pathLength={1} className="syx-core__spark" style={{ animationDelay: `${-((i * 0.53) % 2.4)}s` }} /> : null,
                )}
                <path d={EDGE[s]} className="syx-core__edge" />
              </g>,
            ),
          )}
          {pulse > 0 && <circle key={pulse} className="syx-core__pulse" cx="60" cy="59" r="46" />}
        </>,
      )}
    </span>
  );
}
