"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { ActivityItem, ActivityKind, User } from "@/types";
import { ActivityFeed } from "./activity-feed";
import { EmptyState } from "@/components/shared/states";

const kinds: { value: ActivityKind | "all"; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "automation", label: "Automations" },
  { value: "insight", label: "Insights" },
  { value: "project", label: "Projects" },
  { value: "integration", label: "Integrations" },
  { value: "member", label: "Members" },
];

/** Activity timeline grouped by day, filterable by kind (toggle chips). */
export function ActivityView({ items, users }: { items: ActivityItem[]; users: User[] }) {
  const [kind, setKind] = useState<ActivityKind | "all">("all");
  const groups = useMemo(() => {
    const list = kind === "all" ? items : items.filter((i) => i.kind === kind);
    const map = new Map<string, ActivityItem[]>();
    for (const item of list) {
      const day = item.createdAt.slice(0, 10);
      map.set(day, [...(map.get(day) ?? []), item]);
    }
    return [...map.entries()];
  }, [items, kind]);

  return (
    <>
      <div role="group" aria-label="Filter activity" className="flex flex-wrap gap-2">
        {kinds.map((k) => (
          <button
            key={k.value}
            type="button"
            aria-pressed={kind === k.value}
            onClick={() => setKind(k.value)}
            className={cn(
              "h-8 rounded-full border px-3.5 text-[13px] transition-colors duration-200",
              kind === k.value ? "border-fg/40 bg-white/[0.06] text-fg" : "border-line text-fg-3 hover:border-line-strong hover:text-fg-2",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="mt-8" aria-live="polite">
        {groups.length === 0 ? (
          <div className="rounded-xl border border-line">
            <EmptyState title="No activity of this type" description="Try another filter." />
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map(([day, list]) => (
              <section key={day} aria-labelledby={`day-${day}`} className="grid gap-4 md:grid-cols-[10rem_1fr]">
                <h2 id={`day-${day}`} className="text-[13px] font-medium text-fg-2 md:pt-1">
                  {formatDate(`${day}T00:00:00.000Z`)}
                </h2>
                <div className="rounded-lg border border-line bg-surface/40 p-5">
                  <ActivityFeed items={list} users={users} showTime />
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
