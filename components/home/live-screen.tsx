"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { Maximize2 } from "lucide-react";
import { workspace } from "@/content/home";
import type { CoreState } from "@/lib/core/state";
import { RUN_MS, HOLD_MS, useFilm } from "./film";
import { DISPLAY, LiveDashboard } from "./live-dashboard";

/** The lid's bezel around the display, in CSS px (LAPTOP in core-scene.ts is the sum). */
const BEZEL = { x: 22, top: 26, bottom: 32 };
const FRONT = { w: DISPLAY.w + BEZEL.x * 2, h: DISPLAY.h + BEZEL.top + BEZEL.bottom };

/**
 * The front of the laptop's lid, rendered by the scene in 3D beside the Core
 * (the rest of the laptop is added there, see CoreScene.buildMonitor).
 *
 * The dashboard on it plays on its own — a short session, then a breath, then
 * again — from the moment the laptop appears, wherever the scroll is. It also
 * writes its progress to `state.live`, so the chapter's step-by-step caption follows it.
 *
 *   mouse     hover → an "open fullscreen" cue glides after the pointer · click → the demo opens fullscreen
 *   touch     tap → fullscreen
 * It duplicates the chapter's own button, so it stays out of the tab order.
 */
export function LiveScreen({ state }: { state: CoreState }) {
  const root = useRef<HTMLDivElement>(null);
  const display = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState(false);
  const film = useFilm();

  // the demo's clock: runs while the laptop is out, starts over each time it appears
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(now - last, 100) : 0;
      last = now;
      if (state.screen <= 0.002) t = 0;
      else t = reduced ? RUN_MS : (t + dt) % (RUN_MS + HOLD_MS);
      state.live = Math.min(1, t / RUN_MS);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  // the "open fullscreen" cue: in screen space (readable whatever the laptop's size), eased towards the pointer
  useEffect(() => {
    const c = cursor.current;
    if (!hover || !c) return;
    let x = -1;
    let y = -1;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    const loop = () => {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      c.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    const move = (e: globalThis.PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (x < 0) {
        x = tx;
        y = ty;
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, [hover]);

  const open = () => {
    setHover(false);
    film.open({ from: display.current?.getBoundingClientRect(), at: state.live < 1 ? state.live : 0 });
  };
  const onEnter = (e: PointerEvent) => e.pointerType === "mouse" && setHover(true);

  return (
    <div
      ref={root}
      role="button"
      tabIndex={-1}
      aria-label={workspace.demo.openFull}
      onClick={open}
      onPointerEnter={onEnter}
      onPointerLeave={() => setHover(false)}
      style={{ width: FRONT.w, height: FRONT.h, padding: `${BEZEL.top}px ${BEZEL.x}px ${BEZEL.bottom}px` }}
      className="relative cursor-none select-none rounded-[26px] bg-[#050506] shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.12),inset_0_0_0_3px_#1d1e20]"
    >
      {/* a camera in the bezel */}
      <span aria-hidden="true" className="absolute left-1/2 top-[10px] size-1.5 -translate-x-1/2 rounded-full bg-[#16171a] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]" />
      <div ref={display} className="relative overflow-hidden rounded-[6px]">
        <LiveDashboard progress={() => (state.screen > 0.002 ? state.live : 0)} />
        {/* glass: a faint reflection across the screen */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgb(255_255_255/0.035)_45%,transparent_55%)]" />
      </div>

      {/* hover: a quiet "open fullscreen" cue that glides after the pointer */}
      {createPortal(
        <span
          ref={cursor}
          aria-hidden="true"
          data-shown={hover || undefined}
          className="pointer-events-none fixed left-0 top-0 z-(--z-toast) flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-fg py-1.5 pl-1.5 pr-4 text-[13px] font-medium text-canvas opacity-0 shadow-[0_16px_50px_rgb(0_0_0/0.5)] transition-opacity duration-300 data-[shown]:opacity-100"
        >
          <span className="grid size-6 place-items-center rounded-full bg-canvas text-fg">
            <Maximize2 className="size-3" />
          </span>
          {workspace.demo.openFull}
        </span>,
        document.body,
      )}
    </div>
  );
}
