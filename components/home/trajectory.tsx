"use client";

import { useCallback, useRef, useState } from "react";
import { trajectory } from "@/content/home";
import { cn } from "@/lib/cn";
import { useScrollProgress } from "@/lib/hooks/use-scroll-progress";

/**
 * Chapter two — progression.
 * Not a chart: a single line that rises out of the horizon as you scroll,
 * slow at first, then compounding. Faint echoes trail behind it like a long
 * exposure. Stages appear as the line reaches them.
 */

const VB = { w: 1000, h: 400 };
// Growth shape: quiet start, compounding middle, still rising at the end.
const f = (t: number) => t ** 2.6 * (1.15 - 0.15 * t);
const yAt = (t: number) => 372 - f(t) * 340;
const PATH = (() => {
  let d = "";
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    d += `${i ? "L" : "M"}${(t * VB.w).toFixed(1)} ${yAt(t).toFixed(2)}`;
  }
  return d;
})();
const ECHOES = [1, 2, 3, 4, 5, 6];

export function Trajectory() {
  const [stage, setStage] = useState(-1);
  const stageRef = useRef(-1);
  const clip = useRef<SVGRectElement>(null);
  const echoClip = useRef<SVGRectElement>(null);
  const tip = useRef<HTMLDivElement>(null);

  const onProgress = useCallback((p: number) => {
    const d = Math.min(1, Math.max(0, (p - 0.06) / 0.84));
    clip.current?.setAttribute("width", String(d * VB.w));
    echoClip.current?.setAttribute("width", String(Math.max(0, d - 0.035) * VB.w));
    if (tip.current) {
      tip.current.style.left = `${d * 100}%`;
      tip.current.style.top = `${(yAt(d) / VB.h) * 100}%`;
      tip.current.style.opacity = d > 0.002 && d < 0.999 ? "1" : "0";
    }
    const s = trajectory.stages.findLastIndex((st) => d >= st.at);
    if (s !== stageRef.current) {
      stageRef.current = s;
      setStage(s);
    }
  }, []);
  const section = useScrollProgress<HTMLElement>(onProgress);
  const current = trajectory.stages[Math.max(0, stage)];

  return (
    <section ref={section} id="progression" aria-labelledby="progression-title" className="relative h-[380svh]">
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden">
        {/* Words */}
        <div className="container-page relative z-10 pt-[calc(var(--header-h)+6svh)]">
          <p className="text-[11px] uppercase tracking-[0.3em] text-fg-3">{trajectory.eyebrow}</p>
          <h2 id="progression-title" className="sr-only">
            Progression, from start to outcome
          </h2>
          <div className="relative mt-6 grid">
            {trajectory.stages.map((s, i) => (
              <div
                key={s.id}
                aria-hidden={i !== Math.max(0, stage)}
                className={cn(
                  "col-start-1 row-start-1 transition-[opacity,transform] duration-700 ease-out-soft",
                  i === Math.max(0, stage) ? "translate-y-0 opacity-100" : i < stage ? "-translate-y-4 opacity-0" : "translate-y-4 opacity-0",
                )}
              >
                <p className="tabular text-sm text-fg-3">{s.when}</p>
                <p className="mt-3 font-display text-display font-light text-fg">{s.label}</p>
                <p className="mt-4 max-w-md text-base leading-relaxed text-fg-2 sm:text-lg">{s.line}</p>
              </div>
            ))}
          </div>
          <p
            className={cn(
              "mt-8 flex items-baseline gap-3 transition-opacity duration-700 lg:absolute lg:right-(--gutter) lg:top-[calc(var(--header-h)+6svh+2.5rem)] lg:mt-0 lg:flex-col lg:items-end lg:gap-1",
              current.id === "outcome" && stage === trajectory.stages.length - 1 ? "opacity-100" : "opacity-0",
            )}
          >
            <span className="tabular whitespace-nowrap font-display text-[clamp(2rem,1.4rem+2.4vw,3.5rem)] font-light tracking-tight text-fg">{trajectory.closing.value}</span>
            <span className="text-sm text-fg-3">{trajectory.closing.label}</span>
          </p>
        </div>

        {/* The line */}
        <div aria-hidden="true" className="relative mt-auto h-[46svh] w-full lg:h-[52svh]">
          <svg viewBox={`0 0 ${VB.w} ${VB.h}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <defs>
              <clipPath id="traj-clip">
                <rect ref={clip} x="0" y="-40" width="0" height={VB.h + 80} />
              </clipPath>
              <clipPath id="traj-echo-clip">
                <rect ref={echoClip} x="0" y="-40" width="0" height={VB.h + 80} />
              </clipPath>
            </defs>
            {/* horizon */}
            <line x1="0" x2={VB.w} y1={VB.h - 0.5} y2={VB.h - 0.5} stroke="rgb(245 245 242 / 0.1)" vectorEffect="non-scaling-stroke" />
            {/* echoes — a long exposure of the same movement */}
            <g clipPath="url(#traj-echo-clip)" fill="none">
              {ECHOES.map((k) => (
                <path
                  key={k}
                  d={PATH}
                  transform={`translate(0 ${k * 9})`}
                  stroke={`rgb(245 245 242 / ${0.16 - k * 0.022})`}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
            <g clipPath="url(#traj-clip)" fill="none">
              <path d={PATH} stroke="#f5f5f2" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </g>
          </svg>

          {/* stage markers */}
          {trajectory.stages.map((s, i) => {
            const reached = i <= stage;
            return (
              <div
                key={s.id}
                className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${s.at * 100}%`, top: `${(yAt(s.at) / VB.h) * 100}%` }}
              >
                <span
                  className={cn(
                    "-mt-1 size-2 rounded-full border transition-[background-color,border-color,transform] duration-500 ease-out-soft",
                    reached ? "scale-100 border-fg bg-fg" : "scale-75 border-line-strong bg-canvas",
                  )}
                />
                <span className={cn("w-px flex-1 transition-colors duration-700", reached ? "bg-fg/25" : "bg-fg/[0.06]")} />
              </div>
            );
          })}

          {/* moving tip */}
          <div ref={tip} className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg opacity-0 transition-opacity duration-300">
            <span className="absolute -inset-2 rounded-full border border-fg/25" />
          </div>
        </div>

        {/* stage labels on the horizon */}
        <ol className="relative h-16 w-full">
          {trajectory.stages.map((s, i) => (
            <li
              key={s.id}
              className={cn(
                "absolute top-4 text-[11px] uppercase tracking-[0.22em] transition-colors duration-500",
                i === 0 ? "translate-x-0 pl-(--gutter)" : i === trajectory.stages.length - 1 ? "-translate-x-full pr-(--gutter)" : "-translate-x-1/2",
                i <= stage ? "text-fg-2" : "text-fg-3/50",
              )}
              style={{ left: i === 0 ? 0 : `${s.at * 100}%` }}
            >
              <span className="tabular">{String(i + 1).padStart(2, "0")}</span>
              <span className="ml-2 hidden sm:inline">{s.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
