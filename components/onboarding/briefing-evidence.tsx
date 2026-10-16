import type { CSSProperties, ReactNode } from "react";
import { briefing as copy } from "@/content/onboarding";
import { formatCurrency } from "@/lib/format";
import type { FollowStep } from "@/lib/onboarding/mandate";
import type { BriefingDraft } from "@/types";

/**
 * The briefing's evidence, drawn to scale from the briefing's own data and never decorative:
 *
 *   SilenceRing     around the Core, how long each client has waited for an answer. A full turn
 *                   is the company's curve (0 to 20 days); the threshold where its deals start to
 *                   slip splits it in two halves, each with the close rate measured on that side.
 *                   Every client sits where their silence has taken them, as large as they are
 *                   worth (priority, insight). Then in emerald: the half where deals still close
 *                   (recommendation), and the Core reaching each client (action).
 *   FollowThrough   the life of the priority, from the moment it was found to the deal closing.
 *
 * White = what is · the Core's emerald = what Syxoria does about it. Styles: "The discovery".
 */

/* The ring's drawing space: wide enough for the clients' names on either side */
const VW = 760;
const VH = 590;
const C = { x: 380, y: 262 };
const R = 226;
/** Where the Core's stone ends, for the lines it sends out */
const STONE = 90;
/** The Core's box, as a share of the drawing's width */
export const CORE_SHARE = 196 / VW;

