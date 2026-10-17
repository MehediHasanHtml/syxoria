import { effectiveMode } from "@/lib/onboarding/mandate";
import type { AutomationContext, AutomationHold, AutomationState, AutomationWorkflow, AutonomyLevel, AutonomyPolicy } from "@/types";

/**
 * How the holds read, the same on every screen. A hold covers new autonomous actions only: the
 * global one everything Syxoria would start by itself, a workflow's its own, a tool's every
 * workflow acting in it.
 */

/** The workflows a level lets Syxoria run on its own: those whose rule acts alone under it */
export function workflowsFor(policy: AutonomyPolicy, level: AutonomyLevel, all: AutomationWorkflow[]) {
  return all.filter((w) => {
    const rule = policy.rules.find((r) => r.id === w.ruleId);
    return rule ? effectiveMode(rule, { level, overrides: {} }) === "auto" : false;
  });
}

export const globalHold = (state: AutomationState) => state.holds.find((h) => h.scope === "global") ?? null;

export const holdFor = (state: AutomationState, scope: Exclude<AutomationHold["scope"], "global">, targetId: string) =>
  state.holds.find((h) => h.scope === scope && h.targetId === targetId) ?? null;

/** What keeps a workflow from starting anything new: the global hold first, then its own, then its tool's */
export function holdOn(state: AutomationState, ctx: Pick<AutomationContext, "workflows">, workflowId: string): AutomationHold | null {
  const workflow = ctx.workflows.find((w) => w.id === workflowId);
  return globalHold(state) ?? holdFor(state, "workflow", workflowId) ?? (workflow ? holdFor(state, "integration", workflow.integrationId) : null);
}

/** The actions a hold keeps from starting, and those that carry on */
export function heldActions(state: AutomationState, ctx: Pick<AutomationContext, "workflows" | "pending">) {
  const held = ctx.pending.filter((a) => holdOn(state, ctx, a.workflowId));
  return { held, running: ctx.pending.filter((a) => !held.includes(a)) };
}

/** Whether one of today's actions is kept from starting (an action Syxoria would not start alone never is) */
export function isHeld(state: AutomationState, ctx: Pick<AutomationContext, "workflows" | "pending">, actionId: string) {
  const pending = ctx.pending.find((a) => a.id === actionId);
  return pending ? holdOn(state, ctx, pending.workflowId) !== null : false;
}

/** Whether anything at all is held, for the top bar's word */
export const anyHold = (state: AutomationState) => state.holds.length > 0 || state.incident !== null;
