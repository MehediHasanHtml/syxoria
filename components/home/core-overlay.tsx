"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { hero, integrations } from "@/content/home";
import { cn } from "@/lib/cn";
import type { CoreAnchors } from "@/lib/core/state";
import { productModules } from "@/lib/mock-data/modules";
import type { Explore } from "./use-explore";

export type CoreOverlayHandle = {
  /** Called every frame with where the scene's points are on screen. */
  update: (anchors: CoreAnchors, words: DOMRect | null, coreClickable: boolean) => void;
};

const MARGIN = 10;
const TOP = 80;
const HIT = 40; // branch hit circle, px

const overlaps = (x: number, y: number, w: number, h: number, r: DOMRect | null, pad = 14) =>
  !!r && x < r.right + pad && x + w > r.left - pad && y < r.bottom + pad && y + h > r.top - pad;

/**
 * The DOM layer over the Core, positioned by the scene every frame:
 *   · one target per module branch (hover / tap to explore, click to open)
 *   · the name of each connected tool
 *   · the Core itself, clickable at the start of the story ("open the Core")
 * Branch targets duplicate the module list beside the Core, so they stay out
 * of the tab order; the list is the accessible control.
 */
export function CoreOverlay({ ref, focus, explore, onOpenCore }: { ref: Ref<CoreOverlayHandle>; focus: number | null; explore: Explore; onOpenCore: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const branchEls = useRef<(HTMLButtonElement | null)[]>([]);
  const toolEls = useRef<(HTMLDivElement | null)[]>([]);
  const coreEl = useRef<HTMLButtonElement>(null);
  const toolSizes = useRef(new Map<HTMLElement, { w: number; h: number }>());
  // branch target widths, with the full name and with the number only
  const branchWidths = useRef(new Map<HTMLElement, { full: number; compact: number }>());
  // room kept free on the right for the numbered navigation (--rail-w, in rem)
  const railW = useRef(0);

  useEffect(() => {
    const sizes = toolSizes.current;
    const measure = () => {
      sizes.clear();
      const root = getComputedStyle(document.documentElement);
      railW.current = (parseFloat(root.getPropertyValue("--rail-w")) || 0) * parseFloat(root.fontSize);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  // exploring changes the labels' width (the role appears): measure again
  useEffect(() => {
    branchWidths.current.clear();
  }, [focus]);

  useImperativeHandle(
    ref,
    () => ({
      update(a, words, coreClickable) {
        const el = box.current;
        if (!el) return;
        const W = el.clientWidth;
        const H = el.clientHeight;
        const right = W - railW.current - MARGIN;

        // Branch targets: the hit circle sits on the node, the name opens away from the Core
        a.branches.forEach((p, i) => {
          const b = branchEls.current[i];
          if (!b) return;
          const alpha = p.y < TOP - 10 || p.y > H - 8 ? 0 : p.alpha;
          const shown = alpha > 0.05;
          if (b.style.visibility !== (shown ? "visible" : "hidden")) b.style.visibility = shown ? "visible" : "hidden";
          if (!shown) return;
          // the name opens away from the Core; where it has no room it shrinks to its number
          const left = p.x < a.core.x;
          const side = left ? "left" : "right";
          if (b.dataset.side !== side) b.dataset.side = side;
          let widths = branchWidths.current.get(b);
          if (!widths) {
            delete b.dataset.compact;
            const full = b.offsetWidth;
            b.dataset.compact = "";
            widths = { full, compact: b.offsetWidth };
            branchWidths.current.set(b, widths);
          }
          const y = p.y - HIT / 2;
          const at = (w: number) => (left ? p.x + HIT / 2 - w : p.x - HIT / 2);
          const fits = (w: number) => at(w) >= MARGIN && at(w) + w <= right && !overlaps(at(w), y, w, HIT, words);
          const full = fits(widths.full);
          const w = full ? widths.full : widths.compact;
          if (full === "compact" in b.dataset) {
            if (full) delete b.dataset.compact;
            else b.dataset.compact = "";
          }
          const x = at(w);
          b.style.opacity = alpha.toFixed(3);
          b.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
          // never on the words or off screen; the node itself stays reachable
          const label = b.lastElementChild as HTMLElement | null;
          if (label) label.style.opacity = full || fits(w) ? "" : "0";
        });

        // Tool names, below their node, clamped on screen and nudged apart
        const placed: { x: number; y: number; w: number; h: number; el: HTMLElement }[] = [];
        a.nodes.forEach((p, i) => {
          const t = toolEls.current[i];
          if (!t) return;
          if (p.alpha < 0.01) {
            if (t.style.opacity !== "0") t.style.opacity = "0";
            return;
          }
          t.style.opacity = p.alpha.toFixed(3);
          let size = toolSizes.current.get(t);
          if (!size) toolSizes.current.set(t, (size = { w: t.offsetWidth, h: t.offsetHeight }));
          const x = Math.min(Math.max(p.x - size.w / 2, MARGIN), W - MARGIN - size.w);
          const y = Math.min(Math.max(p.y + 10, TOP), H - MARGIN - size.h);
          if (overlaps(x, y, size.w, size.h, words, 16)) {
            t.style.opacity = "0";
            return;
          }
          placed.push({ x, y, w: size.w, h: size.h, el: t });
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

        // The Core as a target
        const c = coreEl.current;
        if (c) {
          const on = coreClickable && a.core.alpha > 0.5 && a.core.r > 8;
          if (c.style.visibility !== (on ? "visible" : "hidden")) c.style.visibility = on ? "visible" : "hidden";
          if (on) {
            // resized in 8px steps only: a size change costs a layout, the position does not
            const d = Math.round((a.core.r * 2) / 8) * 8;
            const size = `${d}px`;
            if (c.style.width !== size) c.style.width = c.style.height = size;
            c.style.transform = `translate3d(${(a.core.x - d / 2).toFixed(1)}px, ${(a.core.y - d / 2).toFixed(1)}px, 0)`;
          }
        }
      },
    }),
    [],
  );

  return (
    <div ref={box} className="pointer-events-none absolute inset-0 overflow-hidden">
      <button
        ref={coreEl}
        type="button"
        onClick={onOpenCore}
        aria-label={`${hero.coreHint} — explore the six modules`}
        className="group pointer-events-auto invisible absolute left-0 top-0 rounded-full"
      >
        <span className="absolute left-1/2 top-full mt-4 -translate-x-1/2 whitespace-nowrap text-[11px] uppercase tracking-[0.3em] text-fg-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          {hero.coreHint}
        </span>
      </button>

      {productModules.map((m, i) => {
        const on = focus === i;
        return (
          <button
            key={m.key}
            ref={(n) => void (branchEls.current[i] = n)}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            {...explore(i)}
            // pointer-only target (the module list is the focusable control): clicking must not move focus here
            onMouseDown={(e) => e.preventDefault()}
            data-active={on || undefined}
            className="group pointer-events-auto invisible absolute left-0 top-0 flex items-center will-change-transform data-[side=left]:flex-row-reverse"
          >
            <span className="grid size-10 place-items-center">
              <span className={cn("size-7 rounded-full border transition-[border-color,transform] duration-300 ease-out-soft", on ? "scale-110 border-white/35" : "border-white/0 group-hover:border-white/20")} />
            </span>
            <span
              className={cn(
                "flex items-baseline gap-2 whitespace-nowrap rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.2em] transition-[color,background-color,opacity] duration-300 ease-out-soft [text-shadow:0_1px_12px_rgb(0_0_0/0.9)]",
                on ? "bg-black/40 text-fg backdrop-blur-md" : focus !== null ? "text-fg-3" : "text-fg-2",
              )}
            >
              <span className={cn("tabular", on ? "text-accent" : "text-fg-3")}>{String(i + 1).padStart(2, "0")}</span>
              {/* phones: the number marks the branch; the module names are in the row below */}
              <span className={cn("group-data-[compact]:hidden", !on && "max-sm:hidden")}>{m.name}</span>
              {on && <span className="text-fg-3 group-data-[compact]:hidden">{m.role}</span>}
            </span>
          </button>
        );
      })}

      {integrations.tools.map((t, i) => (
        <div
          key={t.id}
          ref={(n) => void (toolEls.current[i] = n)}
          aria-hidden="true"
          className="absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-black/40 py-1 pl-1.5 pr-2.5 text-[11px] text-fg-2 opacity-0 backdrop-blur-md will-change-transform"
        >
          <IntegrationLogo id={t.id} size={13} />
          {t.name}
        </div>
      ))}
    </div>
  );
}
