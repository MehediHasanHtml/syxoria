"use client";

import { Sun, Sunrise, Sunset, type LucideIcon } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";
import { briefingTime, dailyBriefing as copy } from "@/content/briefing";
import type { BriefingPeriod, DailyBriefing } from "@/types";

const ICON: Record<BriefingPeriod, LucideIcon> = { morning: Sunrise, midday: Sun, evening: Sunset };

/** Today's briefings — morning, midday, evening — as one compact choice; the latest is marked */
export function BriefingPeriods({ briefings, current, onChoose }: { briefings: DailyBriefing[]; current: string; onChoose: (id: string) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const latest = briefings.at(-1)?.id;
  const onKey = (e: KeyboardEvent) => {
    const go = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!go) return;
    e.preventDefault();
    const i = briefings.findIndex((b) => b.id === current);
    const next = briefings[(i + go + briefings.length) % briefings.length];
    onChoose(next.id);
    refs.current[next.id]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={copy.periodsLabel} className="bd-periods" onKeyDown={onKey}>
      {briefings.map((b) => {
        const Icon = ICON[b.period];
        const on = b.id === current;
        return (
          <button
            key={b.id}
            ref={(el) => {
              refs.current[b.id] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            className="bd-periods__item"
            onClick={() => onChoose(b.id)}
          >
            <Icon aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
            <span>{copy.periods[b.period]}</span>
            <span className="bd-periods__time tabular">{briefingTime(b.preparedAt)}</span>
            {b.id === latest && (
              <span className="bd-periods__latest" title={copy.latest}>
                <span className="sr-only">, {copy.latest}</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
