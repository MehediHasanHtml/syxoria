import { dailyBriefing as briefingCopy } from "@/content/briefing";
import { getAssistantDesk, getPreparedAnswers } from "@/services/assistant";
import { getDailyBriefings } from "@/services/briefings";
import { getCurrentUser } from "@/services/user";
import { getConversations, getWorkspaceActions } from "@/services/workspace";

/**
 * Everything the assistant reads, from the workspace's services: who it speaks to and how it
 * greets them (the latest briefing sets the time of day), what it brings up and is in the middle
 * of, the conversations and prepared answers, and the actions its answers hand over.
 * The assistant has no data of its own.
 */
export async function loadAssistant() {
  const [set, user, desk, answers, { conversations, prompts }, actions] = await Promise.all([
    getDailyBriefings(),
    getCurrentUser(),
    getAssistantDesk(),
    getPreparedAnswers(),
    getConversations(),
    getWorkspaceActions(),
  ]);
  const latest = set.briefings[set.briefings.length - 1];

  return {
    greeting: `${briefingCopy.greeting[latest.period]}, ${set.owner.firstName}.`,
    initials: user.initials,
    ...desk,
    answers,
    conversations,
    prompts,
    actions,
  };
}

export type AssistantData = Awaited<ReturnType<typeof loadAssistant>>;
