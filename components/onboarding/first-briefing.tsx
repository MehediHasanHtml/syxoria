"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { DecodeText } from "@/components/shared/decode-text";
import { briefing as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { followThrough, reachOf, resolveBriefingAction } from "@/lib/onboarding/mandate";
import type { AutonomyPolicy, Briefing, DataSource, Mandate } from "@/types";
import { FollowThrough, SilenceRing } from "./briefing-evidence";
import { ModeGlyph } from "./mandate-ring";
import { OnbButton } from "./onboarding-button";
import { transition } from "./view-transition";

const today = () => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

type Props = {
  briefing: Briefing;
  mandate: Mandate;
  policy: AutonomyPolicy;
  /** The connected tools — the action never promises what they can't do */
  sources: DataSource[];
  firstName: string | null;
  /** onboarding: a short prelude, then the discovery reveals itself · workspace: all there, as the first page */
  variant: "onboarding" | "workspace";
  /** Into the product: called once the button's emerald has begun (see OnbButton onAdvance) */
  onEnter?: () => void;
  /** The moment the decision is pressed — the Core answers at once */
  onEntering?: () => void;
  /** Each thing Syxoria says — a line of the prelude, a step of the discovery — as it is reached: the Core answers */
  onBeat?: () => void;
  /** The Core's reaction count */
  pulse?: number;
};

/** The moments of the onboarding variant, in milliseconds from its start */
const PRELUDE = [350, 800, 1250, 1800];
const PRELUDE_END = 2900;
/**
 * The discovery, one sentence at a time (ms after the prelude): the ring is drawn and the clients
 * land on it, with what is waiting → the two halves, and why it matters → the healthy half lights
 * up, and what to do → the Core reaches each client, and what is already in hand; then the decision.
 */
const STEPS = [300, 2300, 4000, 5600, 7300];

/** A sentence with the words it leans on set apart: white for what is, emerald for what to do */
function stressed(text: string, stress: string | undefined, tone: "fg" | "accent"): ReactNode {
  const at = stress ? text.indexOf(stress) : -1;
  if (!stress || at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <em className="onb-disc__stress" data-tone={tone}>
        {stress}
      </em>
      {text.slice(at + stress.length)}
    </>
  );
}

/**
 * The executive briefing — the finale of the onboarding, and the page the user comes back to every
 * morning. Not a dashboard: one discovery, told in four sentences beside the Core.
 *
 * A short prelude first: the Core alone, saying what it now holds, and that it has found
 * something. Then it settles at the centre of the ring that shows its reasoning: how long each
 * client has waited for an answer, on the company's own history (insight), where those deals still
 * close (recommendation), and the Core reaching each of them (action). Beside it, from the largest
 * to the one to act on: what is waiting (priority) · why it matters · what to do · what is already
 * in hand, the thread it follows from here, and the decision left to the user.
 *
 * White = what is · the Core's emerald = what Syxoria does about it. The fuller sentences are
 * there for screen readers. The Core stays on the stage throughout, so it is never in the bar here.
 *
 * Everything in it is the briefing the service returned; the action is worded by the mandate the
 * user just gave and the tools connected (resolveBriefingAction): it says what Syxoria will do or
 * has in hand, never that it has done it.
 */
export function FirstBriefing({ briefing, mandate, policy, sources, firstName, variant, onEnter, onEntering, onBeat, pulse }: Props) {
  const onboarding = variant === "onboarding";
  const [t, setT] = useState(onboarding ? 0 : Infinity);
  const [date, setDate] = useState<string | null>(null);
  const headRef = useRef<HTMLHeadingElement>(null);

  const beat = useRef(onBeat);
  useEffect(() => {
    beat.current = onBeat;
  });

  useEffect(() => {
    // the day is the visitor's own, read once mounted (never at render on the server)
    const w = setTimeout(() => setDate(today()), 0);
    if (!onboarding) return () => clearTimeout(w);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // with reduced motion, everything is there at once
    const marks = still ? [Infinity] : [...PRELUDE, PRELUDE_END, ...STEPS.map((at) => PRELUDE_END + at)];
    const timers = marks.map((m) =>
      setTimeout(
        () => {
          // the prelude ends as one continuous change: the Core travels to the centre of the ring.
          // Time only moves forward: a transition that lands late never takes the reading back
          const reach = () => setT((was) => Math.max(was, m));
          if (m === PRELUDE_END || m === Infinity) transition(reach);
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
  useEffect(() => {
    if (onboarding && !prelude) headRef.current?.focus({ preventScroll: true });
  }, [onboarding, prelude]);
  // the Core answers each thing as it is said
  const said = [...PRELUDE, ...STEPS.slice(0, 4).map((at) => PRELUDE_END + at)].filter((at) => t >= at).length;
  useEffect(() => {
    if (onboarding && said > 0) beat.current?.();
  }, [onboarding, said]);

  const action = resolveBriefingAction(briefing, mandate, policy, sources);
  const { priority, insight, recommendation, impact, drafts } = briefing;
  const worth = formatCurrency(drafts.reduce((s, d) => s + d.value, 0));
  // the mandate the action is taken under, with the mark it had when it was chosen
  const level = policy.levels.find((l) => l.id === mandate.level);
  const reach = reachOf(policy, mandate);
  // the one Core of the onboarding travels here from the prelude; the workspace has its own in its bar
  const core = <SyxoriaCore state="ready" pulse={pulse} vtName={onboarding ? "syx-core" : undefined} label="Syxoria" className="w-full" />;

  if (prelude)
    return (
      <div className="onb-prelude grid place-items-center" role="status" aria-live="polite">
        <div className="grid justify-items-center gap-9 tight:gap-6">
          <SyxoriaCore state="understanding" pulse={pulse} vtName="syx-core" className="onb-prelude__core" />
          <ul className="grid justify-items-center gap-2.5 text-center">
            {copy.prelude.map((line, i) => (
              <li key={line} className={cn("onb-prelude__line font-display text-[clamp(1.2rem,1rem+0.8vw,1.65rem)] font-light tracking-[-0.015em] text-fg-2", t >= PRELUDE[i] && "is-on")}>
                {line}
              </li>
            ))}
            <li className={cn("onb-prelude__line mt-1 font-display text-[clamp(1.2rem,1rem+0.8vw,1.65rem)] font-light italic text-accent-strong", t >= PRELUDE[3] && "is-on")}>{copy.found}</li>
          </ul>
        </div>
      </div>
    );

  return (
    <div className="editorial-type onb-disc @container w-full" data-variant={variant}>
      <div className="onb-disc__grid">
        {/* THE REASONING — around the Core, on the company's own history */}
        <div className="onb-disc__stage">
          {insight.curve && insight.quiet ? (
            <SilenceRing drafts={drafts} curve={insight.curve} threshold={insight.quiet.threshold} drawn={shown(0)} halves={shown(1)} lit={shown(2)} reach={shown(3)}>
              {core}
            </SilenceRing>
          ) : (
            <div className="onb-disc__core">{core}</div>
          )}
        </div>

        {/* THE PRIORITY — one figure leads: what is waiting on the user */}
        <header className="onb-disc__head" data-shown={shown(0) || undefined}>
          <p className="font-label text-label uppercase text-fg-3">
            {copy.eyebrow[variant]}
            {date && <span className="text-fg-3/70"> · {date}</span>}
          </p>
          <p className="onb-disc__intro">{onboarding ? copy.intro.onboarding(firstName) : copy.intro.workspace()}</p>
          <h1 ref={headRef} tabIndex={-1} className="onb-disc__hero outline-none">
            <span className="onb-disc__figure tabular">{onboarding ? <DecodeText text={worth} pending={!shown(0)} delay={260} /> : worth}</span>
            <span className="onb-disc__words">{copy.waiting}</span>
          </h1>
          <p className="sr-only">
            {priority.title} {priority.detail}
          </p>
        </header>

        {/* WHY IT MATTERS, and WHAT TO DO */}
        <div className="onb-disc__why">
          <p className="onb-disc__line" data-shown={shown(1) || undefined}>
            {stressed(insight.title, insight.stress, "fg")}
            <span className="sr-only"> {insight.detail}</span>
          </p>
          <p className="onb-disc__line" data-shown={shown(2) || undefined}>
            {stressed(recommendation.title, recommendation.stress, "accent")}
            <span className="sr-only">
              {" "}
              {recommendation.detail} {impact && `${impact.value} ${impact.label}.`}
            </span>
          </p>
        </div>

        {/* WHAT IS ALREADY IN HAND — within the mandate, the thread it follows from here, and the decision */}
        <section className="onb-disc__act" aria-label={action.label} data-shown={shown(3) || undefined}>
          <div className="flex items-center justify-between gap-4">
            <p className="font-label text-label uppercase text-accent-strong">{action.label}</p>
            {level && (
              <p className="onb-disc__mandate">
                <ModeGlyph share={reach.auto / reach.total} />
                {copy.mandate(level.name)}
              </p>
            )}
          </div>
          <p className="onb-disc__title">{action.title}</p>
          <p className="onb-disc__note">
            {action.note}
            <span className="sr-only"> {action.detail}</span>
          </p>
          <FollowThrough steps={followThrough(action)} outcome={worth} />
          {onboarding && (
            <div className={cn("onb-disc__enter transition-opacity duration-700", shown(4) ? "opacity-100" : "pointer-events-none opacity-0")}>
              <OnbButton tone="emerald" onClick={onEntering} onAdvance={onEnter} disabled={!shown(4)} aria-hidden={!shown(4) || undefined}>
                {action.decision}
              </OnbButton>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
