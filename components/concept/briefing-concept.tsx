"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { LogoMark } from "@/components/shared/logo";
import { OnbButton } from "@/components/onboarding/onboarding-button";
import { cn } from "@/lib/cn";
import type { CoreState } from "@/lib/core/core-states";
import { formatCurrency } from "@/lib/format";
import { quietDeals } from "@/lib/mock-data/onboarding";

/*
 * A static study of a new direction for the executive briefing, for review before it is built.
 * Not wired to the onboarding: the frames are drawn at 1440 × 900 and scaled to fit the board.
 *
 * The idea: one discovery, not a dashboard. The Core stands on the stage inside a ring that
 * measures how long each conversation has been silent (a full turn is twenty days, the bottom is
 * the company's own ten day threshold). Beside it, four sentences: priority, insight,
 * recommendation, action. White = what is · emerald = what Syxoria does.
 */

const W = 1440;
const H = 900;
const C = { x: 432, y: 486 };
const R = 226;
const CORE = 196;
const TURN = 20;

const r2 = (v: number) => Math.round(v * 100) / 100;
const deg = (days: number) => (days / TURN) * 360;
const at = (a: number, r: number) => {
  const t = (a * Math.PI) / 180;
  return { x: r2(C.x + r * Math.sin(t)), y: r2(C.y - r * Math.cos(t)) };
};
/** Clockwise from angle `a` to angle `b` */
const arc = (a: number, b: number, r: number) => {
  const s = at(a, r);
  const e = at(b, r);
  return `M${s.x} ${s.y} A${r} ${r} 0 ${b - a > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
};

const deals = quietDeals.slice(0, 3);
const most = Math.max(...deals.map((d) => d.value));
const dotR = (value: number) => r2(4.5 + (value / most) * 5);
const total = deals.reduce((s, d) => s + d.value, 0);

type Variant = "first" | "later";

/* ---------- The board ---------- */

export function BriefingConcept({ frame }: { frame?: string }) {
  if (frame)
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas">
        <div style={{ width: W, height: H }}>
          <Frame step={/^[0-4]$/.test(frame) ? Number(frame) : 4} variant={frame === "later" ? "later" : "first"} />
        </div>
      </main>
    );
  return (
    <main className="editorial-type min-h-dvh bg-canvas text-fg">
      <div className="mx-auto max-w-[78rem] px-6 pb-32 pt-16 md:px-10">
        <header className="max-w-3xl">
          <p className="font-label text-label uppercase text-fg-3">Syxoria · Executive briefing · Concept for review</p>
          <h1 className="mt-5 font-display text-[clamp(2.2rem,1.6rem+2.4vw,3.6rem)] font-extralight leading-[1.06] tracking-[-0.025em]">
            One discovery, <em className="font-serif font-light italic">told as a story.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-fg-2">
            The briefing no longer shows everything Syxoria knows. It shows the one thing it found, why it matters, what to do, and what is already done. The
            Core stays on stage and shows its reasoning around itself.
          </p>
        </header>

        <Section title="The briefing" note="The final screen of the onboarding, at rest.">
          <Scaled>
            <Frame step={4} variant="first" />
          </Scaled>
        </Section>

        <div className="mt-10 grid gap-x-10 gap-y-8 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <Anatomy word="Priority" line="One figure leads the page. What is waiting on the owner, in a single sentence." />
          <Anatomy word="Insight" line="The ring around the Core. Every client sits where their silence has taken them, past the ten days where deals slip." />
          <Anatomy word="Recommendation" line="The half of the ring where deals still close turns emerald: that is where Syxoria wants them." />
          <Anatomy word="Action" line="The Core reaches each client. The replies are drafted, and the only thing left is the owner’s approval." />
        </div>

        <Section title="How it unfolds" note="Around twelve seconds, one sentence at a time. Nothing moves once it is all there.">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { step: 0, label: "I found something", line: "The Core alone, after the onboarding." },
              { step: 1, label: "What needs you", line: "The ring draws. Three clients are past the line." },
              { step: 2, label: "Why it matters", line: "Their own history: past ten days, half as many deals close." },
              { step: 3, label: "What to do", line: "The healthy half lights up. Reply this morning." },
              { step: 4, label: "What is already done", line: "The Core reaches them. Replies are waiting for approval." },
            ].map((s) => (
              <figure key={s.step}>
                <Scaled className="rounded-lg">
                  <Frame step={s.step} variant="first" />
                </Scaled>
                <figcaption className="mt-3">
                  <span className="block font-display text-[1.15rem] font-light">{s.label}</span>
                  <span className="mt-0.5 block text-[13.5px] text-fg-3">{s.line}</span>
                </figcaption>
              </figure>
            ))}
            <div className="flex flex-col justify-end rounded-lg border border-line p-6">
              <p className="font-display text-[1.35rem] font-light leading-snug text-fg-2">
                Then the button is the decision itself: <span className="text-fg">review the replies</span>, and Syxoria opens on them.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Three days later" note="The same page, every morning. The ring moves as the business moves, so the briefing always opens on what changed.">
          <Scaled>
            <Frame step={4} variant="later" />
          </Scaled>
        </Section>

        <div className="mt-10 grid gap-10 border-t border-line pt-8 md:grid-cols-2">
          <Keep
            title="What stays"
            items={["The Core, the dark stage and its emerald", "Spectral and Schibsted, the editorial voice", "Priority, insight, recommendation, action", "The follow through, from found to closed"]}
          />
          <Keep title="What goes" items={["The chart and its axes", "The list of deals with their figures", "Four labelled sections", "The horizontal action panel"]} />
        </div>
      </div>
    </main>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="mt-20">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <h2 className="font-display text-[1.75rem] font-extralight tracking-[-0.015em]">{title}</h2>
        <p className="max-w-xl text-[14px] text-fg-3">{note}</p>
      </div>
      {children}
    </section>
  );
}

function Anatomy({ word, line }: { word: string; line: string }) {
  return (
    <div>
      <p className="font-label text-label uppercase text-accent-strong">{word}</p>
      <p className="mt-2 text-[14.5px] leading-relaxed text-fg-2">{line}</p>
    </div>
  );
}

function Keep({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-label text-label uppercase text-fg-3">{title}</p>
      <ul className="mt-3 grid gap-2">
        {items.map((i) => (
          <li key={i} className="font-display text-[1.2rem] font-light text-fg-2">
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A 1440 × 900 frame, scaled to the width it is given */
function Scaled({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(e.contentRect.width / W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("relative w-full overflow-hidden rounded-xl border border-line shadow-float", className)} style={{ aspectRatio: `${W} / ${H}` }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${k})`, visibility: k ? undefined : "hidden" }}>
        {children}
      </div>
    </div>
  );
}

