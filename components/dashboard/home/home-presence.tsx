"use client";

import type { ReactNode } from "react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { useAutomation } from "@/components/dashboard/automation/automation-provider";
import { automation as words } from "@/content/automation";
import { overview as copy } from "@/content/overview";
import { globalHold, heldActions } from "@/lib/automation";

/**
 * Syxoria on the home: the same Core as the onboarding's, on stage here (the top bar keeps only a
 * point of light), and in two lines what it is doing right now: its mode, and what starts next on
 * its own, or, while autonomous actions are suspended, that it only observes and prepares. Its
 * look follows: lit and at work, or its light held low. The way into the briefing goes under it.
 */
export function HomePresence({ children }: { children?: ReactNode }) {
  const { ctx, state, requestResume } = useAutomation();
  const all = globalHold(state);
  const targeted = state.holds.filter((h) => h.scope !== "global").length;
  const { held, running } = heldActions(state, ctx);
  const word = all ? words.status.suspended : targeted ? words.status.partly(targeted) : words.status.running;

  return (
    <div className="hm-presence" data-held={all ? "all" : targeted ? "some" : undefined}>
      <SyxoriaCore state={all ? "paused" : "active"} label="Syxoria" className="hm-presence__core" />
      <div className="hm-presence__text">
        <p className="hm-presence__state">
          <span className="hm-presence__word">{word}</span>
          <span className="hm-presence__mode">{copy.presence.mode(ctx.levelName)}</span>
        </p>
        <p className="hm-presence__line">
          {all ? copy.presence.suspended : targeted ? copy.presence.partly : copy.presence.running}
          {all && held.length > 0 && <> {copy.presence.held(held.length)}.</>}
        </p>
        {all ? (
          <button type="button" className="hm-presence__resume" onClick={() => requestResume(all)}>
            {copy.presence.resume}
          </button>
        ) : (
          running[0] && <p className="hm-presence__next">{copy.presence.next(running[0].name)}</p>
        )}
        {children && <div className="hm-presence__cta">{children}</div>}
      </div>
    </div>
  );
}
