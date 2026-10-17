"use client";

import { Check, ChevronDown, CircleAlert, Sun, Sunrise, Sunset, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { briefingTime, dailyBriefing as copy } from "@/content/briefing";
import type { BriefingPeriod, DailyBriefing } from "@/types";

const ICON: Record<BriefingPeriod, LucideIcon> = { morning: Sunrise, midday: Sun, evening: Sunset };

/**
 * The day's three briefings, in one quiet choice: a small pill naming the briefing in view
 * ("Morning briefing"), so the greeting and the dial keep the attention. It opens the day: each
 * briefing with the time it was prepared, the latest with a small emerald mark, those still to
 * come quiet and out of reach. Down their left side runs the day's main thread, where it stood at
 * each briefing (identified in the morning, in progress at midday, completed by the evening), lit
 * up to the briefing in view.
 * A menu button: the arrow keys go along the day, Escape closes it.
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
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const at = briefings.findIndex((b) => b.id === current);
  const shown = briefings[at];
  // the latest of the user's own briefings (on the first day, the others are examples)
  const latest = briefings.findLastIndex((b) => !b.example);
  const stageOf = (b: DailyBriefing) => `${copy.day.stages[b.stage.state]}: ${b.stage.label}`;
  const Shown = ICON[shown.period];

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]:not([aria-disabled="true"])') ?? []);
  const focusAt = (index: number) => {
    const els = items();
    els[(index + els.length) % els.length]?.focus();
  };
  const openAt = (index: number) => {
    setOpen(true);
    requestAnimationFrame(() => focusAt(index));
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const onTriggerKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    openAt(e.key === "ArrowDown" ? at : -1);
  };
  const onMenuKey = (e: KeyboardEvent) => {
    if (e.key === "Tab") return close(false);
    const here = items().indexOf(document.activeElement as HTMLElement);
    const move = { ArrowDown: here + 1, ArrowUp: here - 1, Home: 0, End: -1 }[e.key];
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (move !== undefined) {
      e.preventDefault();
      focusAt(move);
    }
  };

  return (
    <div ref={rootRef} className="bd-period">
      <button
        ref={triggerRef}
        type="button"
        className="bd-period__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${copy.periodsLabel}: ${copy.day.briefing(copy.periods[shown.period], briefingTime(shown.preparedAt))}`}
        onClick={() => (open ? close(false) : openAt(at))}
        onKeyDown={onTriggerKey}
      >
        <Shown aria-hidden="true" className="bd-period__icon" strokeWidth={1.7} />
        <span>{copy.day.name(copy.periods[shown.period])}</span>
        <ChevronDown aria-hidden="true" className="bd-period__chevron" strokeWidth={1.8} />
      </button>

      <div ref={menuRef} id={menuId} role="menu" aria-label={copy.periodsLabel} hidden={!open} className="bd-period__menu" onKeyDown={onMenuKey}>
        <p aria-hidden="true" className="bd-label bd-period__head">
          {copy.periodsLabel}
        </p>
        {briefings.map((b, i) => {
          const on = i === at;
          const time = briefingTime(b.preparedAt);
          const isLatest = i === latest && briefings.length > 1;
          return (
            <button
              key={b.id}
              type="button"
              role="menuitemradio"
              aria-checked={on}
              aria-label={`${copy.day.briefing(copy.periods[b.period], time)}${b.example ? ` (${copy.example.toLowerCase()})` : ""}. ${stageOf(b)}${isLatest ? `. ${copy.latest}` : ""}`}
              tabIndex={-1}
              className="bd-period__item"
              data-state={b.stage.state}
              data-ahead={i > at || undefined}
              data-link={i < briefings.length - 1 ? (i < at ? "read" : "day") : upcoming.length ? "ahead" : undefined}
              onClick={() => {
                onChoose(b.id);
                close();
              }}
            >
              <span aria-hidden="true" className="bd-period__node">
                {b.stage.state === "completed" && <Check className="size-2.5" strokeWidth={3} />}
                {b.stage.state === "blocked" && <CircleAlert className="size-3" strokeWidth={2.2} />}
              </span>
              <span aria-hidden="true" className="bd-period__name">
                {copy.periods[b.period]}
                <span className="bd-period__time tabular">{time}</span>
                {b.example && <span className="bd-period__example">{copy.example}</span>}
                {isLatest && <span className="bd-period__latest">{copy.latest}</span>}
              </span>
              <span aria-hidden="true" className="bd-period__stage">
                <span className="bd-period__state">{copy.day.stages[b.stage.state]}</span> · {b.stage.label}
              </span>
              {on && <Check aria-hidden="true" className="bd-period__check" strokeWidth={2.2} />}
            </button>
          );
        })}
        {upcoming.map((u, i) => (
          <div
            key={u.period}
            role="menuitemradio"
            aria-checked={false}
            aria-disabled="true"
            aria-label={`${copy.day.briefing(copy.periods[u.period], u.time)}. ${copy.upcoming(u.time)}`}
            className="bd-period__item"
            data-upcoming=""
            data-link={i < upcoming.length - 1 ? "ahead" : undefined}
          >
            <span aria-hidden="true" className="bd-period__node" />
            <span aria-hidden="true" className="bd-period__name">
              {copy.periods[u.period]}
              <span className="bd-period__time tabular">{u.time}</span>
            </span>
            <span aria-hidden="true" className="bd-period__stage">
              {copy.day.upcoming}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
