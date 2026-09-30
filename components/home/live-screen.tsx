"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { BarChart3, CalendarClock, FileText, Home, Inbox, Play, Search, Sparkles, Zap } from "lucide-react";
import { workspace } from "@/content/home";
import type { CoreState } from "@/lib/core/state";
import { useFilm } from "./film";

/** Size of the screen in CSS px — the scene scales it into place (SCREEN_PX in core-scene.ts). */
const W = 1200;
const H = 750;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type Count = { el: HTMLElement; to: number; at: number; decimals: number; prefix: string; suffix: string; group: boolean };

/**
 * The product, live: an HTML workspace rendered inside the 3D scene beside
 * the Core (see CoreScene.buildScreen). What it shows builds up with the
 * scroll — cards arrive, numbers count, the chart draws, the stream fills —
 * read every frame from the scene state (`state.live`).
 *
 *   mouse     hover → a "play the demo" cursor follows · click → the full demo opens from the screen
 *   touch     tap → the full demo
 * It duplicates the chapter's own "Play the demo" button, so it stays out of the tab order.
 */
export function LiveScreen({ state }: { state: CoreState }) {
  const root = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);
  const film = useFilm();

  // what the screen shows, following state.live
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reveals = [...el.querySelectorAll<HTMLElement>("[data-at]")].map((n) => ({ el: n, at: parseFloat(n.dataset.at ?? "0") }));
    const counts: Count[] = [...el.querySelectorAll<HTMLElement>("[data-count]")].map((n) => ({
      el: n,
      to: parseFloat(n.dataset.count ?? "0"),
      at: parseFloat(n.closest<HTMLElement>("[data-at]")?.dataset.at ?? "0"),
      decimals: parseInt(n.dataset.decimals ?? "0", 10),
      prefix: n.dataset.prefix ?? "",
      suffix: n.dataset.suffix ?? "",
      group: n.dataset.group !== undefined,
    }));
    const draws = [...el.querySelectorAll<SVGPathElement>("[data-draw]")].map((n) => ({ el: n, at: parseFloat(n.dataset.draw ?? "0") }));
    const fills = [...el.querySelectorAll<HTMLElement>("[data-fill]")].map((n) => ({ el: n, at: parseFloat(n.closest<HTMLElement>("[data-at]")?.dataset.at ?? "0"), to: parseFloat(n.dataset.fill ?? "1") }));
    const fmt = new Intl.NumberFormat("en-IE");
    let last = -1;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const live = state.screen > 0.002 ? state.live : 0;
      if (Math.abs(live - last) < 0.0005) return;
      last = live;
      for (const r of reveals) {
        const t = easeOut(clamp01((live - r.at) / 0.12));
        r.el.style.opacity = t.toFixed(3);
        r.el.style.transform = t >= 1 ? "" : `translate3d(0, ${((1 - t) * 14).toFixed(1)}px, 0)`;
      }
      for (const c of counts) {
        const v = c.to * easeOut(clamp01((live - c.at) / 0.3));
        const n = c.decimals ? v.toFixed(c.decimals) : Math.round(v);
        c.el.textContent = `${c.prefix}${c.group ? fmt.format(Number(n)) : n}${c.suffix}`;
      }
      for (const d of draws) d.el.style.strokeDashoffset = (1 - easeOut(clamp01((live - d.at) / 0.45))).toFixed(4);
      for (const f of fills) f.el.style.transform = `scaleX(${(f.to * easeOut(clamp01((live - f.at) / 0.3))).toFixed(3)})`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  // the "play" cursor: eased towards the pointer, so it glides instead of sticking to it
  useEffect(() => {
    const c = cursor.current;
    const el = root.current;
    if (!c || !el) return;
    let x = W / 2;
    let y = H / 2;
    let tx = x;
    let ty = y;
    let raf = 0;
    const loop = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      c.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(loop);
      else raf = 0;
    };
    const hit = el.querySelector<HTMLElement>("[data-hit]");
    const move = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      // the hit layer covers the whole screen: its offset is the pointer in the screen's own (untransformed) px
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

  const open = () => film.open({ from: root.current?.getBoundingClientRect() });
  const onEnter = (e: PointerEvent) => e.pointerType === "mouse" && root.current?.setAttribute("data-hover", "");
  const onLeave = () => root.current?.removeAttribute("data-hover");

  return (
    <div
      ref={root}
      role="button"
      tabIndex={-1}
      aria-label={`${workspace.demo.label} (${workspace.demo.duration})`}
      onClick={open}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      style={{ width: W, height: H }}
      className="live-screen group relative cursor-none select-none overflow-hidden rounded-[22px] bg-[#0b0c0d] p-[3px] font-sans text-fg"
    >
      {/* the frame: a thin light, warmer on the side that faces the Core */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(100deg,rgb(255_176_110/0.55),rgb(255_255_255/0.14)_28%,rgb(255_255_255/0.06)_60%,rgb(255_255_255/0.16))]" />
      <div className="relative flex h-full overflow-hidden rounded-[19px] bg-[#0b0c0d]">
        {/* sidebar */}
        <aside className="flex w-[68px] shrink-0 flex-col items-center gap-2 border-r border-white/[0.06] py-5">
          <span className="mb-4 grid size-8 place-items-center rounded-lg bg-fg font-display text-[13px] font-medium text-canvas">S</span>
          {[Home, Inbox, Sparkles, Zap, BarChart3, CalendarClock, FileText].map((Icon, i) => (
            <span key={i} className={`grid size-10 place-items-center rounded-lg ${i === 0 ? "bg-white/[0.07] text-fg" : "text-fg-3"}`}>
              <Icon className="size-[18px]" strokeWidth={1.5} />
            </span>
          ))}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col px-8 pb-7 pt-6">
          {/* top bar */}
          <header className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-3">Wednesday · 30 Sept</p>
              <p className="mt-1.5 font-display text-[26px] font-extralight tracking-[-0.03em]">Good morning, Claire</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-[240px] items-center gap-2.5 rounded-full border border-white/[0.08] px-4 text-[13px] text-fg-3">
                <Search className="size-4" strokeWidth={1.5} />
                Ask Syxoria…
                <span className="ml-auto font-mono text-[11px]">⌘K</span>
              </span>
              <span className="flex h-10 items-center gap-2 rounded-full border border-white/[0.08] px-4 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-2">
                <span className="size-1.5 animate-pulse-soft rounded-full bg-accent" />
                {workspace.demo.live}
              </span>
            </div>
          </header>

          {/* the modules, at a glance */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            {kpis.map((k, i) => (
              <div key={k.module} data-at={0.04 + i * 0.07} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 opacity-0">
                <p className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.2em] text-fg-3">
                  {k.module}
                  <span className="text-fg-2">{k.trend}</span>
                </p>
                <p className="mt-3 font-display text-[30px] font-extralight leading-none tracking-[-0.03em]">
                  <span data-count={k.value} data-decimals={k.decimals ?? 0} data-prefix={k.prefix ?? ""} data-suffix={k.suffix ?? ""}>
                    0
                  </span>
                </p>
                <div className="mt-2.5 flex items-end justify-between gap-3">
                  <p className="text-[12px] text-fg-3">{k.label}</p>
                  <svg viewBox="0 0 80 24" className="h-6 w-20 shrink-0 text-fg-2" aria-hidden="true">
                    <path d={k.spark} pathLength={1} data-draw={0.1 + i * 0.07} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset="1" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid min-h-0 flex-1 grid-cols-[1fr_320px] gap-4">
            {/* momentum, drawing itself */}
            <div data-at={0.2} className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 opacity-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-fg-3">Kairo · Revenue</p>
                  <p className="mt-2 font-display text-[34px] font-extralight leading-none tracking-[-0.03em]">
                    <span data-count={184320} data-prefix="€" data-group>
                      €0
                    </span>
                  </p>
                </div>
                <span className="flex gap-1 rounded-full border border-white/[0.08] p-1 font-mono text-[10.5px] text-fg-3">
                  <span className="rounded-full px-2.5 py-1">1M</span>
                  <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-fg">3M</span>
                  <span className="rounded-full px-2.5 py-1">1Y</span>
                </span>
              </div>
              <svg viewBox="0 0 600 190" preserveAspectRatio="none" className="mt-4 w-full flex-1" aria-hidden="true">
                {[38, 86, 134, 182].map((y) => (
                  <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="rgb(255 255 255 / 0.05)" />
                ))}
                <path d={`${CHART} L 600 190 L 0 190 Z`} fill="url(#live-fill)" data-at={0.55} className="opacity-0" />
                <path d={CHART} pathLength={1} data-draw={0.24} fill="none" stroke="#f5f5f2" strokeWidth="1.6" strokeDasharray="1 1" strokeDashoffset="1" vectorEffect="non-scaling-stroke" />
                <defs>
                  <linearGradient id="live-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#f5f5f2" stopOpacity="0.1" />
                    <stop offset="1" stopColor="#f5f5f2" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* the stream, and what Syxoria proposes */}
            <div className="flex min-h-0 flex-col gap-3">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-fg-3">Lume · Stream</p>
                <ul className="mt-3 grid gap-2.5">
                  {stream.map((s, i) => (
                    <li key={s.title} data-at={0.36 + i * 0.09} className="flex items-center gap-3 opacity-0">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-white/[0.08] font-mono text-[10px] text-fg-2">{s.from}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-fg">{s.title}</span>
                        <span className="block text-[11.5px] text-fg-3">{s.meta}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div data-at={0.66} className="rounded-2xl border border-accent-line bg-accent-soft p-4 opacity-0">
                <p className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.2em] text-fg-3">
                  Nexo · Suggestion
                  <span className="text-accent">€6,380</span>
                </p>
                <p className="mt-2 text-[14px] leading-snug text-fg">4 invoices can be followed up today</p>
                <span className="mt-3 inline-flex h-8 items-center rounded-full bg-fg px-3.5 text-[12px] font-medium text-canvas">Review & approve</span>
              </div>
              <div data-at={0.76} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 opacity-0">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-fg-3">Zento · Capacity</p>
                <div className="mt-3 grid gap-2">
                  {[0.62, 0.84, 0.45].map((v, i) => (
                    <span key={i} className="relative block h-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <span data-fill={v} className="absolute inset-0 origin-left scale-x-0 rounded-full bg-fg-2" />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* takes the pointer for the whole screen, so the cursor below can follow it in the screen's own px */}
      <span data-hit aria-hidden="true" className="absolute inset-0" />

      {/* hover: a quiet "play" cursor that glides after the pointer */}
      <span
        ref={cursor}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 flex items-center gap-2.5 rounded-full bg-fg py-2.5 pl-3 pr-5 text-[15px] font-medium text-canvas opacity-0 shadow-[0_20px_60px_rgb(0_0_0/0.5)] transition-opacity duration-300 group-data-[hover]:opacity-100"
      >
        <span className="grid size-8 place-items-center rounded-full bg-canvas text-fg">
          <Play className="ml-0.5 size-3.5 fill-current" />
        </span>
        {workspace.demo.label}
        <span className="tabular text-canvas/60">{workspace.demo.duration}</span>
      </span>
    </div>
  );
}

const CHART = "M 0 162 C 40 158, 70 150, 100 146 S 160 150, 200 132 S 270 118, 300 112 S 360 116, 400 96 S 470 70, 500 64 S 560 42, 600 30";

const kpis = [
  { module: "Lume", label: "Signals today", value: 38, trend: "+9", spark: "M1 18 L12 16 L22 17 L32 11 L42 13 L52 8 L62 9 L79 4" },
  { module: "Nexo", label: "Suggestions", value: 4, trend: "new", spark: "M1 14 L14 15 L26 10 L38 12 L50 7 L62 9 L79 6" },
  { module: "Volt", label: "Saved this month", value: 6.2, decimals: 1, suffix: " h", trend: "+18%", spark: "M1 20 L14 17 L26 18 L38 12 L50 10 L62 7 L79 3" },
  { module: "Kairo", label: "Momentum", value: 12, prefix: "+", suffix: "%", trend: "week", spark: "M1 19 L12 17 L22 18 L32 12 L42 13 L52 7 L62 8 L79 2" },
];

const stream = [
  { from: "St", title: "Invoice #1042 paid — Maison Leroux", meta: "Stripe · 2 min ago" },
  { from: "Hs", title: "Two deals have gone quiet", meta: "HubSpot · linked by Nexo" },
  { from: "Gm", title: "Kickoff request from Atelier Nord", meta: "Gmail · slot proposed" },
];
