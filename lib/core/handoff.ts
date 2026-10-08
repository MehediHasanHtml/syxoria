"use client";

import { useLayoutEffect, type RefObject } from "react";
import { flow, prefersReducedMotion } from "@/lib/motion";

/*
 * The Core crossing from one page to the next. The landing page's "Start free" holds a small
 * Core; when it is pressed, where that Core stood is handed over, and the onboarding's Core
 * arrives from exactly there — the same object, travelling — rather than a second one appearing.
 */

const KEY = "syx-core-handoff";
/** A handover older than this is stale (the navigation took too long, or never happened) */
const FRESH = 6000;

type Handoff = { x: number; y: number; w: number; t: number };

/** Remember where the Core is on screen, just before leaving the page */
export function handOffCore(el: Element | null) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const h: Handoff = { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, t: Date.now() };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(h));
  } catch {
    // storage unavailable: the Core simply appears in place
  }
}

/** Make this Core arrive from where the last page handed it over (once; nothing if it wasn't) */
export function useCoreArrival(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    let from: Handoff | null = null;
    try {
      from = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as Handoff | null;
      sessionStorage.removeItem(KEY);
    } catch {
      return;
    }
    const el = ref.current;
    if (!el || !from || Date.now() - from.t > FRESH || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const dx = from.x - (r.left + r.width / 2);
    const dy = from.y - (r.top + r.height / 2);
    // fully visible all the way (it is the same Core, not a new one fading in)
    const anim = el.animate(
      [
        { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${from.w / r.width})`, opacity: 1 },
        { transform: "none", opacity: 1 },
      ],
      { duration: flow.arrive, easing: "cubic-bezier(0.65, 0, 0.2, 1)" },
    );
    return () => anim.cancel();
  }, [ref]);
}
