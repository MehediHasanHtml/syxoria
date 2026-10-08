"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { AutonomyLevel, AutonomyPolicy } from "@/types";

const hint: Record<AutonomyLevel, string> = {
  guided: "Prepares — you approve",
  assisted: "Handles the routine",
  autonomous: "Acts within your mandate",
};

/** What a level lets Syxoria do: of the actions it could take, how many it takes on its own */
export type LevelReach = { auto: number; total: number; boundary: number };

/**
 * Guided → Assisted → Autonomous, as one track rather than three pricing cards. Each level shows
 * what it means rather than a colour: the Core's emerald fills the track as far as the autonomy
 * given; under each level, its reach — the actions it takes on its own, out of all it could
 * take, and the boundary no level crosses (those always ask you). The chosen level's light is
 * stronger the more it may do, and Autonomous draws its boundary around it: it acts within the
 * mandate, never beyond. Native radios — arrows move between levels. Styles: "Mandate".
 */
export function AutonomySelector({
  policy,
  level,
  reach,
  onChange,
}: {
  policy: AutonomyPolicy;
  level: AutonomyLevel;
  reach: Record<AutonomyLevel, LevelReach>;
  onChange: (l: AutonomyLevel) => void;
}) {
  const index = policy.levels.findIndex((l) => l.id === level);
  return (
    <fieldset className="onb-autonomy" style={{ "--at": index } as CSSProperties} data-level={level}>
      <legend className="sr-only">How much Syxoria may do on its own</legend>
      <div className="relative">
        <span aria-hidden="true" className="onb-autonomy__track" />
        <span aria-hidden="true" className="onb-autonomy__fill" />
        <div className="relative grid grid-cols-3">
          {policy.levels.map((l, i) => {
            const on = l.id === level;
            const r = reach[l.id];
            const align = i === 0 ? "items-start text-left" : i === 2 ? "items-end text-right" : "items-center text-center";
            return (
              <label key={l.id} data-level={l.id} className={cn("onb-autonomy__stop group relative flex cursor-pointer flex-col", on && "onb-autonomy__stop--on", align)}>
                <input type="radio" name="autonomy-level" value={l.id} checked={on} onChange={() => onChange(l.id)} className="peer sr-only" />
                <span aria-hidden="true" className={cn("onb-autonomy__knob", on && "onb-autonomy__knob--on", i < index && "onb-autonomy__knob--passed")}>
                  {l.id === "autonomous" && <span className="onb-autonomy__boundary" />}
                </span>
                <span className={cn("onb-autonomy__name mt-3.5 font-display font-light leading-none tracking-[-0.01em] transition-colors duration-300", on ? "text-fg" : "text-fg-2 group-hover:text-fg")}>
                  {l.name}
                </span>
                <span className="mt-1.5 text-[12.5px] text-fg-3">
                  {hint[l.id]}
                  {l.id === policy.recommended && <span className="text-accent-strong"> · Recommended</span>}
                </span>
                {/* its reach: what it takes on itself, out of everything it could — up to the boundary */}
                <span aria-hidden="true" className="onb-reach mt-2.5">
                  {Array.from({ length: r.total }, (_, k) => (
                    <span key={k} className={cn("onb-reach__seg", k < r.auto && "onb-reach__seg--auto", k >= r.boundary && "onb-reach__seg--held")} style={{ "--k": k } as CSSProperties} />
                  ))}
                </span>
                <span className="sr-only">
                  Does {r.auto} of {r.total} actions on its own; {r.total - r.boundary} always ask you first.
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
