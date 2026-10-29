import { mockAssistantBrought, mockAssistantDoing, mockAssistantLead, mockPreparedAnswers } from "@/lib/mock-data/assistant";
import type { AssistantBrought, AssistantDoing, PreparedAnswer } from "@/types/workspace";
import { clone } from "./_client";

/** TODO(api): answers will be generated from the connected tools, not prepared */
export async function getPreparedAnswers(): Promise<PreparedAnswer[]> {
  return clone(mockPreparedAnswers);
}

/** TODO(api): what the assistant brings up for the owner now, and what it is busy with */
export async function getAssistantDesk(): Promise<{ lead: string; brought: AssistantBrought[]; doing: AssistantDoing[] }> {
  return clone({ lead: mockAssistantLead, brought: mockAssistantBrought, doing: mockAssistantDoing });
}
