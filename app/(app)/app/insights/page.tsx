import type { Metadata } from "next";
import { InsightsView } from "@/components/dashboard/insights-view";
import { PageHeader } from "@/components/dashboard/page-header";
import { getInsights } from "@/services/insights";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage() {
  const insights = await getInsights();
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Workspace", href: "/app" }, { label: "Insights" }]}
        title="Insights"
        description="Recommendations from Nexo — each with its reasoning, confidence and expected impact. Nothing is applied without you."
      />
      <InsightsView insights={insights} />
    </>
  );
}
