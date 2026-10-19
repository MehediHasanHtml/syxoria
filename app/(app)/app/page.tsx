import type { Metadata } from "next";
import { loadOverview } from "@/components/dashboard/overview/data";
import { ExecutiveOverview } from "@/components/dashboard/overview/executive-overview";

export const metadata: Metadata = { title: "Overview" };

/**
 * The Executive Overview, the workspace's first page.
 *   ?briefing=b_morning · b_midday · b_evening   open on one of the day's briefings (the latest by default)
 */
export default async function OverviewPage({ searchParams }: PageProps<"/app">) {
  const [{ briefing }, data] = await Promise.all([searchParams, loadOverview()]);
  return <ExecutiveOverview data={data} initial={typeof briefing === "string" ? briefing : undefined} />;
}
