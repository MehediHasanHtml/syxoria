import { dailyBriefing as copy } from "@/content/briefing";
import { mockDailyBriefings } from "@/lib/mock-data/briefings";
import { mockAutonomyPolicy } from "@/lib/mock-data/onboarding";
import { reachOfLevel } from "@/lib/onboarding/mandate";
import type { AutonomyLevel, DailyBriefingSet } from "@/types";
import { clone } from "./_client";

/**
 * TODO(api): GET /briefings?date= — the day's briefings so far, with the mandate they were prepared under.
 * `first`: the owner's very first day, so the morning has no earlier briefing to be compared with.
 */
export async function getDailyBriefings(level: AutonomyLevel = "autonomous", { first = false }: { first?: boolean } = {}): Promise<DailyBriefingSet> {
  const reach = reachOfLevel(mockAutonomyPolicy, level);
  const name = mockAutonomyPolicy.levels.find((l) => l.id === level)?.name ?? level;
  const briefings = first ? mockDailyBriefings.map((b, i) => (i === 0 ? { ...b, changes: null, comparedWith: null } : b)) : mockDailyBriefings;
  return clone({
    date: "2026-10-14",
    company: "Northfield Studio",
    owner: { firstName: "Maël" },
    autonomy: {
      level,
      name,
      share: reach.total ? reach.auto / reach.total : 0,
      promise: copy.autonomy.promises[level],
      limit: copy.autonomy.limit,
    },
    briefings,
  });
}
