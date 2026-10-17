"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { dailyBriefing as copy } from "@/content/briefing";
import type { BriefingActionItem, BriefingChange, BriefingDimension } from "@/types";
import { ChangeIcon, StatusIcon } from "./marks";

/** One briefing's updates, for the full history: what it reported, and its actions as they stood then */
export type HistoryGroup = { id: string; label: string; changes: BriefingChange[]; actions: BriefingActionItem[] };

/**
 * Since your last briefing: a small activity history. The two or three updates that matter most
 * (the briefing marks them), newest first on one thin thread, each a short line, its time, and its
 * status in a mark and a word. An update about an action takes that action's own status, so it
 * reads the same here as in the action panel. A line about a step of the reasoning selects it on
 * the dial. "View full history" opens the whole day over the stage, briefing by briefing, without
 * moving anything. The very first briefing has no earlier one: its history is what Syxoria did
 * since the tools were connected.
 */
export function BriefingChanges({
  changes,
  actions,
  title,
  against,
  history,
  onSelect,
  visible = 3,
}: {
  changes: BriefingChange[] | null;
  /** The briefing's actions, to read an update's status from the action it is about */
  actions: BriefingActionItem[];
  /** "Since your last briefing", or "Since you connected" for the very first one */
  title: string;
  /** The briefing the updates are counted from ("Morning, 8:00"), when there is one */
  against: string | null;
  /** Every briefing so far, the one in view first, for the full history */
  history: HistoryGroup[];
  onSelect: (d: BriefingDimension) => void;
  /** How many updates show before "View full history" */
  visible?: number;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  // closing the history gives the focus back to the link
  const restore = useRef(false);
  const id = useId();

  useEffect(() => {
    if (open) heading.current?.focus();
    else if (restore.current) {
      restore.current = false;
      toggle.current?.focus();
    }
    if (!open) return;
    // open, the full history closes on a click elsewhere
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  if (!changes)
    return (
      <section aria-labelledby={`${id}-title`} className="bd-changes" data-first="">
        <h2 id={`${id}-title`} className="bd-label">
          {copy.changes.title}
        </h2>
        <p className="bd-changes__lead">{copy.changes.first}</p>
        <p className="bd-changes__first">{copy.changes.firstNote}</p>
      </section>
    );

  const marked = changes.filter((c) => c.highlight);
  const shown = (marked.length ? marked : changes).slice(0, visible);
  const all = history.reduce((n, g) => n + g.changes.length, 0);
  const close = () => {
    restore.current = true;
    setOpen(false);
  };
  const pick = (d: BriefingDimension) => {
    onSelect(d);
    if (open) close();
  };

  return (
    <section
      ref={root}
      aria-labelledby={`${id}-title`}
      className="bd-changes"
      data-open={open || undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <div className="bd-changes__head">
        <h2 id={`${id}-title`} className="bd-label">
          {title}
        </h2>
        {against && <p className="bd-changes__against tabular">{against}</p>}
      </div>
      <Timeline changes={shown} actions={actions} onSelect={pick} />
      {all > shown.length && (
        <button ref={toggle} type="button" className="bd-link bd-changes__more" aria-expanded={open} aria-controls={`${id}-history`} onClick={() => setOpen(true)}>
          {copy.changes.more}
        </button>
      )}

      {/* THE FULL HISTORY — the whole day so far, briefing by briefing, over the stage */}
      {open && (
        <section id={`${id}-history`} aria-labelledby={`${id}-history-title`} className="bd-history">
          <div className="bd-history__head">
            <h2 id={`${id}-history-title`} ref={heading} tabIndex={-1} className="bd-label outline-none">
              {copy.changes.history}
            </h2>
            <button type="button" className="bd-why__close" aria-label={copy.changes.close} onClick={close}>
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </div>
          <div className="bd-history__body">
            {history
              .filter((g) => g.changes.length > 0)
              .map((g) => (
                <div key={g.id} className="bd-history__group">
                  <p className="bd-history__group-title">
                    <span>{g.label}</span>
                    <span className="bd-history__count">{copy.changes.count(g.changes.length)}</span>
                  </p>
                  <Timeline changes={g.changes} actions={g.actions} onSelect={pick} />
                </div>
              ))}
          </div>
        </section>
      )}
    </section>
  );
}

/**
 * Updates on one thin thread, newest first: the mark, the line and its time, then the status and a
 * few words. With `onSelect`, a line about a step of the reasoning selects it; without (the
 * workspace home), the lines are read only.
 */
export function Timeline({ changes, actions, onSelect }: { changes: BriefingChange[]; actions: BriefingActionItem[]; onSelect?: (d: BriefingDimension) => void }) {
  const statusOf = (c: BriefingChange): { word: string; mark: ReactNode; tone: string } => {
    const action = c.actionId ? actions.find((a) => a.id === c.actionId) : undefined;
    return action
      ? { word: copy.actions.statuses[action.status], mark: <StatusIcon status={action.status} />, tone: action.status }
      : { word: copy.changes.kinds[c.kind], mark: <ChangeIcon kind={c.kind} />, tone: c.kind };
  };

  return (
    <ol className="bd-changes__list">
      {changes.map((c, i) => {
        const { word, mark, tone } = statusOf(c);
        const body = (
          <>
            {mark}
            <span className="bd-change__main">
              <span className="bd-change__top">
                <span className="bd-change__title">{c.title}</span>
                {c.at && <span className="bd-change__at tabular">{c.at}</span>}
              </span>
              <span className="bd-change__detail">
                <span className="bd-change__status" data-tone={tone}>
                  {word}
                </span>
                {c.detail && <> · {c.detail}</>}
              </span>
            </span>
          </>
        );
        return (
          <li key={c.id} className="bd-changes__item" style={{ animationDelay: `${i * 70}ms` }}>
            {c.dimension && onSelect ? (
              <button
                type="button"
                className="bd-change"
                onClick={() => onSelect(c.dimension!)}
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
    </ol>
  );
}
