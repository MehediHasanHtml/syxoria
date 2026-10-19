"use client";

import Link from "next/link";
import { useRef, type CSSProperties, type PointerEvent } from "react";
import { ArrowRight, CalendarClock, Check } from "lucide-react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { centerAreas, centerDay, centerVerbs, centerWatch, type CenterArea, type CenterMoment, type CenterScenario, type CenterVerb } from "@/lib/mock-data/center-scenarios";
import type { CoreState } from "@/lib/core/core-states";
import { cn } from "@/lib/cn";
import type { WorkspaceAction } from "@/types/workspace";

/*
 * Three directions for the overview's centre (/concept/center). Each shows the same moment of the
 * company (calm, an anomaly, a decision awaiting approval, an action that went through) and does
 * something with it:
 *   Sculpture        the Brain as a dark anthracite object, its light says what is happening
 *   CoreSample       an abstract Core: the business as layers, the moment as a shift in them
 *   DecisionCenter   no permanent object: what Syxoria understands, detects, recommends, executes
 * Styles: app/concept/center/center.css (.ce-*).
 */

export type CenterProps = { s: CenterScenario; action?: WorkspaceAction; onReview: (actionId: string) => void };

const areaName = (id: CenterArea) => centerAreas.find((a) => a.id === id)?.name ?? id;

/* ---------- Shared: the moment, told ---------- */

function Kicker({ s }: { s: CenterScenario }) {
  return (
    <p className="ce-kicker" data-verb={s.verb}>
      <span className="ce-kicker__verb">{centerVerbs[s.verb].doing}</span>
      <span>{s.at}</span>
      <span>{areaName(s.area)}</span>
    </p>
  );
}

function NextStep({ s, onReview }: { s: CenterScenario; onReview: (id: string) => void }) {
  const n = s.next;
  if (!n) return null;
  return (
    <div className="ce-next" data-kind={n.kind}>
      <p className="ce-next__line">{n.line}</p>
      {n.kind === "approve" && n.actionId ? (
        <button type="button" className="cx-btn cx-btn--primary" onClick={() => onReview(n.actionId!)}>
          {n.label}
        </button>
      ) : (
        <Link href={n.href} className={cn("cx-btn", n.kind === "hold" && "cx-btn--primary")}>
          {n.kind === "hold" && <CalendarClock aria-hidden="true" />}
          {n.label}
          {n.kind === "open" && <ArrowRight aria-hidden="true" />}
        </Link>
      )}
    </div>
  );
}

/** The moment in a few lines, under an object (directions one and two) */
function Caption({ s, onReview }: { s: CenterScenario; onReview: (id: string) => void }) {
  return (
    <div className="ce-caption" key={s.state}>
      <Kicker s={s} />
      <h2 className="ce-caption__headline">{s.headline}</h2>
      {s.stake && (
        <p className="ce-caption__stake">
          <strong className="tabular">{s.stake.value}</strong> {s.stake.caption}
        </p>
      )}
      <NextStep s={s} onReview={onReview} />
    </div>
  );
}

/* ---------- Direction one: the sculpture ---------- */

/** The stone unlit in every moment: as a sculpture, only the light on it changes */
const SCULPTURE_LOOK: CoreState = "dormant";

/**
 * The Brain as an object: the same Core, in dark anthracite, lit like a sculpture. A soft light
 * follows the pointer; what happens in the company changes the light on it, never its shape:
 * a warm slit on the side that holds an anomaly, the seam between its halves lit while a decision
 * waits, one emerald breath when something went through.
 */
export function Sculpture({ s, onReview }: CenterProps) {
  const stage = useRef<HTMLDivElement>(null);
  const onMove = (e: PointerEvent) => {
    const el = stage.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--lx", `${Math.round(x * 100)}%`);
    el.style.setProperty("--ly", `${Math.round(y * 100)}%`);
    el.style.setProperty("--rx", `${((0.5 - y) * 8).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((x - 0.5) * 10).toFixed(2)}deg`);
  };
  const onLeave = () => {
    const el = stage.current;
    if (!el) return;
    for (const p of ["--lx", "--ly", "--rx", "--ry"]) el.style.removeProperty(p);
  };
  return (
    <div className="ce-sculpt" data-state={s.state}>
      <div ref={stage} className="ce-sculpt__stage" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div className="ce-sculpt__object" key={s.state}>
          <SyxoriaCore state={SCULPTURE_LOOK} label="Syxoria" className="ce-sculpt__core" />
          <span className="ce-sculpt__light" aria-hidden="true" />
          <span className="ce-sculpt__flare" aria-hidden="true" />
          <span className="ce-sculpt__seam" aria-hidden="true" />
          <span className="ce-sculpt__breath" aria-hidden="true" />
        </div>
        <span className="ce-sculpt__plinth" aria-hidden="true" />
        {s.state !== "calm" && (
          <p className="ce-sculpt__note" key={`note-${s.state}`}>
            <span>{centerVerbs[s.verb].doing}</span> {s.at}
          </p>
        )}
      </div>
      <Caption s={s} onReview={onReview} />
    </div>
  );
}

