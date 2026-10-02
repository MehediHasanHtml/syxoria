"use client";

import { Pause, Play, RotateCcw, X } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { workspace } from "@/content/home";
import { siteConfig } from "@/lib/site-config";
import { DemoSteps } from "./demo-steps";
import { DISPLAY, LiveDashboard } from "./live-dashboard";

/** One run of the demo, playing on its own; then a breath, and it starts over. */
const RUN_MS = 22000;
const HOLD_MS = 2600;

type OpenOptions = {
  /** screen rect the demo grows out of (e.g. the product screen that was clicked) */
  from?: DOMRect;
};

const FilmContext = createContext<{ open: (options?: OpenOptions) => void } | null>(null);

/** Opens the product demo, fullscreen, from anywhere on the homepage. */
export function useFilm() {
  const ctx = useContext(FilmContext);
  if (!ctx) throw new Error("useFilm must be used inside <FilmProvider>");
  return ctx;
}

export function FilmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<OpenOptions | null>(null);
  const value = useMemo(() => ({ open: (options: OpenOptions = {}) => setOpen(options) }), []);
  return (
    <FilmContext.Provider value={value}>
      {children}
      {open && <FilmDialog options={open} onClose={() => setOpen(null)} />}
    </FilmContext.Provider>
  );
}

/**
 * The product, fullscreen. Plays `siteConfig.productFilm` when provided;
 * until then, the live workspace itself — the same session as on the page's
 * screen, playing on its own, with its story told underneath.
 */
function FilmDialog({ options, onClose }: { options: OpenOptions; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    // the demo grows out of the screen that was clicked
    const frame = d.querySelector<HTMLElement>("[data-film-frame]");
    const from = options.from;
    if (!frame || !from || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const to = frame.getBoundingClientRect();
    const tween = gsap.fromTo(
      frame,
      { x: from.left - to.left, y: from.top - to.top, scaleX: from.width / to.width, scaleY: from.height / to.height, transformOrigin: "0 0" },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.85, ease: "power3.inOut", clearProps: "transform" },
    );
    return () => {
      tween.kill();
      gsap.set(frame, { clearProps: "transform" });
    };
  }, [options]);

  return (
    <dialog
      ref={ref}
      aria-label="Syxoria — live demo"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="film-motion fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-canvas p-0 text-fg"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between px-5 sm:px-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-fg-3">Syxoria — live demo</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the demo"
            className="grid size-10 place-items-center rounded-full border border-line text-fg-2 transition-colors hover:border-fg-3 hover:text-fg"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 place-items-center px-4 pb-6 sm:px-8">
          {siteConfig.productFilm ? (
            <video data-film-frame src={siteConfig.productFilm} controls autoPlay playsInline className="aspect-video w-full max-w-6xl bg-black" />
          ) : (
            <AutoDemo />
          )}
        </div>
      </div>
    </dialog>
  );
}

/** The live workspace, playing on its own (a clock instead of the scroll), with play / pause and a timeline. */
function AutoDemo() {
  const [playing, setPlaying] = useState(true);
  const frame = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  // the clock: elapsed time of the current run, advanced only while playing
  const clock = useRef({ t: 0, last: 0, playing: true });
  useEffect(() => {
    clock.current.playing = playing;
  }, [playing]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) clock.current.t = RUN_MS; // the finished state, readable at once
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const c = clock.current;
      const dt = c.last ? Math.min(now - c.last, 100) : 0;
      c.last = now;
      if (c.playing && !reduced) c.t = (c.t + dt) % (RUN_MS + HOLD_MS);
      if (bar.current) bar.current.style.scale = `${Math.min(1, c.t / RUN_MS).toFixed(4)} 1`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // the dashboard keeps its own px size, scaled to fit the frame
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => el.style.setProperty("--s", String(e.contentRect.width / DISPLAY.w)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const progress = () => Math.min(1, clock.current.t / RUN_MS);
  const seek = (p: number) => {
    clock.current.t = Math.max(0, Math.min(1, p)) * RUN_MS;
  };

  return (
    <div className="flex w-full max-w-6xl flex-col gap-5">
      <div
        data-film-frame
        className="relative mx-auto w-[min(100%,calc((100dvh-15rem)*1.6))] rounded-[22px] bg-[#050506] p-[1.6%] shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.12),0_40px_120px_-30px_rgb(0_0_0/0.9)]"
      >
        <div ref={frame} className="relative aspect-[1200/750] overflow-hidden rounded-[6px]">
          <div className="absolute left-0 top-0 origin-top-left" style={{ scale: "var(--s, 1)" }}>
            <LiveDashboard progress={progress} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-fg transition-colors hover:border-fg-3"
        >
          {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={() => seek(0)}
          aria-label="Start over"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-fg-2 transition-colors hover:border-fg-3 hover:text-fg"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
        {/* the timeline: click anywhere to go there */}
        <button
          type="button"
          aria-label="Demo timeline"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek((e.clientX - r.left) / r.width);
          }}
          className="group relative h-8 flex-1"
        >
          <span className="absolute inset-x-0 top-1/2 block h-px -translate-y-1/2 bg-line-strong transition-[height] group-hover:h-[3px]" />
          <span ref={bar} className="absolute inset-x-0 top-1/2 block h-px origin-left -translate-y-1/2 bg-fg transition-[height] group-hover:h-[3px]" style={{ scale: "0 1" }} />
        </button>
      </div>
      <DemoSteps progress={progress} className="max-sm:hidden" />
      <p className="sr-only">{workspace.demo.summary}</p>
    </div>
  );
}
