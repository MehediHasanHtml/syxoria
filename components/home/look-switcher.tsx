"use client";

import { useEffect, useSyncExternalStore } from "react";
import { lookStore, type CoreLook } from "@/lib/core/look";
import { cn } from "@/lib/cn";

/** The Core's current look (palette, ground), from the URL / browser; server: the default. */
export function useCoreLook(): CoreLook {
  return useSyncExternalStore(lookStore.subscribe, lookStore.get, lookStore.server);
}

/**
 * A small panel to compare the Core's looks side by side, live — shown with
 * ?compare in the URL (and remembered once opened). Also keeps the page's
 * accent colour in step with the Core's light (html[data-core]).
 */
export function LookSwitcher() {
  const look = useCoreLook();

  useEffect(() => {
    document.documentElement.dataset.core = look.palette;
  }, [look.palette]);

  if (!look.compare) return null;
  return (
    <div
      role="group"
      aria-label="Compare the Core's looks"
      className="fixed bottom-4 left-4 z-(--z-toast) flex flex-col gap-2 rounded-2xl border border-white/10 bg-[rgb(12_13_14/0.8)] p-2.5 shadow-float backdrop-blur-xl"
    >
      <p className="flex items-center justify-between gap-6 px-1 font-mono text-[9.5px] uppercase tracking-[0.26em] text-fg-3">
        Compare
        <button type="button" onClick={() => lookStore.set({ compare: false })} className="text-fg-3 transition-colors hover:text-fg" aria-label="Hide the compare panel">
          ✕
        </button>
      </p>
      <Segment
        label="Light"
        value={look.palette}
        options={[
          { id: "gold", label: "Gold", swatch: "#f2b46e" },
          { id: "emerald", label: "Emerald", swatch: "#2fae78" },
        ]}
        onChange={(palette) => lookStore.set({ palette })}
      />
      <Segment
        label="Ground"
        value={look.ground}
        options={[
          { id: "float", label: "Floating" },
          { id: "lines", label: "Lines" },
        ]}
        onChange={(ground) => lookStore.set({ ground })}
      />
    </div>
  );
}

function Segment<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string; swatch?: string }[]; onChange: (v: T) => void }) {
  const index = options.findIndex((o) => o.id === value);
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 px-1 text-[11px] text-fg-3">{label}</span>
      <div role="radiogroup" aria-label={label} className="relative grid grid-cols-2 rounded-full bg-white/[0.05] p-0.5">
        <span aria-hidden="true" className="absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full bg-white/[0.12] transition-transform duration-500 ease-out-soft" style={{ transform: `translateX(${index * 100}%)` }} />
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={o.id === value}
            onClick={() => onChange(o.id)}
            className={cn("relative z-10 flex h-7 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full px-3 text-[11.5px] transition-colors", o.id === value ? "text-fg" : "text-fg-3 hover:text-fg-2")}
          >
            {o.swatch && <span className="size-2 rounded-full" style={{ background: o.swatch }} />}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
