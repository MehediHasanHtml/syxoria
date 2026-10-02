"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { Maximize2 } from "lucide-react";
import { workspace } from "@/content/home";
import type { CoreState } from "@/lib/core/state";
import { useFilm } from "./film";
import { DISPLAY, LiveDashboard } from "./live-dashboard";

/** The monitor's front, in CSS px: the display plus its bezel (MONITOR in core-scene.ts). */
const BEZEL = 24;
const FRONT = { w: DISPLAY.w + BEZEL * 2, h: DISPLAY.h + BEZEL * 2 };

/**
 * The front of the product monitor, rendered by the scene in 3D beside the
 * Core (its back, edges and stand are added there, see CoreScene.buildMonitor).
 * The dashboard on it runs with the scroll (`state.live`).
 *
 *   mouse     hover → an "open fullscreen" cursor glides after the pointer · click → the demo opens fullscreen
 *   touch     tap → fullscreen
 * It duplicates the chapter's own button, so it stays out of the tab order.
 */
export function LiveScreen({ state }: { state: CoreState }) {
  const root = useRef<HTMLDivElement>(null);
  const display = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);
  const film = useFilm();

  // the "open fullscreen" cursor: eased towards the pointer, so it glides instead of sticking to it
  useEffect(() => {
    const c = cursor.current;
    const el = root.current;
    if (!c || !el) return;
    let x = FRONT.w / 2;
    let y = FRONT.h / 2;
    let tx = x;
    let ty = y;
    let raf = 0;
    const loop = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      c.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    const hit = el.querySelector<HTMLElement>("[data-hit]");
    const move = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      // the hit layer covers the whole front: its offset is the pointer in the front's own (untransformed) px
      tx = e.offsetX;
      ty = e.offsetY;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    hit?.addEventListener("pointermove", move);
    return () => {
      hit?.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  const open = () => film.open({ from: display.current?.getBoundingClientRect() });
  const onEnter = (e: PointerEvent) => e.pointerType === "mouse" && root.current?.setAttribute("data-hover", "");
  const onLeave = () => root.current?.removeAttribute("data-hover");

  return (
    <div
      ref={root}
      role="button"
      tabIndex={-1}
      aria-label={workspace.demo.openFull}
      onClick={open}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      style={{ width: FRONT.w, height: FRONT.h, padding: BEZEL }}
      className="group relative cursor-none select-none rounded-[28px] bg-[#050506] shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.12),inset_0_0_0_3px_#1d1e20]"
    >
      {/* a camera in the bezel */}
      <span aria-hidden="true" className="absolute left-1/2 top-[10px] size-1.5 -translate-x-1/2 rounded-full bg-[#16171a] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]" />
      <div ref={display} className="relative overflow-hidden rounded-[6px]">
        <LiveDashboard progress={() => (state.screen > 0.002 ? state.live : 0)} />
        {/* glass: a faint reflection across the screen */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgb(255_255_255/0.035)_45%,transparent_55%)]" />
      </div>

      {/* takes the pointer for the whole front, so the cursor below can follow it in the front's own px */}
      <span data-hit aria-hidden="true" className="absolute inset-0 rounded-[28px]" />

      {/* hover: a quiet "open fullscreen" cursor that glides after the pointer */}
      <span
        ref={cursor}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-full bg-fg py-2.5 pl-3 pr-5 text-[16px] font-medium text-canvas opacity-0 shadow-[0_20px_60px_rgb(0_0_0/0.5)] transition-opacity duration-300 group-data-[hover]:opacity-100"
      >
        <span className="grid size-8 place-items-center rounded-full bg-canvas text-fg">
          <Maximize2 className="size-3.5" />
        </span>
        {workspace.demo.openFull}
      </span>
    </div>
  );
}
