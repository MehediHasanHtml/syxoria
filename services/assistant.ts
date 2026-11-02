import { mockAssistantDay, mockPreparedAnswers } from "@/lib/mock-data/assistant";
import type { AssistantDay, PreparedAnswer } from "@/types/workspace";
import { clone } from "./_client";

/** TODO(api): answers will be generated from the connected tools, not prepared */
export async function getPreparedAnswers(): Promise<PreparedAnswer[]> {
  return clone(mockPreparedAnswers);
}

/** TODO(api): GET /assistant/day — what Syxoria has watched, analysed, decided and done today */
export async function getAssistantDay(): Promise<AssistantDay> {
  return clone(mockAssistantDay);
}
