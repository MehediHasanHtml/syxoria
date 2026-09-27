"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { useCallback, useRef, type CSSProperties } from "react";
import { LivingTree } from "@/components/brand/living-tree";
import { genesis } from "@/content/home";
import { useScrollProgress } from "@/lib/hooks/use-scroll-progress";
import { useFilm } from "./film";

/**
 * Chapter one — the universe.
 * One pinned stage, one tree. The hero statement gives way to four short
 * chapters (roots → structure → branches → canopy) while the tree keeps
 * growing with the scroll. Text windows are pure CSS on `--p`.
 */

// Scroll windows [in, out] for the hero and each chapter
const WINDOWS: [number, number][] = [
  [-1, 0.14],
  [0.2, 0.38],
  [0.42, 0.6],
  [0.64, 0.82],
  [0.86, 1.2],
];
const HERO_GROWTH = 0.84;

const layer = ([a, b]: [number, number]): CSSProperties =>
  ({
    // fade in over 0.05 of progress, out over 0.05, drift upward through the window
    opacity: `clamp(0, min(calc((var(--p) - ${a}) / 0.05), calc((${b} - var(--p)) / 0.05)), 1)`,
    transform: `translate3d(0, calc(clamp(-1, (var(--p) - ${(a + b) / 2}) / ${(b - a) / 2}, 1) * -28px), 0)`,
  }) as CSSProperties;

export function Genesis() {
  const growth = useRef(HERO_GROWTH);
  const film = useFilm();
  const stageRef = useRef<HTMLDivElement>(null);

  const onProgress = useCallback((p: number) => {
    const e = p * p * (3 - 2 * p);
    growth.current = HERO_GROWTH + (1 - HERO_GROWTH) * e;
    const stage = WINDOWS.findLastIndex(([a]) => p >= a);
    if (stageRef.current) stageRef.current.dataset.stage = String(Math.max(0, stage));
  }, []);
  const section = useScrollProgress<HTMLElement>(onProgress);

  return (
    <section ref={section} id="evolution" aria-labelledby="hero-title" className="relative h-[480svh]" style={{ ["--p" as string]: 0 }}>
      <div ref={stageRef} data-stage="0" className="genesis sticky top-0 h-svh overflow-hidden">
        <div className="container-page relative grid h-full grid-rows-[minmax(0,1fr)_auto] pt-(--header-h) lg:grid-cols-12 lg:grid-rows-1 lg:items-center">
          {/* The tree */}
          <div className="relative row-start-1 -mx-(--gutter) lg:col-span-7 lg:col-start-6 lg:mx-0 lg:h-[92%]">
            <LivingTree
              growthRef={growth}
              className="absolute inset-0"
              label="A bonsai growing out of a thin frame. It keeps growing as you scroll."
            />
          </div>

          {/* Words */}
          <div className="relative row-start-2 grid pb-10 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:pb-0">
            <div className="genesis-hero col-start-1 row-start-1 self-end lg:self-center" style={layer(WINDOWS[0])}>
              <h1 id="hero-title" className="text-display font-medium text-fg">
                {genesis.titleLead}
                <span className="block font-light text-fg-2">{genesis.titleAccent}</span>
              </h1>
              <p className="mt-6 max-w-[27rem] text-[15px] leading-relaxed text-fg-3 sm:text-base">{genesis.body}</p>
              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link
                  href={genesis.primaryCta.href}
                  className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-fg pl-6 pr-5 text-sm font-medium text-canvas transition-[background-color,gap] duration-300 ease-out-soft hover:gap-3.5 hover:bg-white"
                >
                  {genesis.primaryCta.label}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <button type="button" onClick={film.open} className="group inline-flex items-center gap-3 text-sm text-fg-2 transition-colors hover:text-fg">
                  <span className="grid size-11 place-items-center rounded-full border border-line-strong transition-[border-color,transform] duration-500 ease-out-soft group-hover:scale-110 group-hover:border-fg-3">
                    <Play className="ml-0.5 size-3.5 fill-current" aria-hidden="true" />
                  </span>
                  {genesis.filmCta}
                </button>
              </div>
            </div>

            {genesis.chapters.map((c, i) => (
              <div key={c.id} className="col-start-1 row-start-1 self-end lg:self-center" style={layer(WINDOWS[i + 1])}>
                <p className="tabular text-xs tracking-[0.3em] text-fg-3">{c.index}</p>
                <h2 className="mt-5 text-headline font-light text-fg">{c.word}</h2>
                <p className="mt-5 max-w-[24rem] text-base leading-relaxed text-fg-2 sm:text-lg">{c.line}</p>
              </div>
            ))}
          </div>

          {/* Progress rail */}
          <div aria-hidden="true" className="pointer-events-none absolute bottom-7 left-(--gutter) right-(--gutter) hidden items-center gap-5 lg:flex">
            <span className="text-[11px] uppercase tracking-[0.3em] text-fg-3">Scroll to grow</span>
            <span className="relative h-px w-40 overflow-hidden bg-line">
              <span className="absolute inset-0 origin-left bg-fg-2" style={{ transform: "scaleX(var(--p))" }} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
