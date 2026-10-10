"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DecodeText } from "@/components/shared/decode-text";
import { briefing as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { reachOf, resolveBriefingAction } from "@/lib/onboarding/mandate";
import type { AutonomyPolicy, Briefing, DataSource, Mandate } from "@/types";
import { ActionLanes, NextLanes, OutcomeScale, SilenceLanes, StakeLanes } from "./briefing-evidence";
import { BriefingSection } from "./briefing-section";
import { ModeGlyph } from "./mandate-ring";
import { OnbButton } from "./onboarding-button";

/** A step's figure — the briefing reads at a glance as four of them — what it measures, and its evidence beside it */
function Lead({ value, caption, accent, beside }: { value: ReactNode; caption: string; accent?: boolean; beside?: ReactNode }) {
  return (
    <div className="onb-brief__lead">
      <div className="flex items-end gap-4">
        <p className={cn("onb-brief__figure tabular", accent ? "text-accent-strong" : "text-fg")}>{value}</p>
        {beside}
      </div>
      <p className="onb-brief__caption">{caption}</p>
    </div>
  );
}

/** What a step means: one statement in the brand's voice, and what supports it */
function Words({ title, detail }: { title: string; detail: string }) {
  return (
    <>
      <p className="onb-brief__statement">{title}</p>
      <p className="onb-brief__detail">{detail}</p>
    </>
  );
}

const today = () => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

type Props = {
  briefing: Briefing;
  mandate: Mandate;
  policy: AutonomyPolicy;
  /** The connected tools — the action never promises what they can't do */
  sources: DataSource[];
  firstName: string | null;
  /** onboarding: a short prelude, then the briefing reveals itself · workspace: all there, as the first page */
  variant: "onboarding" | "workspace";
  /** Into the product: called once the button's emerald has begun (see OnbButton onAdvance) */
  onEnter?: () => void;
  /** The moment "Enter Syxoria" is pressed — the Core answers at once */
  onEntering?: () => void;
  /** Each step of the reasoning as it is reached — the Core answers as it presents it */
  onBeat?: () => void;
};

/** The moments of the onboarding variant, in milliseconds from its start */
const PRELUDE = [250, 650, 1050, 1500];
const PRELUDE_END = 2300;
/**
 * The reasoning, step by step (ms after the prelude): priority → insight (the longest: its silence
 * is counted out day by day) → recommendation → the action, the strongest moment; then the way in.
 */
const STEPS = [300, 1400, 3500, 4500, 5700];

/**
 * The first briefing — the reward of the onboarding, and the template for every briefing Syxoria
 * writes. A very short prelude says what Syxoria now holds (the memory's final state, folding
 * away: its job is done), then the briefing reveals itself as one line of reasoning — priority →
 * insight → recommendation → action — each step given its own moment, the action last and
 * strongest.
 *
 * It is one drawing rather than four boxes. Each step leads with one figure (how much → how long
 * → how much better → when), so the briefing reads at a glance as four numbers; under them the
 * same lanes run through all four steps — one per deal — and cross the line of today: left of it,
 * what Syxoria understood (the exchange, then the silence, counted in days), in white; right of
 * it, what happens next, in the Core's emerald. Everything in it is the briefing the service
 * returned; the action is worded by the mandate the user just gave and the tools connected
 * (resolveBriefingAction): it says what Syxoria will do or has prepared, never that it has done it.
 */
export function FirstBriefing({ briefing, mandate, policy, sources, firstName, variant, onEnter, onEntering, onBeat }: Props) {
  const onboarding = variant === "onboarding";
  const [t, setT] = useState(onboarding ? 0 : Infinity);
  const [when, setWhen] = useState<{ hello: string; date: string } | null>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  // a deal pointed at — in any stretch of the drawing — is shown as the same deal in all of them
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    // the time of day is the visitor's own, read once mounted (never at render on the server)
    const w = setTimeout(() => setWhen({ hello: greeting(), date: today() }), 0);
    if (!onboarding) return () => clearTimeout(w);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // with reduced motion, everything is there at once
    const marks = still ? [Infinity] : [...PRELUDE, PRELUDE_END, ...STEPS.map((at) => PRELUDE_END + at)];
    const timers = marks.map((m) => setTimeout(() => setT(m), Number.isFinite(m) ? m : 0));
    return () => {
      clearTimeout(w);
      timers.forEach(clearTimeout);
    };
  }, [onboarding]);

  const prelude = t < PRELUDE_END;
  const shown = (i: number) => t >= PRELUDE_END + STEPS[i];
  // while it unfolds, the step just reached holds the attention; once all is there, none does
  const reading = !shown(4);
  const current = (i: number) => reading && shown(i) && !shown(i + 1);
  useEffect(() => {
    if (onboarding && !prelude) headRef.current?.focus({ preventScroll: true });
  }, [onboarding, prelude]);
  // the Core answers each step as it is presented
  const beat = useRef(onBeat);
  useEffect(() => {
    beat.current = onBeat;
  });
  const step = STEPS.slice(0, 4).filter((at) => t >= PRELUDE_END + at).length;
  useEffect(() => {
    if (onboarding && step > 0) beat.current?.();
  }, [onboarding, step]);

  /** A figure read out as it is reached (decoded, like everything Syxoria reads); at rest in the workspace */
  const figure = (text: string, i: number): ReactNode => (onboarding ? <DecodeText text={text} pending={!shown(i)} delay={260} /> : text);

  const action = resolveBriefingAction(briefing, mandate, policy, sources);
  const { priority, insight, recommendation, drafts } = briefing;
  const worth = drafts.reduce((s, d) => s + d.value, 0);
  // the deal the reasoning turns to: it stands out in every stretch of the drawing, and its silence is the insight
  const subject = insight.quiet?.draftId ?? drafts[0]?.id ?? "";
  const subjectDraft = drafts.find((d) => d.id === subject);
  // the mandate the action is taken under, with the mark it had when it was chosen
  const level = policy.levels.find((l) => l.id === mandate.level);
  const reach = reachOf(policy, mandate);
  const lanes = { drafts, subject, focus: hover, onFocus: setHover };

  if (prelude)
    return (
      <div className="onb-prelude grid min-h-[60vh] place-items-center" role="status" aria-live="polite">
        <ul className="grid gap-3.5">
          {copy.prelude.map((line, i) => (
            <li key={line} className={cn("onb-prelude__line flex items-center gap-3.5 font-display text-[clamp(1.25rem,1rem+0.9vw,1.75rem)] font-light tracking-[-0.015em]", t >= PRELUDE[i] && "is-on")}>
              <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-accent-soft text-accent-strong ring-1 ring-accent-line">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {line}
            </li>
          ))}
          <li className={cn("onb-prelude__line pl-[2.125rem] font-display text-[clamp(1.25rem,1rem+0.9vw,1.75rem)] font-light italic text-accent-strong", t >= PRELUDE[3] && "is-on")}>{copy.ready}</li>
        </ul>
      </div>
    );

  return (
    <div className="editorial-type onb-briefing @container w-full">
      <p className="onb-rise font-label text-label uppercase text-fg-3">
        Your first briefing
        {when && <span className="text-fg-3/70"> · {when.date}</span>}
      </p>
      <h1
        ref={headRef}
        tabIndex={-1}
        className="onb-briefing__title onb-rise mt-3.5 text-balance font-display text-[clamp(1.9rem,1.35rem+1.8vw,3rem)] leading-[1.08] tracking-(--title-tracking) text-fg outline-none [font-weight:var(--title-weight)] tight:mt-2.5 tight:text-[2.1rem]"
      >
        {when?.hello ?? "Hello"}
        {firstName ? `, ${firstName}` : ""}. <span className="text-fg-2">{copy.lead}</span>{" "}
        <em className="font-serif italic tracking-(--accent-tracking) [font-size:var(--accent-size)] [font-weight:var(--accent-weight)]">{copy.accent}</em>
      </h1>

      <div className="onb-course mt-8 tight:mt-4" data-variant={variant} data-reading={(onboarding && reading) || undefined} data-hover={hover ? "" : undefined}>
        {/* how much — what deserves attention: who, and what each is worth */}
        <BriefingSection label={copy.labels.priority} kind="priority" shown={shown(0)} current={current(0)} lead={<Lead value={figure(formatCurrency(worth), 0)} caption={copy.figures.stake(drafts.length)} />} lanes={<StakeLanes {...lanes} />}>
          <Words title={priority.title} detail={priority.detail} />
        </BriefingSection>

        {/* how long — why: what Syxoria noticed. The exchange, then the silence, counted out day by day up to today */}
        <BriefingSection
          label={copy.labels.insight}
          kind="insight"
          shown={shown(1)}
          current={current(1)}
          lead={subjectDraft ? <Lead value={figure(copy.figures.days(subjectDraft.quietDays), 1)} caption={copy.figures.silence(subjectDraft.company)} /> : null}
          lanes={<SilenceLanes {...lanes} threshold={insight.quiet?.threshold} />}
        >
          <Words title={insight.title} detail={insight.detail} />
        </BriefingSection>

        {/* how much better — what to do, and what it achieves on the company’s own history. From here on: the Core’s emerald */}
        <BriefingSection
          label={copy.labels.recommendation}
          kind="recommendation"
          shown={shown(2)}
          current={current(2)}
          lead={briefing.impact ? <Lead value={figure(briefing.impact.value, 2)} caption={briefing.impact.label} beside={briefing.impact.compare && <OutcomeScale {...briefing.impact.compare} />} /> : null}
          lanes={<NextLanes {...lanes} />}
        >
          <Words title={recommendation.title} detail={recommendation.detail} />
        </BriefingSection>

        {/* when — what Syxoria does with each, worded by the mandate and the tools, never more */}
        <BriefingSection
          label={copy.labels.action}
          kind="action"
          shown={shown(3)}
          current={current(3)}
          aside={
            level && (
              <>
                <ModeGlyph share={reach.auto / reach.total} />
                {copy.mandate(level.name)}
              </>
            )
          }
          lead={<Lead value={figure(action.figure, 3)} caption={action.caption} accent />}
          lanes={<ActionLanes {...lanes} status={action.status} statusLabel={action.statusLabel} />}
        >
          <Words title={action.title} detail={action.detail} />
        </BriefingSection>
      </div>

      <div className={cn("mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 transition-opacity duration-700 tight:mt-4", shown(4) ? "opacity-100" : "pointer-events-none opacity-0")}>
        <p className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[12.5px] text-fg-3">
          {insight.quiet && (
            <span className="onb-brief__key">
              <span aria-hidden="true" />
              {insight.quiet.note}
            </span>
          )}
          <span>{briefing.basedOn}.</span>
        </p>
        {onboarding && (
          <OnbButton tone="emerald" onClick={onEntering} onAdvance={onEnter} disabled={!shown(4)} aria-hidden={!shown(4) || undefined}>
            {copy.enter}
          </OnbButton>
        )}
      </div>
    </div>
  );
}
