"use client";

import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CoreButton } from "@/components/home/core-button";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { knowledgeLabels, understanding as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { getInitialAnalysis, understandCompany } from "@/services/onboarding";
import type { CompanyProfile, DataSource, InitialAnalysis, KnowledgeEntry, KnowledgeKind } from "@/types";
import { CoreMark } from "./core-mark";
import { rise } from "./primitives";

/* The map's geometry, in a 640 × 400 frame (HTML labels are placed in % of it) */
const W = 640;
const H = 400;
const CORE = { x: 232, y: 200 };
const CLUSTERS: Record<KnowledgeKind, { x: number; y: number }> = {
  conversations: { x: 418, y: 74 },
  documents: { x: 552, y: 132 },
  clients: { x: 566, y: 258 },
  opportunities: { x: 446, y: 318 },
  invoices: { x: 318, y: 334 },
};
const KINDS = Object.keys(CLUSTERS) as KnowledgeKind[];
const DOTS = 26;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/** A deterministic scatter of dots in a disc (golden-angle spiral, a little irregular).
    Rounded, so server and browser — whose trigonometry can differ in the last digit — agree. */
function scatter(seed: number) {
  return Array.from({ length: DOTS }, (_, i) => {
    const r = 30 * Math.sqrt((i + 0.6) / DOTS) * (0.82 + 0.3 * Math.abs(Math.sin(seed * 13.1 + i * 7.7)));
    const a = i * 2.39996 + seed;
    const round = (v: number) => Math.round(v * 100) / 100;
    return { x: round(Math.cos(a) * r), y: round(Math.sin(a) * r * 0.92), s: round(1.1 + 0.9 * Math.abs(Math.sin(seed + i * 3.3))) };
  });
}
/** How many dots a count fills: by order of magnitude, so 150 and 18,000 look different */
const filled = (count: number) => (count > 0 ? Math.min(DOTS, Math.ceil(Math.log10(count + 1) * 6.2)) : 0);
/** A gentle curve from a to b, bowed sideways by `bend` */
function curve(a: { x: number; y: number }, b: { x: number; y: number }, bend = 0.18) {
  const mx = (a.x + b.x) / 2 - (b.y - a.y) * bend;
  const my = (a.y + b.y) / 2 + (b.x - a.x) * bend;
  return { d: `M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`, mid: { x: (a.x + 2 * mx + b.x) / 4, y: (a.y + 2 * my + b.y) / 4 } };
}

type Link = { from: KnowledgeKind; to: KnowledgeKind; label: string };

type Props = {
  company: CompanyProfile;
  sources: DataSource[];
  found: Partial<Record<KnowledgeKind, number>>;
  level: number;
  onFound: (kind: KnowledgeKind, count: number) => void;
  onUnderstood: (knowledge: KnowledgeEntry[]) => void;
  onAnalysed: (analysis: InitialAnalysis) => void;
};

/**
 * The system reading the company — not a loading screen. Connected sources stream into the
 * Core; what it finds gathers into named clusters that fill as counts rise; relationships draw
 * themselves between them; and it says, in plain words, what it is doing and what it notices.
 */
export function UnderstandingState({ company, sources, found, level, onFound, onUnderstood, onAnalysed }: Props) {
  const [phase, setPhase] = useState({ id: "connect", message: "Connecting your company data…" });
  const [links, setLinks] = useState<Link[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[] | null>(null);
  const [analysis, setAnalysis] = useState<InitialAnalysis | null>(null);
  const [failed, setFailed] = useState(false);
  const [run, setRun] = useState(0);
  const done = Boolean(knowledge);
  const dots = useMemo(() => Object.fromEntries(KINDS.map((k, i) => [k, scatter(i * 1.7 + 0.4)])) as Record<KnowledgeKind, ReturnType<typeof scatter>>, []);

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        for await (const ev of understandCompany(company, sources, { signal: abort.signal })) {
          if (ev.type === "phase") setPhase({ id: ev.id, message: ev.message });
          else if (ev.type === "found") onFound(ev.kind, ev.count);
          else if (ev.type === "link") setLinks((l) => [...l, ev]);
          else if (ev.type === "notice") setNotices((n) => [...n, ev.text]);
          else if (ev.type === "done") {
            setKnowledge(ev.knowledge);
            onUnderstood(ev.knowledge);
            // the analysis is fetched while the user takes in the map
            setAnalysis(await getInitialAnalysis(company, sources));
          }
        }
      } catch (e) {
        if (!abort.signal.aborted && !(e instanceof DOMException && e.name === "AbortError")) setFailed(true);
      }
    })();
    return () => abort.abort();
    // a new run restarts the reading (after an interruption)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  const srcY = (i: number) => CORE.y + (i - (sources.length - 1) / 2) * Math.min(64, 330 / Math.max(1, sources.length - 1 || 1));

  return (
    <div className="w-full max-w-[46rem]">
      <p className="onb-rise font-label text-label uppercase text-fg-3">{done ? "Understood" : `Getting to know ${company.name}`}</p>
      <div className="mt-3 min-h-[2.6em] sm:min-h-[1.3em]" aria-live="polite">
        {done ? (
          <h1 className="onb-rise font-display text-[clamp(1.75rem,1.3rem+1.4vw,2.5rem)] font-light leading-[1.12] tracking-(--title-tracking) text-fg">
            Syxoria now understands <em className="font-serif italic text-accent-strong">{company.name}.</em>
          </h1>
        ) : (
          <h1 key={phase.id} className="onb-word font-display text-[clamp(1.5rem,1.2rem+1vw,2.1rem)] font-light leading-[1.15] tracking-(--title-tracking) text-fg">
            {phase.message}
          </h1>
        )}
      </div>

      {/* the map */}
      <div className={cn("onb-map relative mt-8 aspect-[16/10] w-full", done && "onb-map--done")} role="img" aria-label={`Map of what Syxoria has found so far: ${KINDS.map((k) => `${knowledgeLabels[k]} ${found[k] ?? 0}`).join(", ")}`}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
          {/* sources → the Core */}
          {sources.map((s, i) => {
            const { d } = curve({ x: 70, y: srcY(i) }, CORE, -0.12);
            return (
              <g key={s.id}>
                <path d={d} className="onb-map__line" />
                <path d={d} pathLength={1} className="onb-map__flow" style={{ animationDelay: `${-i * 0.4}s` }} />
              </g>
            );
          })}
          {/* the Core → each cluster, drawn when something is found there */}
          {KINDS.map((k) => {
            const { d } = curve(CORE, CLUSTERS[k], 0.1);
            const on = (found[k] ?? 0) > 0;
            return (
              <g key={k} className={cn("onb-map__branch", on && "onb-map__branch--on")}>
                <path d={d} pathLength={1} className="onb-map__draw" />
                {on && <path d={d} pathLength={1} className="onb-map__flow onb-map__flow--out" />}
              </g>
            );
          })}
          {/* relationships between clusters */}
          {links.map((l) => {
            const { d } = curve(CLUSTERS[l.from], CLUSTERS[l.to], 0.22);
            return <path key={`${l.from}-${l.to}`} d={d} pathLength={1} className="onb-map__relation" />;
          })}
          {/* the clusters */}
          {KINDS.map((k) => {
            const c = CLUSTERS[k];
            const n = filled(found[k] ?? 0);
            const missing = done && !found[k];
            return (
              <g key={k} transform={`translate(${c.x} ${c.y})`}>
                <circle r="38" className={cn("onb-map__halo", n > 0 && "onb-map__halo--on")} />
                {missing && <circle r="22" className="onb-map__missing" />}
                {dots[k].map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={p.s} className="onb-map__dot" data-on={i < n || undefined} style={{ transitionDelay: `${(i % 5) * 70}ms` }} />
                ))}
              </g>
            );
          })}
        </svg>

        {/* sources, on the left */}
        {sources.map((s, i) => (
          <span
            key={s.id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center"
            style={{ left: pct(44, W), top: pct(srcY(i), H) }}
            title={s.name}
          >
            <span className="grid size-7 place-items-center rounded-md border border-white/[0.09] bg-canvas-2 sm:size-9">
              {s.logo && <IntegrationLogo id={s.logo} size={16} />}
            </span>
          </span>
        ))}

        {/* the Core, at the heart of it */}
        <span className="absolute w-[13%] -translate-x-1/2 -translate-y-1/2" style={{ left: pct(CORE.x, W), top: pct(CORE.y, H) }}>
          <CoreMark level={level} working={!done} className="w-full" />
        </span>

        {/* cluster labels */}
        {KINDS.map((k) => {
          const c = CLUSTERS[k];
          const count = found[k] ?? 0;
          const missing = done && !count;
          return (
            <span key={k} aria-hidden="true" className="absolute hidden -translate-x-1/2 text-center sm:block" style={{ left: pct(c.x, W), top: pct(c.y + 40, H) }}>
              <span className={cn("block tabular font-display text-[19px] leading-none transition-colors duration-500", count ? "text-fg" : "text-fg-3/50")}>
                {count ? formatNumber(count) : missing ? "—" : "·"}
              </span>
              <span className="mt-1 block whitespace-nowrap text-[10.5px] uppercase tracking-[0.12em] text-fg-3">{knowledgeLabels[k]}</span>
              {missing && <span className="mt-0.5 block whitespace-nowrap text-[10px] text-fg-3/70">Not found</span>}
            </span>
          );
        })}

        {/* what links them */}
        {links.map((l) => {
          const { mid } = curve(CLUSTERS[l.from], CLUSTERS[l.to], 0.22);
          return (
            <span key={`${l.from}-${l.to}`} className="onb-rise absolute hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/[0.07] bg-canvas/90 px-2 py-0.5 text-[10.5px] text-fg-2 sm:block" style={{ left: pct(mid.x, W), top: pct(mid.y, H) }}>
              {l.label}
            </span>
          );
        })}
      </div>

      {/* phones: the map keeps its shape, the counts move underneath it */}
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:hidden">
        {KINDS.map((k) => (
          <div key={k} className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] pb-2">
            <dt className="text-[12.5px] text-fg-3">{knowledgeLabels[k]}</dt>
            <dd className={cn("tabular font-display text-[15px]", found[k] ? "text-fg" : "text-fg-3/60")}>{found[k] ? formatNumber(found[k]) : done ? "—" : "·"}</dd>
          </div>
        ))}
      </dl>

      {/* what it notices along the way */}
      <section aria-labelledby="noticed" className="mt-8 border-t border-white/[0.07] pt-6">
        <h2 id="noticed" className="font-label text-label uppercase text-fg-3">
          {copy.noticed}
        </h2>
        <ul className="mt-3.5 grid gap-2.5" aria-live="polite">
          {notices.length === 0 && <li className="text-[14px] text-fg-3">Reading…</li>}
          {notices.map((n) => (
            <li key={n} className="onb-rise flex gap-3 text-[14.5px] leading-snug text-fg-2">
              <span aria-hidden="true" className="mt-[0.6em] h-px w-3 shrink-0 bg-accent" />
              {n}
            </li>
          ))}
        </ul>
      </section>

      {failed && (
        <div className="onb-rise mt-8 flex flex-wrap items-center gap-4 text-[14px] text-fg-2" role="alert">
          The connection was interrupted. What was read is kept.
          <CoreButton
            onClick={() => {
              setFailed(false);
              setLinks([]);
              setNotices([]);
              setRun((r) => r + 1);
            }}
          >
            Resume
          </CoreButton>
        </div>
      )}

      {done && (
        <div className="onb-rise mt-9 flex flex-wrap items-center gap-x-6 gap-y-3" style={rise(2)}>
          <CoreButton onClick={() => analysis && onAnalysed(analysis)} busy={!analysis}>
            {analysis ? "See what Syxoria found" : "Preparing the analysis"}
          </CoreButton>
          <p className="flex items-center gap-2 text-[13px] text-fg-3">
            <Check className="size-3.5 text-accent-strong" aria-hidden="true" />
            {formatNumber((knowledge ?? []).reduce((s, k) => s + k.count, 0))} records read, from {sources.length} {sources.length === 1 ? "source" : "sources"}
          </p>
        </div>
      )}
    </div>
  );
}