const r2 = (v: number) => Math.round(v * 100) / 100;
const point = (a: number, r: number) => {
  const t = (a * Math.PI) / 180;
  return { x: r2(C.x + r * Math.sin(t)), y: r2(C.y - r * Math.cos(t)) };
};
/** Clockwise along the ring, from angle `a` to angle `b` */
const arc = (a: number, b: number, r: number) => {
  const s = point(a, r);
  const e = point(b, r);
  return `M${s.x} ${s.y} A${r} ${r} 0 ${b - a > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
};
/** A place on the drawing, for the words laid over it */
const at = (p: { x: number; y: number }) => ({ left: `${r2((p.x / VW) * 100)}%`, top: `${r2((p.y / VH) * 100)}%` });
const percent = (v: number) => `${Math.round(v * 100)}%`;

type Side = "left" | "right" | "above" | "below";

export function SilenceRing({
  drafts,
  curve,
  threshold,
  drawn,
  halves,
  lit,
  reach,
  children,
}: {
  drafts: BriefingDraft[];
  /** Close rate by days waiting (index = days): a full turn of the ring */
  curve: number[];
  threshold: number;
  /** The ring and the clients on it */
  drawn: boolean;
  /** The two halves and what each closes (insight) */
  halves: boolean;
  /** In emerald, the half where deals still close (recommendation) */
  lit: boolean;
  /** The Core reaching each client (action) */
  reach: boolean;
  /** The Core, at the centre */
  children: ReactNode;
}) {
  const turn = curve.length - 1;
  const deg = (days: number) => (Math.min(days, turn) / turn) * 360;
  const edge = deg(threshold);
  const most = Math.max(1, ...drafts.map((d) => d.value));

  // each client on the ring, its name outside it: beside it on the sides, under or over it near
  // the bottom and the top; names on the same side are kept apart
  const placed = drafts.map((d, i) => {
    const a = deg(d.quietDays);
    const r = r2(4.5 + (d.value / most) * 5);
    const side: Side = Math.abs(a - 180) < 24 ? "below" : a < 24 || a > 336 ? "above" : a > 180 ? "left" : "right";
    const label = point(a, R + (side === "below" || side === "above" ? 22 : 24));
    return { d, i, a, r, dot: point(a, R), side, label: side === "below" ? { ...label, y: label.y + r } : label };
  });
  for (const side of ["left", "right"] as const) {
    const row = placed.filter((p) => p.side === side).sort((p, q) => p.label.y - q.label.y);
    for (let k = 1; k < row.length; k++) row[k].label.y = Math.max(row[k].label.y, row[k - 1].label.y + 44);
  }

  return (
    <figure className="onb-silence" data-drawn={drawn || undefined} data-halves={halves || undefined} data-lit={lit || undefined} data-reach={reach || undefined}>
      <figcaption className="sr-only">
        {copy.ring.summary(threshold, percent(curve[0]), percent(curve[turn]))} {drafts.map((d) => copy.ring.deal(d.company, d.quietDays, formatCurrency(d.value))).join(". ")}.
      </figcaption>

      <svg aria-hidden="true" viewBox={`0 0 ${VW} ${VH}`} className="onb-silence__svg">
        <defs>
          <filter id="onb-silence-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <radialGradient id="onb-silence-reach" gradientUnits="userSpaceOnUse" cx={C.x} cy={C.y} r={R}>
            <stop offset="0.4" stopColor="#4fae86" stopOpacity="0.9" />
            <stop offset="1" stopColor="#4fae86" stopOpacity="0.25" />
          </radialGradient>
        </defs>

        {/* the days, one mark each; the threshold crosses the ring */}
        {Array.from({ length: turn }, (_, d) => {
          const a = deg(d);
          const isEdge = d === threshold;
          const s = point(a, isEdge ? R - 14 : R + 7);
          const e = point(a, isEdge ? R + 14 : R + 12);
          return <line key={d} x1={s.x} y1={s.y} x2={e.x} y2={e.y} className="onb-silence__tick" data-edge={isEdge || undefined} style={{ "--i": d } as CSSProperties} />;
        })}

        {/* answered in time · left waiting: drawn clockwise, like the days */}
        <path d={arc(0, edge, R)} pathLength={1} className="onb-silence__half" data-side="in-time" />
        <path d={arc(edge, 359.99, R)} pathLength={1} className="onb-silence__half" data-side="late" />
        <path d={arc(0, edge, R)} pathLength={1} className="onb-silence__lit onb-silence__lit--glow" filter="url(#onb-silence-glow)" />
        <path d={arc(0, edge, R)} pathLength={1} className="onb-silence__lit" />

        {/* the Core reaches each client */}
        {placed.map((p) => {
          const s = point(p.a, STONE);
          const e = point(p.a, R - p.r - 9);
          return (
            <g key={p.d.id} className="onb-silence__reach" style={{ "--i": p.i } as CSSProperties}>
              <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} pathLength={1} stroke="url(#onb-silence-reach)" className="onb-silence__thread" />
              <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} pathLength={1} className="onb-silence__spark" />
              <circle cx={p.dot.x} cy={p.dot.y} r={p.r + 6} className="onb-silence__halo" />
            </g>
          );
        })}

        {/* each client, as large as what they are worth */}
        {placed.map((p) => (
          <circle key={p.d.id} cx={p.dot.x} cy={p.dot.y} r={p.r} className="onb-silence__dot" style={{ "--i": p.i } as CSSProperties} />
        ))}
      </svg>

      <div className="onb-silence__core" style={{ width: `${r2(CORE_SHARE * 100)}%`, ...at(C) }}>
        {children}
      </div>

      <div aria-hidden="true">
        <Rate at={at(point(edge * 0.28, 160))} figure={percent(curve[0])} lines={copy.ring.inTime} side="in-time" />
        <Rate at={at(point(edge + (360 - edge) * 0.72, 160))} figure={percent(curve[turn])} lines={copy.ring.late} side="late" />
        <span className="onb-silence__edge font-label uppercase" style={at(point(edge, R - 30))}>
          {copy.ring.edge(threshold)}
        </span>
        {placed.map((p) => (
          <span key={p.d.id} className="onb-silence__name" data-side={p.side} style={{ ...at(p.label), "--i": p.i, "--x": r2((p.label.x / VW) * 100) } as CSSProperties}>
            <span className="text-fg">{p.d.company}</span>
            <span className="tabular">
              {copy.days(p.d.quietDays)} · {formatCurrency(p.d.value)}
            </span>
          </span>
        ))}
        <span className="onb-silence__caption font-label uppercase" style={at({ x: C.x, y: C.y + R + 82 })}>
          {copy.ring.caption}
        </span>
      </div>
    </figure>
  );
}

function Rate({ at, figure, lines, side }: { at: CSSProperties; figure: string; lines: string[]; side: "in-time" | "late" }) {
  return (
    <span className="onb-silence__rate" data-side={side} style={at}>
      <span className="onb-silence__figure tabular">{figure}</span>
      {lines.map((l) => (
        <span key={l}>{l}</span>
      ))}
    </span>
  );
}

/**
 * The life of the priority, from the moment it was found to the deal closing: what Syxoria has
 * done, what it is doing now, what waits on the user, then on the client. The end carries what is
 * at stake — the result it all leads to.
 */
export function FollowThrough({ steps, outcome }: { steps: FollowStep[]; outcome: string }) {
  return (
    <ol className="onb-follow" aria-label={copy.follow} style={{ "--n": steps.length } as CSSProperties}>
      {steps.map((s, i) => (
        <li key={s.id} className="onb-follow__step" data-state={s.state} data-by={s.by} style={{ "--i": i } as CSSProperties}>
          <span aria-hidden="true" className="onb-follow__node" />
          <span className="onb-follow__label">{s.label}</span>
          <span className="onb-follow__when tabular">{i === steps.length - 1 ? outcome : (s.when ?? " ")}</span>
          {s.state !== "next" && <span className="sr-only">{s.state === "done" ? ", done" : ", under way"}</span>}
        </li>
      ))}
    </ol>
  );
}
