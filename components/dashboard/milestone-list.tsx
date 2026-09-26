"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/states";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/format";
import type { Milestone } from "@/types";

/** Checkable milestones. TODO(api): persist toggles via PATCH /projects/:id/milestones/:mid */
export function MilestoneList({ milestones, projectName }: { milestones: Milestone[]; projectName: string }) {
  const [items, setItems] = useState(milestones);
  if (!items.length) return <EmptyState compact title="No milestones yet" description="Break the project into a few meaningful steps." />;

  return (
    <ul aria-label={`${projectName} milestones`} className="space-y-1">
      {items.map((m) => (
        <li key={m.id}>
          <label className="group -mx-2 flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-white/[0.03]">
            <input
              type="checkbox"
              checked={m.done}
              onChange={() => setItems((list) => list.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)))}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 grid size-4 shrink-0 place-items-center rounded-xs border transition-colors duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
                m.done ? "border-accent bg-accent text-canvas" : "border-line-strong group-hover:border-fg-3",
              )}
            >
              {m.done && <Check className="size-3" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block text-[13px] transition-colors", m.done ? "text-fg-3 line-through decoration-line-strong" : "text-fg")}>{m.title}</span>
              {m.dueDate && <span className="text-[11px] text-fg-3">{formatShortDate(m.dueDate)}</span>}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
