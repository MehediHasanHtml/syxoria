import type { PreviewData } from "@/components/marketing/product-screens";
import { getIntegrations } from "./activity";
import { getAnalyticsReport, getOverviewMetrics } from "./analytics";
import { getInsights } from "./insights";
import { getProjects } from "./projects";

/**
 * Data for the marketing site's live product previews. Uses the same services
 * as the app so the public demo and the real product never drift apart.
 * For a public site you may prefer a static "showcase" dataset instead.
 */
export async function getPreviewData(): Promise<PreviewData> {
  const [metrics, report, insights, projects, integrations] = await Promise.all([
    getOverviewMetrics(),
    getAnalyticsReport("30d"),
    getInsights(),
    getProjects(),
    getIntegrations(),
  ]);
  return {
    metrics,
    growth: report.growth.points,
    baseline: report.baseline.points,
    insights,
    projects,
    integrations,
  };
}
