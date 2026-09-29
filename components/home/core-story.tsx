"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { CoreCanvas } from "@/components/brand/core-canvas";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { access, connect, growth, hero, organism, pulse, workspace } from "@/content/home";
import { pricing } from "@/content/marketing";
import { cn } from "@/lib/cn";
import { createCoreState, type CoreAnchors } from "@/lib/core/state";
import { productModules } from "@/lib/mock-data/modules";
import overview from "@/public/product/dashboard-overview.png";
import { useFilm } from "./film";
import { Preloader } from "./preloader";

/**
 * The homepage is one continuous, pinned scene around the Core. The scroll
 * scrubs a single GSAP timeline (0 → 100) that moves the camera, wakes the
 * Core and swaps the words:
 *
 *   0  genesis      the Core on its plinth, the wordmark behind it
 *   10 growth       the six modules count up, the fissures open
 *   29 one pulse    the camera dives through the Core (warp)
 *   40 modules      six orbs light up around it, three moments
 *   62 workspace    the product screen emerges from the Core
 *   74 connections  tools wire themselves to it
 *   86 access       pull back: the Core in its vitrine, one offer
 */

const CHAPTERS = [
  { at: 0, label: "Genesis", id: "genesis" },
  { at: 10, label: "Growth", id: "growth" },
  { at: 29, label: "Pulse", id: "pulse" },
  { at: 40, label: "Modules", id: "modules" },
  { at: 62, label: "Workspace", id: "workspace" },
  { at: 74, label: "Connections", id: "connections" },
  { at: 86, label: "Access", id: "access" },
];
/** Story height in viewports; the pinned range is one viewport less. */
const STORY_VH = 15;

const plan = pricing.plans.find((p) => p.id === access.planId) ?? pricing.plans[0];
const eur = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);

/**
 * Places the labels that follow the orbs and tool nodes: beside or below their
 * point, flipped/clamped to stay on screen and clear of the header, and nudged
 * apart when two would collide. Sizes are measured once, then cached.
 */
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

const LABEL_MARGIN = 10;
const LABEL_TOP = 80;
function placeLabels(
  anchors: CoreAnchors["orbs"],
  els: (HTMLDivElement | null)[],
  mode: "side" | "below",
  bounds: { w: number; h: number },
  sizes: Map<HTMLElement, { w: number; h: number }>,
  keepOut: DOMRect | null,
) {
  const placed: { x: number; y: number; w: number; h: number; el: HTMLElement }[] = [];
  anchors.forEach((a, i) => {
    const el = els[i];
    if (!el) return;
    el.style.opacity = a.alpha.toFixed(3);
    if (a.alpha < 0.01) return;
    let size = sizes.get(el);
    if (!size) sizes.set(el, (size = { w: el.offsetWidth, h: el.offsetHeight }));
    let x: number;
    let y: number;
    if (mode === "side") {
      x = a.x + 14;
      if (x + size.w > bounds.w - LABEL_MARGIN) x = a.x - 14 - size.w;
      y = a.y - size.h / 2;
    } else {
      x = a.x - size.w / 2;
      y = a.y + 10;
    }
    x = Math.min(Math.max(x, LABEL_MARGIN), bounds.w - LABEL_MARGIN - size.w);
    y = Math.min(Math.max(y, LABEL_TOP), bounds.h - LABEL_MARGIN - size.h);
    if (keepOut && x < keepOut.right + 16 && x + size.w > keepOut.left - 16 && y < keepOut.bottom + 12 && y + size.h > keepOut.top - 12) {
      el.style.opacity = "0";
      return;
    }
    placed.push({ x, y, w: size.w, h: size.h, el });
  });
  placed.sort((p, q) => p.y - q.y);
  for (let pass = 0; pass < 2; pass++)
    for (let k = 1; k < placed.length; k++)
      for (let j = 0; j < k; j++) {
        const p = placed[j];
        const q = placed[k];
        if (q.x < p.x + p.w + 6 && q.x + q.w + 6 > p.x && q.y < p.y + p.h + 4 && q.y + q.h + 4 > p.y) q.y = p.y + p.h + 4;
      }
  for (const p of placed) p.el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
}

function Title({ lead, accent, as: Tag = "h2", id, className }: { lead: string; accent: string; as?: "h1" | "h2"; id?: string; className?: string }) {
  return (
    <Tag id={id} className={cn("font-display text-display font-light text-fg short:text-[1.85rem]", className)}>
      {lead} <em className="font-serif text-[1.08em] font-normal italic tracking-normal text-fg">{accent}</em>
    </Tag>
  );
}

