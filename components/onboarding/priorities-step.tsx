"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { analysis as copy } from "@/content/onboarding";
import type { InitialAnalysis } from "@/types";
import { OnbButton } from "./onboarding-button";
import { PriorityGraph } from "./priority-graph";
import { PriorityInsight } from "./priority-insight";
import { rise, StageHeading } from "./primitives";

const PANEL = "priority-panel";

/**
 * "What deserves your attention." Not a KPI dashboard: Syxoria names the priorities it identified
 * (one after another, as if just concluded), and choosing one plays out its evidence — the graph
 * draws that priority's own twelve months, its figures arrive as the curve reaches them, then what
 * Syxoria concluded. Everything shown comes from the one selected priority (lib/mock-data →
 * services/onboarding), so a graph never stands beside another priority's figures. Switching again
 * mid-way simply starts the new one: every step is a CSS animation keyed to the selection.
 */
export function PrioritiesStep({ analysis, onContinue }: { analysis: InitialAnalysis; onContinue: () => void }) {
  const { priorities } = analysis;
  const [shown, setShown] = useState(0);
  const [selected, setSelected] = useState(0);
  const priority = priorities[selected];

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = priorities.map((_, i) => setTimeout(() => setShown(i + 1), still ? 0 : 350 + i * 550));
    return () => timers.forEach(clearTimeout);
  }, [priorities]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    const edge = e.key === "Home" ? 0 : e.key === "End" ? shown - 1 : null;
    if (!step && edge === null) return;
    e.preventDefault();
    const next = edge ?? (selected + step + shown) % shown;
    setSelected(next);
    (e.currentTarget.parentElement?.querySelectorAll<HTMLElement>("[role=tab]")[next])?.focus();
  };

  return (
    <div className="w-full">
      <StageHeading lead={copy.title.lead} accent={copy.title.accent}>
        {copy.intro}
      </StageHeading>

      <div className="mt-7 grid items-start gap-8 tight:mt-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-12">
        <div role="tablist" aria-orientation="vertical" aria-label="Priorities Syxoria identified" className="onb-priorities grid gap-1">
          {priorities.slice(0, shown).map((p, i) => (
            <PriorityInsight key={p.id} priority={p} rank={i + 1} of={priorities.length} selected={i === selected} onSelect={() => setSelected(i)} onKey={onKey} panelId={PANEL} />
          ))}
        </div>

        <div id={PANEL} role="tabpanel" aria-labelledby={`priority-${priority.id}-tab`} className="onb-rise onb-graph-panel rounded-xl p-5 sm:p-6" style={rise(2)}>
          <PriorityGraph priority={priority} />
        </div>
      </div>

      <div className="mt-7 flex min-h-[2.875rem] flex-wrap items-center gap-x-6 gap-y-3 tight:mt-5">
        {shown >= priorities.length && (
          <OnbButton onAdvance={onContinue} className="onb-rise">
            Decide what Syxoria may do
          </OnbButton>
        )}
      </div>
    </div>
  );
}
