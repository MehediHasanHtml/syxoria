"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CoreCanvas } from "@/components/brand/core-canvas";
import { hero, integrations } from "@/content/home";
import { cn } from "@/lib/cn";
import { createCoreState, type CoreAnchors } from "@/lib/core/state";
import { motion } from "@/lib/motion";
import { MODULES_CHAPTER, STORY_CHAPTERS, STORY_VH, WORKSPACE_CHAPTER, storyOffset } from "./chapters";
import { CoreOverlay, type CoreOverlayHandle } from "./core-overlay";
import { IntegrationsSheet } from "./integrations-sheet";
import { ModuleSheet } from "./module-sheet";
import { Preloader } from "./preloader";
import { useSmoothScroll } from "./smooth-scroll";
import { buildStory } from "./story-timeline";
import { HeroChapter } from "./story/hero-chapter";
import { IntegrationsChapter } from "./story/integrations-chapter";
import { ModulesChapter } from "./story/modules-chapter";
import { OneCoreChapter } from "./story/one-core-chapter";
import { WorkspaceChapter } from "./story/workspace-chapter";
import { useExplore } from "./use-explore";

/** Screen rect of the chapter words currently shown (GSAP autoAlpha leaves inline visibility/opacity). */
function activeWords(scope: HTMLElement | null): DOMRect | null {
  if (!scope) return null;
  for (const layer of scope.querySelectorAll<HTMLElement>(".story-layer[data-layer]")) {
    const { visibility, opacity } = layer.style;
    const shown = visibility ? visibility !== "hidden" && parseFloat(opacity || "1") > 0.05 : layer.classList.contains("story-layer--visible");
    if (shown) return layer.firstElementChild?.firstElementChild?.getBoundingClientRect() ?? null;
  }
  return null;
}

/**
 * The Core experience: one pinned scene the scroll moves through (see
 * story-timeline.ts), which the visitor can also explore directly — the
 * cursor warms the Core, its branches open the modules, the product screen
 * previews itself. Chapters are anchored so the numbered navigation and the
 * header can jump straight to them.
 */