/* ---------- One frame of the briefing ---------- */

type Copy = {
  eyebrow: string;
  intro: string;
  figure: string;
  figureLine: string;
  insight: ReactNode;
  advice: ReactNode;
  act: { label: string; aside: string; title: string; note: string; button: string; second: string };
  thread: { label: string; when?: string; state: "done" | "now" | "part" | "next" }[];
  core: CoreState;
};

const em = (t: string) => <em className="font-serif not-italic text-fg">{t}</em>;
const green = (t: string) => <em className="font-serif italic text-accent-strong">{t}</em>;

const copy: Record<Variant, Copy> = {
  first: {
    eyebrow: "Your first briefing · Friday 16 October",
    intro: "Maël, here is what I found.",
    figure: formatCurrency(total),
    figureLine: "is waiting on your reply.",
    insight: <>Past ten quiet days, your deals close {em("half as often")}.</>,
    advice: <>Reply this morning to {green("double your chances")}.</>,
    act: {
      label: "Already prepared",
      aside: "Assisted mandate",
      title: "Your three replies are drafted in Gmail.",
      note: "Nothing is sent without your approval.",
      button: "Review the replies",
      second: "Enter Syxoria",
    },
    thread: [
      { label: "Found", when: "Today", state: "done" },
      { label: "Drafted", when: "9:00", state: "done" },
      { label: "Approved", when: "By you", state: "now" },
      { label: "Sent", state: "next" },
      { label: "Answered", state: "next" },
      { label: "Closed", when: formatCurrency(total), state: "next" },
    ],
    core: "ready",
  },
  later: {
    eyebrow: "Executive briefing · Monday 19 October",
    intro: "Since Friday, things have moved.",
    figure: formatCurrency(deals[0].value),
    figureLine: `signed with ${deals[0].company}.`,
    insight: <>Nora is still quiet, but she {em("answers calls")} within a day.</>,
    advice: <>Call her {green("tomorrow morning")}.</>,
    act: {
      label: "On your calendar",
      aside: "Assisted mandate",
      title: "A call with Nora, Tuesday at 10:30.",
      note: "I’ll brief you five minutes before.",
      button: "Confirm the call",
      second: "Pick another time",
    },
    thread: [
      { label: "Found", when: "Friday", state: "done" },
      { label: "Drafted", when: "Friday", state: "done" },
      { label: "Approved", when: "Friday", state: "done" },
      { label: "Sent", when: "3 of 3", state: "done" },
      { label: "Answered", when: "2 of 3", state: "part" },
      { label: "Closed", when: "1 of 3", state: "part" },
    ],
    core: "active",
  },
};

