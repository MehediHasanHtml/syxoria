"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Scroll progress (0..1) of a tall section while its sticky stage is pinned:
 * 0 when the section's top reaches the viewport top, 1 when its bottom reaches
 * the viewport bottom.
 *
 * Writes `--p` on the element (for CSS-driven motion) and calls `onChange`
 * (for canvas/SVG). Passive, rAF-throttled, and idle while offscreen —
 * no React state, so scrolling never re-renders the tree.
 */
export function useScrollProgress<T extends HTMLElement>(
  onChange?: (p: number) => void,
  { mode = "pinned" }: { mode?: "pinned" | "through" } = {},
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let visible = false;

    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // pinned: progress across the sticky range · through: from entering to leaving the viewport
      const p = mode === "pinned" ? -r.top / Math.max(1, r.height - vh) : (vh - r.top) / (r.height + vh);
      const clamped = Math.min(1, Math.max(0, p));
      el.style.setProperty("--p", clamped.toFixed(4));
      cb.current?.(clamped);
    };
    const onScroll = () => {
      if (visible && !raf) raf = requestAnimationFrame(measure);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) onScroll();
    });
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    measure();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [mode]);

  return ref;
}
