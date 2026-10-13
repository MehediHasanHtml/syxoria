"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { DecodeText } from "@/components/shared/decode-text";
import { briefing as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { reachOf, resolveBriefingAction } from "@/lib/onboarding/mandate";
import type { AutonomyPolicy, Briefing, DataSource, Mandate } from "@/types";
import { DraftList, Exchange, OutcomeScale, StakeList } from "./briefing-evidence";
import { BriefingSection } from "./briefing-section";
import { ModeGlyph } from "./mandate-ring";
import { OnbButton } from "./onboarding-button";
import { transition } from "./view-transition";

/** A step's figure and what it measures — the briefing reads at a glance as four of them */
function Lead({ value, caption, accent, hero, inline }: { value: ReactNode; caption: string; accent?: boolean; hero?: boolean; /** the figure and what it counts on one line */ inline?: boolean }) {
  return (
    <div className={cn("onb-brief__lead", inline && "onb-brief__lead--inline")}>
      <p className={cn("onb-brief__figure tabular", hero && "onb-brief__figure--hero", accent ? "text-accent-strong" : "text-fg")}>{value}</p>
      <p className="onb-brief__caption">{caption}</p>
    </div>
  );
}

/** What a step means: one statement in the brand's voice, and what supports it */
function Words({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="onb-brief__words onb-brief__then">
      <p className="onb-brief__statement">{title}</p>
      <p className="onb-brief__detail">{detail}</p>
    </div>
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
 * The reasoning, step by step (ms after the prelude): priority → insight (the longest: their
 * message is read, then its silence counted out day by day) → recommendation → the action, the
 * strongest moment; then the way in.
 */
const STEPS = [300, 1900, 4800, 6000, 7300];

/**
 * The first briefing — the finale of the onboarding, and the template for every briefing Syxoria
 * writes. A short prelude first: the Core alone on the stage, saying what it now holds. Then it
 * returns to the bar and the briefing unfolds as one line of reasoning — priority → insight →
 * recommendation → action — each step given its own moment, the action last and strongest.
 *
 * It is one sheet rather than four columns: WHAT IS above, in white — the sum waiting on the
 * user, and who is waiting (priority); their own words, the exchange, then the silence counted in
 * days (insight) — and WHAT SYXORIA DOES ABOUT IT below, in the Core's emerald — what a reply
 * changes (recommendation), flowing into what it will do (action). One deal is in view at a time:
 * choosing another reads its message instead.
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
          // the prelude ends as one continuous change: the Core travels from the stage to the bar
          if (m === PRELUDE_END || m === Infinity)
            transition(() => {
              setT(m);
              unfold.current?.();
            });
          else setT(m);
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
  const figure = (text: string, i: number): ReactNode => (onboarding ? <DecodeText text={text} pending={!shown(i)} delay={260} /> : text);

  const action = resolveBriefingAction(briefing, mandate, policy, sources);
  const { priority, insight, recommendation, drafts } = briefing;
  const worth = drafts.reduce((s, d) => s + d.value, 0);
  const opening = insight.quiet?.draftId ?? drafts[0]?.id ?? "";
  const focus = chosen ?? opening;
  const deal = drafts.find((d) => d.id === focus) ?? drafts[0];
  // every conversation is drawn on the same line of time and to the same scale, so they compare
  const span = Math.max(1, ...drafts.map((d) => (d.rhythm?.length ?? 1) + d.quietDays));
  const peak = Math.max(1, ...drafts.flatMap((d) => (d.rhythm ?? []).flatMap((v) => [v.them, v.you])));
  // the mandate the action is taken under, with the mark it had when it was chosen
  const level = policy.levels.find((l) => l.id === mandate.level);
  const reach = reachOf(policy, mandate);
  const view = { drafts, focus, onChoose: setChosen };
  // the first reading takes its time; a deal looked at again is read quickly
  const again = !current(1) || focus !== opening;

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
          Your first briefing
          {when && <span className="text-fg-3/70"> · {when.date}</span>}
        </p>
        <p className="onb-briefing__source hidden text-[12.5px] text-fg-3 @4xl:block">{briefing.basedOn}.</p>
      </div>
      <h1
        ref={headRef}
        tabIndex={-1}
        className="onb-briefing__title onb-rise mt-3.5 text-balance font-display text-[clamp(1.9rem,1.35rem+1.8vw,3rem)] leading-[1.08] tracking-(--title-tracking) text-fg outline-none [font-weight:var(--title-weight)] tight:mt-2.5 tight:text-[2.1rem]"
      >
        {when?.hello ?? "Hello"}
        {firstName ? `, ${firstName}` : ""}. <span className="text-fg-2">{copy.lead}</span>{" "}
        <em className="font-serif italic tracking-(--accent-tracking) [font-size:var(--accent-size)] [font-weight:var(--accent-weight)]">{copy.accent}</em>
      </h1>

      <div className="onb-sheet" data-variant={variant} data-reading={(onboarding && reading) || undefined}>
        {/* WHAT IS — in white */}
        <div className="onb-sheet__is">
          {/* what needs you: how much is waiting, and who — choosing one shows what they wrote */}
          <BriefingSection label={copy.labels.priority} gloss={copy.glosses.priority} kind="priority" shown={shown(0)} current={current(0)}>
            <Lead hero value={figure(formatCurrency(worth), 0)} caption={copy.figures.stake(drafts.length)} />
            <Words title={priority.title} detail={priority.detail} />
            <StakeList {...view} />
          </BriefingSection>

          {/* why now: their own words, read out; the exchange, then the silence counted day by day up to today; what that costs here */}
          <BriefingSection label={copy.labels.insight} gloss={copy.glosses.insight} kind="insight" shown={shown(1)} current={current(1)}>
            {deal && (
              <>
                <figure className="onb-quote">
                  <blockquote className="onb-quote__words">
                    {/* every message holds the place, so the sheet never moves when another is chosen */}
                    {drafts.map((d) => (
                      <span key={d.id} aria-hidden="true" className="onb-quote__sizer">
                        “{d.asked}”
                      </span>
                    ))}
                    <span>{onboarding ? <DecodeText text={`“${deal.asked}”`} pending={!shown(1)} delay={again ? 0 : 260} /> : `“${deal.asked}”`}</span>
                  </blockquote>
                  <figcaption className="onb-quote__by">{copy.wrote(deal.contact, deal.company, deal.quietDays)}</figcaption>
                  <div className="onb-quote__count">
                    <p className="onb-brief__figure tabular text-fg">{figure(copy.figures.days(deal.quietDays), 1)}</p>
                    <p className="onb-brief__caption">{copy.figures.silence}</p>
                  </div>
                </figure>
                <Exchange key={deal.id} draft={deal} span={span} peak={peak} threshold={insight.quiet?.threshold} quick={again} reply={shown(3) ? { status: action.status, label: action.statusLabel } : undefined} />
              </>
            )}
            <Words title={insight.title} detail={insight.detail} />
          </BriefingSection>
        </div>

        {/* WHAT SYXORIA DOES ABOUT IT — in the Core's emerald */}
        <div className="onb-sheet__does">
          {/* what I suggest, and what it changes on the company's own history — it runs on into the action */}
          <BriefingSection label={copy.labels.recommendation} gloss={copy.glosses.recommendation} kind="recommendation" shown={shown(2)} current={current(2)} aside={<span aria-hidden="true" className="onb-brief__flow" />}>
            {briefing.impact && <Lead accent inline value={figure(briefing.impact.value, 2)} caption={briefing.impact.label} />}
            {briefing.impact?.compare && <OutcomeScale {...briefing.impact.compare} />}
            <Words title={recommendation.title} detail={recommendation.detail} />
          </BriefingSection>

          {/* what I'll do — with each, worded by the mandate and the tools, never more */}
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
              <div>
                <Lead accent inline value={figure(action.figure, 3)} caption={action.caption} />
                <Words title={action.title} detail={action.detail} />
              </div>
              <div>
                <DraftList {...view} status={action.status} statusLabel={action.statusLabel} />
                {onboarding && (
                  <div className={cn("onb-act__enter transition-opacity duration-700", shown(4) ? "opacity-100" : "pointer-events-none opacity-0")}>
                    <OnbButton tone="emerald" onClick={onEntering} onAdvance={onEnter} disabled={!shown(4)} aria-hidden={!shown(4) || undefined}>
                      {copy.enter}
                    </OnbButton>
                  </div>
                )}
              </div>
            </div>
          </BriefingSection>
        </div>
      </div>
    </div>
  );
}
