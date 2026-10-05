"use client";

import { useSyncExternalStore } from "react";
import { NAV_SECTIONS } from "./chapters";

/**
 * The homepage section being viewed — shared by every navigation (the header,
 * the numbered rail), so they always agree. One scroll listener, checked once
 * per frame at most, and only while something is listening.
 */
let current: string | null = null;
let raf = 0;
const listeners = new Set<() => void>();

function check() {
  raf = 0;
  let next: string | null = null;
  NAV_SECTIONS.forEach((s, i) => {
    const el = document.querySelector(`[data-nav-start="${s.id}"]`);
    if (!el) return;
    // a section is current once the scroll reaches where it begins; the story opens on its first one
    if (i === 0 || el.getBoundingClientRect().top <= 2) next = s.id;
  });
  if (next === current) return;
  current = next;
  listeners.forEach((fn) => fn());
}

const schedule = () => {
  if (!raf) raf = requestAnimationFrame(check);
};

function subscribe(fn: () => void) {
  listeners.add(fn);
  if (listeners.size === 1) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }
  // every new listener re-checks: the sections may have just appeared (e.g. navigating to the homepage)
  schedule();
  return () => {
    listeners.delete(fn);
    if (listeners.size) return;
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    cancelAnimationFrame(raf);
    raf = 0;
  };
}

/** The id of the section being viewed (see NAV_SECTIONS), or null where there is none (other pages, the server). */
export function useActiveSection(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}
