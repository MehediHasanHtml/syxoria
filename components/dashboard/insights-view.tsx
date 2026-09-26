"use client";

import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/states";
import { Tabs } from "@/components/ui/tabs";
import type { Insight, InsightStatus } from "@/types";
import { InsightCard } from "./insight-card";

type Filter = "all" | "open" | "applied" | "dismissed";

const filters: { value: Filter; label: string; match: (s: InsightStatus) => boolean }[] = [
  { value: "open", label: "Open", match: (s) => s === "new" || s === "in-review" || s === "processing" || s === "locked" },
  { value: "applied", label: "Applied", match: (s) => s === "applied" },
  { value: "dismissed", label: "Dismissed", match: (s) => s === "dismissed" },
  { value: "all", label: "All", match: () => true },
];

export function InsightsView({ insights }: { insights: Insight[] }) {
  const [filter, setFilter] = useState<Filter>("open");
  // Track status changes so moving an insight updates the tab counts live.
  const [statuses, setStatuses] = useState<Record<string, InsightStatus>>(() => Object.fromEntries(insights.map((i) => [i.id, i.status])));

  const counts = useMemo(
    () => Object.fromEntries(filters.map((f) => [f.value, insights.filter((i) => f.match(statuses[i.id])).length])) as Record<Filter, number>,
    [insights, statuses],
  );
  const matcher = filters.find((f) => f.value === filter)!.match;
  const visible = insights.filter((i) => matcher(statuses[i.id]));

  return (
    <>
      <Tabs
        label="Filter insights"
        value={filter}
        onValueChange={setFilter}
        idPrefix="insights"
        items={filters.map((f) => ({
          value: f.value,
          label: (
            <>
              {f.label} <span className="tabular text-[11px] text-fg-3">{counts[f.value]}</span>
            </>
          ),
        }))}
      />
      <div id={`insights-panel-${filter}`} role="tabpanel" aria-labelledby={`insights-tab-${filter}`} className="mt-5">
        {visible.length === 0 ? (
          <div className="rounded-xl border border-line">
            <EmptyState
              icon={<Sparkles aria-hidden="true" />}
              title={filter === "open" ? "You’re all caught up" : "Nothing here yet"}
              description={filter === "open" ? "Nexo will surface new recommendations as your workspace grows." : "Insights you act on will be listed here."}
            />
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {visible.map((i) => (
              <InsightCard key={i.id} insight={{ ...i, status: statuses[i.id] }} onStatusChange={(id, s) => setStatuses((m) => ({ ...m, [id]: s }))} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
