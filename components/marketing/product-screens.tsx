"use client";

import { Bell, Check, CircleCheck, LayoutGrid, Search, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AreaChart } from "@/components/dashboard/charts/area-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { LogoMark } from "@/components/shared/logo";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { ModuleIcon, moduleIcons } from "@/components/shared/module-icon";
import { PriorityIndicator } from "@/components/shared/status";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { Insight, Integration, Metric, ModuleKey, Project, TimePoint } from "@/types";

/** Data the marketing previews need — fetched through /services by the page. */
export type PreviewData = {
  metrics: Metric[];
  growth: TimePoint[];
  baseline: TimePoint[];
  insights: Insight[];
  projects: Project[];
  integrations: Integration[];
};

/* ------------------------------------------------------------------ */
/* Window chrome                                                       */
/* ------------------------------------------------------------------ */

const sideModules: ModuleKey[] = ["lume", "nexo", "volt", "kairo", "zento", "orion"];

export function AppWindow({
  children,
  active = "overview",
  className,
  title = "Overview",
}: {
  children: ReactNode;
  active?: ModuleKey | "overview";
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn("flex h-full overflow-hidden rounded-[inherit] bg-canvas-2 text-left", className)}>
      <div aria-hidden="true" className="hidden w-12 shrink-0 flex-col items-center gap-1 border-r border-line bg-canvas py-3 sm:flex">
        <LogoMark className="mb-3 size-5 text-fg" />
        <span className={cn("grid size-8 place-items-center rounded-md", active === "overview" ? "bg-surface-3 text-fg" : "text-fg-3")}>
          <LayoutGrid className="size-4" strokeWidth={1.5} />
        </span>
        {sideModules.map((m) => {
          const Icon = moduleIcons[m];
          return (
            <span key={m} className={cn("grid size-8 place-items-center rounded-md", active === m ? "bg-surface-3 text-fg" : "text-fg-3")}>
              <Icon className="size-4" strokeWidth={1.5} />
            </span>
          );
        })}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div aria-hidden="true" className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-line px-4">
          <span className="min-w-0 truncate text-[11px] font-medium uppercase tracking-label text-fg-2">{title}</span>
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="hidden h-6 w-36 items-center gap-1.5 rounded-sm border border-line bg-canvas px-2 text-[10px] text-fg-3 md:flex">
              <Search className="size-3" /> Search…
            </span>
            <span className="hidden whitespace-nowrap text-[10px] text-fg-3 xl:block">Thu 24 Sep 2026</span>
            <span className="relative">
              <Bell className="size-3.5 text-fg-3" />
              <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-accent" />
            </span>
            <span className="grid size-6 place-items-center rounded-full border border-line-strong bg-surface-3 text-[9px] text-fg-2">ML</span>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */

export function OverviewScreen({ data }: { data: PreviewData }) {
  return (
    // Rows keep their natural height (like the real dashboard) instead of stretching to the window.
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {data.metrics.map((m, i) => (
          <MetricCard key={m.id} metric={m} compact className={cn(i > 1 && "max-lg:hidden")} />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_15rem] lg:items-start">
        <div className="rounded-lg border border-line bg-surface/60 p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-[13px] font-medium tracking-tight text-fg">Value created</p>
              <p className="mt-0.5 truncate text-[11px] text-fg-3">Last 30 days vs the 30 before</p>
            </div>
            <span className="tabular shrink-0 rounded-sm bg-positive-soft px-1.5 py-0.5 text-[11px] text-positive">+64%</span>
          </div>
          <AreaChart data={data.growth} compare={data.baseline} label="Value created over 30 days" valueFormat="currency-compact" height={200} xLabels={4} />
        </div>
        <div className="hidden flex-col gap-2 rounded-lg border border-line bg-surface/60 p-3.5 lg:flex">
          <p className="mb-1 font-display text-[13px] font-medium tracking-tight text-fg">Needs you today</p>
          {data.insights.slice(0, 3).map((i) => (
            <div key={i.id} className="flex items-start gap-2 rounded-md border border-line/70 bg-canvas-2 p-2">
              <ModuleIcon module={i.module} className="mt-0.5 size-3.5 text-accent" />
              <p className="line-clamp-2 text-[11px] leading-snug text-fg-2">{i.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function InsightsScreen({ data }: { data: PreviewData }) {
  const [applied, setApplied] = useState<Record<string, "idle" | "loading" | "done">>({});
  const list = data.insights.filter((i) => i.status !== "dismissed" && i.status !== "locked").slice(0, 3);

  function apply(id: string) {
    setApplied((s) => ({ ...s, [id]: "loading" }));
    window.setTimeout(() => setApplied((s) => ({ ...s, [id]: "done" })), 900);
  }

  return (
    <ul className="grid gap-2.5">
      {list.map((i) => {
        const state = applied[i.id] ?? "idle";
        return (
          <li key={i.id} className="rounded-lg border border-line bg-surface/60 p-3.5 transition-colors hover:border-line-strong">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-2.5">
                <ModuleIcon module={i.module} framed size="sm" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-fg">{i.title}</p>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-fg-3">{i.summary}</p>
                </div>
              </div>
              <PriorityIndicator priority={i.priority} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 pl-9.5">
              <span className="text-[11px] text-fg-3">
                {i.impact.label} <span className="tabular text-fg-2">{i.impact.value}</span> · {Math.round(i.confidence * 100)}% confidence
              </span>
              <button
                type="button"
                onClick={() => apply(i.id)}
                disabled={state !== "idle"}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-sm px-2.5 text-[11px] font-medium transition-colors",
                  state === "done" ? "bg-positive-soft text-positive" : "bg-fg text-canvas hover:bg-white disabled:opacity-80",
                )}
              >
                {state === "loading" && <Spinner className="size-3" />}
                {state === "done" && <Check className="size-3" aria-hidden="true" />}
                {state === "idle" ? "Apply" : state === "loading" ? "Applying" : "Applied"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function MomentumScreen({ data }: { data: PreviewData }) {
  const projects = data.projects.filter((p) => p.status !== "completed").slice(0, 5);
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_13rem]">
      <div className="rounded-lg border border-line bg-surface/60 p-3.5">
        <p className="mb-3 text-[11px] text-fg-3">Goals & projects</p>
        <ul className="space-y-3.5">
          {projects.map((p) => (
            <li key={p.id}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-[12px]">
                <span className="flex min-w-0 items-center gap-2 text-fg-2">
                  <ModuleIcon module={p.module} className="size-3.5 text-fg-3" />
                  <span className="truncate">{p.name}</span>
                </span>
                <span className="tabular text-fg">{p.progress}%</span>
              </div>
              <Progress value={p.progress} label={`${p.name} progress`} tone={p.status === "at-risk" ? "caution" : p.status === "blocked" ? "negative" : "accent"} />
            </li>
          ))}
        </ul>
      </div>
      <div className="hidden flex-col justify-between rounded-lg border border-line bg-surface/60 p-3.5 lg:flex">
        <p className="text-[11px] text-fg-3">Momentum score</p>
        <p className="tabular text-4xl font-medium tracking-tight text-fg">
          78<span className="text-base text-fg-3">/100</span>
        </p>
        <p className="text-[11px] leading-snug text-fg-3">
          Up 6 points this week. <span className="text-fg-2">Cash collection</span> moved the most.
        </p>
      </div>
    </div>
  );
}

export function ConnectScreen({ data }: { data: PreviewData }) {
  const [connected, setConnected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(data.integrations.map((i) => [i.id, i.connected])),
  );
  const count = Object.values(connected).filter(Boolean).length;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] text-fg-3">Integrations</p>
        <p className="tabular text-[11px] text-fg-2" aria-live="polite">
          {count} connected
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {data.integrations.slice(0, 9).map((i) => {
          const on = connected[i.id];
          return (
            <li key={i.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setConnected((s) => ({ ...s, [i.id]: !s[i.id] }))}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-[border-color,background-color] duration-200",
                  on ? "border-accent-line bg-accent-soft" : "border-line bg-surface/60 hover:border-line-strong",
                )}
              >
                <IntegrationLogo id={i.id} size={18} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium text-fg">{i.name}</span>
                  <span className="block text-[10px] text-fg-3">{i.category}</span>
                </span>
                {on ? <CircleCheck className="size-3.5 shrink-0 text-accent" aria-label="Connected" /> : <span className="text-[10px] text-fg-3">Connect</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AutomateScreen() {
  const [state, setState] = useState<"review" | "approving" | "running">("review");
  const steps = [
    { label: "Invoice is 14 days overdue", detail: "Trigger · Stripe" },
    { label: "Draft a polite reminder", detail: "Nexo · tone matched to client" },
    { label: "Send after your approval", detail: "Volt · Gmail" },
    { label: "Reconcile when paid", detail: "Volt · bank feed" },
  ];
  return (
    <div className="rounded-lg border border-line bg-surface/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[13px] font-medium text-fg">
            <Zap className="size-3.5 text-accent" aria-hidden="true" /> Late invoice follow-up
          </p>
          <p className="mt-1 text-[11px] text-fg-3">Suggested by Nexo · would have recovered {formatCurrency(6380)} this month</p>
        </div>
        <span
          className={cn(
            "rounded-sm border px-2 py-0.5 text-[10px] font-medium",
            state === "running" ? "border-positive/30 bg-positive-soft text-positive" : "border-line-strong text-fg-2",
          )}
          aria-live="polite"
        >
          {state === "running" ? "Running" : "Awaiting approval"}
        </span>
      </div>
      <ol className="mt-4 space-y-0">
        {steps.map((s, i) => (
          <li key={s.label} className="relative flex gap-3 pb-3.5 last:pb-0">
            {i < steps.length - 1 && <span aria-hidden="true" className="absolute left-[9px] top-5 h-[calc(100%-12px)] w-px bg-line" />}
            <span
              aria-hidden="true"
              className={cn(
                "relative mt-0.5 grid size-[19px] shrink-0 place-items-center rounded-full border text-[9px] transition-colors duration-500",
                state === "running" ? "border-accent bg-accent text-canvas" : "border-line-strong bg-canvas text-fg-3",
              )}
              style={{ transitionDelay: `${i * 140}ms` }}
            >
              {state === "running" ? <Check className="size-2.5" /> : i + 1}
            </span>
            <div>
              <p className="text-[12px] text-fg">{s.label}</p>
              <p className="text-[10px] text-fg-3">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex gap-2 border-t border-line pt-3.5">
        <button
          type="button"
          disabled={state !== "review"}
          onClick={() => {
            setState("approving");
            window.setTimeout(() => setState("running"), 1000);
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-fg px-3 text-[12px] font-medium text-canvas transition-colors hover:bg-white disabled:opacity-70"
        >
          {state === "approving" && <Spinner className="size-3" />}
          {state === "review" ? "Approve automation" : state === "approving" ? "Approving" : "Approved"}
        </button>
        {state === "running" ? (
          <button type="button" onClick={() => setState("review")} className="h-8 rounded-sm px-3 text-[12px] text-fg-3 hover:text-fg">
            Reset demo
          </button>
        ) : (
          <span className="self-center text-[11px] text-fg-3">Nothing is sent without you.</span>
        )}
      </div>
    </div>
  );
}

export function SignalScreen() {
  const threads = [
    { from: "Atelier Rive", topic: "Contract signed — kickoff dates?", count: 6, tag: "Onboarding", unread: true },
    { from: "Monceau Partners", topic: "Invoice #1042 question", count: 3, tag: "Finance", unread: true },
    { from: "Studio Hale", topic: "Proposal feedback", count: 9, tag: "Sales", unread: false },
    { from: "Northwind", topic: "Monthly report received", count: 2, tag: "Reporting", unread: false },
  ];
  return (
    <div className="rounded-lg border border-line bg-surface/60">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <p className="text-[11px] text-fg-3">28 messages → 7 conversations</p>
        <span className="text-[11px] text-accent">2 need a reply</span>
      </div>
      <ul className="divide-y divide-line">
        {threads.map((t) => (
          <li key={t.from} className="flex items-center gap-3 px-3.5 py-3">
            <span className={cn("size-1.5 shrink-0 rounded-full", t.unread ? "bg-accent" : "bg-transparent")} aria-label={t.unread ? "Unread" : undefined} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-fg">{t.from}</p>
              <p className="truncate text-[11px] text-fg-3">{t.topic}</p>
            </div>
            <span className="rounded-xs border border-line px-1.5 py-0.5 text-[10px] text-fg-3">{t.tag}</span>
            <span className="tabular w-5 text-right text-[11px] text-fg-3">{t.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TimeScreen() {
  const people = [
    { name: "Inès", load: 118 },
    { name: "Clara", load: 92 },
    { name: "Théo", load: 74 },
    { name: "Maël", load: 101 },
  ];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return (
    <div className="rounded-lg border border-line bg-surface/60 p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] text-fg-3">Capacity · next week</p>
        <p className="text-[11px] text-caution">1 overload on Thursday</p>
      </div>
      <ul className="space-y-3">
        {people.map((p) => (
          <li key={p.name} className="grid grid-cols-[3.5rem_1fr_2.5rem] items-center gap-3">
            <span className="text-[12px] text-fg-2">{p.name}</span>
            <span className="grid grid-cols-5 gap-1" aria-hidden="true">
              {days.map((d, i) => {
                const over = p.load > 100 && i === 3;
                return <span key={d} className={cn("h-5 rounded-xs", over ? "bg-caution/70" : "bg-fg/15")} style={{ opacity: 0.45 + ((p.load / 100) * (i + 2)) / 10 }} />;
              })}
            </span>
            <span className={cn("tabular text-right text-[11px]", p.load > 100 ? "text-caution" : "text-fg-3")}>{p.load}%</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 grid grid-cols-[3.5rem_1fr_2.5rem] gap-3" aria-hidden="true">
        <span />
        <span className="grid grid-cols-5 gap-1 text-center text-[10px] text-fg-3">
          {days.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </span>
      </div>
    </div>
  );
}

export function DirectionScreen() {
  const decisions = [
    { title: "Raise Growth plan price for new clients", date: "22 Sep", status: "Decided" },
    { title: "Hire a second delivery lead in Q1", date: "18 Sep", status: "Proposed" },
    { title: "Pause the knowledge-base project", date: "12 Aug", status: "Decided" },
  ];
  return (
    <div className="grid gap-2.5">
      <div className="rounded-lg border border-line bg-surface/60 p-3.5">
        <p className="text-[11px] text-fg-3">Board pack · Q3 draft</p>
        <p className="mt-2 font-display font-light text-lg leading-snug text-fg">
          Revenue recovered grew 64% this quarter, driven by automated follow-ups and a shorter cash cycle.
        </p>
      </div>
      <ul className="divide-y divide-line rounded-lg border border-line bg-surface/60">
        {decisions.map((d) => (
          <li key={d.title} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
            <span className="min-w-0 truncate text-[12px] text-fg-2">{d.title}</span>
            <span className="flex shrink-0 items-center gap-2 text-[10px] text-fg-3">
              {d.date}
              <span className={cn("rounded-xs border px-1.5 py-0.5", d.status === "Decided" ? "border-accent-line text-accent" : "border-line")}>{d.status}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
