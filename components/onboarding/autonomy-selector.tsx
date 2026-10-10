"use client";

import { cn } from "@/lib/cn";
import { reachOfLevel } from "@/lib/onboarding/mandate";
import type { AutonomyLevel, AutonomyPolicy } from "@/types";
import { ModeGlyph } from "./mandate-ring";

/**
 * Guided · Assisted · Autonomous — the way between the three modes, kept to one quiet line: a name
 * and its mark (how much of the ring that mode lights). One mode is looked at at a time; this only
 * says which, and what else there is. Native radios, so the arrow keys move between them.
 * Styles: "Mandate" in globals.css.
 */
export function AutonomySelector({ policy, level, onChange }: { policy: AutonomyPolicy; level: AutonomyLevel; onChange: (l: AutonomyLevel) => void }) {
  return (
    <fieldset className="onb-modes">
      <legend className="sr-only">How much Syxoria may do on its own</legend>
      {policy.levels.map((l) => {
        const on = l.id === level;
        const reach = reachOfLevel(policy, l.id);
        return (
          <label key={l.id} data-level={l.id} className={cn("onb-modes__item", on && "onb-modes__item--on")}>
            <input type="radio" name="autonomy-level" value={l.id} checked={on} onChange={() => onChange(l.id)} className="sr-only" />
            <ModeGlyph share={reach.auto / reach.total} />
            <span className="onb-modes__name">{l.name}</span>
            {l.id === policy.recommended && <span className="onb-modes__tag">Recommended</span>}
          </label>
        );
      })}
    </fieldset>
  );
}
