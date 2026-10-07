"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { analysis as copy } from "@/content/onboarding";
import type { InitialAnalysis } from "@/types";
import { OnbButton } from "./onboarding-button";
import { PriorityGraph } from "./priority-graph";
import { PriorityInsight } from "./priority-insight";
import { rise, StageHeading } from "./primitives";

/**
 * "What deserves your attention." Not a KPI dashboard: Syxoria names the priorities it identified
 * (one after another, as if just concluded), and the data explains why — the graph, centre stage,
 * follows whichever priority is selected or hovered. Nothing to configure.
 */
export function PrioritiesStep({ analysis, onContinue }: { analysis: InitialAnalysis; onContinue: () => void }) {
  const { priorities } = analysis;
  const [shown, setShown] = useState(0);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = priorities.map((_, i) => setTimeout(() => setShown(i + 1), still ? 0 : 350 + i * 550));
    return () => timers.forEach(clearTimeout);
  }, [priorities]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (selected + step + shown) % shown;
    setSelected(next);
    (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  };

  return (
    <div className="w-full">
      <StageHeading lead={copy.title.lead} accent={copy.title.accent}>
        {copy.intro}
      </StageHeading>

      <div className="mt-7 grid items-start gap-8 tight:mt-5 lg:grid-cols-[minmax(0,19.5rem)_minmax(0,1fr)] lg:gap-10">
        <div role="tablist" aria-orientation="vertical" aria-label="Priorities Syxoria identified" className="border-t border-white/[0.07]">
          {priorities.slice(0, shown).map((p, i) => (
            <PriorityInsight key={p.id} priority={p} rank={i + 1} selected={i === selected} onSelect={() => setSelected(i)} onKey={onKey} graphId="priority-graph" />
          ))}
        </div>

        <div role="tabpanel" aria-live="polite" className="onb-rise onb-graph-panel rounded-xl border border-white/[0.06] p-5 sm:p-6" style={rise(2)}>
          <PriorityGraph id="priority-graph" priority={priorities[selected]} />
        </div>
      </div>

      <div className="mt-7 flex min-h-[2.875rem] flex-wrap items-center gap-x-6 gap-y-3 tight:mt-5">
        {shown >= priorities.length && (
          <OnbButton onClick={onContinue} className="onb-rise">
            Decide what Syxoria may do
          </OnbButton>
        )}
      </div>
    </div>
  );
}
