"use client";

import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import { briefingTime, dailyBriefing as copy } from "@/content/briefing";
import type { BriefingPeriod, DailyBriefing } from "@/types";

/**
 * The day line: today's briefings — morning, midday, evening — as three stations on one thin line,
 * so the day reads as one progression rather than three pages. The part of the day already briefed
 * is lit, up to the briefing in view; the latest carries the Core's emerald; those still to come
 * stand at the end, quiet and out of reach. Under each station, what that briefing brought in a few
 * words (from its changes: risks, what is new, what was done, what is still open).
 * One radio group: the arrow keys go along the day.
 */

/** What a briefing brought, in at most two counts, the most pressing first */
function brought(b: DailyBriefing): string {
  if (!b.changes) return copy.day.first;
  const count = (...kinds: string[]) => b.changes!.filter((c) => kinds.includes(c.kind)).length;
  const parts = [
    copy.day.risk(count("risk")),
    copy.day.new(count("new", "opportunity")),
    copy.day.done(count("completed", "decided")),
    copy.day.open(count("unresolved")),
  ].filter((p) => !p.startsWith("0 "));
  return parts.slice(0, 2).join(" · ") || copy.day.first;
}

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
  // the line after each station: lit up to the briefing in view, then the rest of the day so far, then what is to come
  const link = (i: number) => (i < at ? "read" : i < latest ? "day" : upcoming.length ? "ahead" : undefined);

  return (
    <div role="radiogroup" aria-label={copy.periodsLabel} className="bd-day" style={{ "--n": briefings.length + upcoming.length } as CSSProperties} onKeyDown={onKey}>
      {briefings.map((b, i) => {
        const on = i === at;
        const time = briefingTime(b.preparedAt);
        return (
          <button
            key={b.id}
            ref={(el) => {
              refs.current[b.id] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${copy.day.briefing(copy.periods[b.period], time)}: ${brought(b)}${i === latest && briefings.length > 1 ? `, ${copy.latest.toLowerCase()}` : ""}`}
            tabIndex={on ? 0 : -1}
            className="bd-day__stop"
            data-on={on || undefined}
            data-latest={i === latest || undefined}
            data-link={link(i)}
            onClick={() => onChoose(b.id)}
          >
            <span aria-hidden="true" className="bd-day__node" />
            <span aria-hidden="true" className="bd-day__name">
              {copy.periods[b.period]} <span className="bd-day__time tabular">{time}</span>
            </span>
            <span aria-hidden="true" className="bd-day__brought">
              {brought(b)}
            </span>
          </button>
        );
      })}
      {upcoming.map((u, i) => (
        <span key={u.period} className="bd-day__stop" data-upcoming="" data-link={i < upcoming.length - 1 ? "ahead" : undefined} title={copy.upcoming(u.time)}>
          <span aria-hidden="true" className="bd-day__node" />
          <span className="bd-day__name">
            {copy.periods[u.period]} <span className="bd-day__time tabular">{u.time}</span>
          </span>
          <span className="bd-day__brought">
            {copy.day.upcoming}
            <span className="sr-only">, {copy.upcoming(u.time).toLowerCase()}</span>
          </span>
        </span>
      ))}
    </div>
  );
}
