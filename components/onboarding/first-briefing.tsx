"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { briefing as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { resolveBriefingAction } from "@/lib/onboarding/mandate";
import type { AutonomyPolicy, Briefing, DataSource, Mandate } from "@/types";
import { BriefingSection } from "./briefing-section";
import { OnbButton } from "./onboarding-button";

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
  onEnter?: () => void;
};

/** The moments of the onboarding variant, in milliseconds from its start */
const PRELUDE = [250, 650, 1050, 1500];
const PRELUDE_END = 2300;
const REVEAL = 520;

/**
 * The first briefing — the reward of the onboarding. A very short prelude says what Syxoria now
 * holds (the memory's final state, folding away: its job is done), then the briefing reveals
 * itself as one line of reasoning. The action is worded by the mandate the user just gave.
 */
export function FirstBriefing({ briefing, mandate, policy, sources, firstName, variant, onEnter }: Props) {
  const onboarding = variant === "onboarding";
  const [t, setT] = useState(onboarding ? 0 : Infinity);
  const [when, setWhen] = useState<{ hello: string; date: string } | null>(null);
  const headRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // the time of day is the visitor's own, read once mounted (never at render on the server)
    const w = setTimeout(() => setWhen({ hello: greeting(), date: today() }), 0);
    if (!onboarding) return () => clearTimeout(w);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // with reduced motion, everything is there at once
    const marks = still ? [Infinity] : [...PRELUDE, PRELUDE_END, ...[0, 1, 2, 3, 4].map((i) => PRELUDE_END + 300 + i * REVEAL)];
    const timers = marks.map((m) => setTimeout(() => setT(m), Number.isFinite(m) ? m : 0));
    return () => {
      clearTimeout(w);
      timers.forEach(clearTimeout);
    };
  }, [onboarding]);

  const prelude = t < PRELUDE_END;
  const shown = (i: number) => t >= PRELUDE_END + 300 + i * REVEAL;
  useEffect(() => {
    if (onboarding && !prelude) headRef.current?.focus({ preventScroll: true });
  }, [onboarding, prelude]);

  const action = resolveBriefingAction(briefing, mandate, policy, sources);
  const { priority, insight, recommendation, drafts } = briefing;
  const worth = drafts.reduce((s, d) => s + d.value, 0);

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
      <h1 ref={headRef} tabIndex={-1} className="onb-briefing__title onb-rise mt-3.5 max-w-[48rem] font-display text-[clamp(1.9rem,1.35rem+1.8vw,3rem)] leading-[1.08] tracking-(--title-tracking) text-fg outline-none [font-weight:var(--title-weight)]">
        {when?.hello ?? "Hello"}
        {firstName ? `, ${firstName}` : ""}. <span className="text-fg-2">{copy.lead}</span>{" "}
        <em className="font-serif italic tracking-(--accent-tracking) [font-size:var(--accent-size)] [font-weight:var(--accent-weight)]">{copy.accent}</em>
      </h1>

      <div className="onb-reasoning mt-9 grid gap-px @4xl:grid-cols-[1fr_1fr_1fr_1.35fr]">
        <BriefingSection label={copy.labels.priority} kind="priority" shown={shown(0)}>
          <p className="font-display text-[1.3rem] font-light leading-snug tracking-[-0.015em] text-fg">{priority.title}</p>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{priority.detail}</p>
          <p className="tabular mt-4 font-display text-[1.9rem] font-light leading-none tracking-[-0.02em] text-fg">{formatCurrency(worth)}</p>
          <p className="mt-1 text-[12px] text-fg-3">at stake today</p>
        </BriefingSection>

        <BriefingSection label={copy.labels.insight} kind="insight" shown={shown(1)}>
          <p className="text-[1.05rem] leading-snug text-fg">{insight.title}</p>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{insight.detail}</p>
        </BriefingSection>

        <BriefingSection label={copy.labels.recommendation} kind="recommendation" shown={shown(2)}>
          <p className="text-[1.05rem] leading-snug text-fg">{recommendation.title}</p>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{recommendation.detail}</p>
        </BriefingSection>

        <BriefingSection label={copy.labels.action} kind="action" shown={shown(3)}>
          <p className="text-[1.05rem] leading-snug text-fg">{action.title}</p>
          <ul className="mt-3.5 grid gap-px overflow-hidden rounded-lg border border-accent-line/60">
            {drafts.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 bg-canvas/60 px-3.5 py-2.5 text-[13px]">
                <span className="min-w-0 truncate">
                  <span className="text-fg">{d.company}</span>
                  <span className="text-fg-3"> · {formatCurrency(d.value)}</span>
                </span>
                <span className={cn("shrink-0 text-[11.5px]", action.status === "listed" ? "text-fg-3" : "text-accent-strong")}>{action.statusLabel}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] leading-relaxed text-fg-2">{action.detail}</p>
        </BriefingSection>
      </div>

      <div className={cn("mt-7 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 transition-opacity duration-700", shown(4) ? "opacity-100" : "pointer-events-none opacity-0")}>
        <p className="text-[12.5px] text-fg-3">{briefing.basedOn}.</p>
        {onboarding && (
          <OnbButton tone="emerald" onClick={onEnter} disabled={!shown(4)} aria-hidden={!shown(4) || undefined}>
            {copy.enter}
          </OnbButton>
        )}
      </div>
    </div>
  );
}