/* ---------- Direction two: the abstract Core ---------- */

const W = 200;
const TOP = 34;
const BOTTOM = 330;
const X0 = 50;
const X1 = 150;

/** The layers' heights, in the order they are stacked, from their weights */
function layers() {
  const total = centerAreas.reduce((n, a) => n + a.weight, 0);
  let y = TOP;
  return centerAreas.map((a, i) => {
    const h = ((BOTTOM - TOP) * a.weight) / total;
    const layer = { ...a, y, h, i };
    y += h;
    return layer;
  });
}
const LAYERS = layers();
/** A layer's top edge, with the slight waver of a real core sample */
const edge = (y: number, i: number) => {
  const pts = Array.from({ length: 9 }, (_, k) => {
    const x = X0 + ((X1 - X0) * k) / 8;
    return `${x.toFixed(1)} ${(y + 1.6 * Math.sin(k * 1.3 + i * 2.1)).toFixed(1)}`;
  });
  return pts;
};

/**
 * The Core, abstracted: a core sample of the company. Each layer is a part of the business, as
 * thick as it weighs; the seam that runs through it is Syxoria. A calm day is aligned layers and
 * a faint seam. An anomaly is a fault: the layer slips sideways, marked where it broke. A decision
 * is a gap opening under that layer, lit across. Something done closes the layers and
 * runs the light from top to bottom.
 */
export function CoreSample({ s, onReview }: CenterProps) {
  const at = LAYERS.find((l) => l.id === s.area)!;
  return (
    <div className="ce-sample" data-state={s.state}>
      <div className="ce-sample__stage">
        <svg viewBox={`0 0 ${W} 364`} className="ce-sample__svg" role="img" aria-label={`The business in layers. ${s.headline}`} key={s.state}>
          <defs>
            <linearGradient id="ce-round" x1="0" x2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0.55" />
              <stop offset="0.32" stopColor="#fff" stopOpacity="0.06" />
              <stop offset="0.6" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="ce-seam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-accent-strong)" stopOpacity="0" />
              <stop offset="0.5" stopColor="var(--color-accent-strong)" stopOpacity="1" />
              <stop offset="1" stopColor="var(--color-accent-strong)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {LAYERS.map((l) => {
            // the layer and those above it rise, those below sink: the gap opens under it
            const before = l.i <= at.i;
            const here = l.id === at.id;
            // a fault slips the layer sideways; a decision opens a gap at it
            const dx = s.state === "anomaly" && here ? 9 : 0;
            const dy = s.state === "approval" ? (before ? -7 : 7) : 0;
            const top = edge(l.y, l.i);
            const bottom = edge(l.y + l.h, l.i + 1).reverse();
            return (
              <g key={l.id} className="ce-layer" data-here={here || undefined} style={{ transform: `translate(${dx}px, ${dy}px)` }}>
                <path d={`M${top.join(" L")} L${bottom.join(" L")} Z`} className="ce-layer__body" data-i={l.i % 2} />
                {[0.3, 0.55, 0.8].map((f) => (
                  <path key={f} d={`M${edge(l.y + l.h * f, l.i + f * 3).join(" L")}`} className="ce-layer__grain" />
                ))}
                <path d={`M${top.join(" L")}`} className="ce-layer__edge" />
              </g>
            );
          })}
          <rect x={X0} y={TOP - 8} width={X1 - X0} height={BOTTOM - TOP + 16} fill="url(#ce-round)" className="ce-sample__round" />
          {/* Syxoria: the seam through every layer */}
          <line x1={W / 2} x2={W / 2} y1={TOP - 14} y2={BOTTOM + 14} className="ce-sample__seam" />
          <line x1={W / 2} x2={W / 2} y1={TOP - 14} y2={BOTTOM + 14} stroke="url(#ce-seam)" className="ce-sample__travel" />
          {s.state === "approval" && <line x1={X0 - 16} x2={X1 + 16} y1={at.y + at.h} y2={at.y + at.h} className="ce-sample__gap" />}
          {s.state === "anomaly" && <line x1={X0 + 9} x2={X1 + 9} y1={at.y + at.h} y2={at.y + at.h} className="ce-sample__fault" />}
        </svg>
        <ul className="ce-sample__labels" aria-hidden="true">
          {LAYERS.map((l) => (
            <li key={l.id} style={{ "--y": `${((l.y + l.h / 2) / 364) * 100}%` } as CSSProperties} data-here={(l.id === at.id && s.state !== "calm") || undefined} data-state={s.state}>
              {l.name}
            </li>
          ))}
        </ul>
      </div>
      <Caption s={s} onReview={onReview} />
    </div>
  );
}

