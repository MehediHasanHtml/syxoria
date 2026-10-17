import type { BusinessIndicator, HomeRecommendation, HomeSignal } from "@/types";

/**
 * The workspace home for the demo company, the evening of the demo day (lib/mock-data/briefings.ts):
 * after the 18:30 briefing. Everything here tells the same story as the briefings; actions are
 * named by id and their status is always read from the briefing's own list. The UI only reads this
 * through services/overview.ts.
 */

/** The moment the home describes: after the evening briefing */
export const WORKSPACE_NOW = "2026-10-14T19:05:00";

export const mockIndicators: BusinessIndicator[] = [
  {
    id: "revenue",
    label: "Revenue",
    value: "€64,200",
    caption: "invoiced in October so far",
    trend: { direction: "up", text: "12% on September at this date", good: true },
    href: "/app/business/finance",
  },
  {
    id: "pipeline",
    label: "Open proposals",
    value: "€78,300",
    caption: "across three proposals",
    note: "Two moved forward today",
    href: "/app/business/sales",
  },
  {
    id: "invoices",
    label: "Outstanding invoices",
    value: "€9,700",
    caption: "across two invoices",
    note: "€3,200 from Brasserie Ondine due Monday",
    href: "/app/business/finance",
  },
  {
    id: "goal",
    label: "Q4 revenue goal",
    value: "34%",
    caption: "of €190,000",
    progress: 0.34,
    note: "Ahead of pace, two weeks into the quarter",
    href: "/app/business/goals",
  },
];

/** Beyond the priority (Nora's returned quote), most pressing first */
export const mockSignals: HomeSignal[] = [
  {
    id: "s_rive",
    kind: "deadline",
    level: "high",
    title: "Atelier Rive signs by Friday",
    detail: "Camille opened the contract at 16:02. Two days left.",
    stake: "€42,000",
    due: "Friday",
    href: "/app/briefings?briefing=b_evening",
  },
  {
    id: "s_hugo",
    kind: "opportunity",
    level: "watch",
    title: "Hugo wants to start in March",
    detail: "A month earlier than planned, so the deal could close this month.",
    stake: "€21,500",
    href: "/app/briefings?briefing=b_midday",
  },
  {
    id: "s_replies",
    kind: "decline",
    level: "watch",
    title: "Your replies are slowing down",
    detail: "3.4 days on average this week, against 1.8 last month.",
    href: "/app/business/sales",
  },
];

/** Beyond the briefing's own recommendation (call Nora), which the priority already carries */
export const mockRecommendations: HomeRecommendation[] = [
  {
    id: "r_hugo",
    title: "Approve Hugo’s March timeline",
    why: "He asked to start a month earlier than planned.",
    outcome: "The contract can go out this week.",
    actionId: "timeline_hugo",
    href: "/app/actions",
  },
  {
    id: "r_ondine",
    title: "Send Brasserie Ondine a reminder on Monday",
    why: "€3,200 is due Monday, and they paid late twice this year.",
    outcome: "Paid on time.",
    actionId: "reminder_ondine",
    href: "/app/actions",
  },
  {
    id: "r_camille",
    title: "Check in with Camille on Thursday if unsigned",
    why: "Her signature is due Friday.",
    outcome: "Signed before the deadline.",
    href: "/app/briefings?briefing=b_evening",
  },
];
