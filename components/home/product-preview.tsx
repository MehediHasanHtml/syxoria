"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useEffect, useId, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { filmScenes, workspace } from "@/content/home";
import { cn } from "@/lib/cn";
import { filmImages, useFilm } from "./film";
import { useCanHover } from "./use-explore";

const SCENE_MS = 2600;

/**
 * The product screen. It comes alive on its own terms, cheaply (a few
 * crossfading screenshots, loaded on first use):
 *
 *   mouse     hover → the demo previews · click → the full demo opens from it
 *   touch     tap → preview · tap again → full demo
 *   keyboard  focus → preview · Enter → full demo
 */
export function ProductPreview({ active }: { active: boolean }) {
  const film = useFilm();
  const canHover = useCanHover();
  const [previewing, setPreviewing] = useState(false);
  // the other screens load the first time the preview runs
  const [armed, setArmed] = useState(false);
  const [scene, setScene] = useState(0);
  const lastPointer = useRef("");
  const frame = useRef<HTMLSpanElement>(null);
  const hintId = useId();
  // leaving the chapter ends the preview
  const playing = previewing && active;

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setScene((s) => (s + 1) % filmScenes.length), SCENE_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  const start = () => {
    setArmed(true);
    setPreviewing(true);
  };
  const stop = () => {
    setPreviewing(false);
    setScene(0);
  };
  const openFull = () => film.open({ from: frame.current?.getBoundingClientRect(), scene: playing ? scene : 0 });

  const onClick = (e: MouseEvent) => {
    const touch = e.detail > 0 && (lastPointer.current === "touch" || lastPointer.current === "pen");
    if (touch && !playing) start();
    else openFull();
  };
  const mouse = (fn: () => void) => (e: PointerEvent) => e.pointerType === "mouse" && fn();
  const shown = playing ? scene : 0;

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        onPointerDown={(e) => (lastPointer.current = e.pointerType)}
        onPointerEnter={mouse(start)}
        onPointerLeave={mouse(stop)}
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && start()}
        onBlur={stop}
        aria-label={`${workspace.demo.label} (${workspace.demo.duration})`}
        aria-describedby={hintId}
        aria-haspopup="dialog"
        className="group relative block w-full cursor-pointer rounded-[18px] border border-white/10 bg-white/[0.035] p-1.5 text-left shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)] backdrop-blur-xl transition-[border-color,transform] duration-500 ease-out-soft hover:border-white/20 side:p-2"
      >
        {/* window bar: it is the product, not a picture of it */}
        <span className="flex h-7 items-center justify-between px-2 text-[10.5px] text-fg-3 side:px-2.5">
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-fg-3/50" />
            syxoria.app / workspace
          </span>
          <span className={cn("flex items-center gap-1.5 uppercase tracking-[0.2em] transition-opacity duration-300", playing ? "opacity-100" : "opacity-0")}>
            <span className="size-1.5 animate-pulse-soft rounded-full bg-accent" />
            {workspace.demo.live}
          </span>
        </span>

        <span ref={frame} className="relative block aspect-[16/10] overflow-hidden rounded-[11px] bg-black">
          {filmScenes.map((s, i) =>
            i === 0 || armed ? (
              <Image
                key={i}
                src={filmImages[s.image]}
                alt=""
                fill
                sizes="(min-width: 1024px) 56vw, 92vw"
                className="object-cover object-top grayscale"
                style={{
                  opacity: shown === i ? 1 : 0,
                  transformOrigin: s.origin,
                  transform: `scale(${shown === i && playing ? s.zoom * 1.04 : s.zoom})`,
                  transition: `opacity 700ms var(--ease-in-out-soft), transform ${playing ? SCENE_MS + 700 : 700}ms ${playing ? "linear" : "var(--ease-out-soft)"}`,
                }}
              />
            ) : null,
          )}

          {/* idle: a quiet invitation */}
          <span className={cn("absolute inset-0 grid place-items-center bg-black/25 transition-opacity duration-500", playing ? "opacity-0" : "opacity-100")}>
            <span className="grid size-14 place-items-center rounded-full bg-fg text-canvas shadow-[0_10px_40px_rgb(0_0_0/0.5)] transition-transform duration-500 ease-out-soft group-hover:scale-110">
              <Play className="ml-0.5 size-4 fill-current" aria-hidden="true" />
            </span>
          </span>

          {/* previewing: captions + progress, and the way into the full demo */}
          <span className={cn("absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3.5 pt-14 transition-opacity duration-500 side:px-5 side:pb-4", playing ? "opacity-100" : "opacity-0")}>
            <span key={shown} className="block animate-fade-in font-display text-[15px] font-light tracking-tight text-fg side:text-lg">
              {filmScenes[shown].caption}
            </span>
            <span className="mt-3 flex gap-1">
              {filmScenes.map((_, i) => (
                <span key={i} className="relative h-px flex-1 overflow-hidden bg-white/20">
                  <span className={cn("absolute inset-y-0 left-0 bg-fg", i < shown ? "w-full" : i === shown && playing ? "film-progress" : "w-0")} style={i === shown && playing ? { animationDuration: `${SCENE_MS}ms` } : undefined} key={`${i}-${shown}-${playing}`} />
                </span>
              ))}
            </span>
          </span>
          <span
            className={cn(
              "absolute right-3 top-3 rounded-full bg-fg px-3 py-1.5 text-[11.5px] font-medium text-canvas shadow-lg transition-[opacity,transform] duration-300 ease-out-soft",
              playing ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
            )}
          >
            {workspace.demo.openFull}
          </span>
        </span>
      </button>
      <p id={hintId} className="mt-3 text-[11px] uppercase tracking-[0.24em] text-fg-3 short:hidden">
        {canHover ? workspace.demo.hint.pointer : playing ? workspace.demo.tapAgain : workspace.demo.hint.touch}
      </p>
    </div>
  );
}
