import type { AutomationIntegration, AutomationState, AutomationWorkflow } from "@/types";

/**
 * What Syxoria carries out on its own for Northfield Studio, and the tools it acts in. Each
 * workflow runs under one permission rule of the mandate (lib/mock-data/onboarding.ts), so it only
 * appears when that rule lets Syxoria act alone under the owner's autonomy mode.
 * TODO(api): served by the execution layer with the holds in force.
 */
export const mockWorkflows: AutomationWorkflow[] = [
  {
    id: "wf_replies",
    name: "Routine replies",
    description: "Answers existing clients from the templates you approved.",
    ruleId: "send",
    integrationId: "gmail",
  },
  {
    id: "wf_records",
    name: "Deal and contact updates",
    description: "Moves deals to their next stage and logs calls and emails.",
    ruleId: "records",
    integrationId: "hubspot",
  },
  {
    id: "wf_calendar",
    name: "Calendar holds",
    description: "Keeps time free for what a briefing recommends, and moves it if you book something else.",
    ruleId: "records",
    integrationId: "calendar",
  },
];

export const mockActingIntegrations: AutomationIntegration[] = [
  { id: "gmail", name: "Gmail", logo: "gmail", acts: "Sends routine replies" },
  { id: "hubspot", name: "HubSpot", logo: "hubspot", acts: "Updates deals and contacts" },
  { id: "calendar", name: "Google Calendar", logo: null, acts: "Places and moves holds" },
];

/** Nothing held, no incident: the state a workspace starts in */
export const mockAutomationState: AutomationState = { holds: [], incident: null };
