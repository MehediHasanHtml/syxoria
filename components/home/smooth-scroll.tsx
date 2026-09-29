"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { easeInOutCubic, motion } from "@/lib/motion";

type SmoothScroll = {
  /** Smoothly scroll to "#id", an element or a y position. */
  scrollTo: (target: string | HTMLElement | number) => void;
  /** Resume scrolling (it is held while the preloader counts). */
  start: () => void;
};

const Ctx = createContext<SmoothScroll | null>(null);

export function useSmoothScroll() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSmoothScroll must be used inside <SmoothScrollProvider>");
  return ctx;
}

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so the scroll-scrubbed story
 * and the scroll position never drift apart. Off for reduced motion (native
 * scrolling, instant jumps). In-page links (`#id`) glide there too.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({
      autoRaf: false,
      lerp: 0.085,
      anchors: { duration: motion.nav.duration, easing: easeInOutCubic },
      // dialogs and sheets scroll natively
      prevent: (node) => !!node.closest?.("dialog"),
    });
    l.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => l.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    // the preloader holds the page; it calls start() when it lifts
    if (document.documentElement.style.overflow === "hidden") l.stop();
    lenis.current = l;
    return () => {
      gsap.ticker.remove(raf);
      l.destroy();
      lenis.current = null;
    };
  }, []);

  const value = useMemo<SmoothScroll>(
    () => ({
      scrollTo: (target) => {
        const l = lenis.current;
        if (l) {
          l.scrollTo(target, { duration: motion.nav.duration, easing: easeInOutCubic });
          return;
        }
        if (typeof target === "number") return window.scrollTo({ top: target });
        const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
        el?.scrollIntoView();
      },
      start: () => lenis.current?.start(),
    }),
    [],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
