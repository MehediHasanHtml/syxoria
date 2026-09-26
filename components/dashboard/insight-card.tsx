"use client";

import Link from "next/link";
import { ChevronDown, Lock } from "lucide-react";
import { useId, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ModuleIcon } from "@/components/shared/module-icon";
import { InsightStatusBadge, PriorityIndicator } from "@/components/shared/status";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";
import { REFERENCE_NOW } from "@/lib/mock-data/series";
import { updateInsightStatus } from "@/services/insights";
import type { Insight, InsightStatus } from "@/types";

const NOW = new Date(REFERENCE_NOW);

/**
 * Insight with all product states: new · in-review · applied · dismissed ·
 * processing · locked. Actions are optimistic with rollback on failure.
 */
export function InsightCard({
  insight,
  compact = false,
  onStatusChange,
}: {
  insight: Insight;
  compact?: boolean;
  onStatusChange?: (id: string, status: InsightStatus) => void;
}) {
  const [status, setStatus] = useState<InsightStatus>(insight.status);
  const [pending, setPending] = useState<InsightStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const rationaleId = useId();

  const locked = status === "locked";
  const processing = status === "processing";
  const resolved = status === "applied" || status === "dismissed";

  async function act(next: InsightStatus) {
    const prev = status;
    setPending(next);
    setError(null);
    try {
      await updateInsightStatus(insight.id, next);
      setStatus(next);
      onStatusChange?.(insight.id, next);
    } catch {
      setStatus(prev);
      setError("Could not update this insight. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <article
      aria-labelledby={`${rationaleId}-title`}
      className={cn(
        "group rounded-lg border bg-surface/60 transition-[border-color,background-color,opacity] duration-300",
        compact ? "p-4" : "p-5",
        locked ? "border-dashed border-line-strong" : "border-line hover:border-line-strong",
        status === "dismissed" && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3.5">
        <ModuleIcon module={insight.module} framed tone={status === "new" ? "accent" : "default"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <InsightStatusBadge status={status} />
            <PriorityIndicator priority={insight.priority} showLabel={!compact} />
            <span className="text-[11px] text-fg-3">{formatRelative(insight.createdAt, NOW)}</span>
          </div>
          <h3 id={`${rationaleId}-title`} className="mt-2.5 text-[15px] font-medium leading-snug text-fg">
            {insight.title}
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-fg-3">{insight.summary}</p>

          {!compact && (
            <>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={rationaleId}
                onClick={() => setOpen((o) => !o)}
                className="mt-3 inline-flex items-center gap-1 text-xs text-fg-2 transition-colors hover:text-fg"
              >
                Why this insight
                <ChevronDown className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")} aria-hidden="true" />
              </button>
              <div id={rationaleId} hidden={!open} className="mt-2 animate-fade-in rounded-md border border-line bg-canvas-2 p-3 text-[13px] leading-relaxed text-fg-2">
                {insight.rationale}
                <p className="mt-2 text-xs text-fg-3">Confidence {Math.round(insight.confidence * 100)}%</p>
              </div>
            </>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-fg-3">
              {insight.impact.label} <span className="tabular font-medium text-fg">{insight.impact.value}</span>
              {insight.projectId && !compact && (
                <>
                  {" · "}
                  <Link href={`/app/projects/${insight.projectId}`} className="text-fg-2 underline decoration-line-strong underline-offset-2 hover:text-fg">
                    View project
                  </Link>
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              {locked && (
                <ButtonLink href="/app/settings?tab=workspace" size="sm" variant="outline">
                  <Lock aria-hidden="true" /> Upgrade to unlock
                </ButtonLink>
              )}
              {processing && <span className="text-xs text-fg-3">Nexo is still analysing…</span>}
              {!locked && !processing && !resolved && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => act("dismissed")} loading={pending === "dismissed"} disabled={pending !== null}>
                    Dismiss
                  </Button>
                  <Button size="sm" onClick={() => act("applied")} loading={pending === "applied"} loadingLabel="Applying" disabled={pending !== null}>
                    Apply
                  </Button>
                </>
              )}
              {resolved && (
                <Button size="sm" variant="ghost" onClick={() => act("in-review")} loading={pending === "in-review"} disabled={pending !== null}>
                  Undo
                </Button>
              )}
            </div>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-xs text-negative">
              {error}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
