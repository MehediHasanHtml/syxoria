"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flow, prefersReducedMotion } from "@/lib/motion";

/**
 * A primary action, carried out the way every one does in Syxoria: the button answers at once —
 * the Core's emerald starts running through it (`awake`, styled by "AWAKEN" in globals.css) —
 * and the action follows a beat later, while it is still filling. Repeated presses are ignored
 * until `reset` (or until the moment it belongs to is gone): `run` says whether this press counted.
 * No beat with reduced motion.
 */
export function useAwaken() {
  const [awake, setAwake] = useState(false);
  const running = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = useCallback((action: () => void) => {
    if (running.current) return false;
    running.current = true;
    setAwake(true);
    if (prefersReducedMotion()) action();
    else timer.current = window.setTimeout(action, flow.commit);
    return true;
  }, []);

  const reset = useCallback(() => {
    window.clearTimeout(timer.current);
    running.current = false;
    setAwake(false);
  }, []);

  return { awake, run, reset };
}
