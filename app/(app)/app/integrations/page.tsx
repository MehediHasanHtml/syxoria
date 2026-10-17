import type { Metadata } from "next";
import { IntegrationsView } from "@/components/dashboard/integrations/integrations-view";
import { getTools } from "@/services/workspace";

export const metadata: Metadata = { title: "Integrations" };

/** Integrations. ?tool= opens one */
export default async function IntegrationsPage({ searchParams }: PageProps<"/app/integrations">) {
  const [{ tool }, tools] = await Promise.all([searchParams, getTools()]);
  return <IntegrationsView tools={tools} initial={typeof tool === "string" ? tool : undefined} />;
}
