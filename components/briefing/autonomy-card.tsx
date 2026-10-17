"use client";

import type { ReactNode } from "react";
import { useAutomationIfAny } from "@/components/dashboard/automation/automation-provider";
import { ModeGlyph } from "@/components/onboarding/mandate-ring";
import { automation as words, holdTime } from "@/content/automation";
import { dailyBriefing as copy } from "@/content/briefing";
import { globalHold } from "@/lib/automation";
import type { BriefingAutonomy } from "@/types";

/**
 * The mandate the briefing's actions are taken under: what Syxoria may do on its own, and what
 * still waits for the owner whatever the mode. Each action still says, on its own line, whether it
 * needs approval: the mode is permission, never proof that something was done. In the workspace,
 * while autonomous actions are suspended, it says so instead of the mode's promise. At the end of
 * the onboarding it also holds the way in.
 */
export function AutonomyCard({ autonomy, children }: { autonomy: BriefingAutonomy; children?: ReactNode }) {
  const automation = useAutomationIfAny();
  const held = automation ? globalHold(automation.state) : null;
  return (
    <section aria-label={copy.autonomy.title} className="bd-autonomy" data-held={held ? "" : undefined}>
      <p className="bd-label">{copy.autonomy.title}</p>
      <div className="bd-autonomy__mode">
        <ModeGlyph share={autonomy.share} className="bd-autonomy__glyph" />
        <div className="min-w-0">
          <p className="bd-autonomy__name">
            {autonomy.name}
            {held && <span className="bd-autonomy__held">{words.status.suspended}</span>}
          </p>
          <p className="bd-autonomy__promise">{held ? `${words.since(holdTime(held.since), held.by === "safety")}. ${words.banner.body}` : autonomy.promise}</p>
        </div>
      </div>
      <p className="bd-autonomy__limit">{autonomy.limit}</p>
      {children && <div className="bd-autonomy__cta">{children}</div>}
    </section>
  );
}
