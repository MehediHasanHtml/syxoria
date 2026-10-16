"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { dailyBriefing as copy } from "@/content/briefing";
import type { BriefingActionItem, BriefingChange, BriefingDimension } from "@/types";
import { ChangeIcon, StatusIcon } from "./marks";

/**
 * Since your last briefing: the two or three updates that matter most (the briefing lists them
 * most relevant first), each a headline, a few words if needed, its status and its time. An update
 * about an action takes that action's own status, so it reads the same here as in the action panel.
 * A line about a step of the reasoning selects it on the dial. "All updates" opens the rest over
 * the stage, without moving anything. The very first briefing has nothing to compare with, and
 * says so rather than inventing a past.
 */
export function BriefingChanges({
  changes,
  actions,
  against,
  onSelect,
  visible = 3,
}: {
  changes: BriefingChange[] | null;
  /** The briefing's actions, to read an update's status from the action it is about */
  actions: BriefingActionItem[];
  /** The briefing the updates are counted from ("Morning briefing, 8:00"), or null for the very first one */
  against: string | null;
  onSelect: (d: BriefingDimension) => void;
  /** How many updates show before "All updates" */
  visible?: number;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const id = useId();

  // open, the full list closes on a click elsewhere
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  if (!changes || !against)
    return (
      <section aria-labelledby={`${id}-title`} className="bd-changes" data-first="">
        <h2 id={`${id}-title`} className="bd-label">
          {copy.changes.title}
        </h2>
        <p className="bd-changes__lead">{copy.changes.first}</p>
        <p className="bd-changes__first">{copy.changes.firstNote}</p>
      </section>
    );

  const shown = open ? changes : changes.slice(0, visible);
  const hidden = changes.length - visible;
  const statusOf = (c: BriefingChange): { word: string; mark: ReactNode; tone: string } => {
    const action = c.actionId ? actions.find((a) => a.id === c.actionId) : undefined;
    return action
      ? { word: copy.actions.statuses[action.status], mark: <StatusIcon status={action.status} />, tone: action.status }
      : { word: copy.changes.kinds[c.kind], mark: <ChangeIcon kind={c.kind} />, tone: c.kind };
  };

  return (
    <section
      ref={root}
      aria-labelledby={`${id}-title`}
      className="bd-changes"
      data-open={open || undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <div className="bd-changes__head">
        <h2 id={`${id}-title`} className="bd-label">
          {copy.changes.title}
        </h2>
        <p className="bd-changes__against tabular">{against}</p>
      </div>
      <ul id={`${id}-list`} className="bd-changes__list">
        {shown.map((c) => {
          const { word, mark, tone } = statusOf(c);
          const body = (
            <>
              {mark}
              <span className="bd-change__main">
                <span className="bd-change__title">{c.title}</span>
                <span className="bd-change__detail">
                  <span className="bd-change__status" data-tone={tone}>
                    {word}
                  </span>
                  {c.detail && <> · {c.detail}</>}
                </span>
              </span>
              {c.at && <span className="bd-change__at tabular">{c.at}</span>}
            </>
          );
          return (
            <li key={c.id}>
              {c.dimension ? (
                <button
                  type="button"
                  className="bd-change"
                  onClick={() => {
                    onSelect(c.dimension!);
                    setOpen(false);
                  }}
                  aria-label={`${word}: ${c.title}${c.detail ? `, ${c.detail}` : ""}${c.at ? `, ${c.at}` : ""}. Show the ${copy.dimensions[c.dimension].toLowerCase()}`}
                >
                  {body}
                </button>
              ) : (
                <div className="bd-change">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {/* also there when a short screen keeps fewer lines than `visible` (globals.css) */}
      {changes.length > 1 && (
        <button
          ref={toggle}
          type="button"
          className="bd-link bd-changes__more"
          data-needed={hidden > 0 || undefined}
          aria-expanded={open}
          aria-controls={`${id}-list`}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? copy.changes.less : copy.changes.more(changes.length)}
        </button>
      )}
    </section>
  );
}
