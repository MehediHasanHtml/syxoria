import { cn } from "@/lib/cn";

/** here: present and attentive · busy: working on something · listening: hearing the owner · held: its actions are paused */
export type PresenceState = "here" | "busy" | "listening" | "held";

/**
 * Syxoria's presence while the final Core is being designed: a point of light inside a fine
 * ring. It breathes while Syxoria is present, an arc turns around it while it works, rings open
 * out while it listens, and it turns terracotta and still when its actions are paused. One
 * component, so the approved Core can take its place. Styles: "PRESENCE" in assistant.css.
 */
export function PresenceMark({ state, vtName, className }: { state: PresenceState; vtName?: string; className?: string }) {
  return (
    <span className={cn("ar-mark", className)} data-state={state} aria-hidden="true" style={{ viewTransitionName: vtName }}>
      <svg viewBox="0 0 40 40">
        <circle className="ar-mark__ring" cx="20" cy="20" r="17" />
        <circle className="ar-mark__arc" cx="20" cy="20" r="17" pathLength={100} />
        <circle className="ar-mark__dot" cx="20" cy="20" r="3.2" />
      </svg>
    </span>
  );
}