export function CoreExperience() {
  const { scrollTo, start } = useSmoothScroll();
  const root = useRef<HTMLElement>(null);
  const overlay = useRef<CoreOverlayHandle>(null);
  const chapterRef = useRef(0);
  // the opening: the Core starts as scattered shards that appear one by one (see Preloader)
  const [state] = useState(() => createCoreState({ intro: 0, awaken: 0.06, scatter: 1, tease: 0 }));
  const [sceneReady, setSceneReady] = useState(false);
  // forming: the loader teases shards over a curtain · revealing: they assemble · done: the page is live
  const [opening, setOpening] = useState<"forming" | "revealing" | "done">("forming");
  const live = useRef(false);
  const [chapter, setChapter] = useState(0);
  // the module being explored (hover / focus / tap) and the one opened in full
  const [focus, setFocus] = useState<number | null>(null);
  const [sheet, setSheet] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const exploring = chapter === MODULES_CHAPTER ? focus : null;
  const explore = useExplore(exploring, setFocus, setSheet);
  // the explored (or opened) branch reaches out in the scene; it eases there by itself
  useEffect(() => void gsap.set(state, { focus: sheet ?? exploring ?? -1 }), [state, sheet, exploring]);

  const onFrame = useCallback((a: CoreAnchors) => {
    overlay.current?.update(a, activeWords(root.current), live.current && chapterRef.current <= 1);
  }, []);

  // The scroll-scrubbed story
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = gsap.utils.selector(el);
    const mm = gsap.matchMedia();
    // same breakpoints as the "side" and "short" CSS variants (globals.css)
    mm.add(
      {
        desktop: "(min-width: 1024px), (orientation: landscape) and (min-width: 640px)",
        mobile: "(max-width: 1023.98px) and (orientation: portrait), (max-width: 639.98px)",
        short: "(max-width: 1023.98px) and (max-height: 740px)",
        narrow: "(max-width: 1279.98px)",
      },
      (ctx) => {
        const desktop = !!ctx.conditions?.desktop;
        // side-by-side on a short or narrower screen: the words take more of the width
        const wide = !desktop ? 1 : ctx.conditions?.short ? 1.35 : ctx.conditions?.narrow ? 1.25 : 1;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "bottom bottom",
            scrub: reduced ? true : 1,
            onUpdate: (self) => {
              const p = self.progress * 100;
              const ch = Math.max(0, STORY_CHAPTERS.findLastIndex((c) => p >= c.start));
              if (ch !== chapterRef.current) {
                chapterRef.current = ch;
                setChapter(ch);
                setFocus(null);
              }
            },
          },
        });
        buildStory({ tl, q, state, desktop, wide, short: !!ctx.conditions?.short });
      },
    );
    return () => mm.revert();
  }, [state]);

  // The opening sequence, driven by the Preloader:
  // 00–99% the shards appear one by one; 100% they fly together — the Core, whole for the first time
  const onProgress = useCallback((p: number) => void gsap.set(state, { tease: Math.min(1, Math.max(0, (p - 0.2) / 0.75)) }), [state]);
  const onLaunch = useCallback(() => {
    setOpening("revealing");
    gsap.set(state, { tease: 1 });
    gsap.to(state, { scatter: 0, duration: 1.4, ease: "power3.inOut" });
    // the room (plinth, floor, glow) arrives as the pieces lock together
    gsap.to(state, { intro: 1, duration: motion.core.duration, delay: 0.55, ease: motion.core.ease });
  }, [state]);
  // Then the page takes over: the hero words come in over the Core
  const onIntro = useCallback(
    (instant: boolean) => {
      start();
      live.current = true;
      setOpening("done");
      const words = root.current?.querySelectorAll('[data-layer="hero"] [data-r]');
      if (instant) {
        gsap.set(state, { scatter: 0, tease: 1 });
        gsap.to(state, { intro: 1, duration: 1.2, ease: motion.core.ease });
        return;
      }
      if (words?.length)
        gsap.fromTo(words, { autoAlpha: 0, y: 30, filter: "blur(6px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1, stagger: 0.1, delay: 0.1, ease: motion.reveal.ease });
    },
    [state, start],
  );
  const forming = opening !== "done";

  return (
    <>
      <Preloader ready={sceneReady} onProgress={onProgress} onLaunch={onLaunch} onDone={onIntro} />
      <section
        ref={root}
        id="story"
        aria-labelledby="hero-title"
        // while set, the header and section rail stay hidden (globals.css)
        data-opening={forming ? opening : undefined}
        className="relative"
        style={{ height: `${STORY_VH * 100}svh` }}
      >
        {/* Jump targets (where each chapter is fully shown) and where each one begins */}
        {STORY_CHAPTERS.map((c) => (
          <span key={c.id} aria-hidden="true">
            <span id={c.id} className="absolute left-0 w-px scroll-mt-[calc(-1*(var(--header-h)+1rem))]" style={{ top: storyOffset(c.land) }} />
            <span data-nav-start={c.id} className="absolute left-0 w-px" style={{ top: storyOffset(c.start) }} />
          </span>
        ))}

        <div className="sticky top-0 h-svh overflow-hidden">
          {/* During the opening the Core draws above a curtain that hides the page; then it drops behind the words */}
          {forming && <div aria-hidden="true" className="absolute inset-0 z-10 bg-canvas" />}
          <CoreCanvas state={state} className={cn("absolute inset-0", forming && "z-20")} onFrame={onFrame} onReady={() => setSceneReady(true)} nodeCount={integrations.tools.length} />
          <CoreOverlay ref={overlay} focus={exploring} explore={explore} onOpenCore={() => scrollTo("#modules")} />

          {/* Readability on small screens: the words sit on a soft floor of shadow */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-canvas via-canvas/85 to-transparent side:hidden" />

          <HeroChapter />
          <OneCoreChapter />
          <ModulesChapter focus={exploring} explore={explore} onOpen={setSheet} />
          <WorkspaceChapter active={chapter === WORKSPACE_CHAPTER} />
          <IntegrationsChapter onMore={() => setMoreOpen(true)} />

          {/* Scroll hint */}
          <div aria-hidden="true" data-layer="hint" className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex">
            <span className="text-[10px] uppercase tracking-[0.3em] text-fg-3">{hero.scrollHint}</span>
            <span className="relative h-10 w-px overflow-hidden bg-line">
              <span className="scroll-hint absolute inset-x-0 top-0 h-1/2 bg-fg-2" />
            </span>
          </div>
        </div>
      </section>

      <ModuleSheet index={sheet} onClose={() => setSheet(null)} onNavigate={setSheet} />
      <IntegrationsSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
