"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { ProgressionStage } from "@/types";

/** Stage id → tree part to spotlight (see .gt[data-focus] in globals.css). */
const focusMap: Record<string, string> = {
  roots: "roots",
  trunk: "trunk",
  branches: "branches",
  canopy: "canopy",
  fruit: "fruit",
};

/**
 * Scroll story: a sticky tree on one side, stages on the other. The stage
 * crossing the viewport's centre line becomes active (IntersectionObserver).
 */
export function GrowthStory({ stages, tree }: { stages: ProgressionStage[]; tree: ReactNode }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);

  // Pause the tree's loops while the section is offscreen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) delete el.dataset.paused;
      else el.dataset.paused = "";
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    // Desktop: the stage crossing the viewport centre is active. Mobile: the
    // pinned tree covers the top ~45%, so the trigger line sits lower, in the
    // visible text area.
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: desktop ? "-48% 0px -48% 0px" : "-66% 0px -32% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const stage = stages[active];

  return (
    <div className="relative grid lg:grid-cols-2 lg:gap-16">
      {/* Sticky visual — on mobile a solid panel the text scrolls beneath (fade sits below its edge) */}
      <div className="sticky top-(--header-h) z-[2] -mx-(--gutter) h-[40svh] self-start bg-canvas px-(--gutter) after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-10 after:bg-gradient-to-b after:from-canvas after:to-transparent lg:top-[calc(var(--header-h)+4svh)] lg:mx-0 lg:h-[84svh] lg:bg-transparent lg:px-0 lg:after:hidden">
        <div className="relative flex h-full flex-col items-center justify-center overflow-hidden pb-6 lg:overflow-visible lg:pb-0">
          <div
            ref={stageRef}
            className="gt relative aspect-[680/760] h-full max-h-full"
            data-focus={focusMap[stage.id]}
            style={{ ["--grow" as string]: 1 }}
            aria-hidden="true"
          >
            {tree}
          </div>
          {/* stage rail */}
          <div className="absolute bottom-1.5 left-0 right-0 flex items-center justify-center gap-2 lg:bottom-4">
            {stages.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  "h-0.5 rounded-full transition-[width,background-color] duration-500 ease-out-soft",
                  i === active ? "w-8 bg-accent" : i < active ? "w-3 bg-accent/50" : "w-3 bg-line-strong",
                )}
              />
            ))}
            <span className="tabular ml-2 text-[11px] text-fg-3" aria-live="polite">
              {String(active + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Stages */}
      <ol className="relative z-[1] pt-6 lg:pt-0">
        {stages.map((s, i) => (
          <li
            key={s.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-index={i}
            className="flex min-h-[60svh] flex-col justify-center py-10 lg:min-h-[78svh]"
          >
            <div className={cn("transition-opacity duration-500 ease-out-soft", i === active ? "opacity-100" : "opacity-35")}>
              <p className="eyebrow text-accent">{s.label}</p>
              <h3 className="mt-4 text-title font-medium text-fg">{s.title}</h3>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-fg-2 sm:text-base">{s.body}</p>
              <div className="mt-8 flex items-baseline gap-3 border-t border-line pt-5">
                <span className="tabular text-2xl font-medium tracking-tight text-fg">{s.metric.value}</span>
                <span className="text-[13px] text-fg-3">{s.metric.label}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
