"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { DecodeText } from "@/components/shared/decode-text";
import { briefing as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { followThrough, reachOf, resolveBriefingAction } from "@/lib/onboarding/mandate";
import type { AutonomyPolicy, Briefing, DataSource, Mandate } from "@/types";
import { CloseCurve, DealList, FollowThrough, ReplyList } from "./briefing-evidence";
import { BriefingSection } from "./briefing-section";
import { ModeGlyph } from "./mandate-ring";
import { OnbButton } from "./onboarding-button";
import { transition } from "./view-transition";

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
  /** Each thing Syxoria says — a line of the prelude, a step of the reasoning — as it is reached: the Core answers */
  onBeat?: () => void;
  /** The prelude is over and the briefing unfolds: the Core leaves the stage for the bar */
  onUnfold?: () => void;
  /** The Core's reaction count, for the one that stands on the stage during the prelude */
  pulse?: number;
};

/** The moments of the onboarding variant, in milliseconds from its start */
const PRELUDE = [350, 800, 1250, 1750];
const PRELUDE_END = 2700;
/**
 * The reasoning, step by step (ms after the prelude): the priority → the insight (the longest: the
 * company's curve is drawn, then each deal lands on it) → the recommendation, lifting them back →
 * the action, the strongest moment, its thread lit up to where things stand; then the way in.
 */
const STEPS = [300, 2000, 4100, 5500, 7300];

/**
 * The executive briefing — the finale of the onboarding, and the page the user comes back to every
 * morning. A short prelude first: the Core alone on the stage, saying what it now holds. Then it
 * returns to the bar and the briefing unfolds as one line of reasoning, each step in its own moment.
 *
 * Not four equal blocks: one priority leads, as one figure (what is waiting on the user) and who is
 * waiting. Beside it, the reasoning in one drawing: the company's own curve, every deal on it
 * (insight), and in emerald where a reply takes them (recommendation). Below, the destination: what
 * Syxoria is doing about it (action), and the thread that follows the priority from the moment it
 * was found to the deal closing, so the briefing can show tomorrow what moved since today.
 *
 * White = what is · the Core's emerald = what Syxoria does about it. Each step says one thing on
 * screen; the fuller sentence is there for screen readers. One deal is in view at a time.
 *
 * Everything in it is the briefing the service returned; the action is worded by the mandate the
 * user just gave and the tools connected (resolveBriefingAction): it says what Syxoria will do or
 * has prepared, never that it has done it.
 */
