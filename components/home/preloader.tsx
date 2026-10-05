"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The opening sequence — the Core being formed, one step at a time:
 *
 *   00 → 20%   a point of light travels along a thin curve (covers the time three.js takes to load)
 *   20 → 80%   the Core's six pieces materialise one after another (see `onProgress`),
 *              and a word marks each milestone — 20, 40, 60, 80 — and stays, so it can be read
 *   100%       a short pulse; the pieces fly together and the landing page
 *              reveals the complete Core for the first time (see `onLaunch`)
 *
 * The count moves at a steady pace, so nothing piles up at the end. The
 * overlay is transparent: the Core's canvas shows through it, over a curtain
 * the page draws (CoreExperience). Skipped for reduced motion.
 */

// 0 → 20%: the light sets off
const LINE_MS = 600;
// 20 → 100%: the Core forms, milestone after milestone
const FORM_MS = 3100;
// never hold the page for the 3D scene: past this, the sequence goes on without it
const HOLD_MAX_MS = 2400;
// the pulse at 100%, before the page takes over
const LAUNCH_MS = 850;

/** The milestones: each word arrives with its step of the Core. */
const STAGES: [number, string][] = [
  [20, "Connecting"],
  [40, "Understanding"],
  [60, "Organising"],
  [80, "Orchestrating"],
  [100, "Ready"],
];

