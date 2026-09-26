"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

const INTRO_GROW = 0.42; // state reached on its own after the intro
const SCROLL_RANGE = 0.75; // fraction of viewport height to reach full growth

/**
 * Drives the hero tree:
 *  - `--grow` from scroll position (rAF-throttled, passive, only while visible)
 *  - `--px/--py` pointer parallax on fine pointers
 * Writes CSS variables directly to avoid React re-renders on scroll.
 */
export function HeroTreeStage({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    let base = 0.12;
    let raf = 0;
    let visible = true;

    const apply = () => {
      raf = 0;
      const scroll = Math.min(1, window.scrollY / (window.innerHeight * SCROLL_RANGE));
      const grow = Math.max(base, base + (1 - base) * scroll);
      el.style.setProperty("--grow", grow.toFixed(3));
    };
    const schedule = () => {
      if (visible && !raf) raf = requestAnimationFrame(apply);
    };

    const introTimer = window.setTimeout(() => {
      base = INTRO_GROW;
      schedule();
    }, 2600);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      // Pause every loop while offscreen — zero cost when not visible.
      if (visible) {
        delete el.dataset.paused;
        schedule();
      } else {
        el.dataset.paused = "";
      }
    });
    io.observe(el);
    window.addEventListener("scroll", schedule, { passive: true });

    // Pointer parallax (desktop only)
    const fine = window.matchMedia("(pointer: fine)").matches;
    let praf = 0;
    const onPointer = (e: PointerEvent) => {
      if (praf) return;
      praf = requestAnimationFrame(() => {
        praf = 0;
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty("--px", x.toFixed(3));
        el.style.setProperty("--py", y.toFixed(3));
      });
    };
    if (fine) window.addEventListener("pointermove", onPointer, { passive: true });

    schedule();
    return () => {
      window.clearTimeout(introTimer);
      io.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("pointermove", onPointer);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(praf);
    };
  }, [reduced]);

  return (
    <div ref={ref} className={cn("gt relative", className)}>
      <div
        className="transition-transform duration-700 ease-out-soft will-change-transform"
        style={{ transform: "translate3d(calc(var(--px, 0) * -14px), calc(var(--py, 0) * -10px), 0)" }}
      >
        {children}
      </div>
    </div>
  );
}
