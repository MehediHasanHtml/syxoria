"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, CalendarClock, Check, FileText, Home, Inbox, Loader2, Search, Sparkles, Zap } from "lucide-react";
import { workspace } from "@/content/home";
import { cn } from "@/lib/cn";

/** The display inside the monitor, in CSS px (the bezel adds MONITOR's margin around it). */
export const DISPLAY = { w: 1200, h: 750 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const eur = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/**
 * The demo's script — one short, real session, as a function of progress
 * (0..1): the workspace comes alive, a payment arrives, Nexo proposes a
 * follow-up, the cursor reviews and approves it, Volt sends it, the numbers
 * move. The same script plays with the scroll (in the scene) and on its own
 * (fullscreen), so the product always looks like it is operating.
 */
const T = {
  build: [0.0, 0.1],
  arrive: 0.2,
  suggest: 0.3,
  review: 0.41,
  checks: [0.45, 0.48, 0.51, 0.54],
  approve: 0.63,
  sent: 0.75,
  logged: 0.77,
  done: 0.9,
} as const;

/** The cursor's path: from → to over [start, end] (targets are elements with data-target). */
const MOVES: [number, number, string, string][] = [
  [0.12, 0.2, "rest", "stream-top"],
  [0.31, 0.39, "stream-top", "review"],
  [0.55, 0.61, "review", "approve"],
  [0.84, 0.93, "approve", "chart-end"],
];
const CLICKS = [T.review, T.approve];

type Phase = { arrived: boolean; suggestion: boolean; expanded: boolean; checks: number; sending: boolean; sent: boolean; logged: boolean; done: boolean };

const phaseAt = (p: number): Phase => ({
  arrived: p >= T.arrive,
  suggestion: p >= T.suggest,
  expanded: p >= T.review && p < T.sent,
  checks: T.checks.filter((c) => p >= c).length,
  sending: p >= T.approve && p < T.sent,
  sent: p >= T.sent,
  logged: p >= T.logged,
  done: p >= T.done,
});
const key = (ph: Phase) => Object.values(ph).join("|");

const invoices = [
  { client: "Atelier Nord", amount: 2140, late: "21 days" },
  { client: "Maison Leroux", amount: 1680, late: "18 days" },
  { client: "Studio Kahn", amount: 1460, late: "16 days" },
  { client: "Orbe & Co", amount: 1100, late: "14 days" },
];

/**
 * The Syxoria workspace, operating. `progress` is read every frame: the
 * scroll (in the scene) or a clock (fullscreen). Discrete moments re-render;
 * everything continuous (numbers, chart, cursor, progress) is written
 * straight to the DOM.
 */
export function LiveDashboard({ progress, className }: { progress: () => number; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const read = useRef(progress);
  const [phase, setPhase] = useState<Phase>(() => phaseAt(0));
  const phaseKey = useRef(key(phase));
  useEffect(() => {
    read.current = progress;
  });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = <E extends Element = HTMLElement>(s: string) => el.querySelector<E>(s);
    const cursor = q("[data-cursor]");
    const ripple = q("[data-ripple]");
    const last = new Map<string, { x: number; y: number }>([["rest", { x: 860, y: 560 }]]);
    // where an element is, in the display's own px (layout offsets are unaffected by the 3D transform)
    const pos = (name: string) => {
      const t = q(`[data-target="${name}"]`);
      if (t) {
        let x = t.offsetWidth / 2;
        let y = t.offsetHeight / 2;
        let n: HTMLElement | null = t;
        while (n && n !== el) {
          x += n.offsetLeft;
          y += n.offsetTop;
          n = n.offsetParent as HTMLElement | null;
        }
        last.set(name, { x, y });
      }
      return last.get(name) ?? last.get("rest")!;
    };
    const text = (sel: string, value: string) => {
      const n = q(sel);
      if (n && n.textContent !== value) n.textContent = value;
    };
    let prev = -1;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = clamp01(read.current());
      if (Math.abs(p - prev) < 0.0002) return;
      prev = p;
      const ph = phaseAt(p);
      const k = key(ph);
      if (k !== phaseKey.current) {
        phaseKey.current = k;
        setPhase(ph);
      }

      // the workspace comes alive: cards arrive, numbers count up to today
      const build = ease(span(p, T.build[0], T.build[1] + 0.04));
      el.querySelectorAll<HTMLElement>("[data-in]").forEach((n) => {
        const t = ease(span(p, parseFloat(n.dataset.in ?? "0"), parseFloat(n.dataset.in ?? "0") + 0.06));
        n.style.opacity = t.toFixed(3);
        n.style.translate = t >= 1 ? "" : `0 ${((1 - t) * 10).toFixed(1)}px`;
      });
      const cashIn = ease(span(p, T.arrive, T.arrive + 0.06));
      text("[data-v=signals]", String(Math.round(38 * build) + (ph.arrived ? 1 : 0) + (ph.logged ? 1 : 0)));
      text("[data-v=cash]", eur.format(48210 * build + 2400 * cashIn));
      text("[data-v=saved]", `${(6.2 * build + 0.4 * ease(span(p, 0.78, 0.84))).toFixed(1)} h`);
      text("[data-v=momentum]", `+${Math.round(12 * build + 2 * ease(span(p, 0.8, 0.86)))}%`);
      text("[data-v=revenue]", eur.format(184320 * build + 2400 * cashIn));
      text("[data-v=sending]", `Sending ${Math.min(4, Math.max(1, Math.ceil(span(p, T.approve, T.sent - 0.01) * 4)))} / 4`);
      const chart = q<SVGPathElement>("[data-chart]");
      if (chart) chart.style.strokeDashoffset = (1 - ease(span(p, 0.03, 0.16))).toFixed(4);
      const tail = q<SVGPathElement>("[data-chart-tail]");
      if (tail) tail.style.strokeDashoffset = (1 - ease(span(p, 0.79, 0.88))).toFixed(4);
      const area = q("[data-chart-area]");
      if (area) area.style.opacity = (ease(span(p, 0.1, 0.2)) * 0.9).toFixed(3);
      const bar = q("[data-send-bar]");
      if (bar) bar.style.scale = `${ease(span(p, T.approve, T.sent - 0.01)).toFixed(3)} 1`;

      // the cursor: moves between what it works on, presses, and rests
      if (cursor) {
        let at = pos("rest");
        for (const [a, b, from, to] of MOVES) {
          if (p < a) break;
          const f = pos(from);
          const t2 = pos(to);
          const e = ease(span(p, a, b));
          at = { x: f.x + (t2.x - f.x) * e, y: f.y + (t2.y - f.y) * e };
        }
        const press = CLICKS.some((c) => Math.abs(p - c) < 0.008);
        const shown = span(p, 0.11, 0.13) * (1 - span(p, 0.96, 0.99));
        cursor.style.opacity = shown.toFixed(3);
        cursor.style.translate = `${at.x.toFixed(1)}px ${at.y.toFixed(1)}px`;
        cursor.style.scale = press ? "0.86" : "1";
        if (ripple) {
          const c = CLICKS.find((c) => p >= c && p < c + 0.035);
          ripple.style.opacity = c === undefined ? "0" : (1 - span(p, c, c + 0.035)).toFixed(3);
          ripple.style.scale = c === undefined ? "0.3" : (0.3 + span(p, c, c + 0.035) * 1.2).toFixed(3);
          ripple.style.translate = `${at.x.toFixed(1)}px ${at.y.toFixed(1)}px`;
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const stream = [
    ...(phase.logged ? [{ id: "volt", from: "Vo", title: "Volt sent 4 payment reminders", meta: "Approved by you · just now", fresh: true }] : []),
    ...(phase.arrived ? [{ id: "pay", from: "St", title: "Payment received — Maison Leroux", meta: "Stripe · €2,400 · linked by Nexo", fresh: !phase.logged }] : []),
    { id: "deals", from: "Hs", title: "Two deals have gone quiet", meta: "HubSpot · 12 days without contact", fresh: false },
    { id: "kick", from: "Gm", title: "Kickoff request from Atelier Nord", meta: "Gmail · slot proposed", fresh: false },
    { id: "brief", from: "No", title: "Q3 brief updated", meta: "Notion · 3 decisions logged", fresh: false },
  ].slice(0, 4);

  return (
    <div ref={root} style={{ width: DISPLAY.w, height: DISPLAY.h }} className={cn("relative flex select-none overflow-hidden bg-[#0b0c0d] font-sans text-fg", className)}>
      {/* sidebar */}
      <aside className="flex w-16 shrink-0 flex-col items-center gap-2 border-r border-white/[0.06] py-5">
        <span className="mb-4 grid size-8 place-items-center rounded-lg bg-fg font-display text-[13px] font-medium text-canvas">S</span>
        {[Home, Inbox, Sparkles, Zap, BarChart3, CalendarClock, FileText].map((Icon, i) => (
          <span key={i} className={cn("relative grid size-10 place-items-center rounded-lg", i === 0 ? "bg-white/[0.07] text-fg" : "text-fg-3")}>
            <Icon className="size-[18px]" strokeWidth={1.5} />
            {i === 1 && phase.arrived && !phase.logged && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />}
          </span>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col px-6 pb-6 pt-5">
        {/* top bar */}
        <header className="flex h-[52px] items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-3">Wednesday · 30 Sept</p>
            <p className="mt-1 font-display text-[24px] font-extralight tracking-[-0.03em]">Good morning, Claire</p>
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
        <div className="mt-[18px] grid grid-cols-4 gap-3.5">
          {[
            { module: "Lume", label: "Signals today", v: "signals", trend: "live", spark: "M1 18 L12 16 L22 17 L32 11 L42 13 L52 8 L62 9 L79 4" },
            { module: "Stripe · Nexo", label: "Cash collected", v: "cash", trend: "month", spark: "M1 16 L14 15 L26 12 L38 13 L50 9 L62 8 L79 5" },
            { module: "Volt", label: "Saved this month", v: "saved", trend: "auto", spark: "M1 20 L14 17 L26 18 L38 12 L50 10 L62 7 L79 3" },
            { module: "Kairo", label: "Momentum", v: "momentum", trend: "week", spark: "M1 19 L12 17 L22 18 L32 12 L42 13 L52 7 L62 8 L79 2" },
          ].map((k, i) => (
            <div key={k.v} data-in={0.01 + i * 0.02} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 opacity-0">
              <p className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.2em] text-fg-3">
                {k.module}
                <span className="text-fg-2">{k.trend}</span>
              </p>
              <p data-v={k.v} className="tabular mt-3 font-display text-[28px] font-extralight leading-none tracking-[-0.03em]">
                0
              </p>
              <div className="mt-2.5 flex items-end justify-between gap-3">
                <p className="text-[12px] text-fg-3">{k.label}</p>
                <svg viewBox="0 0 80 24" className="h-6 w-20 shrink-0 text-fg-2" aria-hidden="true">
                  <path d={k.spark} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3.5 grid min-h-0 flex-1 grid-cols-[1fr_360px] gap-3.5">
          {/* revenue, drawing itself — and moving when the payment lands */}
          <div data-in={0.06} className="relative flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 opacity-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-fg-3">Kairo · Revenue, this quarter</p>
                <p data-v="revenue" className="tabular mt-2 font-display text-[34px] font-extralight leading-none tracking-[-0.03em]">
                  €0
                </p>
              </div>
              <span className="flex gap-1 rounded-full border border-white/[0.08] p-1 font-mono text-[10.5px] text-fg-3">
                <span className="rounded-full px-2.5 py-1">1M</span>
                <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-fg">3M</span>
                <span className="rounded-full px-2.5 py-1">1Y</span>
              </span>
            </div>
            <div className="relative mt-4 flex-1">
              <svg viewBox="0 0 600 260" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
                {[52, 117, 182, 247].map((y) => (
                  <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="rgb(255 255 255 / 0.05)" />
                ))}
                <path data-chart-area d={`${CHART} L 540 260 L 0 260 Z`} fill="url(#live-fill)" opacity="0" />
                <path data-chart d={CHART} pathLength={1} fill="none" stroke="#f5f5f2" strokeWidth="2.6" strokeDasharray="1 1" strokeDashoffset="1" />
                <path data-chart-tail d={TAIL} pathLength={1} fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeDasharray="1 1" strokeDashoffset="1" />
                <defs>
                  <linearGradient id="live-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#f5f5f2" stopOpacity="0.1" />
                    <stop offset="1" stopColor="#f5f5f2" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              {/* the latest point: where the cursor ends its session */}
              <span data-target="chart-end" className="absolute right-[1%] top-[10%] size-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-accent shadow-[0_0_14px_3px_var(--core-glow)]" style={{ opacity: phase.logged ? 1 : 0, transition: "opacity 600ms" }} />
            </div>
            {phase.done && (
              <p className="absolute bottom-5 left-1/2 flex -translate-x-1/2 animate-fade-in items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-black/60 px-4 py-2 text-[12.5px] text-fg">
                <Check className="size-3.5 text-accent" />
                All caught up — €6,380 on its way, nothing waiting for you.
              </p>
            )}
          </div>

          <div className="flex min-h-0 flex-col gap-3.5">
            {/* the stream: everything arrives in one place */}
            <div data-in={0.08} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 opacity-0">
              <p className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.2em] text-fg-3">
                Lume · Stream
                <span className="text-fg-2">today</span>
              </p>
              <ul className="mt-3 grid gap-2">
                {stream.map((s, i) => (
                  <li
                    key={s.id}
                    data-target={i === 0 ? "stream-top" : undefined}
                    className={cn("flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-500", s.fresh && "animate-fade-in bg-white/[0.04]")}
                  >
                    <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border font-mono text-[10px]", s.fresh ? "border-accent-line text-accent" : "border-white/[0.08] text-fg-2")}>{s.from}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-fg">{s.title}</span>
                      <span className="block truncate text-[11.5px] text-fg-3">{s.meta}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* what Syxoria proposes — reviewed, approved and carried out */}
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              {!phase.suggestion && (
                <p className="flex h-full items-center justify-center gap-2 text-[12.5px] text-fg-3">
                  <span className="size-1.5 animate-pulse-soft rounded-full bg-fg-3" />
                  Nexo is reading what comes in…
                </p>
              )}
              {phase.suggestion && !phase.sent && (
                <div className="animate-fade-in">
                  <p className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.2em] text-fg-3">
                    Nexo · Suggestion
                    <span className="text-accent">€6,380</span>
                  </p>
                  <p className="mt-2 text-[14px] leading-snug text-fg">4 invoices can be followed up today</p>
                  {!phase.expanded && (
                    <span data-target="review" className="mt-3 inline-flex h-8 items-center rounded-full bg-fg px-4 text-[12px] font-medium text-canvas">
                      Review
                    </span>
                  )}
                  {phase.expanded && (
                    <div className="mt-3 animate-fade-in">
                      <ul className="grid gap-1.5">
                        {invoices.map((inv, i) => (
                          <li key={inv.client} className="flex items-center gap-2.5 text-[12.5px]">
                            <span className={cn("grid size-4 place-items-center rounded border transition-colors duration-300", i < phase.checks ? "border-accent bg-accent text-canvas" : "border-white/20")}>
                              {i < phase.checks && <Check className="size-3" strokeWidth={3} />}
                            </span>
                            <span className="flex-1 text-fg-2">{inv.client}</span>
                            <span className="text-fg-3">{inv.late}</span>
                            <span className="tabular w-16 text-right text-fg">{eur.format(inv.amount)}</span>
                          </li>
                        ))}
                      </ul>
                      <span data-target="approve" className={cn("relative mt-3 flex h-9 items-center justify-center overflow-hidden rounded-full text-[12.5px] font-medium", phase.sending ? "bg-white/[0.08] text-fg" : "bg-fg text-canvas")}>
                        {phase.sending && <span data-send-bar className="absolute inset-y-0 left-0 w-full origin-left bg-accent/30" style={{ scale: "0 1" }} />}
                        <span className="relative flex items-center gap-2">
                          {phase.sending ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              <span data-v="sending">Sending 1 / 4</span>
                            </>
                          ) : (
                            "Approve & send reminders"
                          )}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}
              {phase.sent && (
                <div className="flex h-full animate-fade-in flex-col justify-center gap-2">
                  <p className="flex items-center gap-2 text-[14px] text-fg">
                    <span className="grid size-6 place-items-center rounded-full bg-accent text-canvas">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    4 reminders sent
                  </p>
                  <p className="text-[12.5px] leading-snug text-fg-3">Volt carried it out, with your approval. Replies will land in the stream.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* the cursor, and its click */}
      <span data-ripple aria-hidden="true" className="pointer-events-none absolute left-0 top-0 -ml-5 -mt-5 size-10 rounded-full border border-white/60 opacity-0" />
      <span data-cursor aria-hidden="true" className="pointer-events-none absolute left-0 top-0 opacity-0 transition-[scale] duration-150 [filter:drop-shadow(0_4px_8px_rgb(0_0_0/0.6))]">
        <svg width="22" height="22" viewBox="0 0 24 24" className="-ml-[3px] -mt-[2px]">
          <path d="M4 2.5 L19.5 13 L12 14.2 L8.6 21 Z" fill="#f5f5f2" stroke="#0b0c0d" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

const CHART = "M 0 220 C 40 214, 70 204, 100 199 S 160 205, 200 182 S 270 160, 300 152 S 360 158, 400 130 S 470 96, 500 88 S 525 80, 540 76";
const TAIL = "M 540 76 C 556 70, 574 50, 594 26";
