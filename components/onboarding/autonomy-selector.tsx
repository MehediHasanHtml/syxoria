"use client";

import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { autonomy as copy } from "@/content/onboarding";
import type { CoreState } from "@/lib/core/core-states";
import { cn } from "@/lib/cn";
import type { AutonomyLevel, AutonomyPolicy } from "@/types";

/**
 * Each mode, as one recognisable identity: the Core itself, at the level of activity the mode
 * gives it, and the one thing the mode means for you.
 *
 *   Guided      half lit, at rest — it prepares, you decide
 *   Assisted    fully lit, steady — the routine is handled
 *   Autonomous  fully lit, its light moving — it acts, inside a boundary drawn around it
 */
const coreOf: Record<AutonomyLevel, CoreState> = { guided: "initializing", assisted: "active", autonomous: "executing" };

/**
 * Guided · Assisted · Autonomous — three distinct choices rather than one bar that gets greener.
 * Native radios (arrows move between them); styles: "Mandate" in globals.css.
 */
export function AutonomySelector({ policy, level, onChange }: { policy: AutonomyPolicy; level: AutonomyLevel; onChange: (l: AutonomyLevel) => void }) {
  return (
    <fieldset className="onb-modes grid gap-2 sm:grid-cols-3 sm:gap-3">
      <legend className="sr-only">How much Syxoria may do on its own</legend>
      {policy.levels.map((l) => {
        const on = l.id === level;
        return (
          <label key={l.id} data-level={l.id} className={cn("onb-mode group", on && "onb-mode--on")}>
            <input type="radio" name="autonomy-level" value={l.id} checked={on} onChange={() => onChange(l.id)} className="sr-only" />
            <span aria-hidden="true" className="onb-mode__emblem">
              <SyxoriaCore state={coreOf[l.id]} detail="mark" intensity={on ? 1 : 0.55} className="size-full" />
              {l.id === "autonomous" && <span className="onb-mode__boundary" />}
            </span>
            <span className="min-w-0">
              <span className="flex items-baseline gap-2">
                <span className="onb-mode__name font-display font-light leading-none tracking-[-0.01em]">{l.name}</span>
                {l.id === policy.recommended && <span className="text-[11.5px] text-accent-strong">Recommended</span>}
              </span>
              <span className="onb-mode__promise mt-1.5 block text-[13px] leading-snug">{copy.promises[l.id]}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
