"use client";

import { useCallback, useRef, useSyncExternalStore, type FocusEvent, type MouseEvent, type PointerEvent } from "react";

/**
 * Hover-to-discover with touch and keyboard equivalents, shared by the Core's
 * branches and the module list:
 *
 *   mouse     hover → explore · leave → returns · click → open details
 *   touch     first tap → explore · second tap → open details
 *   keyboard  focus → explore · Enter → open details
 *
 * Returns a function giving the props for item `i`.
 */
export function useExplore(focus: number | null, setFocus: (i: number | null) => void, open: (i: number) => void) {
  const leaveTimer = useRef(0);
  const lastPointer = useRef("");
  const keyboardFocused = useRef<number | null>(null);

  return useCallback(
    (i: number) => ({
      "data-explore": "",
      onPointerDown: (e: PointerEvent) => {
        lastPointer.current = e.pointerType;
      },
      onPointerEnter: (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        window.clearTimeout(leaveTimer.current);
        setFocus(i);
      },
      onPointerLeave: (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        // a short grace period lets the cursor travel from a branch to its name without flicker
        leaveTimer.current = window.setTimeout(() => setFocus(null), 160);
      },
      onFocus: (e: FocusEvent<HTMLElement>) => {
        if (!e.currentTarget.matches(":focus-visible")) return;
        keyboardFocused.current = i;
        window.clearTimeout(leaveTimer.current);
        setFocus(i);
      },
      onBlur: (e: FocusEvent<HTMLElement>) => {
        if (keyboardFocused.current !== i) return;
        keyboardFocused.current = null;
        if (!(e.relatedTarget as HTMLElement | null)?.closest?.("[data-explore]")) setFocus(null);
      },
      onClick: (e: MouseEvent) => {
        // keyboard activation reports detail 0
        const touch = e.detail > 0 && (lastPointer.current === "touch" || lastPointer.current === "pen");
        if (touch && focus !== i) setFocus(i);
        else open(i);
      },
    }),
    [focus, setFocus, open],
  );
}

export type Explore = ReturnType<typeof useExplore>;

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

/** True on devices with a real hover (mouse, trackpad). SSR-safe (defaults to true). */
export function useCanHover() {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(HOVER_QUERY);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(HOVER_QUERY).matches,
    () => true,
  );
}
