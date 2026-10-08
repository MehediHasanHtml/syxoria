import type { KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import type { Priority } from "@/types";

/**
 * One priority, read as a discovery rather than a report line: what deserves attention, in the
 * brand's serif. Selected, it opens — a thread of the Core's emerald runs down beside it, its
 * evidence arrives as the graph's curve reaches it, then what Syxoria concluded from it — all of
 * it from the same priority the graph draws. No numbering: their order already says which comes
 * first. A tab of a vertical tablist — arrows move between priorities. Styles: "Priorities".
 */
export function PriorityInsight({
  priority,
  rank,
  of,
  selected,
  onSelect,
  onKey,
  panelId,
}: {
  priority: Priority;
  rank: number;
  of: number;
  selected: boolean;
  onSelect: () => void;
  onKey: (e: KeyboardEvent<HTMLButtonElement>) => void;
  panelId: string;
}) {
  const id = `priority-${priority.id}`;
  const lead = priority.kpis[0];
  return (
    <button
      type="button"
      role="tab"
      id={`${id}-tab`}
      aria-selected={selected}
      aria-controls={panelId}
      aria-labelledby={`${id}-rank ${id}-title`}
      aria-describedby={selected ? `${id}-more` : undefined}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKey}
      className={cn("onb-priority onb-rise group block w-full text-left outline-none", selected && "onb-priority--on")}
    >
      <span id={`${id}-rank`} className="sr-only">
        Priority {rank} of {of}:
      </span>
      <span id={`${id}-title`} className="onb-priority__title block font-display font-light leading-snug tracking-[-0.015em]">
        {priority.title}
      </span>

      {/* closed: the one figure that says why it is here */}
      <span aria-hidden="true" className="onb-priority__hint">
        <span className="block min-h-0 overflow-hidden text-[12.5px] text-fg-3">
          {lead && (
            <span className="block pt-1">
              <span className="tabular text-fg-2">{lead.value}</span> {lead.label}
            </span>
          )}
        </span>
      </span>

      {/* open: the evidence, then the conclusion — remounted on each selection, so it plays again */}
      <span className="onb-priority__more">
        <span key={selected ? "on" : "off"} id={`${id}-more`} className="min-h-0 overflow-hidden">
          <span className="block pt-3">
            <span className="flex flex-wrap gap-x-6 gap-y-2">
              {priority.kpis.map((k, i) => (
                <span key={k.id} className="onb-priority__figure block" style={{ ["--i" as string]: i }}>
                  <span className="tabular block font-display text-[1.3rem] font-light leading-none tracking-[-0.02em] text-fg">{k.value}</span>
                  <span className="mt-1 block text-[12px] text-fg-3">{k.label}</span>
                </span>
              ))}
            </span>
            <span className="onb-priority__observation mt-3.5 block">
              <span className="block text-[13.5px] leading-relaxed text-fg-2">{priority.insight}</span>
              <span className="mt-2 block text-[12px] text-fg-3">From {priority.basedOn}</span>
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
