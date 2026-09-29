"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

// Kept short: the curtain hides the page, so every extra moment costs perceived speed.
const MIN_MS = 800;
// Never hold the page for the 3D scene: past this, the curtain lifts and the Core fades in when ready.
const MAX_MS = 1500;

/**
 * Opening curtain: a counter from 000 to 100 that only completes once the
 * Core is actually ready to draw, then lifts. Runs on every page load;
 * skipped entirely for reduced motion.
 */
export function Preloader({ ready, onDone }: { ready: boolean; onDone: (instant: boolean) => void }) {
  const [phase, setPhase] = useState<"counting" | "leaving" | "gone">("counting");
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const readyRef = useRef(ready);
  const done = useRef(onDone);
  useEffect(() => {
    readyRef.current = ready;
    done.current = onDone;
  });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const id = requestAnimationFrame(() => {
        setPhase("gone");
        done.current(true);
      });
      return () => cancelAnimationFrame(id);
    }
    const root = document.documentElement;
    root.style.overflow = "hidden";

    let start = 0;
    let prev = 0;
    let shown = 0;
    let raf = 0;
    let timer = 0;
    const tick = (now: number) => {
      if (!start) start = prev = now;
      const t = now - start;
      const dt = Math.min(now - prev, 100);
      prev = now;
      // Time drives the count to 90; while the scene is still loading it keeps
      // creeping toward 99 (never frozen); once ready it runs out to 100.
      const done100 = readyRef.current || t > MAX_MS;
      const timed = Math.min(1, t / MIN_MS) ** 0.75 * 90;
      const creep = t > MIN_MS ? 9 * (1 - Math.exp(-(t - MIN_MS) / 1200)) : 0;
      const goal = done100 && t >= MIN_MS ? 100 : timed + creep;
      // eased, but never faster than ~140/s, so a busy main thread cannot make it jump
      shown = Math.min(goal, shown + Math.min(Math.max((goal - shown) * 0.2, 0.02 * dt), 0.2 * dt));
      if (goal === 100 && shown > 99.6) shown = 100;
      if (count.current) count.current.textContent = String(Math.floor(shown)).padStart(3, "0");
      if (bar.current) bar.current.style.transform = `scaleX(${shown / 100})`;
      if (shown >= 100) {
        timer = window.setTimeout(() => {
          setPhase("leaving");
          root.style.overflow = "";
          done.current(false);
          timer = window.setTimeout(() => setPhase("gone"), 700);
        }, 60);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      root.style.overflow = "";
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "preloader fixed inset-0 z-(--z-overlay) bg-canvas transition-[opacity,filter] duration-700 ease-out-soft",
        phase === "leaving" && "pointer-events-none opacity-0 blur-sm",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_58%,rgb(255_150_70/0.07),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,rgb(245_245_242/0.05),transparent_60%)]" />
      <div className="container-page relative flex h-full flex-col justify-between py-7">
        <p className="text-[11px] font-medium uppercase tracking-brand text-fg-2">Syxoria</p>
        <div className="flex items-end justify-between gap-6">
          <div className="mb-3 w-40 sm:w-56">
            <p className="text-[10px] uppercase tracking-[0.3em] text-fg-3">Awakening the core</p>
            <span className="mt-3 block h-px overflow-hidden bg-line">
              <span ref={bar} className="block h-full origin-left scale-x-0 bg-fg-2" />
            </span>
          </div>
          <span ref={count} className="tabular font-display text-[clamp(4.5rem,3rem+9vw,11rem)] font-extralight leading-none tracking-tight text-fg">
            000
          </span>
        </div>
      </div>
    </div>
  );
}
