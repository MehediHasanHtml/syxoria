"use client";

import { Check } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { ModuleIcon } from "@/components/shared/module-icon";
import { cn } from "@/lib/cn";
import type { ModuleKey, ProductModule } from "@/types";
import {
  AppWindow,
  AutomateScreen,
  DirectionScreen,
  InsightsScreen,
  MomentumScreen,
  SignalScreen,
  TimeScreen,
  type PreviewData,
} from "./product-screens";

/**
 * Capabilities as live demos, not icon cards. Vertical tablist on desktop,
 * horizontal scroller on mobile; arrow keys work in both orientations.
 */
export function ModulesShowcase({ modules, data }: { modules: ProductModule[]; data: PreviewData }) {
  const [active, setActive] = useState<ModuleKey>(modules[0].key);
  const listRef = useRef<HTMLDivElement>(null);
  const current = modules.find((m) => m.key === active)!;

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const idx = modules.findIndex((m) => m.key === active);
    let next = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (idx + 1) % modules.length;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (idx - 1 + modules.length) % modules.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = modules.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const key = modules[next].key;
    setActive(key);
    const el = listRef.current?.querySelector<HTMLElement>(`[data-key="${key}"]`);
    el?.focus();
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:gap-10">
      <div
        ref={listRef}
        role="tablist"
        aria-label="Syxoria modules"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="-mx-[var(--gutter)] flex snap-x gap-2 overflow-x-auto px-[var(--gutter)] pb-1 scrollbar-none lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {modules.map((m, i) => {
          const selected = m.key === active;
          return (
            <button
              key={m.key}
              type="button"
              role="tab"
              data-key={m.key}
              id={`module-tab-${m.key}`}
              aria-controls={`module-panel-${m.key}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(m.key)}
              className={cn(
                "group relative flex shrink-0 snap-start items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-[background-color,border-color] duration-300",
                "lg:rounded-none lg:border-x-0 lg:border-b-0 lg:border-t lg:px-0 lg:py-5 lg:last:border-b",
                selected ? "border-line-strong bg-surface-2 lg:border-line lg:bg-transparent" : "border-line hover:bg-white/[0.02] lg:hover:bg-transparent",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -left-px top-0 hidden h-full w-px origin-top bg-accent transition-transform duration-500 ease-out-soft lg:block",
                  selected ? "scale-y-100" : "scale-y-0",
                )}
              />
              <span className="tabular hidden w-6 text-[11px] text-fg-3 lg:block lg:pl-4">{String(i + 1).padStart(2, "0")}</span>
              <ModuleIcon module={m.key} className={cn("size-[18px] transition-colors lg:ml-4", selected ? "text-accent" : "text-fg-3 group-hover:text-fg-2")} />
              <span className="flex flex-col">
                <span className={cn("text-sm font-medium transition-colors", selected ? "text-fg" : "text-fg-2 group-hover:text-fg")}>{m.name}</span>
                <span className="text-xs text-fg-3">{m.role}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={`module-panel-${current.key}`}
        role="tabpanel"
        aria-labelledby={`module-tab-${current.key}`}
        className="grid gap-6 rounded-xl border border-line bg-canvas-2/70 p-4 sm:p-6 xl:grid-cols-[1fr_1.35fr] xl:gap-8 xl:p-8"
      >
        <div key={current.key} className="flex animate-fade-in flex-col">
          <p className="eyebrow text-accent">
            {current.name} · {current.role}
          </p>
          <h3 className="mt-4 text-title font-medium text-fg text-balance">{current.summary}</h3>
          <ul className="mt-6 space-y-3 border-t border-line pt-6">
            {current.capabilities.map((c) => (
              <li key={c} className="flex items-start gap-3 text-[14px] text-fg-2">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-h-[340px] overflow-hidden rounded-lg border border-line shadow-panel">
          <AppWindow active={current.key} title={`${current.name} · ${current.role}`}>
            <div key={current.key} className="h-full animate-fade-in overflow-y-auto">
              {current.key === "lume" && <SignalScreen />}
              {current.key === "nexo" && <InsightsScreen data={data} />}
              {current.key === "volt" && <AutomateScreen />}
              {current.key === "kairo" && <MomentumScreen data={data} />}
              {current.key === "zento" && <TimeScreen />}
              {current.key === "orion" && <DirectionScreen />}
            </div>
          </AppWindow>
        </div>
      </div>
    </div>
  );
}
