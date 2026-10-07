"use client";

import { Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/home/sheet";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { cn } from "@/lib/cn";
import { knowsFor, type KnowsItem, type KnowsStatus } from "@/lib/onboarding/machine";
import type { DataSource, OnboardingSnapshot } from "@/types";
import { rise } from "./primitives";

type Props = { snapshot: OnboardingSnapshot; sources: DataSource[] };

/** ✓ known · ● being learned now · ○ not yet */
export function KnowsMark({ status }: { status: KnowsStatus }) {
  if (status === "done")
    return (
      <span aria-hidden="true" className="onb-pop grid size-4 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong ring-1 ring-accent-line">
        <Check className="size-2.5" strokeWidth={3} />
      </span>
    );
  return (
    <span aria-hidden="true" className={cn("grid size-4 shrink-0 place-items-center rounded-full ring-1", status === "active" ? "ring-accent-line" : "ring-white/12")}>
      {status === "active" && <span className="size-1.5 animate-pulse-soft rounded-full bg-accent-strong" />}
    </span>
  );
}

const said: Record<KnowsStatus, string> = { done: "known", active: "in progress", pending: "not yet" };

/**
 * "What Syxoria knows": its memory of the company, written as the onboarding goes. Detailed while
 * the user watches it learn (identity, then sources); compact once it understands — finished
 * things fold into one line each. The more it knows, the less there is to read.
 */
export function KnowsContent({ snapshot, sources }: Props) {
  const { density, items } = knowsFor(snapshot);
  const company = snapshot.company ?? snapshot.candidate;
  const compact = density === "compact";
  const searching = snapshot.activity === "searching";

  const detail = (item: KnowsItem) => {
    if (compact) return null;
    if (item.id === "company" && snapshot.candidate && !snapshot.company) {
      const c = snapshot.candidate;
      const rows = [
        ["Legal form", c.legalForm.split(" · ")[0]],
        ["Activity", c.activity.label],
        ["Size", c.headcount],
        ["Based in", c.city],
      ];
      return (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12.5px]">
          {rows.map(([k, v], i) => (
            <div key={k} className="contents">
              <dt className="onb-rise text-fg-3" style={rise(i + 2)}>
                {k}
              </dt>
              <dd className="onb-rise text-fg-2" style={rise(i + 2)}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
      );
    }
    if (item.id === "sources" && snapshot.stage === "connections") {
      const touched = sources.filter((s) => snapshot.connections[s.id] && ["connected", "connecting"].includes(snapshot.connections[s.id].status));
      if (!touched.length) return <p className="mt-1.5 text-[12.5px] text-fg-3">Waiting for your tools.</p>;
      return (
        <ul className="mt-3 grid gap-2">
          {touched.map((s) => {
            const on = snapshot.connections[s.id].status === "connected";
            return (
              <li key={s.id} className="onb-rise flex items-center gap-2.5 text-[12.5px]">
                {s.logo && <IntegrationLogo id={s.logo} size={14} className={cn("transition-opacity duration-500", !on && "opacity-40")} />}
                <span className={on ? "text-fg-2" : "text-fg-3"}>{s.name}</span>
                <span className="ml-auto text-fg-3">{on ? "Read-only" : "Connecting…"}</span>
              </li>
            );
          })}
        </ul>
      );
    }
    return null;
  };

  return (
    <div data-density={density}>
      <p className="font-label text-label uppercase text-fg-3">What Syxoria knows</p>
      <p className={cn("mt-3 font-display font-light leading-tight tracking-[-0.02em] text-fg", compact ? "text-[1.2rem]" : "text-[1.55rem]")}>
        {company ? (
          <span key={company.name} className="onb-word inline-block">
            {company.name}
          </span>
        ) : (
          <span className={cn("text-fg-3", searching && "onb-searching")}>{searching ? "Searching the register…" : "A company to get to know"}</span>
        )}
      </p>
      {company && !compact && (
        <p className="onb-rise mt-1 text-[12.5px] text-fg-3">
          {company.sector[0].toUpperCase() + company.sector.slice(1)} · {company.city}
        </p>
      )}

      <ul className={cn("border-t border-white/[0.06]", compact ? "mt-4 grid gap-2.5 pt-4" : "mt-5 grid gap-3.5 pt-5")}>
        {items.map((item) => (
          <li key={item.id} className={cn("transition-opacity duration-700", item.status === "pending" && "opacity-55")}>
            <p className="flex items-center gap-2.5 text-[13px]">
              <KnowsMark status={item.status} />
              <span className={item.status === "pending" ? "text-fg-3" : "text-fg"}>{item.label}</span>
              <span className="sr-only">: {said[item.status]}</span>
            </p>
            {detail(item) && <div className="pl-[1.625rem]">{detail(item)}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Desktop: the memory, beside the conversation — it narrows as Syxoria understands */
export function WhatSyxoriaKnows(props: Props) {
  return (
    <aside aria-label="What Syxoria knows about your company" className="onb-memory rounded-xl border border-white/[0.06] bg-[linear-gradient(180deg,rgb(255_255_255/0.025),transparent_50%)] p-6">
      <KnowsContent {...props} />
    </aside>
  );
}

/** Small screens: the memory folds into one line under the bar, and opens as a sheet */
export function KnowsStrip(props: Props) {
  const [open, setOpen] = useState(false);
  const { items } = knowsFor(props.snapshot);
  const company = props.snapshot.company ?? props.snapshot.candidate;
  const known = items.filter((i) => i.status === "done").map((i) => i.label.split(" · ")[0]);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex w-full items-center gap-3 border-b border-white/[0.06] bg-canvas/80 px-(--gutter) py-3 text-left backdrop-blur-xl"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-label text-[0.625rem] uppercase tracking-(--label-tracking) text-fg-3">What Syxoria knows</span>
          <span className="mt-1 block truncate text-[14px] text-fg">
            {company?.name ?? "A company to get to know"}
            {known.length > 0 && <span className="text-fg-3"> · {known.join(" · ")}</span>}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-fg-3" aria-hidden="true" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} label="What Syxoria knows" header="Company profile">
        <KnowsContent {...props} />
      </Sheet>
    </>
  );
}
