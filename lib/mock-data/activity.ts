import type { ActivityItem, Integration } from "@/types";

export const mockActivity: ActivityItem[] = [
  { id: "a_01", kind: "insight", actorId: "system", message: "Nexo surfaced a new insight", target: "4 invoices ready for follow-up", module: "nexo", createdAt: "2026-09-24T08:52:00.000Z", projectId: "p_collection" },
  { id: "a_02", kind: "project", actorId: "u_02", message: "completed a milestone in", target: "Client onboarding", module: "volt", createdAt: "2026-09-24T07:10:00.000Z", projectId: "p_onboarding" },
  { id: "a_03", kind: "automation", actorId: "system", message: "Volt sent 3 kickoff invitations for", target: "Atelier Rive, Monceau Partners", module: "volt", createdAt: "2026-09-24T06:45:00.000Z", projectId: "p_onboarding" },
  { id: "a_04", kind: "automation", actorId: "system", message: "Lume grouped 28 new messages into", target: "7 conversations", module: "lume", createdAt: "2026-09-24T06:00:00.000Z", projectId: null },
  { id: "a_05", kind: "project", actorId: "u_04", message: "flagged a risk on", target: "Sales pipeline hygiene", module: "lume", createdAt: "2026-09-23T15:40:00.000Z", projectId: "p_pipeline" },
  { id: "a_06", kind: "integration", actorId: "u_03", message: "connected", target: "Stripe", module: "nexo", createdAt: "2026-09-23T10:12:00.000Z", projectId: "p_collection" },
  { id: "a_07", kind: "member", actorId: "u_01", message: "invited", target: "Sami Benali as viewer", module: "orion", createdAt: "2026-09-22T17:30:00.000Z", projectId: null },
  { id: "a_08", kind: "project", actorId: "u_01", message: "updated goals in", target: "H2 growth goals", module: "kairo", createdAt: "2026-09-21T16:30:00.000Z", projectId: "p_okr" },
  { id: "a_09", kind: "automation", actorId: "system", message: "Volt reconciled 16 payments with", target: "bank feed", module: "volt", createdAt: "2026-09-21T08:00:00.000Z", projectId: "p_collection" },
  { id: "a_10", kind: "insight", actorId: "u_02", message: "applied an insight to", target: "Kickoff scheduling", module: "volt", createdAt: "2026-09-20T10:30:00.000Z", projectId: "p_onboarding" },
];

export const mockIntegrations: Integration[] = [
  { id: "gmail", name: "Gmail", category: "Communication", connected: true },
  { id: "outlook", name: "Outlook", category: "Communication", connected: false },
  { id: "slack", name: "Slack", category: "Communication", connected: true },
  { id: "drive", name: "Google Drive", category: "Documents", connected: true },
  { id: "notion", name: "Notion", category: "Documents", connected: false },
  { id: "excel", name: "Excel", category: "Data", connected: false },
  { id: "hubspot", name: "HubSpot", category: "CRM", connected: true },
  { id: "salesforce", name: "Salesforce", category: "CRM", connected: false },
  { id: "stripe", name: "Stripe", category: "Finance", connected: true },
  { id: "paypal", name: "PayPal", category: "Finance", connected: false },
];