/* ---------- Direction three: the decision centre ---------- */

/** The abstract Core, small: the seal at the head of the decision centre */
export function CoreMark({ s }: { s: CenterScenario }) {
  return (
    <svg viewBox="0 0 22 44" className="ce-mark" data-state={s.state} aria-hidden="true">
      {LAYERS.map((l) => {
        const y = 4 + ((l.y - TOP) / (BOTTOM - TOP)) * 36;
        const h = (l.h / (BOTTOM - TOP)) * 36 - 1.4;
        const here = l.id === s.area && s.state !== "calm";
        return <rect key={l.id} x={here && s.state === "anomaly" ? 4.5 : 3} y={y} width="16" height={h} rx="0.6" data-here={here || undefined} />;
      })}
      <line x1="11" x2="11" y1="1" y2="43" />
    </svg>
  );
}

const VERBS: CenterVerb[] = ["understand", "detect", "recommend", "execute"];
const minutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const DAY_START = minutes("8:00");
const DAY_END = minutes("19:05");

/** The day so far, on one line: each thing Syxoria understood, detected, recommended or did, at its time */
function DayLine({ highlight }: { highlight?: string }) {
  const on = centerDay.find((m) => m.id === highlight);
  return (
    <div className="ce-day">
      <ol className="ce-day__line" aria-label="Today, from 8:00">
        {centerDay.map((m: CenterMoment) => (
          <li key={m.id} data-verb={m.verb} data-on={m.id === highlight || undefined} style={{ "--at": `${((minutes(m.at) - DAY_START) / (DAY_END - DAY_START)) * 100}%` } as CSSProperties} title={`${m.at}  ${m.text}`}>
            <span className="sr-only">
              {m.at}, {centerVerbs[m.verb].doing}: {m.text}
            </span>
          </li>
        ))}
      </ol>
      <p className="ce-day__ends">
        <span>8:00</span>
        {on ? (
          <span className="ce-day__on">
            {on.at} · {on.text}
          </span>
        ) : (
          <span className="ce-day__on ce-day__on--quiet">{centerDay.length} moments today</span>
        )}
        <span>Now</span>
      </p>
    </div>
  );
}

/**
 * No permanent object: the centre is what Syxoria is doing with the company right now. In calm
 * it shows what it keeps in view; when something happens, that moment takes the centre with
 * what it rests on and the next step, an approval included. The four verbs say how much of each
 * it did today, and the day line places the moment among the others. The abstract Core is its
 * seal: small, at the head, changing with the moment.
 */
export function DecisionCenter({ s, action, onReview }: CenterProps) {
  const counts = Object.fromEntries(VERBS.map((v) => [v, centerDay.filter((m) => m.verb === v).length])) as Record<CenterVerb, number>;
  return (
    <div className="ce-dc" data-state={s.state}>
      <div className="ce-dc__moment" key={s.state}>
        <div className="ce-dc__head">
          <CoreMark s={s} />
          <Kicker s={s} />
        </div>
        <h2 className="ce-dc__headline">{s.headline}</h2>
        <p className="ce-dc__detail">{s.detail}</p>

        {s.state === "calm" ? (
          <ul className="ce-watch" aria-label="What Syxoria keeps in view">
            {centerWatch.map((w) => (
              <li key={w.area}>
                <span className="ce-watch__area">{areaName(w.area)}</span>
                <span>{w.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="ce-dc__grid">
            {s.stake && (
              <p className="ce-dc__stake">
                <strong className="tabular">{s.stake.value}</strong>
                <span>{s.stake.caption}</span>
              </p>
            )}
            <ul className="ce-dc__evidence" aria-label="What it rests on">
              {s.evidence.map((e) => (
                <li key={e}>
                  {s.state === "done" && <Check aria-hidden="true" />}
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {s.state === "approval" && action?.preview && (
          <blockquote className="ce-dc__draft">
            <p className="ce-dc__draft-to">{action.preview.to}</p>
            <p className="ce-dc__draft-subject">{action.preview.subject}</p>
            <p>{action.preview.body?.[1]}</p>
          </blockquote>
        )}

        <NextStep s={s} onReview={onReview} />
      </div>

      <div className="ce-dc__foot">
        <ul className="ce-verbs" aria-label="Today">
          {VERBS.map((v) => (
            <li key={v} data-verb={v} data-on={v === s.verb || undefined}>
              <strong className="tabular">{counts[v]}</strong>
              <span>{centerVerbs[v].name}</span>
            </li>
          ))}
        </ul>
        <DayLine highlight={s.momentId} />
      </div>
    </div>
  );
}
