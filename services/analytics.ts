import { buildAnalyticsReport, mockOverviewMetrics } from "@/lib/mock-data/analytics";
import type { AnalyticsReport, Metric, TimeRange } from "@/types";
import { clone } from "./_client";

export const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "12m", label: "12 months" },
];

export function isTimeRange(value: unknown): value is TimeRange {
  return TIME_RANGES.some((r) => r.value === value);
}

/** TODO(api): GET /metrics/overview */
export async function getOverviewMetrics(): Promise<Metric[]> {
  return clone(mockOverviewMetrics);
}

/** TODO(api): GET /analytics?range= */
export async function getAnalyticsReport(range: TimeRange = "30d"): Promise<AnalyticsReport> {
  return buildAnalyticsReport(range);
}
