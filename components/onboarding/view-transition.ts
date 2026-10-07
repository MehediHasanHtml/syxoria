import { flushSync } from "react-dom";

/**
 * Moves from one moment to the next as one continuous change: where the browser supports View
 * Transitions, the old and new states morph — the Core, the memory, the conversation are shared
 * elements ("ONBOARDING" in globals.css); elsewhere the new moment simply rises in.
 */
export function transition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const go = () => {
    update();
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  if (!doc.startViewTransition || reduced) {
    go();
    return;
  }
  const root = document.documentElement;
  root.dataset.vt = "onboarding";
  doc.startViewTransition(() => flushSync(go)).finished.finally(() => delete root.dataset.vt);
}
