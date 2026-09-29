"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { CoreAnchors, CoreState } from "@/lib/core/state";

type Props = {
  /** Mutable scene state, read every frame — mutate it (e.g. with GSAP) to drive the Core. */
  state: CoreState;
  className?: string;
  label?: string;
  /** Pointer parallax */
  interactive?: boolean;
  nodeCount?: number;
  /** Screen positions of the module orbs and tool nodes, every frame. */
  onFrame?: (anchors: CoreAnchors) => void;
  /** Called once the scene has compiled and drawn its first frame (or failed to). */
  onReady?: () => void;
};

/**
 * The Core, rendered with WebGL. three.js is loaded on demand so the page's
 * text paints first; the canvas only renders while it is on screen and the
 * tab is visible. Without WebGL, a quiet CSS glow stands in.
 */
export function CoreCanvas({ state, className, label, interactive = true, nodeCount, onFrame, onReady }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const callbacks = useRef({ onFrame, onReady });
  useEffect(() => {
    callbacks.current = { onFrame, onReady };
  });

  useEffect(() => {
    let disposed = false;
    const cleanup: (() => void)[] = [];

    const fail = () => {
      if (disposed) return;
      setStatus("failed");
      callbacks.current.onReady?.();
    };

    (async () => {
      const mod = await import("@/lib/core/core-scene").catch(() => null);
      if (disposed) return;
      const el = wrap.current;
      const cv = canvas.current;
      if (!mod || !el || !cv || !mod.webglAvailable()) return fail();

      // let the page (and the preloader) paint before the heavy build
      await new Promise((r) => setTimeout(r, 80));
      if (disposed) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const low = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4;
      // Sculpting the rock is the heaviest CPU step: do it in its own task, then
      // yield again before building the rest, so no single task blocks for long.
      const rockGeometry = mod.buildRockGeometry(low ? mod.ROCK_DETAIL.low : mod.ROCK_DETAIL.high);
      await new Promise((r) => setTimeout(r, 0));
      if (disposed) return rockGeometry.dispose();
      let scene: InstanceType<typeof mod.CoreScene>;
      try {
        scene = new mod.CoreScene(cv, {
          state,
          quality: low ? "low" : "high",
          interactive,
          reducedMotion: reduced,
          nodeCount,
          rockGeometry,
          onFrame: (a) => callbacks.current.onFrame?.(a),
        });
      } catch {
        return fail();
      }
      cleanup.push(() => scene.dispose());
      await scene.ready;
      if (disposed) return;
      setStatus("ready");
      callbacks.current.onReady?.();

      let visible = false;
      const sync = () => (visible && !document.hidden ? scene.start() : scene.stop());
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        sync();
      });
      io.observe(el);
      const ro = new ResizeObserver(([e]) => scene.setSize(e.contentRect.width, e.contentRect.height));
      ro.observe(el);
      document.addEventListener("visibilitychange", sync);
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "mouse") scene.setPointer((e.clientX / window.innerWidth) * 2 - 1, 1 - (e.clientY / window.innerHeight) * 2);
      };
      if (interactive) window.addEventListener("pointermove", onMove, { passive: true });
      const onLost = (e: Event) => {
        e.preventDefault();
        scene.stop();
        setStatus("failed");
      };
      cv.addEventListener("webglcontextlost", onLost);
      cleanup.push(() => {
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", sync);
        window.removeEventListener("pointermove", onMove);
        cv.removeEventListener("webglcontextlost", onLost);
      });
    })();

    return () => {
      disposed = true;
      cleanup.reverse().forEach((fn) => fn());
    };
  }, [state, interactive, nodeCount]);

  return (
    <div ref={wrap} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={cn("overflow-hidden", className)}>
      <canvas
        ref={canvas}
        className={cn("absolute inset-0 size-full transition-opacity duration-1000 ease-out-soft", status === "ready" ? "opacity-100" : "opacity-0")}
      />
      {status === "failed" && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative aspect-square w-[min(38%,22rem)]">
            <div className="absolute inset-[-40%] rounded-full bg-[radial-gradient(closest-side,rgb(255_140_50/0.22),transparent)]" />
            <div className="absolute inset-[12%] rounded-[46%_54%_50%_50%/55%_52%_48%_45%] bg-[radial-gradient(circle_at_50%_58%,#ffb45a_0%,#a0400e_14%,#1b1512_34%,#0b0a09_70%)] shadow-[0_0_80px_-10px_rgb(255_140_50/0.45)]" />
          </div>
        </div>
      )}
    </div>
  );
}
