"use client";

import { Lightbulb, ListChecks, ScanSearch, Target, X, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { dailyBriefing as copy } from "@/content/briefing";
import type { BriefingDimension, BriefingStep, DailyBriefing } from "@/types";
import { FigureCentre, FigureLine } from "./briefing-figure";
import { SeverityMark, STATUS_ORDER, StatusIcon } from "./marks";

/**
 * The briefing's dial: the four steps of its reasoning around one centre, all of them readable at
 * once. Priority at the top, insight on the right, action at the bottom, recommendation on the
 * left: each a point on the ring with its card beside it. A card says its step in one headline and
 * leads with its figure; the selected one gives its figure to the centre and says why instead.
 * The centre names the question the step answers, then its figure set for what it is (money, a
 * deadline, a client's words...) or its sentence when there is no honest figure, and "Why" opens
 * the reasoning over the dial: what it rests on, what it follows from, what it is meant to
 * achieve, and what is worth knowing about the data.
 *
 * The cards are one radio group (arrow keys go round the dial, in the same order as the ring);
 * the points on the ring are a shortcut to the same choice for the pointer. While the briefing is
 * still arriving (`revealed`), the steps not reached yet wait, out of reach.
 * Styles: "DAILY BRIEFING" in globals.css.
 */

const ANGLE: Record<BriefingDimension, number> = { priority: 0, insight: 90, action: 180, recommendation: 270 };
/** Clockwise, for the arrow keys */
const AROUND: BriefingDimension[] = ["priority", "insight", "action", "recommendation"];
const ICON: Record<BriefingDimension, LucideIcon> = { priority: Target, insight: ScanSearch, recommendation: Lightbulb, action: ListChecks };
/** The step each one follows from, said under "Why" */
const FOLLOWS: Partial<Record<BriefingDimension, BriefingDimension>> = { recommendation: "insight", action: "recommendation" };

const S = 400;
const C = S / 2;
const R = 172;
/** The inner disc that holds the centre */
const DISC = 114;
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

/** What the priority and the action cards say at their right: how pressing, and what stands out among the actions */
function Status({ briefing, dimension }: { briefing: DailyBriefing; dimension: BriefingDimension }) {
  if (dimension === "priority")
    return (
      <span className="bd-card__tag" data-level={briefing.priority.severity}>
        <SeverityMark level={briefing.priority.severity} />
        {copy.severity[briefing.priority.severity]}
      </span>
    );
  if (dimension !== "action") return null;
  const count = (s: string) => briefing.actions.filter((a) => a.status === s).length;
  const first = STATUS_ORDER.find((s) => count(s) > 0);
  if (!first) return null;
  return (
    <span className="bd-card__tag" data-status={first}>
      <StatusIcon status={first} ring={false} />
      {copy.actions.counts[first](count(first))}
    </span>
  );
}

export function BriefingDial({
  briefing,
  selected,
  onSelect,
  since,
  revealed = 4,
}: {
  briefing: DailyBriefing;
  selected: BriefingDimension;
  onSelect: (d: BriefingDimension) => void;
  /** The briefing it is compared with, named in passing ("8:00"); null for the very first one */
  since: string | null;
  /** How many steps have been reached, in the order of the reasoning */
  revealed?: number;
}) {
  const [reasoning, setReasoning] = useState<string | null>(null);
  const cards = useRef<Partial<Record<BriefingDimension, HTMLButtonElement | null>>>({});
  const whyButton = useRef<HTMLButtonElement>(null);
  const whyTitle = useRef<HTMLHeadingElement>(null);
  // closing the reasoning gives the focus back to Why, once the centre is reachable again
  const restore = useRef(false);
  const id = useId();
  const steps = stepsOf(briefing);
  const step = steps[selected];
  // the reasoning stays open only for the step it was opened on
  const why = reasoning === `${briefing.id}:${selected}`;
  const sel = ANGLE[selected];
  const waiting = (d: BriefingDimension) => copy.chain.indexOf(d) >= revealed;
  const follows = FOLLOWS[selected];

  useEffect(() => {
    if (why) whyTitle.current?.focus();
    else if (restore.current) {
      restore.current = false;
      whyButton.current?.focus();
    }
  }, [why]);

  const choose = (d: BriefingDimension, focus = false) => {
    setReasoning(null);
    onSelect(d);
    if (focus) cards.current[d]?.focus();
  };
  const closeWhy = () => {
    restore.current = true;
    setReasoning(null);
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
  const changed = (d: BriefingDimension) => (since && steps[d].change && steps[d].change!.kind !== "unchanged" ? steps[d].change!.kind : null);
  const comparison = step.change?.kind === "new" && since ? `${copy.stepChange.new} since ${since}` : step.change?.was ? `${copy.was}: ${step.change.was}` : null;
  const progress = step.metric?.kind === "progress" ? step.metric.share : null;

  return (
    <div className="bd-dial" data-selected={selected}>
      <div className="bd-ring" data-why={why || undefined}>
        <svg aria-hidden="true" viewBox={`0 0 ${S} ${S}`} className="bd-ring__svg">
          {/* the four quarters; the two either side of the selected step carry it */}
          {[0, 90, 180, 270].map((a) => (
            <path key={a} d={arc(a + 11, a + 79)} className="bd-ring__arc" data-near={a === sel || a + 90 === sel || (a === 270 && sel === 0) || undefined} />
          ))}
          {[45, 135, 225, 315].map((a) => {
            const p = point(a, R);
            return <circle key={a} cx={p.x} cy={p.y} r="2.4" className="bd-ring__tick" />;
          })}
          <circle cx={C} cy={C} r={DISC} className="bd-ring__disc" />
          {/* progress towards a goal runs round the disc */}
          {progress !== null && (
            <circle key={`${briefing.id}-${selected}`} cx={C} cy={C} r={DISC} pathLength={1} strokeDasharray={`${progress} 1`} transform={`rotate(-90 ${C} ${C})`} className="bd-ring__progress" />
          )}
          {/* each point is tied to the centre; the selected one most clearly */}
          {AROUND.map((d) => {
            const s = point(ANGLE[d], R - 27);
            const e = point(ANGLE[d], DISC + 1);
            return <line key={d} x1={s.x} y1={s.y} x2={e.x} y2={e.y} className="bd-ring__link" data-on={d === selected || undefined} />;
          })}
        </svg>

        {/* the points on the ring: the same choice as the cards, for the pointer */}
        {AROUND.map((d) => {
          const Icon = ICON[d];
          return (
            <button
              key={d}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              className="bd-point"
              data-dimension={d}
              data-on={d === selected || undefined}
              data-pending={waiting(d) || undefined}
              disabled={waiting(d)}
              onClick={() => choose(d)}
            >
              <Icon className="size-[42%]" strokeWidth={1.6} />
            </button>
          );
        })}

        {/* THE CENTRE — the question the selected step answers, then its figure or its sentence */}
        <div className="bd-center" aria-live="polite" data-pending={revealed < 1 || undefined}>
          <div key={`${briefing.id}-${selected}`} className="bd-center__body" inert={why || undefined}>
            <p className="bd-center__kicker">
              <span className="sr-only">{copy.dimensions[selected]}: </span>
              {copy.questions[selected]}
            </p>
            {step.metric ? <FigureCentre metric={step.metric} /> : <p className="bd-center__title">{step.title}</p>}
            {step.detail && <p className="bd-center__detail">{step.detail}</p>}
            {/* how it moved since the previous briefing */}
            {comparison && <p className="bd-center__was">{comparison}</p>}
            <button
              ref={whyButton}
              type="button"
              className="bd-link bd-link--why"
              aria-expanded={why}
              aria-controls={why ? `${id}-why` : undefined}
              onClick={() => setReasoning(`${briefing.id}:${selected}`)}
            >
              {copy.why}
            </button>
          </div>
        </div>

        {/* WHY — the reasoning behind the selected step, over the dial */}
        {why && (
          <section
            id={`${id}-why`}
            aria-labelledby={`${id}-why-title`}
            className="bd-why"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                closeWhy();
              }
            }}
          >
            <div className="bd-why__head">
              <h2 id={`${id}-why-title`} ref={whyTitle} tabIndex={-1} className="bd-why__title outline-none">
                {copy.reasoning.title(copy.dimensions[selected])}
              </h2>
              <button type="button" className="bd-why__close" aria-label={copy.reasoning.close} onClick={closeWhy}>
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </div>
            <p className="bd-why__lead">{step.why}</p>
            {step.evidence && step.evidence.length > 0 && (
              <div className="bd-why__part">
                <p className="bd-why__label">{copy.reasoning.basis}</p>
                <ul className="bd-why__list">
                  {step.evidence.slice(0, 3).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {follows && (
              <div className="bd-why__part">
                <p className="bd-why__label">{copy.reasoning.follows(copy.dimensions[follows])}</p>
                <p>{steps[follows].title}</p>
              </div>
            )}
            {step.outcome && (
              <div className="bd-why__part">
                <p className="bd-why__label">{copy.reasoning.outcome}</p>
                <p>{step.outcome}</p>
              </div>
            )}
            {step.limits && (
              <div className="bd-why__part" data-limits="">
                <p className="bd-why__label">{copy.reasoning.limits}</p>
                <p>{step.limits}</p>
              </div>
            )}
          </section>
        )}
      </div>

      {/* THE FOUR STEPS — each card beside its point on wide screens, in reading order under the dial on small ones */}
      <div role="radiogroup" aria-label={copy.eyebrow} className="bd-cards" onKeyDown={onKey}>
        {AROUND.map((d) => {
          const Icon = ICON[d];
          const on = d === selected;
          const s = steps[d];
          const change = changed(d);
          return (
            <button
              key={d}
              ref={(el) => {
                cards.current[d] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              data-dimension={d}
              data-pending={waiting(d) || undefined}
              inert={waiting(d) || undefined}
              className="bd-card"
              onClick={() => choose(d)}
            >
              <span className="bd-card__kicker">
                <Icon aria-hidden="true" className="bd-card__icon size-3.5" strokeWidth={1.8} />
                <span className="bd-card__name">{copy.dimensions[d]}</span>
                {change && (
                  <span className="bd-card__change">
                    <span aria-hidden="true" className="bd-card__dot" />
                    <span className="bd-card__change-word">{copy.stepChange[change]}</span>
                    <span className="sr-only"> since {since}</span>
                  </span>
                )}
                <Status briefing={briefing} dimension={d} />
              </span>
              {/* keyed by briefing: the words arrive afresh as the day moves on */}
              <span key={`t-${briefing.id}`} className="bd-card__title">
                {s.title}
              </span>
              {/* the selected step's figure is in the centre: its card says why instead */}
              {on || !(s.metric || s.detail) ? (
                <span key={`w-${briefing.id}-${d}`} className="bd-card__why">
                  {s.why}
                </span>
              ) : (
                <span key={`f-${briefing.id}-${d}`} className="bd-card__figure">
                  {s.metric ? <FigureLine metric={s.metric} /> : s.detail}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
