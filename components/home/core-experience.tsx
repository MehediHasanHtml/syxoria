"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CoreCanvas } from "@/components/brand/core-canvas";
import { hero, integrations } from "@/content/home";
import { cn } from "@/lib/cn";
import type { CorePalette } from "@/lib/core/look";
import { createCoreState, type CoreAnchors } from "@/lib/core/state";
import { motion } from "@/lib/motion";
import { productModules } from "@/lib/mock-data/modules";
import { INTEGRATIONS_CHAPTER, MODULES_CHAPTER, MODULE_WALK, STORY_CHAPTERS, STORY_VH, storyOffset } from "./chapters";
import { CoreOverlay, type CoreOverlayHandle } from "./core-overlay";
import { IntegrationsSheet } from "./integrations-sheet";
import { LiveScreen } from "./live-screen";
import { LookSwitcher, useCoreLook } from "./look-switcher";
import { ModuleSheet } from "./module-sheet";
import { Preloader } from "./preloader";
import { useSmoothScroll } from "./smooth-scroll";
import { buildStory } from "./story-timeline";
import { HeroChapter } from "./story/hero-chapter";
import { IntegrationsChapter } from "./story/integrations-chapter";
import { ModulesChapter } from "./story/modules-chapter";
import { OneCoreChapter } from "./story/one-core-chapter";
import { PricingChapter } from "./story/pricing-chapter";
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

/** The module the scroll has reached while walking through the modules chapter, or null outside the walk. */
function walkAt(p: number) {
  if (p < MODULE_WALK.from || p >= MODULE_WALK.to) return null;
  const n = productModules.length;
  return Math.min(n - 1, Math.floor(((p - MODULE_WALK.from) / (MODULE_WALK.to - MODULE_WALK.from)) * n));
}

/**
 * The Core experience: one pinned scene the scroll travels through — a single
 * journey around the same Core (see story-timeline.ts) — which the visitor
 * can also explore directly: the cursor warms the Core, its branches open the
 * modules, the product screen plays the demo. Chapters are anchored so the
 * numbered navigation and the header can jump straight to them.
 *
 * `palette`: the colour of the Core's light on this page — the original gold
 * unless the page says otherwise (the /emerald test page) or its URL asks.
 */
