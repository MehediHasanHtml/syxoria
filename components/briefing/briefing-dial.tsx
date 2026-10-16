"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { dailyBriefing as copy } from "@/content/briefing";
import { cn } from "@/lib/cn";
import type { BriefingDimension, BriefingStep, DailyBriefing } from "@/types";
import { SeverityMark } from "./marks";

/**
 * The briefing's dial: the four steps of its reasoning around one centre. Priority at the top,
 * insight on the right, action at the bottom, recommendation on the left; the centre shows the one
 * selected — its figure when there is an honest one, else its sentence — how it compares with the
 * previous briefing, and on demand the reasoning behind it. The centre also names the step it
 * follows from and the one it leads to, so the line priority → insight → recommendation → action
 * can be walked through. The four are one radio group (arrow keys go round the dial).
 * Styles: "DAILY BRIEFING" in globals.css.
 */

const ANGLE: Record<BriefingDimension, number> = { priority: 0, insight: 90, action: 180, recommendation: 270 };
/** Clockwise, for the arrow keys */
const AROUND: BriefingDimension[] = ["priority", "insight", "action", "recommendation"];

const S = 400;
const C = S / 2;
const R = 170;
const r2 = (v: number) => Math.round(v * 100) / 100;
const point = (a: number, r: number) => {
  const t = (a * Math.PI) / 180;
  return { x: r2(C + r * Math.sin(t)), y: r2(C - r * Math.cos(t)) };
};
const arc = (a: number, b: number) => {
  const s = point(a, R);
  const e = point(b, R);
  return `M${s.x} ${s.y} A${R} ${R} 0 0 1 ${e.x} ${e.y}`;
};

export const stepsOf = (b: DailyBriefing): Record<BriefingDimension, BriefingStep> => ({
  priority: b.priority,
  insight: b.insight,
  recommendation: b.recommendation,
  action: b.action,
});

/** What each point of the dial says under its name: how pressing, what changed, what waits */
function subtitle(b: DailyBriefing, d: BriefingDimension): string | null {
  if (d === "priority") return copy.severity[b.priority.severity];
  if (d === "action") {
    const count = (s: string) => b.actions.filter((a) => a.status === s).length;
    const first = (
      [
        ["unsuccessful", "unsuccessful"],
        ["awaiting-approval", "need you"],
        ["in-progress", "in progress"],
        ["scheduled", "scheduled"],
        ["completed", "completed"],
      ] as const
    ).find(([s]) => count(s) > 0);
    return first ? `${count(first[0])} ${first[0] === "awaiting-approval" && count(first[0]) === 1 ? "needs you" : first[1]}` : null;
  }
  const change = stepsOf(b)[d].change;
  return change && change.kind !== "unchanged" ? copy.stepChange[change.kind] : null;
}