export function FirstBriefing({ briefing, mandate, policy, sources, firstName, variant, onEnter, onEntering, onBeat, onUnfold, pulse }: Props) {
  const onboarding = variant === "onboarding";
  const [t, setT] = useState(onboarding ? 0 : Infinity);
  const [when, setWhen] = useState<{ hello: string; date: string } | null>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  // the deal in view: the one chosen, else the one the briefing opens on
  const [chosen, setChosen] = useState<string | null>(null);

  const unfold = useRef(onUnfold);
  const beat = useRef(onBeat);
  useEffect(() => {
    unfold.current = onUnfold;
    beat.current = onBeat;
  });

  useEffect(() => {
    // the time of day is the visitor's own, read once mounted (never at render on the server)
    const w = setTimeout(() => setWhen({ hello: greeting(), date: today() }), 0);
    if (!onboarding) return () => clearTimeout(w);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // with reduced motion, everything is there at once
    const marks = still ? [Infinity] : [...PRELUDE, PRELUDE_END, ...STEPS.map((at) => PRELUDE_END + at)];
    const timers = marks.map((m) =>
      setTimeout(
        () => {
          // the prelude ends as one continuous change: the Core travels from the stage to the bar.
          // Time only moves forward: a transition that lands late never takes the reading back
          const reach = () => setT((was) => Math.max(was, m));
          if (m === PRELUDE_END || m === Infinity)
            transition(() => {
              reach();
              unfold.current?.();
            });
          else reach();
        },
        Number.isFinite(m) ? m : 0,
      ),
    );
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
  // the Core answers each thing as it is said
  const said = [...PRELUDE, ...STEPS.slice(0, 4).map((at) => PRELUDE_END + at)].filter((at) => t >= at).length;
  useEffect(() => {
    if (onboarding && said > 0) beat.current?.();
  }, [onboarding, said]);

  /** A figure read out as it is reached (decoded, like everything Syxoria reads); at rest in the workspace */
  const figure = (text: string, i: number, delay = 260): ReactNode => (onboarding ? <DecodeText text={text} pending={!shown(i)} delay={delay} /> : text);

  const action = resolveBriefingAction(briefing, mandate, policy, sources);
  const { priority, insight, recommendation, impact, drafts } = briefing;
  const worth = drafts.reduce((s, d) => s + d.value, 0);
  const focus = chosen ?? insight.quiet?.draftId ?? drafts[0]?.id ?? "";
  // the mandate the action is taken under, with the mark it had when it was chosen
  const level = policy.levels.find((l) => l.id === mandate.level);
  const reach = reachOf(policy, mandate);
  const view = { drafts, focus, onChoose: setChosen };

  if (prelude)
    return (
      <div className="onb-prelude grid min-h-[64vh] place-items-center" role="status" aria-live="polite">
        <div className="grid justify-items-center gap-9 tight:gap-6">
          <SyxoriaCore state="ready" pulse={pulse} vtName="syx-core" className="onb-prelude__core" />
          <ul className="grid justify-items-center gap-2.5 text-center">
            {copy.prelude.map((line, i) => (
              <li key={line} className={cn("onb-prelude__line font-display text-[clamp(1.2rem,1rem+0.8vw,1.65rem)] font-light tracking-[-0.015em] text-fg-2", t >= PRELUDE[i] && "is-on")}>
                {line}
              </li>
            ))}
            <li className={cn("onb-prelude__line mt-1 font-display text-[clamp(1.2rem,1rem+0.8vw,1.65rem)] font-light italic text-accent-strong", t >= PRELUDE[3] && "is-on")}>{copy.ready}</li>
          </ul>
        </div>
      </div>
    );

  return (
    <div className="editorial-type onb-briefing @container w-full">
      <div className="flex items-baseline justify-between gap-8">
        <p className="onb-rise font-label text-label uppercase text-fg-3">
          {copy.eyebrow[variant]}
          {when && <span className="text-fg-3/70"> · {when.date}</span>}
        </p>
        <p className="onb-briefing__source hidden text-[12.5px] text-fg-3 @4xl:block">{briefing.basedOn}.</p>
      </div>
      <h1
        ref={headRef}
        tabIndex={-1}
        className="onb-briefing__title onb-rise mt-3 text-balance font-display text-[clamp(1.8rem,1.3rem+1.6vw,2.75rem)] leading-[1.08] tracking-(--title-tracking) text-fg outline-none [font-weight:var(--title-weight)] tight:mt-2 tight:text-[2rem]"
      >
        {when?.hello ?? "Hello"}
        {firstName ? `, ${firstName}` : ""}. <span className="text-fg-2">{copy.lead}</span>{" "}
        <em className="font-serif italic tracking-(--accent-tracking) [font-size:var(--accent-size)] [font-weight:var(--accent-weight)]">{copy.accent}</em>
      </h1>

      <div className="onb-sheet" data-variant={variant} data-reading={(onboarding && reading) || undefined}>
        <div className="onb-sheet__case">
          {/* THE PRIORITY — one figure leads the page: what is waiting on the user, then who */}
          <BriefingSection label={copy.labels.priority} gloss={copy.glosses.priority} kind="priority" shown={shown(0)} current={current(0)}>
            <p className="onb-hero">
              <span className="onb-hero__figure tabular">{figure(formatCurrency(worth), 0)}</span>
              <span className="onb-hero__words">{copy.waiting}</span>
            </p>
            <p className="sr-only">
              {priority.title} {priority.detail}
            </p>
            <DealList {...view} />
          </BriefingSection>

          {/* THE REASONING — why it matters, drawn on the company's own history, and what to do about it */}
          <div className="onb-sheet__why">
            <BriefingSection label={copy.labels.insight} gloss={copy.glosses.insight} kind="insight" shown={shown(1)} current={current(1)}>
              <p className="onb-brief__statement">{insight.title}</p>
              <p className="sr-only">{insight.detail}</p>
              {insight.curve && insight.quiet && <CloseCurve {...view} curve={insight.curve} threshold={insight.quiet.threshold} lifted={shown(2)} />}
            </BriefingSection>

            <BriefingSection label={copy.labels.recommendation} gloss={copy.glosses.recommendation} kind="recommendation" shown={shown(2)} current={current(2)}>
              <div className="onb-advice">
                <p className="onb-brief__statement">{recommendation.title}</p>
                {impact && (
                  <p className="onb-advice__impact">
                    <span className="onb-advice__figure tabular">{figure(impact.value, 2, 500)}</span>
                    <span className="onb-advice__label">{impact.label}</span>
                  </p>
                )}
              </div>
              <p className="sr-only">{recommendation.detail}</p>
            </BriefingSection>
          </div>
        </div>

        {/* THE ACTION — what Syxoria is doing about it, within the mandate, and the thread it follows from here */}
        <BriefingSection
          label={copy.labels.action}
          gloss={copy.glosses.action}
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
        >
          <div className="onb-act">
            <p className="onb-act__lead">
              <span className="onb-act__figure tabular">{figure(action.figure, 3, 400)}</span>
              <span className="onb-act__caption">{action.caption}</span>
            </p>
            <p className="sr-only">
              {action.title} {action.detail}
            </p>
            <ReplyList {...view} status={action.status} statusLabel={action.statusLabel} />
          </div>
          <div className="onb-act__thread">
            <p className="onb-act__follow font-label text-label uppercase">{copy.follow}</p>
            <FollowThrough steps={followThrough(action)} outcome={formatCurrency(worth)} />
            {onboarding && (
              <div className={cn("onb-act__enter transition-opacity duration-700", shown(4) ? "opacity-100" : "pointer-events-none opacity-0")}>
                <OnbButton tone="emerald" onClick={onEntering} onAdvance={onEnter} disabled={!shown(4)} aria-hidden={!shown(4) || undefined}>
                  {copy.enter}
                </OnbButton>
              </div>
            )}
          </div>
        </BriefingSection>
      </div>
    </div>
  );
}
