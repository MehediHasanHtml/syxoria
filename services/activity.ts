import { mockActivity, mockIntegrations } from "@/lib/mock-data/activity";
import type { ActivityItem, Integration } from "@/types";
import { clone } from "./_client";

/** TODO(api): GET /activity?limit= */
export async function getActivity(limit?: number): Promise<ActivityItem[]> {
  return clone(limit ? mockActivity.slice(0, limit) : mockActivity);
}

/** TODO(api): GET /activity?projectId= */
export async function getProjectActivity(projectId: string): Promise<ActivityItem[]> {
  return clone(mockActivity.filter((a) => a.projectId === projectId));
}

/** TODO(api): GET /integrations */
export async function getIntegrations(): Promise<Integration[]> {
  return clone(mockIntegrations);
}
