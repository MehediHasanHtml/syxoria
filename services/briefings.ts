import { mockDailyBriefings } from "@/lib/mock-data/briefings";
import { mockAutonomyPolicy } from "@/lib/mock-data/onboarding";
import { reachOfLevel } from "@/lib/onboarding/mandate";
import type { AutonomyLevel, DailyBriefingSet } from "@/types";
import { clone } from "./_client";

/** What each mode lets Syxoria do, and what never changes with it */
const promises: Record<AutonomyLevel, string> = {
  guided: "Prepares everything. Nothing happens until you approve.",
  assisted: "Handles the routine. Asks you before it sends.",
  autonomous: "Acts on its own within your rules.",
};

/** TODO(api): GET /briefings?date= — the day's briefings so far, with the mandate they were prepared under */
export async function getDailyBriefings(level: AutonomyLevel = "autonomous"): Promise<DailyBriefingSet> {
  const reach = reachOfLevel(mockAutonomyPolicy, level);
  const name = mockAutonomyPolicy.levels.find((l) => l.id === level)?.name ?? level;
  return clone({
    date: "2026-10-16",
    company: "Northfield Studio",
    autonomy: {
      level,
      name,
      share: reach.total ? reach.auto / reach.total : 0,
      promise: promises[level],
      limit: "Quotes, contracts and money always wait for you.",
    },
    briefings: mockDailyBriefings,
  });
}
