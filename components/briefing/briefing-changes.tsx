"use client";

import { useState } from "react";
import { dailyBriefing as copy } from "@/content/briefing";
import type { BriefingChange, BriefingDimension } from "@/types";
import { ChangeIcon } from "./marks";

/**
 * What changed since the previous briefing: new, still open, decided, changed, under way, done,
 * risks and opportunities, each in a line. A line about a step of the reasoning selects it on the
 * dial. The first briefing has nothing to compare with, and says so rather than inventing a past.
 */
export function BriefingChanges({
  changes,
  since,
  onSelect,
  visible = 3,
}: {
  changes: BriefingChange[] | null;
  /** The previous briefing's name and time ("midday, 13:00"), or null for the first one */
  since: string | null;
  onSelect: (d: BriefingDimension) => void;
  /** How many lines show before "Show more" */
  visible?: number;
}) {
  const [open, setOpen] = useState(false);
  if (!changes || !since)
    return (
      <section aria-label={copy.changes.first} className="bd-changes">
        <p className="bd-changes__title">{copy.changes.first}</p>
        <p className="bd-changes__first">{copy.changes.firstNote}</p>
      </section>
    );

  const shown = open ? changes : changes.slice(0, visible);
  const hidden = changes.length - visible;
  return (
    <section aria-label={copy.changes.title(since)} className="bd-changes">
      <p className="bd-changes__title">{copy.changes.title(since)}</p>
      <ul className="bd-changes__list">
        {shown.map((c) => {
          const body = (
            <>
              <span className="bd-change__kind" data-kind={c.kind}>
                <ChangeIcon kind={c.kind} />
                {copy.changes.kinds[c.kind]}
              </span>
              <span className="bd-change__text">{c.text}</span>
              {c.at && <span className="bd-change__at tabular">{c.at}</span>}
            </>
          );
          return (
            <li key={c.id}>
              {c.dimension ? (
                <button type="button" className="bd-change" onClick={() => onSelect(c.dimension!)} aria-label={`${copy.changes.kinds[c.kind]}: ${c.text}${c.at ? `, ${c.at}` : ""}. Show ${copy.dimensions[c.dimension]}`}>
                  {body}
                </button>
              ) : (
                <div className="bd-change">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {hidden > 0 && (
        <button type="button" className="bd-link bd-changes__more" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? copy.changes.less : copy.changes.more(hidden)}
        </button>
      )}
    </section>
  );
}
