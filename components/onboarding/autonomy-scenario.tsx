import { autonomy as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import type { AutonomyPolicy } from "@/types";
import { rise } from "./primitives";

/**
 * What a level means, shown rather than described: one real situation, played out under the
 * chosen level. Syxoria's steps carry the emerald; then the boundary — always there, whatever
 * the level — where the decision comes back to the user. Autonomous ≠ no control.
 */
export function AutonomyScenario({ subject, level }: { subject: string; level: AutonomyPolicy["levels"][number] }) {
  const steps = level.scenario;
  const mine = steps.filter((s) => s.by === "syxoria").length;
  return (
    <section aria-label={`Example under ${level.name}`} className="onb-scenario">
      <p className="text-[12.5px] text-fg-3">
        <span className="font-label uppercase tracking-(--label-tracking) text-[0.6875rem]">Example</span>
        <span className="mx-2 text-fg-3/60">—</span>
        {subject}
      </p>
      <ol key={level.id} className="onb-scenario__steps mt-4 grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => {
          const you = s.by === "you";
          return (
            <li key={s.id} className={cn("onb-scenario__step relative pr-4", you && "onb-scenario__step--you")} style={rise(i)} data-boundary={i === mine || undefined}>
              <span aria-hidden="true" className="onb-scenario__rail" />
              <span aria-hidden="true" className="onb-scenario__node" />
              {i === mine && (
                <span className="onb-scenario__boundary" aria-hidden="true">
                  {copy.boundary}
                </span>
              )}
              <span className="mt-4 block font-label text-[0.625rem] uppercase tracking-(--label-tracking) text-fg-3">{you ? "You" : "Syxoria"}</span>
              <span className={cn("mt-1 block text-[13px] leading-snug", you ? "text-fg" : "text-fg-2")}>{s.label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
