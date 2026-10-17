import type { Metadata } from "next";
import { AssistantWorkspace } from "@/components/dashboard/assistant/assistant-workspace";
import { getAssistantSamples } from "@/services/assistant";
import { getConversations, getMemory, getWorkspaceActions } from "@/services/workspace";

export const metadata: Metadata = { title: "Syxoria Assistant" };

/** The assistant. ?q= a question asked from the top bar or a document, ?c= an earlier conversation */
export default async function AssistantPage({ searchParams }: PageProps<"/app/assistant">) {
  const [{ q, c }, samples, { conversations, prompts }, actions, memory] = await Promise.all([searchParams, getAssistantSamples(), getConversations(), getWorkspaceActions(), getMemory()]);
  return (
    <AssistantWorkspace
      key={typeof q === "string" ? q : ""}
      conversations={conversations}
      prompts={prompts}
      samples={samples}
      actions={actions}
      memory={memory}
      initialQuestion={typeof q === "string" ? q : undefined}
      initialConversation={typeof c === "string" ? c : undefined}
    />
  );
}
