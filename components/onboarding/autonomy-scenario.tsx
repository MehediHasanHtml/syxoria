import { autonomy as copy } from "@/content/onboarding";
import type { AutonomyPolicy } from "@/types";
import { rise } from "./primitives";

/**
 * What a mode means, shown rather than described: one real situation, played out under it, in the
 * same marks as the list beside it. Syxoria's steps carry the emerald; then the boundary — always
 * there, whatever the mode — where the decision comes back to the user. Autonomous ≠ no control.
 * Styles: "Mandate" in globals.css.
 */
export function AutonomyScenario({ subject, level }: { subject: string; level: AutonomyPolicy["levels"][number] }) {
  const steps = level.scenario;
  const mine = steps.findIndex((s) => s.by === "you");
  return (
    <section aria-label={`Example under ${level.name}`} className="onb-scenario">
      <p className="onb-scenario__head font-label text-label uppercase">{copy.example}</p>
      <p className="onb-scenario__subject">{subject}</p>
      <ol className="onb-scenario__steps">
        {steps.map((s, i) => (
          <li key={s.id} className="onb-scenario__step" data-by={s.by} data-boundary={i === mine || undefined} style={rise(i)}>
            {i === mine && (
              <span className="onb-scenario__boundary" aria-hidden="true">
                <span className="onb-boundary__name">{copy.boundary}</span>
                <span className="onb-boundary__line" />
              </span>
            )}
            <span aria-hidden="true" className="onb-mark" data-mode={s.by === "you" ? "ask" : "auto"} />
            <span>
              <span className="sr-only">{s.by === "you" ? "You: " : "Syxoria: "}</span>
              {s.label}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
