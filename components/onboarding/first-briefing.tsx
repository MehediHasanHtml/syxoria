"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { DailyBriefingView } from "@/components/briefing/daily-briefing";
import { briefing as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import { firstDailyBriefing } from "@/lib/onboarding/first-daily-briefing";
import { resolveBriefingAction } from "@/lib/onboarding/mandate";
import type { AutonomyPolicy, Briefing, DataSource, Mandate } from "@/types";
import { OnbButton } from "./onboarding-button";
import { transition } from "./view-transition";

type Props = {
  briefing: Briefing;
  mandate: Mandate;
  policy: AutonomyPolicy;
  /** The connected tools — the action never promises what they can't do */
  sources: DataSource[];
  firstName: string | null;
  /** onboarding: a short prelude, then the briefing arrives step by step · workspace: all there, as the first page */
  variant: "onboarding" | "workspace";
  /** Into the product: called once the button's emerald has begun (see OnbButton onAdvance) */
  onEnter?: () => void;
  /** The moment the decision is pressed — the Core answers at once */
  onEntering?: () => void;
  /** Each thing Syxoria says — a line of the prelude, a step of the briefing — as it is reached: the Core answers */
  onBeat?: () => void;
  /** The prelude is over: the Core leaves the stage for its place in the bar */
  onUnfold?: () => void;
  /** The Core's reaction count, for the one that stands on the stage during the prelude */
  pulse?: number;
};

/** The moments of the onboarding variant, in milliseconds from its start */
const PRELUDE = [350, 800, 1250, 1800];
const PRELUDE_END = 2900;
/** The briefing, step by step (ms after the prelude): priority → insight → recommendation → action and what Syxoria is doing → the way in */
const STEPS = [300, 1300, 2300, 3300, 4500];

/**
 * The executive briefing — the finale of the onboarding, and the page the user comes back to every
 * morning, midday and evening (components/briefing).
 *
 * A short prelude first: the Core alone on the stage, saying what it now holds, and that it has
 * found something. Then it returns to its place in the bar and the briefing arrives around the
 * dial, one step of the reasoning at a time — priority, insight, recommendation, action — then what
 * Syxoria is doing about it and under which autonomy, and the way in.
 *
 * It is the user's first briefing: built from what the onboarding found, worded by the mandate
 * they just gave and the tools connected (firstDailyBriefing → resolveBriefingAction), so it says
 * what Syxoria will do or has in hand, never that it has done it. The briefings still to come
 * today are named, not invented.
 */
export function FirstBriefing({ briefing, mandate, policy, sources, firstName, variant, onEnter, onEntering, onBeat, onUnfold, pulse }: Props) {
  const onboarding = variant === "onboarding";
  const [t, setT] = useState(onboarding ? 0 : Infinity);
  const [now, setNow] = useState<Date | null>(null);
  const headRef = useRef<HTMLHeadingElement>(null);

  const beat = useRef(onBeat);
  const unfold = useRef(onUnfold);
  useEffect(() => {
    beat.current = onBeat;
    unfold.current = onUnfold;
  });

  useEffect(() => {
    // the time of day is the visitor's own, read once mounted (never at render on the server)
    const w = setTimeout(() => setNow(new Date()), 0);
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
  const revealed = STEPS.filter((at) => t >= PRELUDE_END + at).length;
  useEffect(() => {
    if (onboarding && !prelude) headRef.current?.focus({ preventScroll: true });
  }, [onboarding, prelude, now]);
  // the Core answers each thing as it is said
  const said = [...PRELUDE, ...STEPS.slice(0, 4).map((at) => PRELUDE_END + at)].filter((at) => t >= at).length;
  useEffect(() => {
    if (onboarding && said > 0) beat.current?.();
  }, [onboarding, said]);

  const set = useMemo(() => (now ? firstDailyBriefing({ briefing, mandate, policy, sources, firstName, now }) : null), [now, briefing, mandate, policy, sources, firstName]);
  const decision = resolveBriefingAction(briefing, mandate, policy, sources).decision;

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

  if (!set) return null;

  const ready = revealed >= STEPS.length;
  return (
    <DailyBriefingView
      set={set}
      revealed={onboarding ? revealed : STEPS.length}
      headingRef={headRef}
      cta={
        onboarding && (
          <div className={cn("transition-opacity duration-700", ready ? "opacity-100" : "pointer-events-none opacity-0")}>
            <OnbButton tone="emerald" className="w-full" onClick={onEntering} onAdvance={onEnter} disabled={!ready} aria-hidden={!ready || undefined}>
              {decision}
            </OnbButton>
          </div>
        )
      }
    />
  );
}
