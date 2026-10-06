"use client";

import { ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet } from "@/components/home/sheet";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { autonomy as copy, knowledgeLabels } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { AutonomyPolicy, DataSource, KnowledgeKind, OnboardingSnapshot } from "@/types";
import { effectiveMode } from "./permission-control";

type Props = { snapshot: OnboardingSnapshot; sources: DataSource[]; policy: AutonomyPolicy };

const KINDS: KnowledgeKind[] = ["clients", "opportunities", "invoices", "documents", "conversations"];

function Section({ label, filled, empty, children }: { label: string; filled: boolean; empty: string; children?: ReactNode }) {
  return (
    <section className={cn("border-t border-white/[0.06] py-4 transition-opacity duration-700", !filled && "opacity-60")}>
      <h3 className="flex items-center gap-2.5 font-label text-label uppercase text-fg-3">
        <span aria-hidden="true" className={cn("size-1 rounded-full transition-colors duration-700", filled ? "bg-accent-strong shadow-[0_0_8px_var(--core-glow)]" : "bg-white/20")} />
        {label}
      </h3>
      {filled ? <div className="onb-rise mt-3">{children}</div> : <p className="mt-2 text-[13px] text-fg-3">{empty}</p>}
    </section>
  );
}

/**
 * "What Syxoria knows": the system's memory of the company, written as the onboarding goes —
 * identity, sources, what it found, what it will work towards, what it may do. The one element
 * that stays through every moment, so the user watches the system become richer.
 */
export function MemoryContent({ snapshot, sources, policy }: Props) {
  const { company, connections, found, analysis, mandate } = snapshot;
  // connected, or on the way — a failed attempt is not something the system knows
  const connected = sources.filter((s) => connections[s.id] && connections[s.id].status !== "error");
  const anyFound = KINDS.some((k) => (found[k] ?? 0) > 0);
  const level = mandate ? policy.levels.find((l) => l.id === mandate.level) : null;
  const asks = mandate ? policy.rules.filter((r) => r.group === "act" && effectiveMode(r, mandate) === "ask").map((r) => r.label.toLowerCase()) : [];

  return (
    <div>
      <p className="font-label text-label uppercase text-fg-3">What Syxoria knows</p>
      <p className="mt-3 font-display text-[1.65rem] font-light leading-tight tracking-[-0.02em] text-fg">
        {company ? company.name : <span className="text-fg-3">A company to get to know</span>}
      </p>
      {company && (
        <p className="onb-rise mt-1.5 text-[13px] text-fg-3">
          {company.sector[0].toUpperCase() + company.sector.slice(1)} · {company.city}
        </p>
      )}

      <div className="mt-5">
        <Section label="Identity" filled={Boolean(company)} empty="From your SIREN, in a moment.">
          {company && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
              <dt className="text-fg-3">Legal form</dt>
              <dd className="text-fg-2">{company.legalForm.split(" · ")[0]}</dd>
              <dt className="text-fg-3">Activity</dt>
              <dd className="text-fg-2">{company.activity.label}</dd>
              <dt className="text-fg-3">Size</dt>
              <dd className="text-fg-2">{company.headcount}</dd>
            </dl>
          )}
        </Section>

        <Section label="Sources" filled={connected.some((s) => connections[s.id].status === "connected")} empty="Waiting for the tools you use.">
          <ul className="flex flex-col gap-2">
            {connected.map((s) => {
              const c = connections[s.id];
              return (
                <li key={s.id} className="flex items-center gap-2.5 text-[13px]">
                  {s.logo && <IntegrationLogo id={s.logo} size={14} className={cn(c.status !== "connected" && "opacity-40")} />}
                  <span className={c.status === "connected" ? "text-fg-2" : "text-fg-3"}>{s.name}</span>
                  <span className="ml-auto text-[12px] text-fg-3">{c.status === "connected" ? "Read-only" : "Connecting…"}</span>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section label="Understanding" filled={anyFound} empty="Begins once a source is connected.">
          <ul className="flex flex-col gap-2">
            {KINDS.map((k) => (
              <li key={k} className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="text-fg-3">{knowledgeLabels[k]}</span>
                <span className={cn("tabular", found[k] ? "text-fg" : "text-fg-3")}>{found[k] ? formatNumber(found[k]) : "—"}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section label="Working towards" filled={Boolean(analysis)} empty="Comes from the first analysis.">
          <ul className="flex flex-col gap-2 text-[13px] text-fg-2">
            {analysis?.objectives.map((o) => (
              <li key={o} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-[0.55em] h-px w-2.5 shrink-0 bg-accent" />
                {o}
              </li>
            ))}
          </ul>
        </Section>

        <Section label="Mandate" filled={Boolean(level)} empty="You decide what it may do.">
          <p className="text-[13px] text-fg">{level?.name}</p>
          {asks.length > 0 && (
            <p className="mt-1.5 text-[13px] leading-snug text-fg-3">
              {copy.ask}: {asks.join(", ")}.
            </p>
          )}
        </Section>
      </div>
    </div>
  );
}

/** Desktop: the memory, beside the conversation */
export function MemoryPanel(props: Props) {
  return (
    <aside aria-label="What Syxoria knows about your company" className="h-full">
      {/* focusable, so it can be scrolled from the keyboard when it is taller than the screen */}
      <div tabIndex={0} className="onb-memory sticky top-24 max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain rounded-xl [scrollbar-width:thin] [scrollbar-color:var(--color-line-strong)_transparent] border border-white/[0.06] bg-[linear-gradient(180deg,rgb(255_255_255/0.025),transparent_40%)] p-6">
        <MemoryContent {...props} />
      </div>
    </aside>
  );
}

/** Small screens: the memory folds into one line under the bar, and opens as a sheet */
export function MemoryStrip(props: Props) {
  const [open, setOpen] = useState(false);
  const { company, connections, found } = props.snapshot;
  const sources = Object.values(connections).filter((c) => c.status === "connected").length;
  const records = Object.values(found).reduce((s, n) => s + (n ?? 0), 0);
  const facts = [sources ? `${sources} ${sources === 1 ? "source" : "sources"}` : null, records ? `${formatNumber(records)} records` : null].filter(Boolean).join(" · ");
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="onb-strip flex w-full items-center gap-3 border-b border-white/[0.06] bg-canvas/80 px-(--gutter) py-3 text-left backdrop-blur-xl"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-label text-[0.625rem] uppercase tracking-(--label-tracking) text-fg-3">What Syxoria knows</span>
          <span className="mt-1 block truncate text-[14px] text-fg">
            {company?.name ?? "A company to get to know"}
            {facts && <span className="text-fg-3"> · {facts}</span>}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-fg-3" aria-hidden="true" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} label="What Syxoria knows" header="Company profile">
        <MemoryContent {...props} />
      </Sheet>
    </>
  );
}
