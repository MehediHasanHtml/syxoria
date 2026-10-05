"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { lookStore, type CoreLook } from "@/lib/core/look";
import { cn } from "@/lib/cn";

/** The Core's current look (ground), from the URL / browser; server: the default. */
export function useCoreLook(): CoreLook {
  return useSyncExternalStore(lookStore.subscribe, lookStore.get, lookStore.server);
}

/** A small panel to compare the looks side by side, live — shown with ?compare in the URL. */
export function LookSwitcher() {
  const look = useCoreLook();
  // the type asked for in the URL stays on <html> (React resets its attributes on a development remount)
  useLayoutEffect(() => {
    if (look.type !== "editorial") document.documentElement.dataset.type = look.type;
  }, [look.type]);

  if (!look.compare) return null;
  return (
    <div
      role="group"
      aria-label="Compare the looks"
      className="fixed bottom-4 left-4 z-(--z-toast) flex flex-col gap-2 rounded-2xl border border-white/10 bg-canvas-2/85 p-2.5 shadow-float backdrop-blur-xl"
    >
      <p className="flex items-center justify-between gap-6 px-1 font-mono text-[9.5px] uppercase tracking-[0.26em] text-fg-3">
        Compare
        <button type="button" onClick={() => lookStore.set({ compare: false })} className="text-fg-3 transition-colors hover:text-fg" aria-label="Hide the compare panel">
          ✕
        </button>
      </p>
      <Segment
        label="Ground"
        value={look.ground}
        options={[
          { id: "float", label: "Floating" },
          { id: "lines", label: "Lines" },
        ]}
        onChange={(ground) => lookStore.set({ ground })}
      />
      <Segment
        label="Type"
        value={look.type}
        options={[
          { id: "editorial", label: "Editorial" },
          { id: "modern", label: "Modern" },
          { id: "original", label: "Original" },
        ]}
        onChange={(type) => lookStore.set({ type })}
      />
    </div>
  );
}

function Segment<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  const index = options.findIndex((o) => o.id === value);
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 px-1 text-[11px] text-fg-3">{label}</span>
      <div role="radiogroup" aria-label={label} className="relative grid auto-cols-fr grid-flow-col rounded-full bg-white/[0.05] p-0.5">
        <span
          aria-hidden="true"
          className="absolute inset-y-0.5 left-0.5 rounded-full bg-white/[0.12] transition-transform duration-500 ease-out-soft"
          style={{ width: `calc((100% - 0.25rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
        />
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={o.id === value}
            onClick={() => onChange(o.id)}
            className={cn("relative z-10 flex h-7 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full px-3 text-[11.5px] transition-colors", o.id === value ? "text-fg" : "text-fg-3 hover:text-fg-2")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
