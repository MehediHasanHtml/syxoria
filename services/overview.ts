import { mockIndicators, mockRecommendations, mockSignals, WORKSPACE_NOW } from "@/lib/mock-data/overview";
import type { AutonomyLevel, HomeOverview } from "@/types";
import { clone } from "./_client";
import { getDailyBriefings } from "./briefings";

/**
 * TODO(api): GET /overview — the workspace home: the latest briefing, the business indicators,
 * the alerts beyond the priority and the recommendations beyond the briefing's own.
 */
export async function getHomeOverview(level: AutonomyLevel = "autonomous"): Promise<HomeOverview> {
  const set = await getDailyBriefings(level);
  const briefing = set.briefings[set.briefings.length - 1];
  return clone({
    now: WORKSPACE_NOW,
    owner: set.owner,
    briefing,
    previous: briefing.comparedWith,
    indicators: mockIndicators,
    signals: mockSignals,
    recommendations: mockRecommendations,
  });
}

/** TODO(api): GET /actions?status=awaiting-approval&count — what waits for the owner, beside Actions & Approvals */
export async function getPendingApprovals(): Promise<number> {
  const set = await getDailyBriefings();
  return set.briefings[set.briefings.length - 1].actions.filter((a) => a.status === "awaiting-approval").length;
}
