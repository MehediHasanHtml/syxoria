import type { Metadata } from "next";
import { AssistantRoom } from "@/components/dashboard/assistant/assistant-room";
import { loadAssistant } from "@/components/dashboard/assistant/data";

export const metadata: Metadata = { title: "Syxoria Assistant" };

/** The assistant. ?q= a question asked from the top bar or the overview, ?c= an earlier conversation */
export default async function AssistantPage({ searchParams }: PageProps<"/app/assistant">) {
  const [{ q, c }, data] = await Promise.all([searchParams, loadAssistant()]);
  return (
    <AssistantRoom
      key={typeof q === "string" ? q : (typeof c === "string" ? c : "")}
      data={data}
      initialQuestion={typeof q === "string" ? q : undefined}
      initialConversation={typeof c === "string" ? c : undefined}
    />
  );
}
