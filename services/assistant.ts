import { mockAssistantSamples } from "@/lib/mock-data/assistant";
import type { AssistantSample } from "@/types";
import { clone } from "./_client";

/** TODO(api): the assistant's suggestions for the owner's day; answers will be generated, not prepared */
export async function getAssistantSamples(): Promise<AssistantSample[]> {
  return clone(mockAssistantSamples);
}
