/**
 * What the centre of the overview shows, in four moments of the demo day (Wednesday 14 October):
 * a calm state, an important anomaly, a decision awaiting approval, and an action that went
 * through. Every moment is one of the day's real events (lib/mock-data/briefings.ts and
 * workspace-actions.ts), so the centre never says anything the rest of the workspace does not.
 * Used by the explorations at /concept/center. No dashes or hyphenated words in UI copy.
 */

export type CenterState = "calm" | "anomaly" | "approval" | "done";
/** What Syxoria does, in four verbs: the centre's grammar */
export type CenterVerb = "understand" | "detect" | "recommend" | "execute";
/** The parts of the business the Core holds, as its layers */
export type CenterArea = "sales" | "clients" | "finance" | "marketing" | "operations";

export type CenterMoment = { id: string; at: string; verb: CenterVerb; area: CenterArea; text: string };

export type CenterScenario = {
  state: CenterState;
  /** The state's name, in the explorations' switcher */
  name: string;
  verb: CenterVerb;
  /** When it happened ("14:12"), or the moment it describes ("Now") */
  at: string;
  area: CenterArea;
  headline: string;
  detail: string;
  /** The figure behind it, when it has an honest one */
  stake?: { value: string; caption: string };
  /** What it rests on, from the connected tools only */
  evidence: string[];
  /** What Syxoria recommends next, or what came of it */
  next?: { kind: "approve" | "hold" | "open"; label: string; line: string; actionId?: string; href: string };
  /** The moment of the day it is (highlighted on the day line) */
  momentId?: string;
  /** Ask Syxoria, about this moment: what the field invites, and a few questions it suggests */
  ask: { placeholder: string; prompts: string[] };
};

export const centerAreas: { id: CenterArea; name: string; weight: number }[] = [
  { id: "sales", name: "Sales", weight: 1.35 },
  { id: "clients", name: "Clients", weight: 1.1 },
  { id: "finance", name: "Finance", weight: 1 },
  { id: "marketing", name: "Marketing", weight: 0.75 },
  { id: "operations", name: "Operations", weight: 0.65 },
];

export const centerVerbs: Record<CenterVerb, { name: string; doing: string }> = {
  understand: { name: "Understands", doing: "Understood" },
  detect: { name: "Detects", doing: "Detected" },
  recommend: { name: "Recommends", doing: "Recommends" },
  execute: { name: "Executes", doing: "Done" },
};

/** The day so far, oldest first: what Syxoria understood, detected, recommended and carried out */
export const centerDay: CenterMoment[] = [
  { id: "m0800", at: "8:00", verb: "detect", area: "sales", text: "Three proposals waiting on your reply" },
  { id: "m1000", at: "10:00", verb: "execute", area: "sales", text: "Replies sent to Camille and Hugo" },
  { id: "m1140", at: "11:40", verb: "understand", area: "clients", text: "Camille wants to sign by Friday" },
  { id: "m1215", at: "12:15", verb: "understand", area: "clients", text: "Hugo asked to start in March" },
  { id: "m1324", at: "13:24", verb: "execute", area: "operations", text: "Deal stages updated in HubSpot" },
  { id: "m1410", at: "14:10", verb: "execute", area: "sales", text: "Contract sent to Atelier Rive" },
  { id: "m1412", at: "14:12", verb: "detect", area: "clients", text: "Nora’s quote was returned" },
  { id: "m1602", at: "16:02", verb: "understand", area: "sales", text: "Camille opened the contract" },
  { id: "m1705", at: "17:05", verb: "recommend", area: "finance", text: "Reminder ready for Brasserie Ondine" },
  { id: "m1720", at: "17:20", verb: "recommend", area: "sales", text: "Hugo’s March timeline drafted" },
];

/** What Syxoria keeps in view while nothing needs the owner */
export const centerWatch: { area: CenterArea; text: string }[] = [
  { area: "sales", text: "Atelier Rive signs by Friday. Camille opened the contract at 16:02." },
  { area: "clients", text: "Oréa Clinics has been quiet for 18 days. References are drafted." },
  { area: "finance", text: "€9,700 to collect. A reminder is ready for Monday." },
  { area: "marketing", text: "Cost per lead up 41%. A paused ad group waits for you." },
  { area: "operations", text: "Gmail, HubSpot and Calendar in sync. Drive needs reconnecting." },
];

export const centerScenarios: CenterScenario[] = [
  {
    state: "calm",
    name: "Calm",
    verb: "understand",
    at: "Now",
    area: "sales",
    headline: "Your business is moving as planned.",
    detail: "Nothing new needs you since the evening briefing. Syxoria keeps five areas in view and prepares the next briefing for 8:00.",
    evidence: ["Two of three deals moved forward today", "Four of five actions went through", "Cash covers about four months of costs"],
    ask: { placeholder: "Ask Syxoria about your business", prompts: ["What should I look at this week?", "Can we afford a designer in January?"] },
  },
  {
    state: "anomaly",
    name: "Anomaly",
    verb: "detect",
    at: "14:12",
    area: "clients",
    headline: "Nora’s quote never reached her.",
    detail: "Her mail server returned it: the address at Côté Sud Hôtels no longer exists. Nothing reached her, so the deal is not lost, only unheard.",
    stake: { value: "€14,800", caption: "quote unheard for 15 days" },
    evidence: ["Returned at 14:12 by cotesud-hotels.fr", "No other contact at Côté Sud Hôtels", "She returned your last two calls the same day"],
    next: { kind: "hold", label: "Keep the 9:30 slot", line: "Call her tomorrow at 9:30. I hold the slot; the call is yours.", actionId: "hold_call", href: "/app/actions?action=hold_call" },
    momentId: "m1412",
    ask: { placeholder: "Ask about Nora, or what else to try", prompts: ["Who else could I reach at Côté Sud?", "Draft a note for her office"] },
  },
  {
    state: "approval",
    name: "Decision",
    verb: "recommend",
    at: "17:20",
    area: "sales",
    headline: "Hugo’s March timeline waits for your approval.",
    detail: "He asked to start a month earlier. The scope and the price stay the same, and the signature moves into October.",
    stake: { value: "€21,500", caption: "brought into October" },
    evidence: ["Hugo’s email, today 12:15", "Packaging range proposal, 28 September", "Studio calendar is free in March"],
    next: { kind: "approve", label: "Review and approve", line: "A change to a quote always waits for you. Nothing goes out before you say yes.", actionId: "timeline_hugo", href: "/app/actions?action=timeline_hugo" },
    momentId: "m1720",
    ask: { placeholder: "Ask what changes if you approve", prompts: ["What changes for Hugo if I approve?", "Compare it with the first timeline"] },
  },
  {
    state: "done",
    name: "Completed",
    verb: "execute",
    at: "12:15",
    area: "sales",
    headline: "Both replies were answered within hours.",
    detail: "Syxoria sent your replies to Camille and Hugo at 10:00. Camille answered at 11:40, Hugo at 12:15. Two deals are moving again.",
    stake: { value: "€63,500", caption: "back in motion today" },
    evidence: ["Sent at 10:00 within your rules", "Camille answered at 11:40", "Hugo answered at 12:15"],
    next: { kind: "open", label: "See what came of it", line: "Waiting on you this morning: three proposals. Now: one.", href: "/app/history" },
    momentId: "m1000",
    ask: { placeholder: "Ask what moved today", prompts: ["Summarise what moved today", "What is still waiting on me?"] },
  },
];