/** A chapter's words. Hidden until the timeline reveals it; `[data-r]` children stagger in. */
function Layer({ name, className, children }: { name: string; className?: string; children: ReactNode }) {
  return (
    <div data-layer={name} className={cn("story-layer pointer-events-none absolute inset-x-0 [&_a]:pointer-events-auto [&_button]:pointer-events-auto", className)}>
      <div className="container-page">{children}</div>
    </div>
  );
}

// Text sits at the bottom on small screens (the Core above it), in a side column on desktop.
const LEFT = "bottom-0 pb-[max(2.5rem,env(safe-area-inset-bottom))] side:bottom-auto side:top-[calc(50%+var(--header-h)/2)] side:-translate-y-1/2 side:pb-0";
const COL = "max-w-[34rem] side:max-w-[27rem] xl:max-w-[30rem] short:max-w-[21rem]";

export function CoreStory() {
  const film = useFilm();
  const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  const railLabel = useRef<HTMLSpanElement>(null);
  const railIndex = useRef<HTMLSpanElement>(null);
  const orbLabels = useRef<(HTMLDivElement | null)[]>([]);
  const nodeLabels = useRef<(HTMLDivElement | null)[]>([]);
  const lenisRef = useRef<Lenis | null>(null);
  const [state] = useState(() => createCoreState({ intro: 0 }));
  const [sceneReady, setSceneReady] = useState(false);

  const labelLayer = useRef<HTMLDivElement>(null);
  const labelSizes = useRef(new Map<HTMLElement, { w: number; h: number }>());
  const onFrame = useCallback((a: CoreAnchors) => {
    const box = labelLayer.current;
    if (!box) return;
    const bounds = { w: box.clientWidth, h: box.clientHeight };
    // labels never sit on the words currently on screen
    const words = activeWords(root.current);
    placeLabels(a.orbs, orbLabels.current, "side", bounds, labelSizes.current, words);
    placeLabels(a.nodes, nodeLabels.current, "below", bounds, labelSizes.current, words);
  }, []);
  useEffect(() => {
    const sizes = labelSizes.current;
    const reset = () => sizes.clear();
    window.addEventListener("resize", reset);
    return () => window.removeEventListener("resize", reset);
  }, []);

  // Smooth scroll + the scroll-scrubbed story timeline
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lenis: Lenis | null = null;
    const raf = (time: number) => lenis?.raf(time * 1000);
    if (!reduced) {
      lenis = new Lenis({ autoRaf: false, lerp: 0.085, anchors: true, prevent: (node) => !!node.closest?.("dialog") });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      if (document.documentElement.style.overflow === "hidden") lenis.stop();
    }
    lenisRef.current = lenis;

    const q = gsap.utils.selector(el);
    const mm = gsap.matchMedia();
    // same breakpoint as the "side" CSS variant (globals.css)
    mm.add(
      {
        desktop: "(min-width: 1024px), (orientation: landscape) and (min-width: 640px)",
        mobile: "(max-width: 1023.98px) and (orientation: portrait), (max-width: 639.98px)",
        short: "(max-width: 1023.98px) and (max-height: 740px)",
        narrow: "(max-width: 1279.98px)",
      },
      (ctx) => {
      const desktop = !!ctx.conditions?.desktop;
      // side-by-side on a short screen (phone in landscape): the words take more of the width
      // (also on narrower desktops, e.g. 1024–1280px, where the column takes a larger share)
      const wide = !desktop ? 1 : ctx.conditions?.short ? 1.35 : ctx.conditions?.narrow ? 1.25 : 1;
      const X = (d: number, m = 0) => (desktop ? d * wide : m);

      // Genesis pose
      Object.assign(state, {
        az: -0.22,
        el: 0.1,
        dist: 11.5,
        tx: 0,
        ty: -0.3,
        tz: 0,
        shiftX: X(0.2),
        shiftY: X(0, 0.17),
        awaken: 0.38,
        strands: 0.16,
        embers: 0.4,
        dust: 0.6,
        floor: 1,
        plinth: 1,
        vitrine: 0,
        orbs: 0,
        activeOrb: -1,
        network: 0,
        warp: 0,
        fade: 0,
        wordmark: 1,
        spin: 0,
        scale: 1,
        lift: 0,
      });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: reduced ? true : 1,
          onUpdate: (self) => {
            const p = self.progress * 100;
            rail.current?.style.setProperty("transform", `scaleY(${self.progress.toFixed(4)})`);
            const ch = CHAPTERS.findLastIndex((c) => p >= c.at - 0.5);
            if (railLabel.current && railLabel.current.textContent !== CHAPTERS[ch].label) {
              railLabel.current.textContent = CHAPTERS[ch].label;
              if (railIndex.current) railIndex.current.textContent = String(ch + 1).padStart(2, "0");
            }
          },
        },
      });

      const cam = (at: number, duration: number, vars: gsap.TweenVars) => tl.to(state, { ease: "sine.inOut", ...vars, duration }, at);
      const show = (name: string, at: number, duration = 1.4) => {
        tl.set(q(`[data-layer="${name}"]`), { autoAlpha: 1 }, at);
        tl.fromTo(
          q(`[data-layer="${name}"] [data-r]`),
          { autoAlpha: 0, y: 36, filter: "blur(8px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration, stagger: 0.22, ease: "power2.out" },
          at,
        );
      };
      const hide = (name: string, at: number, duration = 1.1) => {
        tl.to(q(`[data-layer="${name}"] [data-r]`), { autoAlpha: 0, y: -28, filter: "blur(6px)", duration, stagger: 0.08, ease: "power1.in" }, at);
        tl.set(q(`[data-layer="${name}"]`), { autoAlpha: 0 }, at + duration + 0.35);
      };

      // 0 — Genesis
      tl.to(q('[data-layer="hint"]'), { autoAlpha: 0, duration: 1.5 }, 1);
      hide("hero", 4.5);
      cam(3, 8, { az: 0.35, el: 0.16, dist: 9.2, ty: -0.05, shiftX: X(0.18), shiftY: X(0, 0.16), wordmark: 0, awaken: 0.55, strands: 0.35, spin: 0.5 });

      // 10 — Growth: the modules count up, the Core wakes
      show("growth", 10.5);
      const steps = q("[data-step]");
      steps.forEach((s, i) => {
        tl.to(s, { opacity: 1, duration: 0.6 }, 12.5 + i * 2.3);
        if (i < steps.length - 1) tl.to(s, { opacity: 0.28, duration: 0.6 }, 12.5 + (i + 1) * 2.3);
      });
      const counter = { v: 0 };
      const countEl = q("[data-count]")[0];
      tl.to(counter, { v: 6, duration: 14, onUpdate: () => countEl && (countEl.textContent = String(Math.max(1, Math.ceil(counter.v))).padStart(2, "0")) }, 12.5);
      tl.fromTo(q("[data-bar]"), { scaleX: 0 }, { scaleX: 1, duration: 14 }, 12.5);
      cam(11, 18, { az: 0.95, el: 0.06, dist: 8.8, ty: 0.05, awaken: 1, strands: 0.8, embers: 0.9, spin: 1.4 });
      hide("growth", 26.5);

      // 29 — One pulse: dive through the Core
      cam(29, 6, { dist: 2.4, ty: 0.32, shiftX: 0, shiftY: X(0, 0.05), warp: 1, fade: 0.45, plinth: 0, floor: 0.15, strands: 0.6, ease: "power2.in" });
      // the streaks clear quickly, then the words land on a calm Core
      cam(35, 2.2, { warp: 0, fade: 0, ease: "power2.out" });
      cam(35, 5, { dist: 8.6, az: 2.3, el: 0.24, ty: 0.2, strands: 0.45, ease: "power2.out" });
      show("pulse", 36, 1.2);
      hide("pulse", 39.3, 0.8);

      // 40 — Six modules, one organism
      // the Core slides back to its side before the words arrive
      cam(39.6, 2.4, { shiftX: X(0.17), shiftY: X(0, 0.14) });
      cam(40, 6, { az: 2.6, dist: 9.2, ty: 0.12, orbs: 1, strands: 0.45, embers: 0.7 });
      show("organism", 42);
      hide("organism", 45.3, 0.8);
      cam(46, 16, { az: 3.3, el: 0.18, dist: 8.6, spin: 2.4 });
      organism.moments.forEach((m, i) => {
        const at = 46.8 + i * 5.2;
        tl.to(state, { activeOrb: m.orb, duration: 1.3, ease: "power2.inOut" }, at - 0.6);
        show(`moment-${i}`, at, 1.1);
        hide(`moment-${i}`, at + 3.8, 0.8);
      });

      // 62 — The workspace emerges from the Core
      // the orbs (and their labels) clear before the screen rises
      tl.to(state, { orbs: 0, activeOrb: -1, duration: 1, ease: "power1.in" }, 61.2);
      cam(62, 4, { dist: 9.8, az: 3.6, el: 0.1, ty: 0.1, shiftX: X(0.22), shiftY: X(0, 0.21), awaken: 0.8, strands: 0.3 });
      tl.fromTo(
        q("[data-panel]"),
        { autoAlpha: 0, scale: 0.55, rotateX: 22, y: 60, filter: "blur(14px)" },
        { autoAlpha: 1, scale: 1, rotateX: 0, y: 0, filter: "blur(0px)", duration: 3.6, ease: "power3.out" },
        62.4,
      );
      show("workspace", 63.4);
      cam(66, 8, { az: 3.9, spin: 3 });
      hide("workspace", 72.2);
      tl.to(q("[data-panel]"), { autoAlpha: 0, scale: 1.06, y: -40, filter: "blur(10px)", duration: 1.6, ease: "power2.in" }, 72.2);

      // 74 — Connected to your tools
      cam(74, 4.5, { az: Math.PI * 2, el: 0.08, dist: 12.5, ty: 0.1, shiftX: X(0.14), shiftY: X(0, 0.2), network: 1, strands: 0.3, awaken: 0.9, floor: 0.5 });
      show("connect", 76);
      cam(78.5, 7.5, { az: Math.PI * 2 + 0.22, spin: 3.6 });
      hide("connect", 84.6);

      // 86 — Access: the Core in its vitrine
      cam(86, 6, {
        network: 0,
        az: Math.PI * 2 - 0.42,
        el: 0.13,
        dist: 14.2,
        ty: 0.15,
        shiftX: X(-0.2),
        shiftY: X(0, 0.2),
        plinth: 1,
        floor: 1,
        vitrine: 1,
        awaken: 0.85,
        strands: 0.2,
        embers: 0.6,
      });
      show("access", 89);
      cam(92, 8, { az: Math.PI * 2 - 0.3, spin: 4 });
      tl.to({}, { duration: 0 }, 100);

      return () => {
        state.warp = 0;
        state.fade = 0;
      };
    });

    return () => {
      mm.revert();
      gsap.ticker.remove(raf);
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, [state]);

  // After the curtain: wake the Core and bring in the hero
  const onIntro = useCallback(
    (instant: boolean) => {
      lenisRef.current?.start();
      const words = root.current?.querySelectorAll('[data-layer="hero"] [data-r]');
      if (instant) {
        gsap.to(state, { intro: 1, duration: 1.2, ease: "power2.out" });
        return;
      }
      gsap.to(state, { intro: 1, duration: 1.6, ease: "power2.inOut" });
      if (words?.length) gsap.fromTo(words, { autoAlpha: 0, y: 30, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1, stagger: 0.1, delay: 0.15, ease: "power3.out" });
    },
    [state],
  );

  return (
    <>
      <Preloader ready={sceneReady} onDone={onIntro} />
      <section ref={root} id="story" aria-labelledby="hero-title" className="relative" style={{ height: `${STORY_VH * 100}svh` }}>
        {/* Anchors for in-page links: each lands where its chapter begins */}
        {CHAPTERS.slice(1).map((c) => (
          <span key={c.id} id={c.id} aria-hidden="true" className="absolute left-0 w-px" style={{ top: `calc(${((c.at + 1.5) / 100) * (STORY_VH - 1) * 100}svh + var(--header-h) + 1rem)` }} />
        ))}
        <div className="sticky top-0 h-svh overflow-hidden">
          <CoreCanvas state={state} className="absolute inset-0" onFrame={onFrame} onReady={() => setSceneReady(true)} nodeCount={connect.tools.length} />

          {/* Module orb labels (positioned by the scene every frame) */}
          <div ref={labelLayer} aria-hidden="true" className="pointer-events-none absolute inset-0">
            {productModules.map((m, i) => (
              <div
                key={m.key}
                ref={(n) => void (orbLabels.current[i] = n)}
                className="absolute left-0 top-0 whitespace-nowrap text-[11px] uppercase tracking-[0.22em] opacity-0 will-change-transform"
              >
                <span className="text-fg">{m.name}</span>
                <span className="ml-2 text-fg-3">{m.role}</span>
              </div>
            ))}
            {connect.tools.map((t, i) => (
              <div
                key={t.id}
                ref={(n) => void (nodeLabels.current[i] = n)}
                className="absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-black/40 py-1 pl-1.5 pr-2.5 text-[11px] text-fg-2 opacity-0 backdrop-blur-md will-change-transform"
              >
                <IntegrationLogo id={t.id} size={13} />
                {t.name}
              </div>
            ))}
          </div>

          {/* Readability on small screens: the words sit on a soft floor of shadow */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-canvas via-canvas/85 to-transparent side:hidden" />

          {/* 0 — Genesis */}
          <Layer name="hero" className={cn(LEFT, "story-layer--visible")}>
            <div className={COL}>
              <p data-r className="text-[11px] font-medium uppercase tracking-[0.3em] text-fg-3">
                <span className="mr-3 inline-block h-px w-6 bg-fg-3 align-middle" />
                {hero.eyebrow}
              </p>
              <div data-r className="mt-6 short:mt-3">
                <Title as="h1" id="hero-title" lead={hero.titleLead} accent={hero.titleAccent} />
              </div>
              <p data-r className="mt-6 max-w-[26rem] text-[15px] leading-relaxed text-fg-2 short:mt-3 short:text-[14px] sm:text-base">
                {hero.body}
              </p>
              <div data-r className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4 short:mt-5">
                <Link
                  href={hero.primaryCta.href}
                  className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-fg pl-6 pr-5 text-sm font-medium text-canvas transition-[background-color,gap] duration-300 ease-out-soft hover:gap-3.5 hover:bg-white"
                >
                  {hero.primaryCta.label}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <button type="button" onClick={film.open} className="group inline-flex items-center gap-3 text-sm text-fg-2 transition-colors hover:text-fg">
                  <span className="grid size-11 place-items-center rounded-full border border-line-strong transition-[border-color,transform] duration-500 ease-out-soft group-hover:scale-110 group-hover:border-fg-3">
                    <Play className="ml-0.5 size-3.5 fill-current" aria-hidden="true" />
                  </span>
                  {hero.filmCta}
                </button>
              </div>
            </div>
          </Layer>

          {/* 10 — Growth */}
          <Layer name="growth" className={LEFT}>
            <div className={COL}>
              <p data-r className="text-[11px] font-medium uppercase tracking-[0.3em] text-fg-3">
                <span className="mr-3 inline-block h-px w-6 bg-fg-3 align-middle" />
                {growth.eyebrow}
              </p>
              <div data-r className="mt-6 short:mt-3">
                <Title lead={growth.titleLead} accent={growth.titleAccent} />
              </div>
              <p data-r className="mt-5 max-w-[24rem] text-[15px] leading-relaxed text-fg-2 short:hidden">
                {growth.body}
              </p>
              <div data-r className="mt-9 flex items-end gap-6 short:mt-4">
                <span className="tabular font-display text-5xl font-extralight leading-none text-fg short:text-4xl">
                  <span data-count>01</span>
                  <span className="text-fg-3">/06</span>
                </span>
                <span className="mb-1.5 block h-px flex-1 overflow-hidden bg-line">
                  <span data-bar className="block h-full origin-left bg-accent" />
                </span>
              </div>
              <ol data-r className="mt-6 grid grid-cols-3 short:mt-3 short:grid-cols-6 short:gap-x-2 gap-x-4 gap-y-2 sm:grid-cols-6 lg:grid-cols-3">
                {productModules.map((m) => (
                  <li key={m.key} data-step className="text-[12px] uppercase tracking-[0.2em] text-fg opacity-[0.28]">
                    {m.name}
                  </li>
                ))}
              </ol>
            </div>
          </Layer>

          {/* 29 — One pulse */}
          <Layer name="pulse" className="bottom-0 pb-[max(3rem,env(safe-area-inset-bottom))] text-center side:bottom-auto side:top-[calc(50%+var(--header-h)/2)] side:-translate-y-1/2 side:pb-0">
            <div className="mx-auto max-w-3xl">
              <div data-r>
                <Title lead={pulse.titleLead} accent={pulse.titleAccent} className="[text-shadow:0_2px_40px_rgb(0_0_0/0.8)]" />
              </div>
              <p data-r className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-fg-2 short:mt-3 short:text-[14px] [text-shadow:0_1px_20px_rgb(0_0_0/0.9)]">
                {pulse.body}
              </p>
            </div>
          </Layer>

          {/* 40 — Six modules, one organism */}
          <Layer name="organism" className={LEFT}>
            <div className={COL}>
              <p data-r className="text-[11px] font-medium uppercase tracking-[0.3em] text-fg-3">
                <span className="mr-3 inline-block h-px w-6 bg-fg-3 align-middle" />
                {organism.eyebrow}
              </p>
              <div data-r className="mt-6 short:mt-3">
                <Title lead={organism.titleLead} accent={organism.titleAccent} />
              </div>
              <p data-r className="mt-5 max-w-[24rem] text-[15px] leading-relaxed text-fg-2 short:mt-3 short:text-[14px]">
                {organism.body}
              </p>
            </div>
          </Layer>
          {organism.moments.map((m, i) => {
            const mod = productModules[m.orb];
            return (
              <Layer key={m.id} name={`moment-${i}`} className={LEFT}>
                <div className={COL}>
                  <p data-r className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-fg-3">
                    <span className="tabular text-fg-2">{m.index}</span>
                    <span className="h-px w-6 bg-fg-3" />
                    {mod.name} · {mod.role}
                  </p>
                  <div data-r className="mt-6 short:mt-3">
                    <Title lead={m.titleLead} accent={m.titleAccent} />
                  </div>
                  <p data-r className="mt-5 max-w-[24rem] text-[15px] leading-relaxed text-fg-2 short:mt-3 short:text-[14px]">
                    {m.body}
                  </p>
                </div>
              </Layer>
            );
          })}

          {/* 62 — The workspace */}
          <div className="pointer-events-none absolute inset-0 [perspective:1800px]">
            <div className="container-page flex h-full items-start pt-[calc(var(--header-h)+5svh)] side:items-center side:justify-end side:pt-(--header-h)">
              <button
                type="button"
                data-panel
                onClick={film.open}
                aria-label={`${workspace.film.label} (${workspace.film.duration})`}
                className="story-layer group pointer-events-auto relative w-full cursor-pointer rounded-[18px] border border-white/12 bg-white/[0.04] p-1.5 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9),0_0_60px_-20px_rgb(255_140_50/0.35)] backdrop-blur-xl side:w-[56%] side:p-2 short:max-w-[24rem]"
              >
                <span className="relative block aspect-[16/10] overflow-hidden rounded-[12px] bg-black">
                  <Image
                    src={overview}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 56vw, 92vw"
                    className="object-cover object-top grayscale transition-[transform,filter] duration-700 ease-out-soft group-hover:scale-[1.015] group-hover:brightness-75"
                  />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-16 place-items-center rounded-full bg-fg text-canvas shadow-[0_10px_40px_rgb(0_0_0/0.5)] transition-transform duration-500 ease-out-soft group-hover:scale-110">
                      <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
                    </span>
                  </span>
                </span>
              </button>
            </div>
          </div>
          <Layer name="workspace" className={LEFT}>
            <div className="max-w-[34rem] side:max-w-[20rem] xl:max-w-[22rem] short:max-w-[19rem]">
              <p data-r className="text-[11px] font-medium uppercase tracking-[0.3em] text-fg-3">
                <span className="mr-3 inline-block h-px w-6 bg-fg-3 align-middle" />
                {workspace.eyebrow}
              </p>
              <div data-r className="mt-6 short:mt-3">
                <Title lead={workspace.titleLead} accent={workspace.titleAccent} className="side:text-headline" />
              </div>
              <p data-r className="mt-5 text-[15px] leading-relaxed text-fg-2 short:mt-3 short:text-[14px]">
                {workspace.body}
              </p>
              <div data-r className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 short:mt-5">
                <button type="button" onClick={film.open} className="group inline-flex items-center gap-2.5 text-sm text-fg">
                  <span className="grid size-9 place-items-center rounded-full bg-fg text-canvas transition-transform duration-300 group-hover:scale-110">
                    <Play className="ml-px size-3 fill-current" aria-hidden="true" />
                  </span>
                  {workspace.film.label}
                  <span className="tabular text-fg-3">{workspace.film.duration}</span>
                </button>
                <Link href={workspace.enter.href} className="group inline-flex items-center gap-2 text-sm text-fg-2 transition-colors hover:text-fg">
                  {workspace.enter.label}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Layer>

          {/* 74 — Connections */}
          <Layer name="connect" className={cn(LEFT, "side:top-auto side:bottom-[12svh] side:translate-y-0")}>
            <div className={COL}>
              <p data-r className="text-[11px] font-medium uppercase tracking-[0.3em] text-fg-3">
                <span className="mr-3 inline-block h-px w-6 bg-fg-3 align-middle" />
                {connect.eyebrow}
              </p>
              <div data-r className="mt-6 short:mt-3">
                <Title lead={connect.titleLead} accent={connect.titleAccent} />
              </div>
              <p data-r className="mt-5 max-w-[25rem] text-[15px] leading-relaxed text-fg-2 short:mt-3 short:text-[14px]">
                {connect.body}
              </p>
              <p data-r className="mt-6 text-[11px] uppercase tracking-[0.3em] text-fg-3 short:hidden">
                {connect.note}
              </p>
            </div>
          </Layer>

          {/* 86 — Access */}
          <Layer name="access" className="bottom-0 pb-[max(2rem,env(safe-area-inset-bottom))] side:bottom-auto side:top-[calc(50%+var(--header-h)/2)] side:-translate-y-1/2 side:pb-0">
            <div className="side:ml-auto side:max-w-[25rem] xl:max-w-[27rem] short:max-w-[21rem]">
              <p data-r className="text-[11px] font-medium uppercase tracking-[0.3em] text-fg-3 short:hidden">
                <span className="mr-3 inline-block h-px w-6 bg-fg-3 align-middle" />
                {access.eyebrow}
              </p>
              <div data-r className="mt-5 short:mt-3">
                <Title lead={access.titleLead} accent={access.titleAccent} className="side:text-headline" />
              </div>
              <div data-r className="mt-7 rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6 short:mt-4 short:p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-fg-2">{plan.name}</p>
                  {plan.price.yearly !== null && <p className="text-xs text-fg-3">or {eur(plan.price.yearly)} billed yearly</p>}
                </div>
                {plan.price.monthly !== null && (
                  <p className="mt-3 flex items-baseline gap-2">
                    <span className="tabular font-display text-[2.75rem] font-extralight short:text-[2.1rem] leading-none tracking-tight text-fg">{eur(plan.price.monthly)}</span>
                    <span className="text-sm text-fg-3">/ month</span>
                  </p>
                )}
                <ul className="mt-5 hidden gap-2 text-[13px] text-fg-2 sm:grid short:hidden">
                  {plan.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <span className="size-1 rounded-full bg-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 short:mt-4">
                  <Link
                    href={access.primaryCta.href}
                    className="group inline-flex h-11 items-center gap-2.5 rounded-full bg-fg pl-5 pr-4 text-sm font-medium text-canvas transition-[background-color,gap] duration-300 ease-out-soft hover:gap-3.5 hover:bg-white"
                  >
                    {access.primaryCta.label}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                  <a href={access.secondaryCta.href} className="text-sm text-fg-2 underline decoration-line-strong underline-offset-8 transition-colors hover:text-fg hover:decoration-fg">
                    {access.secondaryCta.label}
                  </a>
                </div>
              </div>
              <p data-r className="mt-4 text-[13px] text-fg-3">
                {access.body}
              </p>
            </div>
          </Layer>

          {/* Chapter rail */}
          <div aria-hidden="true" className="pointer-events-none absolute right-(--gutter) top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex">
            <span ref={railIndex} className="tabular text-[11px] tracking-[0.2em] text-fg-2">
              01
            </span>
            <span className="relative h-28 w-px overflow-hidden bg-line">
              <span ref={rail} className="absolute inset-0 origin-top scale-y-0 bg-fg-2" />
            </span>
            <span ref={railLabel} className="text-[10px] uppercase tracking-[0.3em] text-fg-3 [writing-mode:vertical-rl]">
              Genesis
            </span>
          </div>

          {/* Scroll hint */}
          <div aria-hidden="true" data-layer="hint" className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex">
            <span className="text-[10px] uppercase tracking-[0.3em] text-fg-3">{hero.scrollHint}</span>
            <span className="relative h-10 w-px overflow-hidden bg-line">
              <span className="scroll-hint absolute inset-x-0 top-0 h-1/2 bg-fg-2" />
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
