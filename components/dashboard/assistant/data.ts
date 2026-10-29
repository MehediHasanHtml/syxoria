import { dailyBriefing as briefingCopy } from "@/content/briefing";
import { getAssistantDesk, getPreparedAnswers } from "@/services/assistant";
import { getDailyBriefings } from "@/services/briefings";
import { getCurrentUser, getWorkspace } from "@/services/user";
import { getCalendar, getClients, getConversations, getMemory, getSafetySettings, getWorkspaceActions } from "@/services/workspace";

/**
 * Everything the assistant reads, from the workspace's services: who it speaks to and how it
 * greets them (the latest briefing sets the time of day), what it brings up and is busy with,
 * the conversations and prepared answers, and what it can lay on the table (clients, actions,
 * company memory, the calendar, the rules it works under). The assistant has no data of its own.
 */
export async function loadAssistant() {
  const [set, user, workspace, desk, answers, { conversations, prompts }, actions, memory, clients, events, safety] = await Promise.all([
    getDailyBriefings(),
    getCurrentUser(),
    getWorkspace(),
    getAssistantDesk(),
    getPreparedAnswers(),
    getConversations(),
    getWorkspaceActions(),
    getMemory(),
    getClients(),
    getCalendar(),
    getSafetySettings(),
  ]);
  const latest = set.briefings[set.briefings.length - 1];

  return {
    greeting: `${briefingCopy.greeting[latest.period]}, ${set.owner.firstName}.`,
    initials: user.initials,
    company: workspace.name,
    ...desk,
    answers,
    conversations,
    prompts,
    actions,
    memory,
    people: clients.map((c) => ({ id: c.id, name: c.contact.name, company: c.name, role: c.contact.role, status: c.status, href: `/app/clients?client=${c.id}` })),
    events: events.filter((e) => e.day === "Today" || e.day === "Tomorrow").slice(0, 4),
    rules: { ask: safety.approvals.filter((a) => a.autonomous === "ask").map((a) => a.action), never: safety.restricted.slice(0, 3) },
  };
}

export type AssistantData = Awaited<ReturnType<typeof loadAssistant>>;