function Frame({ step, variant }: { step: number; variant: Variant }) {
  const c = copy[variant];
  const on = (i: number) => step >= i;
  const prelude = step === 0;
  return (
    <div
      className="editorial-type relative size-full overflow-hidden text-fg"
      style={{
        background: `radial-gradient(circle at ${prelude ? "720px 400px" : `${C.x}px ${C.y}px`}, rgb(29 122 85 / ${variant === "first" ? 0.11 : 0.08}), transparent 460px), radial-gradient(ellipse at 50% 120%, rgb(255 255 255 / 0.025), transparent 60%), var(--color-canvas)`,
      }}
    >
      {/* the bar: the Core has left it for the stage */}
      <div className="absolute inset-x-14 top-7 flex items-center justify-between">
        <span className="inline-flex items-center gap-3">
          <LogoMark className="size-6" />
          <span className="text-[13px] font-medium uppercase tracking-brand">Syxoria</span>
        </span>
        <span className="text-[13px] text-fg-3">mael@northfield.co</span>
      </div>

      {prelude ? (
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid justify-items-center gap-10">
            <SyxoriaCore state="understanding" className="w-[210px]" />
            <p className="text-center font-display text-[34px] font-light leading-snug tracking-[-0.015em] text-fg-2">
              Maël, while you were setting things up,
              <br />
              <em className="font-serif italic text-fg">I found something.</em>
            </p>
          </div>
        </div>
      ) : (
        <>
          <Ring step={step} variant={variant} />
          <div className="absolute" style={{ left: C.x - CORE / 2, top: C.y - CORE / 2, width: CORE }}>
            <SyxoriaCore state={c.core} className="w-full" />
          </div>

          {/* the story: four sentences, from the largest to the one to act on */}
          <div className="absolute flex flex-col justify-center" style={{ left: 820, width: 540, top: 84, bottom: 40 }}>
            <p className="font-label text-label uppercase text-fg-3">{c.eyebrow}</p>
            <p className="mt-6 font-display text-[23px] font-light italic text-fg-2">{c.intro}</p>
            <p className="mt-2 font-display text-[112px] font-extralight leading-[0.98] tracking-[-0.035em] tabular">{c.figure}</p>
            <p className="mt-1 font-display text-[34px] font-light tracking-[-0.015em]">{c.figureLine}</p>

            <div className="mt-10 grid gap-2.5">
              <p className={cn("font-display text-[23px] font-light leading-snug text-fg-2 transition-opacity", !on(2) && "opacity-0")}>{c.insight}</p>
              <p className={cn("font-display text-[23px] font-light leading-snug text-fg-2 transition-opacity", !on(3) && "opacity-0")}>{c.advice}</p>
            </div>

            <Act c={c} shown={on(4)} />
          </div>
        </>
      )}
    </div>
  );
}

