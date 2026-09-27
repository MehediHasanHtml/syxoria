"use client";

import Image from "next/image";
import Link from "next/link";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { filmScenes } from "@/content/home";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/lib/site-config";
import overview from "@/public/product/dashboard-overview.png";
import insights from "@/public/product/dashboard-insights.png";
import projects from "@/public/product/dashboard-projects.png";

const images = { overview, insights, projects };
const SCENE_MS = 4200;

const FilmContext = createContext<{ open: () => void } | null>(null);

/** Opens the product film from anywhere on the homepage. */
export function useFilm() {
  const ctx = useContext(FilmContext);
  if (!ctx) throw new Error("useFilm must be used inside <FilmProvider>");
  return ctx;
}

export function FilmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open: () => setOpen(true) }), []);
  return (
    <FilmContext.Provider value={value}>
      {children}
      {open && <FilmDialog onClose={() => setOpen(false)} />}
    </FilmContext.Provider>
  );
}

/**
 * Full-screen product film. Plays `siteConfig.productFilm` when provided;
 * until then, a cinematic preview sequence of the real product screens.
 */
function FilmDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label="Syxoria product film"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="film-motion fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-canvas p-0 text-fg"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between px-5 sm:px-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-fg-3">Syxoria — the film</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close film"
            className="grid size-10 place-items-center rounded-full border border-line text-fg-2 transition-colors hover:border-fg-3 hover:text-fg"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 place-items-center px-4 pb-8 sm:px-8">
          {siteConfig.productFilm ? (
            <video src={siteConfig.productFilm} controls autoPlay playsInline className="aspect-video w-full max-w-6xl bg-black" />
          ) : (
            <PreviewSequence />
          )}
        </div>
      </div>
    </dialog>
  );
}

function PreviewSequence() {
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [ended, setEnded] = useState(false);
  const last = filmScenes.length - 1;

  useEffect(() => {
    if (!playing || ended) return;
    const t = window.setTimeout(() => {
      if (scene === last) setEnded(true);
      else setScene((s) => s + 1);
    }, SCENE_MS);
    return () => window.clearTimeout(t);
  }, [scene, playing, ended, last]);

  const replay = useCallback(() => {
    setScene(0);
    setEnded(false);
    setPlaying(true);
  }, []);

  return (
    <div className="flex w-full max-w-6xl flex-col gap-5">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-line bg-black">
        {filmScenes.map((s, i) => (
          <div
            key={i}
            aria-hidden={i !== scene}
            className={cn(
              "absolute inset-0 transition-opacity duration-[1200ms] ease-in-out-soft",
              i === scene && !ended ? "opacity-100" : "opacity-0",
            )}
          >
            <Image
              src={images[s.image]}
              alt=""
              fill
              sizes="(min-width: 1200px) 2048px, 100vw"
              className="object-cover grayscale"
              style={{
                transformOrigin: s.origin,
                // slow push-in while the scene is on screen
                transform: `scale(${i === scene && !ended ? s.zoom * 1.05 : s.zoom})`,
                transition: `transform ${SCENE_MS + 1200}ms linear`,
              }}
              priority={i === 0}
            />
          </div>
        ))}

        {/* captions */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-6 pb-6 pt-24 sm:px-10 sm:pb-9">
          <p key={ended ? "end" : scene} aria-live="polite" className="animate-fade-in font-display text-[clamp(1.25rem,0.9rem+1.6vw,2.25rem)] font-light tracking-tight text-fg">
            {ended ? "Your company, in a new dimension." : filmScenes[scene].caption}
          </p>
        </div>

        {ended && (
          <div className="absolute inset-0 grid animate-fade-in place-items-center bg-black/70">
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Link href="/signup" className="inline-flex h-11 items-center rounded-full bg-fg px-6 text-sm font-medium text-canvas transition-colors hover:bg-white">
                Start free
              </Link>
              <button
                type="button"
                onClick={replay}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-5 text-sm text-fg-2 transition-colors hover:border-fg-3 hover:text-fg"
              >
                <RotateCcw className="size-4" aria-hidden="true" /> Replay
              </button>
            </div>
          </div>
        )}
      </div>

      {/* controls: play/pause + scene progress */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => (ended ? replay() : setPlaying((p) => !p))}
          aria-label={playing && !ended ? "Pause" : "Play"}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-fg transition-colors hover:border-fg-3"
        >
          {playing && !ended ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
        </button>
        <ol className="flex flex-1 gap-1.5" aria-label="Scenes">
          {filmScenes.map((s, i) => (
            <li key={i} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  setScene(i);
                  setEnded(false);
                }}
                aria-label={`Scene ${i + 1}: ${s.caption}`}
                aria-current={i === scene ? "step" : undefined}
                className="group block w-full py-2"
              >
                <span className="relative block h-px overflow-hidden bg-line-strong">
                  <span
                    key={`${i}-${scene}-${playing}-${ended}`}
                    className={cn(
                      "absolute inset-y-0 left-0 bg-fg",
                      i < scene || ended ? "w-full" : i === scene ? (playing ? "film-progress" : "w-0") : "w-0",
                    )}
                    style={i === scene && playing && !ended ? { animationDuration: `${SCENE_MS}ms` } : undefined}
                  />
                </span>
              </button>
            </li>
          ))}
        </ol>
        <p className="hidden shrink-0 text-[11px] text-fg-3 sm:block">Preview · the full film is in production</p>
      </div>
    </div>
  );
}
