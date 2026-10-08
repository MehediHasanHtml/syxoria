"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { DecodeText } from "@/components/shared/decode-text";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { knowledgeLabels, understanding as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { relationshipChain } from "@/lib/mock-data/onboarding";
import { getInitialAnalysis, understandCompany } from "@/services/onboarding";
import type { CompanyProfile, DataSource, Discovery as DiscoveryT, InitialAnalysis, KnowledgeEntry, KnowledgeKind, Relationship } from "@/types";
import { QuietButton, rise } from "./primitives";

type Props = {
  company: CompanyProfile;
  sources: DataSource[];
  found: Partial<Record<KnowledgeKind, number>>;
  progress: number;
  onFound: (kind: KnowledgeKind, count: number) => void;
  onUnderstood: (knowledge: KnowledgeEntry[]) => void;
  onAnalysed: (analysis: InitialAnalysis) => void;
};

type Geo = { w: number; h: number; core: { x: number; y: number; r: number }; sources: { x: number; y: number }[]; nodes: { x: number; y: number }[] };

/** How long the understood state is held before moving on by itself */
const HOLD = 3200;

/**
 * Syxoria reading the company — the onboarding's signature moment, not a loading screen.
 * Information leaves each connected source and flows into the Core, which opens and lights as it
 * reads; relationships form one by one (a client talks to you, the conversation leads to a quote,
 * the quote becomes an opportunity); and what it discovers is said plainly. Then it moves on.
 * Everything it learns is decoded as it arrives — words letter by letter, counts digit by digit
 * (DecodeText) — as if read in real time; the composition itself never moves.
 */