export function BriefingDial({
  briefing,
  selected,
  onSelect,
  since,
}: {
  briefing: DailyBriefing;
  selected: BriefingDimension;
  onSelect: (d: BriefingDimension) => void;
  /** The previous briefing's time, for "New since 8:00"; null for the first briefing */
  since: string | null;
}) {
  const [reasoning, setReasoning] = useState<{ for: string } | null>(null);
  const nodes = useRef<Partial<Record<BriefingDimension, HTMLButtonElement | null>>>({});
  const steps = stepsOf(briefing);
  const step = steps[selected];
  // the reasoning stays open only for the step it was opened on
  const why = reasoning?.for === `${briefing.id}:${selected}`;
  const at = copy.chain.indexOf(selected);
  const from = copy.chain[at - 1];
  const to = copy.chain[at + 1];

  const choose = (d: BriefingDimension, focus = false) => {
    setReasoning(null);
    onSelect(d);
    if (focus) nodes.current[d]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const i = AROUND.indexOf(selected);
    const go = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (go) {
      e.preventDefault();
      choose(AROUND[(i + go + AROUND.length) % AROUND.length], true);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      choose(e.key === "Home" ? "priority" : "action", true);
    }
  };

  const sel = ANGLE[selected];
  const comparison = step.change?.kind === "new" && since ? `${copy.stepChange.new} since ${since}` : step.change?.was ? `${copy.was}: ${step.change.was}` : null;

  return (
    <div className="bd-dial" data-selected={selected}>
      <div className="bd-dial__ring">
        <svg aria-hidden="true" viewBox={`0 0 ${S} ${S}`} className="bd-dial__svg">
          {/* the four quarters; the two either side of the selected step carry it */}
          {[0, 90, 180, 270].map((a) => (
            <path key={a} d={arc(a + 8, a + 82)} className="bd-dial__arc" data-near={a === sel || a + 90 === sel || (a === 270 && sel === 0) || undefined} />
          ))}
          {/* from the selected step into the centre */}
          {(() => {
            const s = point(sel, R - 16);
            const e = point(sel, R - 36);
            return <line key={sel} x1={s.x} y1={s.y} x2={e.x} y2={e.y} className="bd-dial__pointer" />;
          })()}
          {AROUND.map((d) => {
            const p = point(ANGLE[d], R);
            return (
              <g key={d} className="bd-dial__mark" data-dimension={d} data-on={d === selected || undefined}>
                <circle cx={p.x} cy={p.y} r="13" className="bd-dial__halo" />
                <circle cx={p.x} cy={p.y} r="6.5" className="bd-dial__dot" />
              </g>
            );
          })}
        </svg>

        {/* THE CENTRE — the selected step */}
        <div className="bd-center" aria-live="polite">
          {why ? (
            <div key={`why-${briefing.id}-${selected}`} className="bd-center__body">
              <p className="bd-center__kicker">
                {copy.whyTitle} · {copy.dimensions[selected]}
              </p>
              <p className="bd-center__why">{step.why}</p>
              {step.evidence && (
                <ul className="bd-center__evidence">
                  {step.evidence.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
              <div className="bd-center__nav">
                <button type="button" className="bd-link" onClick={() => setReasoning(null)}>
                  <ArrowLeft aria-hidden="true" className="size-3.5" />
                  {copy.whyClose}
                </button>
              </div>
            </div>
          ) : (
            <div key={`${briefing.id}-${selected}`} className="bd-center__body">
              <p className="bd-center__kicker">{copy.questions[selected]}</p>
              {step.metric ? (
                <>
                  <p className="bd-center__metric tabular" data-kind={step.metric.kind}>
                    {step.metric.value}
                  </p>
                  <p className="bd-center__caption">{step.metric.caption}</p>
                  <p className="bd-center__title">{step.title}</p>
                </>
              ) : (
                <p className="bd-center__title" data-lead="">
                  {step.title}
                </p>
              )}
              {step.detail && <p className="bd-center__detail">{step.detail}</p>}
              {comparison && <p className="bd-center__was">{comparison}</p>}
              <div className="bd-center__nav">
                {from && (
                  <button type="button" className="bd-link" onClick={() => choose(from)} aria-label={`${copy.follows}: ${copy.dimensions[from]}`}>
                    <ArrowLeft aria-hidden="true" className="size-3.5" />
                    {copy.dimensions[from]}
                  </button>
                )}
                {(step.why || step.evidence) && (
                  <button type="button" className="bd-link bd-link--why" onClick={() => setReasoning({ for: `${briefing.id}:${selected}` })}>
                    {copy.why}
                  </button>
                )}
                {to && (
                  <button type="button" className="bd-link" onClick={() => choose(to)} aria-label={`${copy.leads}: ${copy.dimensions[to]}`}>
                    {copy.dimensions[to]}
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* THE FOUR STEPS — around the ring on wide screens, a row of four under it on small ones */}
      <div role="radiogroup" aria-label="Briefing" className="bd-nodes" onKeyDown={onKey}>
        {AROUND.map((d) => {
          const sub = subtitle(briefing, d);
          return (
            <button
              key={d}
              ref={(el) => {
                nodes.current[d] = el;
              }}
              type="button"
              role="radio"
              aria-checked={d === selected}
              tabIndex={d === selected ? 0 : -1}
              aria-label={[copy.dimensions[d], sub].filter(Boolean).join(", ")}
              data-dimension={d}
              className="bd-node"
              onClick={() => choose(d)}
            >
              <span aria-hidden="true" className="bd-node__label">
                <span className="bd-node__name">{copy.dimensions[d]}</span>
                {sub && <span className={cn("bd-node__sub", d === "priority" && "inline-flex items-center gap-1.5")}>{d === "priority" && <SeverityMark level={briefing.priority.severity} />}{sub}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
