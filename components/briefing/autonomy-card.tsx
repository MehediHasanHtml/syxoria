import type { ReactNode } from "react";
import { ModeGlyph } from "@/components/onboarding/mandate-ring";
import { dailyBriefing as copy } from "@/content/briefing";
import type { BriefingAutonomy } from "@/types";

/**
 * The mandate the briefing's actions are taken under: what Syxoria may do on its own, and what
 * still waits for the owner whatever the mode. Each action still says, on its own line, whether it
 * needs approval: the mode is permission, never proof that something was done. At the end of the
 * onboarding it also holds the way in.
 */
export function AutonomyCard({ autonomy, children }: { autonomy: BriefingAutonomy; children?: ReactNode }) {
  return (
    <section aria-label={copy.autonomy.title} className="bd-autonomy">
      <p className="bd-label">{copy.autonomy.title}</p>
      <div className="bd-autonomy__mode">
        <ModeGlyph share={autonomy.share} className="bd-autonomy__glyph" />
        <div className="min-w-0">
          <p className="bd-autonomy__name">{autonomy.name}</p>
          <p className="bd-autonomy__promise">{autonomy.promise}</p>
        </div>
      </div>
      <p className="bd-autonomy__limit">{autonomy.limit}</p>
      {children && <div className="bd-autonomy__cta">{children}</div>}
    </section>
  );
}
