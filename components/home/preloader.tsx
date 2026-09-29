"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The opening sequence — the Core being formed, never shown whole:
 *
 *   00 → 20%   a point of light travels along a thin curve (no WebGL needed yet)
 *   20 → 99%   shards of the real Core materialise one by one, apart (see `onProgress`)
 *   100%       a short pulse; the shards fly together and the landing page
 *              reveals the complete Core for the first time (see `onLaunch`)
 *
 * The overlay is transparent: the Core's canvas shows through it, over a
 * curtain the page draws (CoreExperience). Skipped for reduced motion.
 */

// 0 → 20%: the light sets off (covers the time three.js takes to load)
const LINE_MS = 650;
// 20 → 99%: the shards form
const FORM_MS = 1500;
// never hold the page for the 3D scene: past this, the sequence goes on without it
const HOLD_MAX_MS = 2400;
// the pulse at 100%, before the page takes over
const LAUNCH_MS = 900;

const STAGES: [number, string][] = [
  [0, "Initialising"],
  [12, "Connecting"],
  [28, "Analysing"],
  [46, "Synchronising"],
  [67, "Optimising"],
  [89, "Finalising"],
  [99, "Ready"],
  [100, "Launching"],
];

// the progression curve, in a 1000×1000 box stretched over the screen
// (it ends just inside the screen, where the light flares at 100%)
const CURVE = "M -20 840 C 220 815, 420 735, 600 650 S 850 530, 955 490";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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
  const label = useRef<HTMLSpanElement>(null);
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
    let start = 0;
    let prev = 0;
    let formStart = 0;
    let shown = 0;
    let raf = 0;
    const timers: number[] = [];

    const draw = (p: number, pct: number) => {
      if (count.current) count.current.textContent = String(pct).padStart(2, "0");
      const stage = STAGES.findLast(([at]) => pct >= at)?.[1] ?? "";
      if (label.current && label.current.textContent !== stage) label.current.textContent = stage;
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
        ? 0.2 + 0.79 * easeInOut(Math.min(1, (now - formStart) / FORM_MS))
        : t < LINE_MS
          ? 0.2 * easeOut(t / LINE_MS)
          : 0.2 + 0.05 * (1 - Math.exp(-(t - LINE_MS) / 700));
      // eased towards the goal, so a busy main thread never makes it jump
      shown += (goal - shown) * Math.min(1, dt / 70);
      const formed = formStart && now - formStart >= FORM_MS && shown > 0.985;
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
        }, 220),
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
            <stop offset="1" stopColor="#ffd9b0" stopOpacity="0.9" />
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
            "absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_3px_rgb(255_222_185/0.9),0_0_36px_10px_rgb(255_170_95/0.35)] transition-[transform,opacity] duration-500 ease-out-soft",
            launching && "scale-[3] opacity-0",
          )}
        />
      </span>

      <div className={cn("container-page relative flex h-full flex-col justify-between py-7 transition-opacity duration-500", launching && "opacity-0 delay-200")}>
        <p className="text-[11px] font-medium uppercase tracking-brand text-fg-2">Syxoria</p>
        <div className="flex justify-end pb-[8svh] sm:pb-[6svh]">
          <div className="min-w-[9rem]">
            <p className="flex items-start font-display font-extralight leading-none text-fg">
              <span ref={count} className="tabular text-[clamp(2.75rem,2rem+3vw,4.5rem)] tracking-tight">
                00
              </span>
              <span className="ml-1 mt-2 text-sm text-fg-2">%</span>
            </p>
            <span ref={label} className="mt-3 block text-[10px] uppercase tracking-[0.32em] text-fg-3">
              Initialising
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
