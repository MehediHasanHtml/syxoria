import { flushSync } from "react-dom";

/**
 * Moves from one moment to the next as one continuous change: where the browser supports View
 * Transitions, the old and new states morph — the Core, the memory, the conversation are shared
 * elements ("ONBOARDING" in globals.css); elsewhere the new moment simply rises in.
 */
export function transition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
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
  const vt = doc.startViewTransition(() => flushSync(go));
  // a transition can be skipped (the tab hidden, another one starting): the update still happens,
  // only the animation is lost — nothing to report
  vt.ready.catch(() => {});
  vt.finished.catch(() => {}).finally(() => delete root.dataset.vt);
}
