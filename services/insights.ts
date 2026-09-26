import { mockInsights } from "@/lib/mock-data/insights";
import type { Insight, InsightStatus } from "@/types";
import { clone, simulateLatency } from "./_client";

/** TODO(api): GET /insights */
export async function getInsights(): Promise<Insight[]> {
  return clone(mockInsights);
}

/** TODO(api): GET /insights?projectId= */
export async function getInsightsForProject(projectId: string): Promise<Insight[]> {
  return clone(mockInsights.filter((i) => i.projectId === projectId));
}

/** TODO(api): PATCH /insights/:id { status } */
export async function updateInsightStatus(id: string, status: InsightStatus): Promise<{ id: string; status: InsightStatus }> {
  await simulateLatency(550);
  return { id, status };
}
