import type { BriefingActionStatus } from "@/types";
import type { ActivityItem, ActivityLane, ActivityState, AssistantDay, WorkspaceAction } from "@/types/workspace";

export const LANES: ActivityLane[] = ["monitoring", "analysing", "deciding", "doing"];

/** "18:58" → minutes since midnight */
export const minutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** An item of the day with its state settled: what it says, or what its action says */
export type Activity = ActivityItem & { state: ActivityState; status?: BriefingActionStatus };

const FROM_STATUS: Record<BriefingActionStatus, ActivityState> = {
  suggested: "waiting",
  drafted: "waiting",
  "awaiting-approval": "waiting",
  approved: "ahead",
  scheduled: "ahead",
  "in-progress": "ongoing",
  sent: "done",
  completed: "done",
  unsuccessful: "failed",
};

/**
 * The day as the workspace shows it. A watch is ongoing until it says otherwise, an analysis is
 * over once it has an end; decisions and work read their state from their action (one source with
 * Actions & Approvals and the briefings), unless the item settles it itself.
 */
export function readDay(day: AssistantDay, actions: WorkspaceAction[]): Activity[] {
  return day.items.map((item) => {
    const status = item.actionId ? actions.find((a) => a.id === item.actionId)?.status : undefined;
    const state: ActivityState =
      item.state ?? (item.lane === "monitoring" ? "ongoing" : item.lane === "analysing" ? (item.until ? "done" : "ongoing") : status ? FROM_STATUS[status] : "done");
    return { ...item, state, status };
  });
}

/** Where a time sits on the day, from 0 to 100 */
export function placeOn(day: Pick<AssistantDay, "dayStart" | "dayEnd">) {
  const start = minutes(day.dayStart);
  const span = minutes(day.dayEnd) - start;
  return (t: string) => Math.max(0, Math.min(100, ((minutes(t) - start) / span) * 100));
}

/**
 * How busy Syxoria was across the day, as a smooth line from 0 to 1, up to now: every half hour,
 * what it was watching, analysing, deciding and doing then.
 */
export function pulseOf(items: Activity[], day: AssistantDay) {
  const start = minutes(day.dayStart);
  const now = minutes(day.now);
  const step = 30;
  const counts: number[] = [];
  for (let t = start; t <= now; t += step) {
    let n = 0;
    for (const i of items) {
      if (i.day) continue;
      const a = minutes(i.at);
      const b = i.until ? minutes(i.until) : i.lane === "monitoring" || i.state === "ongoing" ? now : a;
      if (i.lane === "monitoring") n += a <= t ? 0.25 : 0;
      else if (t + step / 2 >= a && t - step / 2 <= b) n += 1;
    }
    counts.push(n);
  }
  const smooth = counts.map((_, i) => (counts[i - 1] ?? counts[i]) * 0.25 + counts[i] * 0.5 + (counts[i + 1] ?? counts[i]) * 0.25);
  const max = Math.max(...smooth, 1);
  return smooth.map((v, i) => ({ t: start + i * step, v: v / max }));
}
