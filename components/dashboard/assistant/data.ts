import { dailyBriefing as briefingCopy } from "@/content/briefing";
import { getAssistantDay, getPreparedAnswers } from "@/services/assistant";
import { getDailyBriefings } from "@/services/briefings";
import { getCurrentUser } from "@/services/user";
import { getClients, getConversations, getSafetySettings, getWorkspaceActions } from "@/services/workspace";

/**
 * Everything the assistant reads, from the workspace's services: who it works for and how it
 * greets them (the latest briefing sets the time of day), its day lane by lane, the exchanges and
 * prepared answers, the actions its decisions and work read their status from, the clients they
 * concern and the rules it works under. The assistant has no data of its own.
 */
export async function loadAssistant() {
  const [set, user, day, answers, { conversations, prompts }, actions, clients, safety] = await Promise.all([
    getDailyBriefings(),
    getCurrentUser(),
    getAssistantDay(),
    getPreparedAnswers(),
    getConversations(),
    getWorkspaceActions(),
    getClients(),
    getSafetySettings(),
  ]);
  const latest = set.briefings[set.briefings.length - 1];
  const date = new Date(`${set.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return {
    greeting: `${briefingCopy.greeting[latest.period]}, ${set.owner.firstName}.`,
    date,
    initials: user.initials,
    day,
    answers,
    conversations,
    prompts,
    actions,
    clients: clients.map((c) => ({ id: c.id, name: c.name, contact: c.contact.name })),
    rules: { ask: safety.approvals.filter((a) => a.autonomous === "ask").map((a) => a.action) },
  };
}

export type AssistantData = Awaited<ReturnType<typeof loadAssistant>>;
