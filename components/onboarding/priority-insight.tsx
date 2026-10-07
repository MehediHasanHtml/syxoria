import type { KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import type { Priority } from "@/types";

/**
 * One priority, in the order the brief reads it: PRIORITY (what deserves attention) → INSIGHT
 * (what Syxoria discovered) → KPI (the evidence). Selected, it opens; the graph follows it.
 * A tab of a vertical tablist — arrows move between priorities.
 */
export function PriorityInsight({
  priority,
  rank,
  selected,
  onSelect,
  onKey,
  graphId,
}: {
  priority: Priority;
  rank: number;
  selected: boolean;
  onSelect: () => void;
  onKey: (e: KeyboardEvent<HTMLButtonElement>) => void;
  graphId: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={graphId}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onMouseEnter={onSelect}
      onKeyDown={onKey}
      className={cn("onb-priority onb-rise group block w-full py-4 text-left outline-none tight:py-3", selected && "onb-priority--on")}
    >
      <span className="flex items-center gap-2.5 font-label text-label uppercase text-fg-3">
        <span aria-hidden="true" className="onb-priority__mark h-px w-3" />
        Priority {String(rank).padStart(2, "0")}
      </span>
      <span className={cn("mt-2 block font-display font-light leading-snug tracking-[-0.015em] transition-colors duration-300", selected ? "text-[1.35rem] text-fg" : "text-[1.15rem] text-fg-2 group-hover:text-fg")}>
        {priority.title}
      </span>
      <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
        {priority.kpis.map((k, i) => (
          <span key={k.id}>
            {i > 0 && <span aria-hidden="true" className="mr-3 text-fg-3">·</span>}
            <span className={selected ? "text-accent-strong" : "text-fg-2"}>{k.value}</span> <span className="text-fg-3">{k.label}</span>
          </span>
        ))}
      </span>
      {selected && (
        <span className="onb-word mt-3 block">
          <span className="block text-[13.5px] leading-relaxed text-fg-2">{priority.insight}</span>
          <span className="mt-2 block text-[12px] text-fg-3">From {priority.basedOn}</span>
        </span>
      )}
    </button>
  );
}
