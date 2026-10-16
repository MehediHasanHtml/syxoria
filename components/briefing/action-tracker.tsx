"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { ModeGlyph } from "@/components/onboarding/mandate-ring";
import { dailyBriefing as copy } from "@/content/briefing";
import { cn } from "@/lib/cn";
import type { BriefingActionItem, BriefingAutonomy } from "@/types";
import { StatusIcon } from "./marks";

/**
 * What Syxoria is doing: every action of the briefing with its status — drafted, awaiting
 * approval, scheduled, in progress, completed, unsuccessful — its timing, and whether it needs the
 * owner. The autonomy mode sits on top: it says what Syxoria may do on its own, while each action
 * still says whether it waits for approval. A line opens to show the next step and the
 * recommendation it carries out. Nothing here approves or sends: that happens in the workspace.
 */
export function ActionTracker({
  actions,
  autonomy,
  recommendation,
  onShowRecommendation,
}: {
  actions: BriefingActionItem[];
  autonomy: BriefingAutonomy;
  /** The briefing's recommendation, to name what an action carries out */
  recommendation: { id: string; title: string };
  onShowRecommendation: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const waiting = actions.filter((a) => a.status === "awaiting-approval").length;
  const running = actions.filter((a) => a.status === "in-progress").length;
  const failed = actions.filter((a) => a.status === "unsuccessful").length;

  return (
    <section aria-label={copy.actions.title} className="bd-actions">
      <div className="bd-actions__head">
        <div className="min-w-0">
          <p className="bd-actions__title">{copy.actions.title}</p>
          <p className="bd-actions__summary">{copy.actions.summary(failed, waiting, running)}</p>
        </div>
        <div className="bd-mode" title={`${autonomy.promise} ${autonomy.limit}`}>
          <ModeGlyph share={autonomy.share} />
          <span className="bd-mode__name">{copy.actions.mode(autonomy.name)}</span>
        </div>
      </div>
      <p className="bd-actions__limit">
        {autonomy.promise} {autonomy.limit}
      </p>

      <ul className="bd-actions__list">
        {actions.map((a) => {
          const expanded = open === a.id;
          const asks = a.needsApproval && (a.status === "awaiting-approval" || a.status === "drafted");
          return (
            <li key={a.id} className="bd-action" data-status={a.status} data-open={expanded || undefined}>
              <button type="button" className="bd-action__row" aria-expanded={expanded} aria-controls={`bd-action-${a.id}`} onClick={() => setOpen(expanded ? null : a.id)}>
                <StatusIcon status={a.status} />
                <span className="bd-action__name">{a.name}</span>
                <span className="bd-action__state">
                  <span className="bd-action__status">{copy.actions.statuses[a.status]}</span>
                  <span className="bd-action__timing tabular">{a.timing}</span>
                </span>
                <ChevronDown aria-hidden="true" className={cn("bd-action__chevron size-3.5", expanded && "rotate-180")} />
              </button>
              <div id={`bd-action-${a.id}`} className="bd-action__more" hidden={!expanded}>
                {asks && <p className="bd-action__asks">{copy.actions.needsYou}: {a.note ?? autonomy.limit}</p>}
                {!asks && a.note && <p>{a.note}</p>}
                {a.next && (
                  <p>
                    <span className="text-fg-3">{copy.actions.next}: </span>
                    {a.next}
                  </p>
                )}
                <p>
                  <span className="text-fg-3">{copy.actions.carriesOut}: </span>
                  {a.recommendationId === recommendation.id ? (
                    <button type="button" className="bd-link bd-link--inline" onClick={onShowRecommendation}>
                      {recommendation.title}
                    </button>
                  ) : (
                    copy.actions.earlier
                  )}
                </p>
                {a.status === "awaiting-approval" && <p className="text-fg-3">{copy.actions.approveElsewhere}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
