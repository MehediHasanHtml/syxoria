"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkline } from "@/components/dashboard/charts/sparkline";
import { CoreButton } from "@/components/home/core-button";
import { briefing as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { AutonomyPolicy, Briefing, Mandate } from "@/types";
import { effectiveMode } from "./permission-control";
import { rise } from "./primitives";

const today = () => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

/** What happens to the follow-ups, in the user's own terms — straight from the mandate they just set */
function draftsLine(policy: AutonomyPolicy, mandate: Mandate, n: number) {
  const mode = (id: string) => effectiveMode(policy.rules.find((r) => r.id === id)!, mandate);
  if (mode("draft") === "off") return "Drafting is turned off — Syxoria will only point at the deals.";
  if (mode("draft") === "ask") return `Want Syxoria to draft the ${n} follow-ups? It will ask before writing anything.`;
  if (mode("send") === "auto") return `${n} follow-ups are drafted. They go out at 10:00 unless you change them.`;
  return `${n} follow-ups are drafted and waiting for your approval. Nothing is sent without you.`;
}

type Props = {
  briefing: Briefing;
  mandate: Mandate;
  policy: AutonomyPolicy;
  firstName: string | null;
  /** onboarding: the briefing on its own, with the way in · workspace: the same, as the workspace's first page */
  variant: "onboarding" | "workspace";
  onEnter?: () => void;
};

/**
 * The first briefing — the moment the system shows it is already useful. Its pieces assemble
 * one after another; inside the workspace it stays exactly where it was, so the briefing
 * simply becomes the first page of the product.
 */
export function FirstBriefing({ briefing, mandate, policy, firstName, variant, onEnter }: Props) {
  const [ready, setReady] = useState(variant === "workspace");
  const [when, setWhen] = useState<{ hello: string; date: string } | null>(null);
  const headRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // the time of day is the visitor's own, read once mounted (never at render on the server)
    const t = setTimeout(() => setWhen({ hello: greeting(), date: today() }), 0);
    if (variant === "onboarding") headRef.current?.focus({ preventScroll: true });
    const r = setTimeout(() => setReady(true), variant === "onboarding" ? 2600 : 0);
    return () => {
      clearTimeout(t);
      clearTimeout(r);
    };
  }, [variant]);

  const { priority, observation, kpi, recommendation, drafts } = briefing;

  return (
    <div className="editorial-type onb-briefing @container w-full">
      <p className="onb-rise font-label text-label uppercase text-fg-3">
        {copy.eyebrow}
        {when && <span className="text-fg-3/70"> · {when.date}</span>}
      </p>
      <h1 ref={headRef} tabIndex={-1} className="onb-briefing__title onb-rise mt-4 font-display text-[clamp(2rem,1.4rem+2vw,3.25rem)] leading-[1.08] tracking-(--title-tracking) text-fg outline-none [font-weight:var(--title-weight)]">
        {when?.hello ?? "Hello"}
        {firstName ? `, ${firstName}` : ""}.{" "}
        <span className="text-fg-2">{copy.lead}</span>{" "}
        <em className="font-serif italic tracking-(--accent-tracking) [font-size:var(--accent-size)] [font-weight:var(--accent-weight)]">{copy.accent}</em>
      </h1>

      <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] @3xl:grid-cols-12">
        <Piece label={copy.labels.priority} i={2} className="@3xl:col-span-7" lead>
          <p className="font-display text-[clamp(1.375rem,1.2rem+0.6vw,1.75rem)] font-light leading-snug tracking-[-0.015em] text-fg">{priority.title}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-fg-2">{priority.detail}</p>
          <ul className="mt-5 divide-y divide-white/[0.05] border-y border-white/[0.05]">
            {drafts.map((d) => (
              <li key={d.id} className="flex items-baseline justify-between gap-4 py-2.5 text-[13.5px]">
                <span className="min-w-0">
                  <span className="text-fg">{d.company}</span>
                  <span className="text-fg-3"> · {d.contact}</span>
                </span>
                <span className="flex shrink-0 items-baseline gap-4">
                  <span className="hidden text-fg-3 sm:inline">quiet {d.quietDays} days</span>
                  <span className="tabular text-fg-2">{formatCurrency(d.value)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Piece>

        <Piece label={copy.labels.kpi} i={3} className="@3xl:col-span-5">
          <p className="text-[13px] text-fg-2">{kpi.label}</p>
          <p className="tabular mt-3 font-display text-[clamp(2.25rem,1.9rem+1vw,3rem)] font-light leading-none tracking-[-0.03em] text-fg">{formatCurrency(kpi.value)}</p>
          <p className="mt-2 text-[12.5px] text-fg-3">
            <span className="text-accent-strong">+{kpi.change}%</span> on last month
          </p>
          <Sparkline values={kpi.series} className="mt-6 h-14 w-full" />
        </Piece>

        <Piece label={copy.labels.observation} i={4} className="@3xl:col-span-5">
          <p className="text-[1.125rem] leading-snug text-fg">{observation.title}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-fg-2">{observation.detail}</p>
        </Piece>

        <Piece label={copy.labels.recommendation} i={5} className="@3xl:col-span-7">
          <p className="text-[1.125rem] leading-snug text-fg">{recommendation.title}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-fg-2">{recommendation.detail}</p>
          <p className="mt-4 flex gap-2.5 rounded-lg border border-accent-line bg-accent-soft px-3.5 py-2.5 text-[13.5px] leading-snug text-fg">
            <span aria-hidden="true" className="mt-[0.5em] size-1.5 shrink-0 rounded-full bg-accent-strong" />
            {draftsLine(policy, mandate, drafts.length)}
          </p>
        </Piece>
      </div>

      <p className="onb-rise mt-4 text-[12.5px] text-fg-3" style={rise(6)}>
        {briefing.basedOn}.
      </p>

      {variant === "onboarding" && (
        <div className={cn("mt-10 transition-opacity duration-700", ready ? "opacity-100" : "pointer-events-none opacity-0")} aria-hidden={!ready || undefined}>
          <CoreButton onClick={onEnter} disabled={!ready}>
            Enter your workspace
          </CoreButton>
        </div>
      )}
    </div>
  );
}

function Piece({ label, i, className, lead, children }: { label: string; i: number; className?: string; lead?: boolean; children: React.ReactNode }) {
  return (
    <section aria-label={label} className={cn("onb-rise onb-piece bg-canvas p-5 sm:p-7", className)} style={rise(i * 2)}>
      <p className="mb-4 flex items-center gap-2.5 font-label text-label uppercase text-fg-3">
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", lead ? "bg-accent-strong shadow-[0_0_10px_var(--core-glow)]" : "bg-white/25")} />
        {label}
      </p>
      {children}
    </section>
  );
}