export function UnderstandingVisualization({ company, sources, found, progress, onFound, onUnderstood, onAnalysed }: Props) {
  const [phase, setPhase] = useState({ id: "open", message: `Opening ${company.name}’s sources` });
  const [links, setLinks] = useState<Relationship[]>([]);
  const [discoveries, setDiscoveries] = useState<DiscoveryT[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[] | null>(null);
  const [analysis, setAnalysis] = useState<InitialAnalysis | null>(null);
  const [pulse, setPulse] = useState(0);
  const [failed, setFailed] = useState(false);
  const [run, setRun] = useState(0);
  const done = Boolean(knowledge);

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        for await (const ev of understandCompany(company, sources, { signal: abort.signal })) {
          if (ev.type === "phase") setPhase({ id: ev.id, message: ev.message });
          else if (ev.type === "found") onFound(ev.kind, ev.count);
          else if (ev.type === "link") {
            setLinks((l) => [...l, ev.relationship]);
            setPulse((p) => p + 1);
          } else if (ev.type === "discovery") {
            setDiscoveries((d) => [...d, ev.discovery]);
            setPulse((p) => p + 1);
          } else if (ev.type === "done") {
            setKnowledge(ev.knowledge);
            onUnderstood(ev.knowledge);
            setPulse((p) => p + 1);
            // the priorities are fetched while the user takes the moment in
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

  // understood: hold the moment, then move on by itself — no "Next" needed
  const next = useRef(onAnalysed);
  useEffect(() => {
    next.current = onAnalysed;
  });
  useEffect(() => {
    if (!done || !analysis) return;
    const t = setTimeout(() => next.current(analysis), HOLD);
    return () => clearTimeout(t);
  }, [done, analysis]);

  /* ---------- geometry: measured, so the flows always meet what they join ---------- */
  const stage = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const c = (q: Element) => {
        const r = q.getBoundingClientRect();
        return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2, w: r.width };
      };
      const core = el.querySelector("[data-geo=core]");
      if (!core) return;
      const cc = c(core);
      setGeo({
        w: box.width,
        h: box.height,
        core: { x: cc.x, y: cc.y, r: cc.w / 2 },
        sources: [...el.querySelectorAll("[data-geo=source]")].map((n) => c(n)),
        nodes: [...el.querySelectorAll("[data-geo=node]")].map((n) => c(n)),
      });
    };
    measure();
    // again once everything has risen into place
    const settle = setTimeout(measure, 1000);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      clearTimeout(settle);
      ro.disconnect();
    };
  }, []);

  const linked = (from: KnowledgeKind, to: KnowledgeKind) => links.some((l) => l.from === from && l.to === to);
  const records = Object.values(found).reduce((s, n) => s + (n ?? 0), 0);

  return (
    <div className="onb-understanding flex w-full flex-col" data-done={done || undefined}>
      {/* what it is doing, in plain words */}
      <div className="min-h-[4.75rem]" aria-live="polite">
        <p className="onb-rise font-label text-label uppercase text-fg-3">
          {done ? "Understood" : `Getting to know ${company.name}`}
          {records > 0 && <span className="normal-case tracking-normal text-fg-3/80"> · {formatNumber(records)} records read</span>}
        </p>
        {done ? (
          <h1 className="onb-word mt-2.5 font-display text-[clamp(1.6rem,1.2rem+1.3vw,2.4rem)] font-light leading-[1.12] tracking-(--title-tracking) text-fg">
            {copy.understood.lead} <em className="font-serif italic text-accent-strong">{copy.understood.accent}</em> {company.name}.
          </h1>
        ) : (
          <h1 className="mt-2.5 font-display text-[clamp(1.45rem,1.15rem+1vw,2rem)] font-light leading-[1.15] tracking-(--title-tracking) text-fg">
            <DecodeText key={phase.id} text={phase.message} />
            <span className="onb-ellipsis" aria-hidden="true" />
          </h1>
        )}
      </div>

      {/* the stage: sources → the Core → how the business holds together */}
      <div ref={stage} className="onb-understanding__stage relative mt-4 grid items-center gap-6 lg:mt-2 lg:grid-cols-[3.5rem_minmax(0,1fr)_15rem] lg:gap-8">
        {geo && (
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 hidden size-full overflow-visible lg:block" viewBox={`0 0 ${geo.w} ${geo.h}`}>
            {geo.sources.map((s, i) => {
              const tx = geo.core.x - geo.core.r * 0.62;
              const ty = geo.core.y + (s.y - geo.core.y) * 0.22;
              const d = `M${s.x + 22} ${s.y} C${s.x + 120} ${s.y} ${tx - 110} ${ty} ${tx} ${ty}`;
              return (
                <g key={i}>
                  <path d={d} className="onb-flow__path" />
                  <path d={d} pathLength={1} className="onb-flow__packet" style={{ animationDelay: `${-i * 0.55}s` }} />
                  <path d={d} pathLength={1} className="onb-flow__packet" style={{ animationDelay: `${-i * 0.55 - 1.3}s` }} />
                </g>
              );
            })}
            {geo.nodes.map((n, i) => {
              const sx = geo.core.x + geo.core.r * 0.66;
              const sy = geo.core.y + (n.y - geo.core.y) * 0.25;
              const d = `M${sx} ${sy} C${sx + 90} ${sy} ${n.x - 110} ${n.y} ${n.x - 14} ${n.y}`;
              const on = (found[relationshipChain[i]] ?? 0) > 0;
              return <path key={i} d={d} pathLength={1} className={cn("onb-branch", on && "onb-branch--on")} />;
            })}
          </svg>
        )}

        {/* the sources it reads from */}
        <ul className="flex justify-center gap-3 lg:flex-col lg:items-center lg:gap-5" aria-label="Reading from">
          {sources.map((s, i) => (
            <li key={s.id} data-geo="source" className="onb-rise grid size-11 place-items-center rounded-xl border border-white/[0.08] bg-canvas-2" style={rise(i + 1)} title={s.name}>
              {s.logo && <IntegrationLogo id={s.logo} size={20} />}
              <span className="sr-only">{s.name}</span>
            </li>
          ))}
        </ul>

        {/* the Core, large: the brain of it all */}
        <div className="grid place-items-center">
          <span data-geo="core" data-core-target="" className="onb-core-large grid place-items-center">
            <SyxoriaCore state={done ? "understanding" : "learning"} progress={progress} pulse={pulse} vtName="syx-core" label="Syxoria" className="w-full" />
          </span>
        </div>

        {/* how the business holds together: client → conversation → quote → opportunity */}
        <ol className="onb-chain relative grid gap-0" aria-label="How your business holds together">
          {relationshipChain.map((k, i) => {
            const count = found[k] ?? 0;
            const next = relationshipChain[i + 1];
            const link = next && links.find((l) => l.from === k && l.to === next);
            return (
              <li key={k} className="relative">
                <div className={cn("flex items-baseline gap-3 transition-opacity duration-700", count ? "opacity-100" : "opacity-40")}>
                  <span data-geo="node" aria-hidden="true" className={cn("onb-chain__node relative top-[0.1em] size-2 shrink-0 self-center rounded-full", count && "onb-chain__node--on")} />
                  <DecodeText text={knowledgeLabels[k]} pending={!count} className="text-[14px] text-fg" />
                  <DecodeText text={count ? formatNumber(count) : "·"} delay={count ? 120 : 0} className="tabular ml-auto font-display text-[1.3rem] font-light leading-none text-fg" />
                </div>
                {next && (
                  <div className="relative ml-[3.5px] flex h-[clamp(2.25rem,5vh,3.5rem)] items-center border-l border-white/[0.07] pl-[1.15rem]">
                    <span aria-hidden="true" className={cn("onb-chain__edge absolute -left-px top-0 w-px", linked(k, next) && "onb-chain__edge--on")} />
                    {link && <DecodeText text={link.label} className="text-[11.5px] italic text-accent-strong" />}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* what it discovered — facts about the business, not row counts */}
      <ul className="mt-6 grid min-h-[4.5rem] grid-cols-2 gap-x-6 gap-y-4 border-t border-white/[0.07] pt-5 lg:grid-cols-4" aria-label="What Syxoria discovered" aria-live="polite">
        {discoveries.map((d) => (
          <Discovery key={d.id} discovery={d} />
        ))}
      </ul>

      {failed && (
        <div className="onb-rise mt-6 flex flex-wrap items-center gap-4 text-[14px] text-fg-2" role="alert">
          The connection was interrupted. What was read is kept.
          <QuietButton
            className="text-fg"
            onClick={() => {
              setFailed(false);
              setLinks([]);
              setDiscoveries([]);
              setRun((r) => r + 1);
            }}
          >
            Resume reading
          </QuietButton>
        </div>
      )}

      {/* it moves on by itself; the way forward is still there for keyboards and the impatient */}
      {done && analysis && (
        <div className="onb-rise mt-5 flex items-center gap-4" style={rise(3)}>
          <span aria-hidden="true" className="onb-hold h-px w-24 bg-white/10" style={{ ["--hold" as string]: `${HOLD}ms` }} />
          <QuietButton onClick={() => onAnalysed(analysis)} className="text-[12.5px]">
            See what deserves attention
          </QuietButton>
        </div>
      )}
    </div>
  );
}

/** One thing Syxoria discovered: the number, and what it means */
export function Discovery({ discovery }: { discovery: DiscoveryT }) {
  return (
    <li className="onb-discovery onb-rise" data-tone={discovery.tone}>
      <p className="tabular font-display text-[clamp(1.5rem,1.2rem+0.8vw,2rem)] font-light leading-none tracking-[-0.02em] text-fg">
        <DecodeText text={discovery.value} />
      </p>
      <p className="mt-1.5 text-[12.5px] leading-snug text-fg-2">
        <DecodeText text={discovery.label} delay={140} />
      </p>
    </li>
  );
}
