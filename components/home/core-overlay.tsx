"use client";

import { useEffect, useImperativeHandle, useRef, type PointerEvent, type Ref } from "react";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { hero, integrations, oneCore } from "@/content/home";
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

const overlaps = (x: number, y: number, w: number, h: number, r: DOMRect | null, pad = 14) =>
  !!r && x < r.right + pad && x + w > r.left - pad && y < r.bottom + pad && y + h > r.top - pad;

type Props = {
  ref: Ref<CoreOverlayHandle>;
  /** the module being explored */
  focus: number | null;
  explore: Explore;
  /** the tool being pointed at, and how to point at one */
  tool: number | null;
  onTool: (i: number | null) => void;
  onOpenCore: () => void;
};

/**
 * The DOM layer over the Core, positioned by the scene every frame:
 *   · each module, named at the edge of its own fragment of the opened Core (a lit point on the fragment,
 *     its name just outside — no wires); hover / tap to explore, click to open
 *   · the three areas of the brain, each written beside the place it works
 *   · each connected tool: pointing at it sends a pulse down its wire
 *   · the Core itself, clickable at the start of the story ("open the Core")
 * Module targets duplicate the module list beside the Core, so they stay out
 * of the tab order; the list is the accessible control.
 */
export function CoreOverlay({ ref, focus, explore, tool, onTool, onOpenCore }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const moduleEls = useRef<(HTMLDivElement | null)[]>([]);
  const toolEls = useRef<(HTMLDivElement | null)[]>([]);
  const coreEl = useRef<HTMLButtonElement>(null);
  const zoneEls = useRef<(HTMLDivElement | null)[]>([]);
  const toolSizes = useRef(new Map<HTMLElement, { w: number; h: number }>());
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

  useImperativeHandle(
    ref,
    () => ({
      update(a, words, coreClickable) {
        const el = box.current;
        if (!el) return;
        const W = el.clientWidth;
        const H = el.clientHeight;
        const right = W - railW.current - MARGIN;

        // Modules: a lit point on each fragment, its name just outside the Core's edge, in the fragment's direction
        a.modules.forEach((p, i) => {
          const m = moduleEls.current[i];
          if (!m) return;
          const shown = p.alpha > 0.04;
          if (m.style.visibility !== (shown ? "visible" : "hidden")) m.style.visibility = shown ? "visible" : "hidden";
          if (!shown) return;
          const dot = m.firstElementChild as HTMLElement;
          const label = m.lastElementChild as HTMLElement;
          const dx = p.x - a.core.x;
          const dy = p.y - a.core.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const R = a.core.r * 1.22 + 12;
          const ax = a.core.x + ux * R;
          const ay = a.core.y + uy * R;
          const lw = label.offsetWidth;
          const lh = label.offsetHeight;
          // above / below the Core the name is centred on its direction; on the sides it opens away from it
          const vertical = Math.abs(ux) < 0.4;
          const side = vertical ? (uy < 0 ? "top" : "bottom") : ux < 0 ? "left" : "right";
          let lx = vertical ? ax - lw / 2 : ux < 0 ? ax - lw : ax;
          let ly = vertical ? (uy < 0 ? ay - lh : ay) : ay - lh / 2;
          lx = Math.min(Math.max(lx, MARGIN), right - lw);
          ly = Math.min(Math.max(ly, TOP), H - MARGIN - lh);
          const hidden = overlaps(lx, ly, lw, lh, words, 10);
          m.style.opacity = p.alpha.toFixed(3);
          dot.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
          label.style.transform = `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 0)`;
          label.style.opacity = hidden ? "0" : "";
          if (label.dataset.side !== side) label.dataset.side = side;
        });

        // Tool names, below their node, clamped on screen and nudged apart
        const placed: { x: number; y: number; w: number; h: number; el: HTMLElement }[] = [];
        a.nodes.forEach((p, i) => {
          const t = toolEls.current[i];
          if (!t) return;
          const shown = p.alpha > 0.01;
          if (t.style.visibility !== (shown ? "visible" : "hidden")) t.style.visibility = shown ? "visible" : "hidden";
          if (!shown) return;
          t.style.opacity = p.alpha.toFixed(3);
          let size = toolSizes.current.get(t);
          if (!size) toolSizes.current.set(t, (size = { w: t.offsetWidth, h: t.offsetHeight }));
          const x = Math.min(Math.max(p.x - size.w / 2, MARGIN), W - MARGIN - size.w);
          const y = Math.min(Math.max(p.y + 10, TOP), H - MARGIN - size.h);
          if (overlaps(x, y, size.w, size.h, words, 16)) {
            t.style.visibility = "hidden";
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

        // The three areas of the brain: each step of "one core" is written beside the place it works,
        // outside the Core's silhouette, joined to it by a fine leader line
        a.zones.forEach((p, i) => {
          const z = zoneEls.current[i];
          if (!z) return;
          const shown = p.alpha > 0.02;
          if (z.style.visibility !== (shown ? "visible" : "hidden")) z.style.visibility = shown ? "visible" : "hidden";
          if (!shown) return;
          const label = z.lastElementChild as HTMLElement;
          const line = z.firstElementChild as HTMLElement;
          // (a zone facing the viewer, like the heart, has no clear direction: it goes to the left)
          let dx = p.x - a.core.x;
          let dy = p.y - a.core.y;
          if (Math.hypot(dx, dy) < a.core.r * 0.35) {
            dx = -1;
            dy = -0.15;
          }
          const len = Math.hypot(dx, dy);
          const ux = dx / len;
          const uy = dy / len;
          const lw = label.offsetWidth;
          const lh = label.offsetHeight;
          const out = a.core.r * 1.2 + 28;
          const place = (side: number) => {
            const x = a.core.x + side * Math.max(Math.abs(ux), 0.55) * out + (side < 0 ? -lw : 0);
            return { x, fits: x >= MARGIN && x + lw <= right };
          };
          // where it has no room on its own side, it goes to the other side of the Core —
          // and where neither side has room (phones), below the Core
          let left = ux < 0;
          let spot = place(left ? -1 : 1);
          if (!spot.fits) {
            const other = place(left ? 1 : -1);
            if (other.fits) {
              left = !left;
              spot = other;
            }
          }
          const below = !spot.fits;
          const lx = Math.min(Math.max(below ? a.core.x - lw / 2 : spot.x, MARGIN), right - lw);
          let ly = below ? a.core.y + a.core.r * 1.3 + 18 : a.core.y + uy * out * 0.8 - lh / 2;
          ly = Math.min(Math.max(ly, TOP), H - MARGIN - lh);
          if (overlaps(lx, ly, lw, lh, words, 12) && words) ly = Math.max(TOP, words.top - lh - 16);
          // the line runs from the zone to the label's near edge
          const ex = below ? lx + lw / 2 : left ? lx + lw : lx;
          const ey = below ? ly - 6 : ly + lh / 2;
          const lineLen = Math.hypot(ex - p.x, ey - p.y);
          z.style.opacity = p.alpha.toFixed(3);
          line.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) rotate(${Math.atan2(ey - p.y, ex - p.x).toFixed(4)}rad)`;
          line.style.width = `${lineLen.toFixed(1)}px`;
          label.style.transform = `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 0)`;
          const side = below ? "below" : left ? "left" : "right";
          if (label.dataset.side !== side) label.dataset.side = side;
        });

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

  const mouse = (fn: () => void) => (e: PointerEvent) => e.pointerType === "mouse" && fn();

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
          <div key={m.key} ref={(n) => void (moduleEls.current[i] = n)} aria-hidden="true" className="invisible absolute inset-0">
            {/* the point of light on the module's fragment */}
            <span className="absolute left-0 top-0 will-change-transform">
              <span
                className={cn(
                  "absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--core-light)] transition-[transform,box-shadow] duration-500 ease-out-soft",
                  on ? "scale-150 shadow-[0_0_14px_4px_var(--core-glow)]" : "shadow-[0_0_8px_2px_var(--core-glow)]",
                )}
              />
              {on && <span className="module-ring absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--core-light)]" />}
            </span>
            {/* its name, just outside the Core: hover / tap to explore, click to open */}
            <button
              type="button"
              tabIndex={-1}
              {...explore(i)}
              // pointer-only target (the module list is the focusable control): clicking must not move focus here
              onMouseDown={(e) => e.preventDefault()}
              className="group pointer-events-auto absolute left-0 top-0 flex items-baseline gap-2 whitespace-nowrap rounded-full px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] transition-[color,background-color,opacity] duration-300 ease-out-soft will-change-transform [text-shadow:0_1px_12px_rgb(0_0_0/0.9)] data-[side=left]:flex-row-reverse"
            >
              <span className={cn("tabular", on ? "text-accent" : "text-fg-3")}>{String(i + 1).padStart(2, "0")}</span>
              <span className={cn("transition-colors", on ? "text-fg" : focus !== null ? "text-fg-3" : "text-fg-2 group-hover:text-fg")}>{m.name}</span>
              <span className={cn("text-fg-3 transition-opacity duration-300 max-sm:hidden", on ? "opacity-100" : "w-0 overflow-hidden opacity-0")}>{m.role}</span>
            </button>
          </div>
        );
      })}

      {oneCore.steps.map((s, i) => (
        <div key={s.title} ref={(n) => void (zoneEls.current[i] = n)} aria-hidden="true" className="invisible absolute inset-0">
          {/* leader line, with the zone's spot at its origin */}
          <span className="absolute left-0 top-0 h-px origin-left bg-gradient-to-r from-[var(--core-light)] via-white/35 to-white/15 will-change-transform">
            <span className="absolute -left-1 -top-1 size-2 rounded-full bg-[var(--core-light)] shadow-[0_0_12px_3px_var(--core-glow)]" />
          </span>
          <div className="group absolute left-0 top-0 w-max max-w-[15rem] will-change-transform data-[side=below]:text-center data-[side=left]:text-right sm:max-w-[17rem]">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.26em] text-fg-2 [text-shadow:0_1px_14px_rgb(0_0_0/0.9)]">
              <span className="text-accent">{String(i + 1).padStart(2, "0")}</span> — {s.zone}
            </p>
            <p className="mt-1.5 font-display text-[19px] font-extralight leading-tight tracking-[-0.02em] text-fg [text-shadow:0_1px_14px_rgb(0_0_0/0.9)] sm:text-[22px]">{s.title}</p>
            <p className="mt-1 text-[13px] leading-snug text-fg-2 [text-shadow:0_1px_14px_rgb(0_0_0/0.9)] max-sm:hidden">{s.body}</p>
          </div>
        </div>
      ))}

      {integrations.tools.map((t, i) => {
        const on = tool === i;
        return (
          <div
            key={t.id}
            ref={(n) => void (toolEls.current[i] = n)}
            aria-hidden="true"
            onPointerEnter={mouse(() => onTool(i))}
            onPointerLeave={mouse(() => onTool(null))}
            // touch: a tap sends the pulse
            onClick={() => onTool(on ? null : i)}
            data-active={on || undefined}
            className="tool-chip pointer-events-auto invisible absolute left-0 top-0 flex cursor-default items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-black/40 py-1 pl-1.5 pr-2.5 text-[11px] text-fg-2 backdrop-blur-md will-change-transform"
          >
            <span className="tool-logo relative grid place-items-center">
              <IntegrationLogo id={t.id} size={13} />
              {on && <span key={`ping-${i}`} className="tool-ping absolute inset-[-5px] rounded-full border border-[var(--core-light)]" />}
            </span>
            <span className="transition-colors duration-300">{t.name}</span>
          </div>
        );
      })}
    </div>
  );
}
