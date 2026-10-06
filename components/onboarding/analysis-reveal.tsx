"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Sparkline } from "@/components/dashboard/charts/sparkline";
import { CoreButton } from "@/components/home/core-button";
import { analysis as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import type { AnalysisFinding, InitialAnalysis, KpiSuggestion } from "@/types";
import { QuietButton, rise, StageHeading } from "./primitives";

/** Findings arrive one after another, as if just concluded — then the numbers worth following. */
function useReveal(total: number, every = 650, delay = 500) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    // with reduced motion, everything is there at once
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = Array.from({ length: total }, (_, i) => setTimeout(() => setShown(i + 1), still ? 0 : delay + i * every));
    return () => timers.forEach(clearTimeout);
  }, [total, every, delay]);
  return shown;
}

/**
 * "Your first analysis is ready." Not a dashboard: a few conclusions, each saying where it
 * comes from, and the handful of numbers the system chose to follow — and why.
 */
export function AnalysisReveal({ analysis, company, onContinue }: { analysis: InitialAnalysis; company: string; onContinue: () => void }) {
  const steps = analysis.findings.length + 2;
  const shown = useReveal(steps);
  const kpisShown = shown > analysis.findings.length;
  const all = shown >= steps;

  return (
    <div className="w-full max-w-[42rem]">
      <StageHeading lead={copy.title.lead} accent={copy.title.accent}>
        {copy.intro}
      </StageHeading>

      <ol className="mt-10 border-t border-white/[0.07]" aria-live="polite" aria-label={`What Syxoria found about ${company}`}>
        {analysis.findings.slice(0, shown).map((f) => (
          <InsightCard key={f.id} finding={f} />
        ))}
      </ol>

      {kpisShown && (
        <section aria-labelledby="kpis" className="onb-rise mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 id="kpis" className="font-label text-label uppercase text-fg-3">
              {copy.kpis}
            </h2>
            <p className="text-[12.5px] text-fg-3">{copy.kpisNote}</p>
          </div>
          <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2">
            {analysis.kpis.map((k, i) => (
              <KPIHighlight key={k.id} kpi={k} index={i} />
            ))}
          </div>
        </section>
      )}

      {all && (
        <div className="onb-rise mt-10 flex flex-col items-start gap-4" style={rise(1)}>
          <CoreButton onClick={onContinue}>Decide what Syxoria may do</CoreButton>
        </div>
      )}
    </div>
  );
}

const toneDot: Record<AnalysisFinding["tone"], string> = {
  priority: "bg-accent-strong shadow-[0_0_10px_var(--core-glow)]",
  observation: "bg-fg-2",
  opportunity: "bg-accent",
  attention: "bg-caution/80",
};

/** One conclusion: what kind, what it says, the detail, where it comes from — and its evidence when there is some */
export function InsightCard({ finding }: { finding: AnalysisFinding }) {
  const [open, setOpen] = useState(false);
  const lead = finding.tone === "priority";
  return (
    <li className="onb-rise border-b border-white/[0.07] py-6">
      <p className="flex items-center gap-2.5 font-label text-label uppercase text-fg-3">
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", toneDot[finding.tone])} />
        {copy.tones[finding.tone]}
      </p>
      <p className={cn("mt-3 font-display font-light leading-snug tracking-[-0.015em] text-fg", lead ? "text-[clamp(1.375rem,1.2rem+0.6vw,1.75rem)]" : "text-[1.1875rem]")}>{finding.title}</p>
      <p className="mt-2 max-w-[38rem] text-[14.5px] leading-relaxed text-fg-2">{finding.detail}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="text-[12.5px] text-fg-3">From {finding.basedOn}</p>
        {finding.evidence && (
          <QuietButton onClick={() => setOpen((o) => !o)} aria-expanded={open} className="text-[12.5px] no-underline">
            {open ? "Hide" : "Show"} the {finding.evidence.length} deals
            <ChevronDown className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")} aria-hidden="true" />
          </QuietButton>
        )}
      </div>
      {open && finding.evidence && (
        <ul className="onb-rise mt-4 divide-y divide-white/[0.05] rounded-lg border border-white/[0.06] bg-white/[0.015]">
          {finding.evidence.map((e) => (
            <li key={e.label} className="flex items-baseline justify-between gap-4 px-4 py-2.5 text-[13.5px]">
              <span className="text-fg">{e.label}</span>
              <span className="flex items-baseline gap-4">
                <span className="text-fg-3">{e.note}</span>
                <span className="tabular w-20 text-right text-fg-2">{e.value}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** A number the system decided to follow, with the reason it was chosen for this company */
export function KPIHighlight({ kpi, index }: { kpi: KpiSuggestion; index: number }) {
  return (
    <div className="onb-rise flex flex-col bg-canvas p-5 sm:p-6" style={rise(index)}>
      <p className="text-[13px] text-fg-2">{kpi.label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="tabular font-display text-[2.125rem] font-light leading-none tracking-[-0.03em] text-fg">{kpi.value}</p>
        {kpi.series && <Sparkline values={kpi.series} className="h-8 w-24" />}
      </div>
      <p className="mt-2 text-[12.5px] text-fg-3">{kpi.context}</p>
      <p className="mt-4 border-t border-white/[0.05] pt-3 text-[12.5px] leading-snug text-fg-3">
        <span className="text-fg-2">Why this one: </span>
        {kpi.reason}
      </p>
    </div>
  );
}