// the progression curve, in a 1000×1000 box stretched over the screen
// (it ends just inside the screen, where the light flares at 100%)
const CURVE = "M -20 840 C 220 815, 420 735, 600 650 S 850 530, 955 490";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
// nearly linear, softened at both ends: an even pace from milestone to milestone
const steady = (t: number) => 0.8 * t + 0.2 * (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Props = {
  /** the Core's scene has compiled and can draw */
  ready: boolean;
  /** 0..1, every frame while counting */
  onProgress?: (p: number) => void;
  /** 100% reached: the pulse starts, the page can begin its reveal */
  onLaunch?: () => void;
  /** the sequence is over (instant: it was skipped) */
  onDone: (instant: boolean) => void;
};

export function Preloader({ ready, onProgress, onLaunch, onDone }: Props) {
  const [phase, setPhase] = useState<"counting" | "launch" | "gone">("counting");
  const count = useRef<HTMLSpanElement>(null);
  const words = useRef<HTMLOListElement>(null);
  const ticks = useRef<HTMLDivElement>(null);
  const curve = useRef<SVGPathElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const readyRef = useRef(ready);
  const cb = useRef({ onProgress, onLaunch, onDone });
  useEffect(() => {
    readyRef.current = ready;
    cb.current = { onProgress, onLaunch, onDone };
  });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => {
        setPhase("gone");
        cb.current.onDone(true);
      });
      return () => cancelAnimationFrame(id);
    }
    const root = document.documentElement;
    root.style.overflow = "hidden";

    const path = curve.current;
    const length = path?.getTotalLength() ?? 0;
    const wordEls = [...(words.current?.children ?? [])] as HTMLElement[];
    const tickEls = [...(ticks.current?.children ?? [])] as HTMLElement[];
    let start = 0;
    let prev = 0;
    let formStart = 0;
    let shown = 0;
    let reached = -1;
    let raf = 0;
    const timers: number[] = [];

    const draw = (p: number, pct: number) => {
      if (count.current) count.current.textContent = String(pct).padStart(2, "0");
      // milestones: the word of the current one is lit, the ones before stay, dimmed
      const stage = STAGES.findLastIndex(([at]) => pct >= at);
      if (stage !== reached) {
        reached = stage;
        wordEls.forEach((w, i) => (w.dataset.state = i < stage ? "past" : i === stage ? "on" : ""));
        tickEls.forEach((t, i) => t.toggleAttribute("data-on", i <= stage));
      }
      trail.current?.setAttribute("stroke-dashoffset", String(1 - p));
      if (path && dot.current) {
        const pt = path.getPointAtLength(length * p);
        dot.current.style.left = `${pt.x / 10}%`;
        dot.current.style.top = `${pt.y / 10}%`;
      }
    };

    const tick = (now: number) => {
      if (!start) start = prev = now;
      const t = now - start;
      const dt = Math.min(now - prev, 100);
      prev = now;
      if (!formStart && t >= LINE_MS && (readyRef.current || t >= HOLD_MAX_MS)) formStart = now;
      const goal = formStart
        ? 0.2 + 0.8 * steady(Math.min(1, (now - formStart) / FORM_MS))
        : t < LINE_MS
          ? 0.2 * easeOut(t / LINE_MS)
          : 0.2 + 0.03 * (1 - Math.exp(-(t - LINE_MS) / 700));
      // eased towards the goal, so a busy main thread never makes it jump
      shown += (goal - shown) * Math.min(1, dt / 60);
      const formed = formStart && now - formStart >= FORM_MS && shown > 0.99;
      if (formed) shown = 0.99;
      draw(shown, Math.min(99, Math.floor(shown * 100)));
      cb.current.onProgress?.(shown);
      if (!formed) {
        raf = requestAnimationFrame(tick);
        return;
      }
      // 99 → a breath → 100: the pulse, then the page takes over
      timers.push(
        window.setTimeout(() => {
          draw(1, 100);
          cb.current.onProgress?.(1);
          setPhase("launch");
          cb.current.onLaunch?.();
          timers.push(
            window.setTimeout(() => {
              root.style.overflow = "";
              cb.current.onDone(false);
            }, LAUNCH_MS),
            window.setTimeout(() => setPhase("gone"), LAUNCH_MS + 200),
          );
        }, 180),
      );
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      root.style.overflow = "";
    };
  }, []);

  if (phase === "gone") return null;
  const launching = phase === "launch";

  return (
    <div aria-hidden="true" data-phase={phase} className="preloader pointer-events-none fixed inset-0 z-(--z-overlay)">
      {/* the progression curve: faint in full, bright up to the light */}
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className={cn("absolute inset-0 size-full transition-opacity duration-500", launching && "opacity-0")}>
        <defs>
          <linearGradient id="preloader-curve" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#f5f5f2" stopOpacity="0" />
            <stop offset="0.35" stopColor="#f5f5f2" stopOpacity="0.5" />
            <stop offset="1" stopColor="#a8dcc4" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path ref={curve} d={CURVE} fill="none" stroke="#f5f5f2" strokeOpacity="0.09" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path ref={trail} d={CURVE} fill="none" stroke="url(#preloader-curve)" strokeWidth="1" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray="1 1" strokeDashoffset="1" />
      </svg>

      {/* the travelling light — at 100% it flares into a line */}
      <span ref={dot} className="absolute left-0 top-[84%] size-0">
        <span className={cn("preloader-flare absolute left-1/2 top-1/2 h-px w-[140vw]", launching && "preloader-flare--on")} />
        <span
          className={cn(
            "absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_3px_var(--core-glow),0_0_36px_10px_var(--core-glow)] transition-[transform,opacity] duration-500 ease-out-soft",
            launching && "scale-[3] opacity-0",
          )}
        />
      </span>

      <div className={cn("container-page relative flex h-full flex-col justify-between py-7 transition-opacity duration-500", launching && "opacity-0 delay-200")}>
        <p className="font-mono text-[11px] font-medium uppercase tracking-brand text-fg-2">Syxoria</p>
        <div className="flex items-end justify-between gap-8 pb-[8svh] sm:pb-[6svh]">
          {/* the milestones, as they are reached */}
          <ol ref={words} className="preloader-words grid gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.3em]">
            {STAGES.map(([at, word]) => (
              <li key={word} className="flex items-baseline gap-3">
                <span className="tabular text-fg-3">{String(at).padStart(3, "0")}</span>
                {word}
              </li>
            ))}
          </ol>
          <div className="min-w-[9rem] text-right">
            <p className="flex items-start justify-end font-display font-extralight leading-none text-fg">
              <span ref={count} className="tabular text-[clamp(2.75rem,2rem+3vw,4.5rem)] tracking-tight">
                00
              </span>
              <span className="ml-1 mt-2 text-sm text-fg-2">%</span>
            </p>
            {/* five ticks: the milestones, lighting as they are passed */}
            <div ref={ticks} className="preloader-ticks mt-4 flex justify-end gap-1.5">
              {STAGES.map(([at]) => (
                <span key={at} className="h-px w-5 bg-white/15 transition-colors duration-500" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