export function CoreExperience({ palette: fixed }: { palette?: CorePalette } = {}) {
  const { scrollTo, start } = useSmoothScroll();
  const root = useRef<HTMLElement>(null);
  const overlay = useRef<CoreOverlayHandle>(null);
  const chapterRef = useRef(0);
  // the opening: the Core starts as scattered shards that appear one by one (see Preloader)
  const [state] = useState(() => createCoreState({ intro: 0, awaken: 0.42, scatter: 1, tease: 0 }));
  // the product screen's element: the scene places it in 3D, React renders into it (a portal)
  const [screenEl] = useState(() => (typeof document === "undefined" ? null : document.createElement("div")));
  const [sceneReady, setSceneReady] = useState(false);
  // forming: the loader builds the Core over a curtain · revealing: it assembles · done: the page is live
  const [opening, setOpening] = useState<"forming" | "revealing" | "done">("forming");
  const live = useRef(false);
  const [chapter, setChapter] = useState(0);
  // the module being explored (hover / focus / tap), the one the scroll has reached, and the one opened in full
  const [focus, setFocus] = useState<number | null>(null);
  const [walk, setWalk] = useState<number | null>(null);
  const [sheet, setSheet] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  // the tool being pointed at (a pulse runs down its wire)
  const [tool, setTool] = useState<number | null>(null);
  const look = useCoreLook();
  const palette = fixed ?? look.palette;
  const ground = look.ground;

  const exploring = chapter === MODULES_CHAPTER ? (focus ?? walk) : null;
  const explore = useExplore(exploring, setFocus, setSheet);
  // the explored (or opened) module's fragment lifts and lights in the scene; it eases there by itself
  useEffect(() => void gsap.set(state, { focus: sheet ?? exploring ?? -1 }), [state, sheet, exploring]);
  const pointing = chapter === INTEGRATIONS_CHAPTER ? tool : null;
  useEffect(() => void gsap.set(state, { tool: pointing ?? -1 }), [state, pointing]);

  // the Core's own fragments can be explored too: pointing at one explores its module, clicking opens it
  const hoverModule = useRef(-1);
  const stage = useRef<HTMLDivElement>(null);
  const onFrame = useCallback((a: CoreAnchors) => {
    overlay.current?.update(a, activeWords(root.current), live.current && chapterRef.current === 0);
    const h = chapterRef.current === MODULES_CHAPTER ? a.hoverModule : -1;
    if (h !== hoverModule.current) {
      const was = hoverModule.current;
      hoverModule.current = h;
      if (h >= 0) setFocus(h);
      else if (was >= 0) setFocus(null);
      if (stage.current) stage.current.style.cursor = h >= 0 ? "pointer" : "";
    }
  }, []);
  const onStageClick = useCallback(() => {
    if (hoverModule.current >= 0) setSheet(hoverModule.current);
  }, []);

  // The scroll-scrubbed story. Built once the fonts are in (its titles are split into lines),
  // and rebuilt when the width changes enough to rewrap them.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = gsap.utils.selector(el);
    let mm: gsap.MatchMedia | null = null;
    let cancelled = false;
    let width = window.innerWidth;
    let timer = 0;

    const build = () => {
      mm?.revert();
      mm = gsap.matchMedia();
      // same breakpoints as the "side" and "short" CSS variants (globals.css)
      mm.add(
        {
          desktop: "(min-width: 1024px), (orientation: landscape) and (min-width: 640px)",
          mobile: "(max-width: 1023.98px) and (orientation: portrait), (max-width: 639.98px)",
          short: "(max-width: 1023.98px) and (max-height: 740px)",
          narrow: "(max-width: 1279.98px)",
        },
        (ctx) => {
          if (!reduced) SplitText.create(q("[data-split]"), { type: "lines", mask: "lines", linesClass: "split-line" });
          const desktop = !!ctx.conditions?.desktop;
          // side-by-side on a short or narrower screen: the words take more of the width
          const wide = !desktop ? 1 : ctx.conditions?.short ? 1.35 : ctx.conditions?.narrow ? 1.2 : 1;
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: el,
              start: "top top",
              end: "bottom bottom",
              scrub: reduced ? true : 1.1,
              onUpdate: (self) => {
                const p = self.progress * 100;
                const ch = Math.max(0, STORY_CHAPTERS.findLastIndex((c) => p >= c.start));
                if (ch !== chapterRef.current) {
                  chapterRef.current = ch;
                  setChapter(ch);
                  setFocus(null);
                }
                setWalk(walkAt(p));
              },
            },
          });
          buildStory({ tl, q, state, desktop, wide, short: !!ctx.conditions?.short, ground });
        },
      );
    };
    (document.fonts?.ready ?? Promise.resolve()).then(() => !cancelled && build());
    const onResize = () => {
      if (Math.abs(window.innerWidth - width) < 40) return;
      width = window.innerWidth;
      window.clearTimeout(timer);
      timer = window.setTimeout(build, 250);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      mm?.revert();
    };
  }, [state, ground]);

  // The opening sequence, driven by the Preloader:
  // 20 → 90% the pieces appear one by one, drifting closer together as more arrive;
  // 100% they come together — slowly — the Core, whole for the first time
  const onProgress = useCallback(
    (p: number) => {
      const s = (v: number) => v * v * (3 - 2 * v);
      gsap.set(state, { tease: Math.min(1, Math.max(0, (p - 0.18) / 0.72)), scatter: 1 - 0.4 * s(Math.min(1, Math.max(0, (p - 0.3) / 0.7))) });
    },
    [state],
  );
  const onLaunch = useCallback(() => {
    setOpening("revealing");
    gsap.set(state, { tease: 1 });
    gsap.to(state, { scatter: 0, duration: 2.1, ease: "power2.inOut" });
    // the room (glow, air, stars) arrives as the pieces lock together
    gsap.to(state, { intro: 1, duration: motion.core.duration, delay: 0.55, ease: motion.core.ease });
  }, [state]);
  // Then the page takes over: the hero words come in beside the Core
  const onIntro = useCallback(
    (instant: boolean) => {
      start();
      live.current = true;
      setOpening("done");
      if (instant) {
        gsap.set(state, { scatter: 0, tease: 1 });
        gsap.to(state, { intro: 1, duration: 1.2, ease: motion.core.ease });
        return;
      }
      const scope = root.current;
      if (!scope) return;
      const lines = scope.querySelectorAll('[data-layer="hero"] [data-r] .split-line');
      const blocks = scope.querySelectorAll('[data-layer="hero"] [data-r]:not([data-split])');
      if (lines.length) gsap.fromTo(lines, { yPercent: 115 }, { yPercent: 0, duration: 1.2, stagger: 0.09, delay: 0.05, ease: "power3.out" });
      if (blocks.length) gsap.fromTo(blocks, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12, delay: 0.35, ease: motion.reveal.ease });
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

        <div ref={stage} onClick={onStageClick} className="sticky top-0 h-svh overflow-hidden">
          {/* During the opening the Core draws above a curtain that hides the page; then it drops behind the words */}
          {forming && <div aria-hidden="true" className="absolute inset-0 z-10 bg-canvas" />}
          <CoreCanvas
            state={state}
            className={cn("absolute inset-0", forming && "z-20")}
            onFrame={onFrame}
            onReady={() => setSceneReady(true)}
            nodeCount={integrations.tools.length}
            palette={palette}
            screen={screenEl}
          />
          {sceneReady && screenEl && createPortal(<LiveScreen state={state} />, screenEl)}
          <CoreOverlay ref={overlay} focus={exploring} explore={explore} tool={pointing} onTool={setTool} onOpenCore={() => scrollTo("#modules")} />

          {/* Readability on small screens: the words sit on a soft floor of shadow */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-canvas via-canvas/85 to-transparent side:hidden" />

          <HeroChapter />
          <OneCoreChapter />
          <ModulesChapter focus={exploring} explore={explore} onOpen={setSheet} />
          <WorkspaceChapter state={state} />
          <IntegrationsChapter onMore={() => setMoreOpen(true)} />
          <PricingChapter />

          {/* Scroll hint */}
          <div aria-hidden="true" data-layer="hint" className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fg-3">{hero.scrollHint}</span>
            <span className="relative h-10 w-px overflow-hidden bg-line">
              <span className="scroll-hint absolute inset-x-0 top-0 h-1/2 bg-fg-2" />
            </span>
          </div>
        </div>
      </section>

      <ModuleSheet index={sheet} onClose={() => setSheet(null)} onNavigate={setSheet} />
      <IntegrationsSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <LookSwitcher palette={fixed} />
    </>
  );
}
