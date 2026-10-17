"use client";

import { Check, CircleAlert, Sun, Sunrise, Sunset, type LucideIcon } from "lucide-react";
import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import { briefingTime, dailyBriefing as copy } from "@/content/briefing";
import type { BriefingPeriod, DailyBriefing } from "@/types";

const ICON: Record<BriefingPeriod, LucideIcon> = { morning: Sunrise, midday: Sun, evening: Sunset };

/**
 * The day's three briefings. Above, one clear choice: Morning · Midday · Evening, each with the
 * time it was prepared; the latest carries a small emerald mark, those still to come stand quiet
 * and out of reach. Below, on the same three columns, one rail: where the day's main thread stood
 * at each briefing, so the progression reads at a glance (identified in the morning, in progress
 * at midday, completed by the evening). The rail is lit up to the briefing in view.
 * One radio group: the arrow keys go along the day.
 */
export function BriefingPeriods({
  briefings,
  upcoming = [],
  current,
  onChoose,
}: {
  briefings: DailyBriefing[];
  upcoming?: { period: BriefingPeriod; time: string }[];
  current: string;
  onChoose: (id: string) => void;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const at = briefings.findIndex((b) => b.id === current);
  const latest = briefings.length - 1;
  const onKey = (e: KeyboardEvent) => {
    const go = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!go) return;
    e.preventDefault();
    const next = briefings[(at + go + briefings.length) % briefings.length];
    onChoose(next.id);
    refs.current[next.id]?.focus();
  };
  const stageOf = (b: DailyBriefing) => `${copy.day.stages[b.stage.state]}: ${b.stage.label}`;

  return (
    <div className="bd-days" style={{ "--n": briefings.length + upcoming.length } as CSSProperties}>
      <div role="radiogroup" aria-label={copy.periodsLabel} className="bd-seg" onKeyDown={onKey}>
        {briefings.map((b, i) => {
          const Icon = ICON[b.period];
          const on = i === at;
          const time = briefingTime(b.preparedAt);
          const isLatest = i === latest && briefings.length > 1;
          return (
            <button
              key={b.id}
              ref={(el) => {
                refs.current[b.id] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${copy.day.briefing(copy.periods[b.period], time)}. ${stageOf(b)}${isLatest ? `. ${copy.latest}` : ""}`}
              tabIndex={on ? 0 : -1}
              className="bd-seg__item"
              data-latest={isLatest || undefined}
              onClick={() => onChoose(b.id)}
            >
              <Icon aria-hidden="true" className="bd-seg__icon" strokeWidth={1.7} />
              <span className="bd-seg__name">{copy.periods[b.period]}</span>
              <span className="bd-seg__time tabular">{time}</span>
            </button>
          );
        })}
        {upcoming.map((u) => {
          const Icon = ICON[u.period];
          return (
            <span key={u.period} className="bd-seg__item" data-upcoming="" title={copy.upcoming(u.time)}>
              <Icon aria-hidden="true" className="bd-seg__icon" strokeWidth={1.7} />
              <span className="bd-seg__name">{copy.periods[u.period]}</span>
              <span className="bd-seg__time tabular">{u.time}</span>
              <span className="sr-only">, {copy.upcoming(u.time).toLowerCase()}</span>
            </span>
          );
        })}
      </div>

      {/* where the day's main thread stood at each briefing: screen readers hear it in each choice's name */}
      <ol aria-hidden="true" className="bd-rail">
        {briefings.map((b, i) => (
          <li
            key={b.id}
            className="bd-rail__step"
            data-state={b.stage.state}
            data-on={i === at || undefined}
            data-ahead={i > at || undefined}
            data-link={i < latest ? (i < at ? "read" : "day") : upcoming.length ? "ahead" : undefined}
            onClick={() => onChoose(b.id)}
          >
            <span className="bd-rail__node">
              {b.stage.state === "completed" && <Check className="size-2.5" strokeWidth={3} />}
              {b.stage.state === "blocked" && <CircleAlert className="size-3" strokeWidth={2.2} />}
            </span>
            <span className="bd-rail__state">{copy.day.stages[b.stage.state]}</span>
            <span className="bd-rail__label">{b.stage.label}</span>
          </li>
        ))}
        {upcoming.map((u, i) => (
          <li key={u.period} className="bd-rail__step" data-upcoming="" data-link={i < upcoming.length - 1 ? "ahead" : undefined}>
            <span className="bd-rail__node" />
            <span className="bd-rail__state">{copy.day.upcoming}</span>
            <span className="bd-rail__label">{copy.upcoming(u.time)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
