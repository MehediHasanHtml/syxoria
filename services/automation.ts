import { workflowsFor } from "@/lib/automation";
import { mockActingIntegrations, mockAutomationState, mockWorkflows } from "@/lib/mock-data/automation";
import { mockAutonomyPolicy } from "@/lib/mock-data/onboarding";
import type { AutomationContext, AutomationHold, AutonomyLevel } from "@/types";
import { clone, simulateLatency } from "./_client";
import { getDailyBriefings } from "./briefings";

/**
 * TODO(api): GET /automation — the workflows Syxoria runs on its own under the mandate, the tools it
 * acts in, today's actions it would start by itself, and the holds in force.
 */
export async function getAutomationContext(level: AutonomyLevel = "autonomous"): Promise<AutomationContext> {
  const set = await getDailyBriefings(level);
  const latest = set.briefings[set.briefings.length - 1];
  const workflows = workflowsFor(mockAutonomyPolicy, level, mockWorkflows);
  const pending = latest.actions
    .filter((a) => !a.needsApproval && a.workflowId && workflows.some((w) => w.id === a.workflowId) && (a.status === "scheduled" || a.status === "in-progress"))
    .map((a) => ({ id: a.id, name: a.name, timing: a.timing, status: a.status, workflowId: a.workflowId as string }));
  return clone({
    level,
    levelName: set.autonomy.name,
    workflows,
    integrations: mockActingIntegrations.filter((i) => workflows.some((w) => w.integrationId === i.id)),
    pending,
    state: mockAutomationState,
  });
}

/**
 * TODO(api): POST /automation/holds — the execution layer enforces it: every queued job and worker
 * checks the holds before it starts, so nothing new starts once this returns. An operation already
 * handed to another service (a message already accepted by Gmail) cannot be called back.
 */
export async function placeHold(input: Omit<AutomationHold, "id" | "since" | "by">): Promise<AutomationHold> {
  await simulateLatency(500);
  return { ...input, id: `hold_${input.scope}_${input.targetId ?? "all"}_${Date.now().toString(36)}`, since: new Date().toISOString(), by: "owner" };
}

/** TODO(api): DELETE /automation/holds/:id — only by an authorised owner, after review; the mandate and its limits are unchanged */
export async function liftHold(id: string): Promise<{ id: string }> {
  await simulateLatency(500);
  return { id };
}