/** What Syxoria has done about it, where it stands, and the decision left to the owner */
function Act({ c, shown }: { c: Copy; shown: boolean }) {
  return (
    <div
      className={cn("mt-9 rounded-[14px] border px-6 pb-5 pt-5", !shown && "opacity-0")}
      style={{
        borderColor: "rgb(79 174 134 / 0.32)",
        background: "linear-gradient(160deg, rgb(29 122 85 / 0.16), rgb(29 122 85 / 0.04) 60%), rgb(8 9 10 / 0.6)",
        boxShadow: "0 0 0 1px rgb(255 255 255 / 0.02) inset, 0 30px 60px -30px rgb(0 0 0 / 0.8), 0 0 60px -30px rgb(42 141 102 / 0.5)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="font-label text-label uppercase text-accent-strong">{c.act.label}</p>
        <p className="text-[12px] text-fg-3">{c.act.aside}</p>
      </div>
      <p className="mt-3 font-display text-[23px] font-light leading-snug">{c.act.title}</p>
      <p className="mt-1 text-[14px] text-fg-2">{c.act.note}</p>

      <ol className="relative mt-5 grid grid-cols-6">
        <span aria-hidden="true" className="absolute left-[8.33%] right-[8.33%] top-[5px] h-px bg-line-strong" />
        {c.thread.map((s, i) => (
          <li key={s.label} className="relative grid justify-items-center gap-1.5 text-center" style={{ "--i": i } as CSSProperties}>
            <Node state={s.state} />
            <span className={cn("mt-1 text-[11.5px]", s.state === "next" ? "text-fg-3" : "text-fg")}>{s.label}</span>
            <span className="text-[11px] tabular text-fg-3">{s.when ?? " "}</span>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-center gap-6 border-t pt-5" style={{ borderColor: "rgb(79 174 134 / 0.16)" }}>
        <OnbButton tone="emerald">{c.act.button}</OnbButton>
        <span className="text-[13.5px] text-fg-2 underline decoration-line-strong underline-offset-4">{c.act.second}</span>
      </div>
    </div>
  );
}

function Node({ state }: { state: "done" | "now" | "part" | "next" }) {
  const base = "relative z-[1] block size-[11px] rounded-full";
  if (state === "done") return <span className={base} style={{ background: "var(--emerald-bright)", boxShadow: "0 0 10px rgb(79 174 134 / 0.6)" }} />;
  if (state === "part")
    return (
      <span className={cn(base, "grid place-items-center border")} style={{ borderColor: "var(--emerald-bright)", background: "var(--color-canvas)" }}>
        <span className="size-[5px] rounded-full" style={{ background: "var(--emerald-bright)" }} />
      </span>
    );
  if (state === "now")
    return (
      <span className={cn(base, "border-[1.5px] border-fg bg-canvas")} style={{ boxShadow: "0 0 0 4px rgb(245 245 242 / 0.08)" }}>
        <span className="animate-pulse-soft absolute -inset-[5px] rounded-full border border-fg/40" />
      </span>
    );
  return <span className={cn(base, "border border-line-strong bg-canvas")} />;
}

/* ---------- The ring: the reasoning, drawn around the Core ---------- */

type Placed = { id: string; name: string; sub: string; days: number; r: number; fill: string; halo?: "draft" | "moving" | "waiting"; label: { a: number; dx?: number; dy?: number; anchor: "start" | "middle" | "end" } };

function Ring({ step, variant }: { step: number; variant: Variant }) {
  const later = variant === "later";
  const halves = step >= 2;
  const lit = step >= 3 && !later;
  const reach = step >= 4 && !later;
  const fg = "var(--color-fg)";

  const friday: Placed[] = deals.map((d, i) => ({
    id: d.contact,
    name: d.company,
    sub: `${d.quietDays} days · ${formatCurrency(d.value)}`,
    days: d.quietDays,
    r: dotR(d.value),
    fill: fg,
    halo: reach ? "draft" : undefined,
    label: [
      { a: deg(d.quietDays), dy: 2, anchor: "end" as const },
      { a: deg(d.quietDays), dy: 30, anchor: "middle" as const },
      { a: deg(d.quietDays), dy: -6, anchor: "end" as const },
    ][i],
  }));
  const monday: Placed[] = [
    { id: deals[0].contact, name: deals[0].company, sub: "Signed", days: 0.5, r: dotR(deals[0].value), fill: "var(--emerald-bright)", label: { a: 0, dx: -26, dy: -24, anchor: "end" } },
    { id: deals[1].contact, name: deals[1].company, sub: "Replied yesterday", days: 1.6, r: dotR(deals[1].value), fill: fg, halo: "moving", label: { a: deg(1.6), anchor: "start" } },
    { id: deals[2].contact, name: deals[2].company, sub: "No answer for 3 days", days: 3, r: dotR(deals[2].value), fill: fg, halo: "waiting", label: { a: deg(3), anchor: "start" } },
  ];
  const placed = later ? monday : friday;

  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 size-full overflow-visible">
      <defs>
        <filter id="bc-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <radialGradient id="bc-reach" gradientUnits="userSpaceOnUse" cx={C.x} cy={C.y} r={R}>
          <stop offset="0.4" stopColor="#4fae86" stopOpacity="0.9" />
          <stop offset="1" stopColor="#4fae86" stopOpacity="0.25" />
        </radialGradient>
      </defs>

      {/* the days, around: a full turn is twenty */}
      {Array.from({ length: TURN }, (_, d) => {
        const a = deg(d);
        const edge = d === 10;
        const s = at(a, edge ? R - 14 : R + 7);
        const e = at(a, edge ? R + 14 : R + 12);
        return <line key={d} x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={fg} strokeOpacity={edge ? (halves ? 0.75 : 0.3) : 0.22} strokeWidth={edge ? 1.25 : 1} />;
      })}

      {/* the two halves: answered in time (right) · left waiting (left) */}
      <path d={arc(0, 180, R)} fill="none" stroke={fg} strokeOpacity={halves ? 0.5 : 0.3} strokeWidth="1.25" />
      <path d={arc(180, 359.99, R)} fill="none" stroke={fg} strokeOpacity={halves ? 0.14 : 0.3} strokeWidth="1.25" />
      {lit && (
        <>
          <path d={arc(0, 180, R)} fill="none" stroke="#4fae86" strokeOpacity="0.55" strokeWidth="5" filter="url(#bc-glow)" />
          <path d={arc(0, 180, R)} fill="none" stroke="#4fae86" strokeWidth="1.5" />
        </>
      )}

      {halves && (
        <text x={C.x} y={C.y + R - 26} textAnchor="middle" className="font-label" fontSize="11" letterSpacing="2" fill={fg} fillOpacity="0.7">
          10 DAYS
        </text>
      )}

      {/* the company's own history, one figure on each half */}
      {halves && !later && (
        <>
          <HalfLabel a={50} figure="62%" lines={["close when", "answered in time"]} tone={lit ? "lit" : "fg"} />
          <HalfLabel a={310} figure="31%" lines={["close when", "left waiting"]} tone="dim" />
        </>
      )}

      {/* what moved since Friday: where each one was, and the way back */}
      {later &&
        deals.map((d, i) => {
          const was = deg(d.quietDays);
          const now = deg(monday[i].days);
          const r = R - 18 - i * 11;
          const ghost = at(was, R);
          // the trail fades towards where it was on Friday
          const n = 36;
          const span = (was - now) / n;
          return (
            <g key={d.contact}>
              {Array.from({ length: n }, (_, k) => (
                <path key={k} d={arc(now + k * span, now + (k + 1.05) * span, r)} fill="none" stroke="#4fae86" strokeOpacity={r2(0.75 * (1 - k / n) ** 1.6)} strokeWidth="1.25" />
              ))}
              <circle cx={at(now, r).x} cy={at(now, r).y} r="2" fill="#4fae86" />
              <circle cx={ghost.x} cy={ghost.y} r={dotR(d.value)} fill="var(--color-canvas)" stroke={fg} strokeOpacity="0.28" />
            </g>
          );
        })}

      {/* what the ring measures */}
      <text x={C.x} y={C.y + R + 92} textAnchor="middle" className="font-label" fontSize="10.5" letterSpacing="2.2" fill={fg} fillOpacity="0.42">
        {later ? "DAYS SINCE EACH CONVERSATION MOVED" : "DAYS EACH CLIENT HAS WAITED FOR YOU"}
      </text>

      {/* the Core reaches each one: the replies it has drafted (later: the call it has booked) */}
      {(reach || (later && step >= 4)) &&
        placed
          .filter((p) => !later || p.halo === "waiting")
          .map((p) => {
          const s = at(deg(p.days), CORE / 2 - 8);
          const e = at(deg(p.days), R - p.r - 9);
          return (
            <g key={p.id}>
              <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="url(#bc-reach)" strokeWidth="1.25" />
              <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#a8dcc4" strokeWidth="1.5" pathLength={1} className="bc-spark" />
            </g>
          );
        })}

      {/* each client: where their silence has taken them, as large as what they are worth */}
      {step >= 1 &&
        placed.map((p) => {
          const pos = at(deg(p.days), R);
          const l = at(p.label.a, R + 24);
          return (
            <g key={p.id}>
              {p.halo === "draft" && <circle cx={pos.x} cy={pos.y} r={p.r + 6} fill="none" stroke="#4fae86" strokeWidth="1.25" />}
              {p.halo === "moving" && <circle cx={pos.x} cy={pos.y} r={p.r + 6} fill="none" stroke="#4fae86" strokeOpacity="0.8" strokeWidth="1.25" />}
              {p.halo === "waiting" && <circle cx={pos.x} cy={pos.y} r={p.r + 6} fill="none" stroke={fg} strokeOpacity="0.5" strokeWidth="1" className="animate-pulse-soft" />}
              {p.fill !== fg && <circle cx={pos.x} cy={pos.y} r={p.r + 5} fill="#4fae86" opacity="0.5" filter="url(#bc-glow)" />}
              <circle cx={pos.x} cy={pos.y} r={p.r} fill={p.fill} />
              <text x={l.x + (p.label.dx ?? 0)} y={l.y + (p.label.dy ?? 0)} textAnchor={p.label.anchor} fill={fg}>
                <tspan className="font-sans" fontSize="14">
                  {p.name}
                </tspan>
                <tspan x={l.x + (p.label.dx ?? 0)} dy="18" className="font-sans tabular" fontSize="12" fill={p.sub === "Signed" ? "#4fae86" : fg} fillOpacity={p.sub === "Signed" ? 1 : 0.5}>
                  {p.sub}
                </tspan>
              </text>
            </g>
          );
        })}
    </svg>
  );
}

function HalfLabel({ a, figure, lines, tone }: { a: number; figure: string; lines: string[]; tone: "fg" | "lit" | "dim" }) {
  const p = at(a, 160);
  const color = tone === "lit" ? "#4fae86" : "var(--color-fg)";
  return (
    <text x={p.x} y={p.y - 6} textAnchor="middle" fill={color} fillOpacity={tone === "dim" ? 0.55 : 1}>
      <tspan className="font-display" fontSize="34" fontWeight="200" letterSpacing="-0.5">
        {figure}
      </tspan>
      {lines.map((l, i) => (
        <tspan key={l} x={p.x} dy={i === 0 ? 20 : 15} className="font-sans" fontSize="11.5" fill="var(--color-fg)" fillOpacity={tone === "dim" ? 0.4 : 0.55}>
          {l}
        </tspan>
      ))}
    </text>
  );
}
