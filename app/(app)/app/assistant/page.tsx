import type { Metadata } from "next";
import { AssistantPreview } from "@/components/dashboard/assistant/assistant-preview";
import { getAssistantSamples } from "@/services/assistant";
import { getHomeOverview } from "@/services/overview";

export const metadata: Metadata = { title: "Ask Syxoria" };

/** The assistant. ?q= the question asked from the top bar */
export default async function AssistantPage({ searchParams }: PageProps<"/app/assistant">) {
  const [{ q }, samples, { briefing }] = await Promise.all([searchParams, getAssistantSamples(), getHomeOverview()]);
  return <AssistantPreview key={typeof q === "string" ? q : ""} samples={samples} actions={briefing.actions} initial={typeof q === "string" ? q : undefined} />;
}
