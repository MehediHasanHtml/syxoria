import type { Metadata } from "next";
import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";
import { REFERENCE_NOW } from "@/lib/mock-data/series";
import { getActivity } from "@/services/activity";
import { getAnalyticsReport, getOverviewMetrics } from "@/services/analytics";
import { getInsights } from "@/services/insights";
import { getProjects } from "@/services/projects";
import { getCurrentUser, getMembers, getPresence } from "@/services/user";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const [user, members, presence, metrics, report, insights, projects, activity] = await Promise.all([
    getCurrentUser(),
    getMembers(),
    getPresence(),
    getOverviewMetrics(),
    getAnalyticsReport("30d"),
    getInsights(),
    getProjects(),
    getActivity(6),
  ]);

  return (
    <OverviewDashboard
      data={{
        now: REFERENCE_NOW,
        user,
        members,
        presence,
        metrics,
        growth: report.growth.points,
        baseline: report.baseline.points,
        insights,
        projects,
        activity,
      }}
    />
  );
}
