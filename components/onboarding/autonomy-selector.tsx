"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { AutonomyLevel, AutonomyPolicy } from "@/types";

const hint: Record<AutonomyLevel, string> = {
  guided: "Prepares — you approve",
  assisted: "Handles the routine",
  autonomous: "Acts within your mandate",
};

/**
 * Guided → Assisted → Autonomous, as one track rather than three pricing cards: the Core's emerald
 * fills the track as far as the autonomy given. Native radios — arrows move between levels.
 */
export function AutonomySelector({ policy, level, onChange }: { policy: AutonomyPolicy; level: AutonomyLevel; onChange: (l: AutonomyLevel) => void }) {
  const index = policy.levels.findIndex((l) => l.id === level);
  return (
    <fieldset className="onb-autonomy" style={{ "--at": index } as CSSProperties}>
      <legend className="sr-only">How much Syxoria may do on its own</legend>
      <div className="relative">
        <span aria-hidden="true" className="onb-autonomy__track" />
        <span aria-hidden="true" className="onb-autonomy__fill" />
        <div className="relative grid grid-cols-3">
          {policy.levels.map((l, i) => {
            const on = l.id === level;
            return (
              <label key={l.id} className={cn("onb-autonomy__stop group relative flex cursor-pointer flex-col", i === 0 ? "items-start text-left" : i === 2 ? "items-end text-right" : "items-center text-center")}>
                <input type="radio" name="autonomy-level" value={l.id} checked={on} onChange={() => onChange(l.id)} className="peer sr-only" />
                <span aria-hidden="true" className={cn("onb-autonomy__knob", on && "onb-autonomy__knob--on", i < index && "onb-autonomy__knob--passed")} />
                <span className={cn("mt-4 text-[15.5px] transition-colors duration-300", on ? "text-fg" : "text-fg-2 group-hover:text-fg")}>{l.name}</span>
                <span className="mt-0.5 text-[12.5px] text-fg-3">
                  {hint[l.id]}
                  {l.id === policy.recommended && <span className="text-accent-strong"> · Recommended</span>}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
