import type { DailyBriefing } from "@/types";

/**
 * One day of executive briefings for the demo company, in order: the morning briefing is the first
 * one ever (the end of the onboarding), so it has nothing to compare with; midday and evening each
 * say what changed since the one before. The three tell one coherent story:
 *
 *   08:00  three proposals wait on a reply → two routine replies are scheduled, a quote waits for you
 *   13:00  the replies went out, Camille answered: the contract is now the priority
 *   18:30  the contract went out, Nora's quote bounced: call her tomorrow
 *
 * The mandate is Autonomous: routine replies go out on their own, while quotes, contracts and
 * anything involving money still wait for the owner (see mockAutonomyPolicy). The UI only reads
 * this through services/briefings.ts.
 */

const morning: DailyBriefing = {
  id: "b_morning",
  period: "morning",
  preparedAt: "2026-10-16T08:00:00",
  headline: "Three clients are waiting on your reply.",
  priority: {
    dimension: "priority",
    severity: "high",
    title: "Three proposals are waiting on your reply.",
    why: "In each one the client wrote last, more than ten days ago.",
    metric: { value: "€78,300", caption: "waiting on your reply", kind: "money" },
    detail: "Largest: Atelier Rive, €42,000",
    evidence: ["Atelier Rive, €42,000: 12 days without an answer", "Maison Lenoir, €21,500: 11 days", "Côté Sud Hôtels, €14,800: 15 days"],
  },
  insight: {
    dimension: "insight",
    title: "Past ten quiet days, your deals close half as often.",
    why: "All three have crossed that line.",
    metric: { value: "31%", caption: "close once a client waits over 10 days", kind: "change" },
    detail: "62% when they hear back in time",
    evidence: ["128 proposals over the last two years", "Answered within 10 days: 62% closed", "Left waiting longer: 31% closed"],
  },
  recommendation: {
    dimension: "recommendation",
    id: "rec_morning",
    title: "Reply to all three this morning.",
    why: "It is the quickest way to double their chances.",
    metric: { value: "2×", caption: "as likely to close once they hear back", kind: "change" },
    detail: "Start with Camille: one line answers her question",
    evidence: ["Camille asked when you need a decision", "Hugo asked for a timeline, drafted from your last project", "Nora’s revised quote needs your eye on the price"],
  },
  action: {
    dimension: "action",
    title: "Two replies go out at 10:00. One waits for you.",
    why: "Routine replies are within your mandate. A quote always needs your approval.",
    metric: { value: "3", caption: "actions prepared this morning", kind: "count" },
    detail: "Nothing involving money is sent without you",
  },
  actions: [
    { id: "reply_camille", name: "Reply to Camille Roy", status: "scheduled", timing: "10:00", next: "Her answer is logged on the deal", needsApproval: false, recommendationId: "rec_morning" },
    { id: "reply_hugo", name: "Reply to Hugo Lenoir", status: "scheduled", timing: "10:00", next: "His answer is logged on the deal", needsApproval: false, recommendationId: "rec_morning" },
    {
      id: "quote_nora",
      name: "Revised quote for Nora Haddad",
      status: "awaiting-approval",
      timing: "Ready since 7:45",
      next: "Sent as soon as you approve",
      needsApproval: true,
      note: "Quotes always wait for you",
      recommendationId: "rec_morning",
    },
    {
      id: "note_belval",
      name: "Note to Élise Belval",
      status: "drafted",
      timing: "Holding",
      next: "Ready for your review on Monday",
      needsApproval: false,
      note: "Élise asked to pick it up after the harvest",
      recommendationId: "rec_morning",
    },
  ],
  changes: null,
  comparedWith: null,
};

const midday: DailyBriefing = {
  id: "b_midday",
  period: "midday",
  preparedAt: "2026-10-16T13:00:00",
  headline: "Atelier Rive is ready to sign.",
  priority: {
    dimension: "priority",
    severity: "critical",
    title: "Atelier Rive wants the contract by Friday.",
    why: "Camille answered at 11:40: they want to be live for the spring launch.",
    metric: { value: "2 days", caption: "until Camille’s deadline", kind: "duration" },
    detail: "€42,000, your largest open deal",
    evidence: ["Camille’s reply, 11:40: “Send the contract and we sign this week”", "Spring launch planned for 3 March", "No other deal is this close to signing"],
    change: { kind: "new" },
  },
  insight: {
    dimension: "insight",
    title: "Answered deals moved within hours.",
    why: "Both clients who heard back at 10:00 replied before noon.",
    metric: { value: "2 of 2", caption: "replied the same morning", kind: "count" },
    detail: "Hugo asked to start in March, a month earlier",
    evidence: ["Camille replied at 11:40", "Hugo replied at 12:15", "Nora has not heard back yet: her quote waits for you"],
    change: { kind: "changed", was: "Past ten quiet days, your deals close half as often." },
  },
  recommendation: {
    dimension: "recommendation",
    id: "rec_midday",
    title: "Review the contract this afternoon.",
    why: "Sent today, it leaves Camille two days to sign.",
    detail: "Then approve Nora’s quote: it has waited since 7:45",
    evidence: ["Drafted from your standard contract and her accepted proposal", "Only the start date changed: 3 March"],
    change: { kind: "changed", was: "Reply to all three this morning." },
  },
  action: {
    dimension: "action",
    title: "The contract is drafted. Two items need you.",
    why: "Contracts and quotes wait for your approval, even in Autonomous mode.",
    metric: { value: "2", caption: "waiting for your approval", kind: "count" },
    detail: "Both replies went out at 10:00",
    change: { kind: "changed", was: "Two replies go out at 10:00. One waits for you." },
  },
  actions: [
    {
      id: "contract_rive",
      name: "Contract for Atelier Rive",
      status: "awaiting-approval",
      timing: "Drafted 12:50",
      next: "Sent as soon as you approve",
      needsApproval: true,
      note: "Contracts always wait for you",
      recommendationId: "rec_midday",
    },
    {
      id: "quote_nora",
      name: "Revised quote for Nora Haddad",
      status: "awaiting-approval",
      timing: "Waiting since 7:45",
      next: "Sent as soon as you approve",
      needsApproval: true,
      note: "Quotes always wait for you",
      recommendationId: "rec_midday",
    },
    { id: "stages", name: "Update deal stages in HubSpot", status: "in-progress", timing: "2 of 3 deals", next: "Done by 13:30", needsApproval: false, recommendationId: "rec_midday" },
    { id: "reply_camille", name: "Reply to Camille Roy", status: "completed", timing: "Sent 10:00", next: "Camille answered at 11:40", needsApproval: false, recommendationId: "rec_morning" },
    { id: "reply_hugo", name: "Reply to Hugo Lenoir", status: "completed", timing: "Sent 10:00", next: "Hugo answered at 12:15", needsApproval: false, recommendationId: "rec_morning" },
  ],
  changes: [
    { id: "c1", kind: "completed", text: "Both routine replies went out.", at: "10:00", dimension: "action" },
    { id: "c2", kind: "new", text: "Camille answered: Atelier Rive wants to sign by Friday.", at: "11:40", dimension: "priority" },
    { id: "c3", kind: "opportunity", text: "Hugo wants to start in March, a month earlier.", at: "12:15", dimension: "insight" },
    { id: "c4", kind: "changed", text: "Review the contract, rather than reply.", dimension: "recommendation" },
    { id: "c5", kind: "unresolved", text: "Nora’s quote still waits for your approval.", dimension: "action" },
  ],
  comparedWith: "morning",
};

const evening: DailyBriefing = {
  id: "b_evening",
  period: "evening",
  preparedAt: "2026-10-16T18:30:00",
  headline: "The contract is out. Nora’s quote did not reach her.",
  priority: {
    dimension: "priority",
    severity: "watch",
    title: "Nora’s revised quote was returned.",
    why: "Her address at Côté Sud Hôtels no longer receives mail.",
    metric: { value: "€14,800", caption: "quote not delivered", kind: "money" },
    detail: "15 days since she last heard from you",
    evidence: ["Returned at 14:12: address no longer in use", "Her phone number is on the deal", "No other contact at Côté Sud Hôtels yet"],
    change: { kind: "new" },
  },
  insight: {
    dimension: "insight",
    title: "Two of three deals moved forward today.",
    why: "This morning, all three were waiting on you.",
    metric: { value: "€63,500", caption: "in deals that moved today", kind: "money" },
    detail: "Camille opened the contract at 16:02",
    evidence: ["Atelier Rive: contract sent, opened at 16:02", "Maison Lenoir: start moved to March", "Côté Sud Hôtels: no contact yet"],
    change: { kind: "changed", was: "Answered deals moved within hours." },
  },
  recommendation: {
    dimension: "recommendation",
    id: "rec_evening",
    title: "Call Nora tomorrow at 9:30.",
    why: "She answers calls within a day, and email no longer reaches her.",
    metric: { value: "9:30", caption: "free in your calendar tomorrow", kind: "time" },
    detail: "Syxoria can hold the slot, not make the call",
    evidence: ["Nora returned your last two calls the same day", "Ask for her new address to resend the quote"],
    change: { kind: "changed", was: "Review the contract this afternoon." },
  },
  action: {
    dimension: "action",
    title: "Four done today. One could not be completed.",
    why: "The quote was approved and sent, then returned.",
    metric: { value: "4 of 5", caption: "actions completed today", kind: "count" },
    detail: "A payment reminder waits for you",
    change: { kind: "changed", was: "The contract is drafted. Two items need you." },
  },
  actions: [
    {
      id: "quote_nora",
      name: "Revised quote for Nora Haddad",
      status: "unsuccessful",
      timing: "Returned 14:12",
      next: "Resent once you have her new address",
      needsApproval: true,
      note: "Her address no longer receives mail",
      recommendationId: "rec_evening",
    },
    { id: "hold_call", name: "Hold 9:30 tomorrow for a call with Nora", status: "scheduled", timing: "Tomorrow 9:30", next: "Moves if you book something else", needsApproval: false, recommendationId: "rec_evening" },
    {
      id: "reminder_ondine",
      name: "Payment reminder for Brasserie Ondine",
      status: "drafted",
      timing: "Invoice due Monday",
      next: "Ready for your approval on Monday",
      needsApproval: true,
      note: "Anything involving money waits for you",
      recommendationId: "rec_evening",
    },
    { id: "contract_rive", name: "Contract for Atelier Rive", status: "completed", timing: "Sent 14:10", next: "Camille opened it at 16:02", needsApproval: true, recommendationId: "rec_midday" },
    { id: "stages", name: "Update deal stages in HubSpot", status: "completed", timing: "Done 13:24", needsApproval: false, recommendationId: "rec_midday" },
  ],
  changes: [
    { id: "c1", kind: "decided", text: "You approved the contract and Nora’s quote.", at: "14:05", dimension: "recommendation" },
    { id: "c2", kind: "completed", text: "The contract went to Atelier Rive.", at: "14:10", dimension: "action" },
    { id: "c3", kind: "risk", text: "Nora’s quote was returned: her address no longer works.", at: "14:12", dimension: "priority" },
    { id: "c4", kind: "new", text: "Camille opened the contract.", at: "16:02", dimension: "insight" },
    { id: "c5", kind: "unresolved", text: "Côté Sud Hôtels has now waited 15 days.", dimension: "priority" },
  ],
  comparedWith: "midday",
};

export const mockDailyBriefings: DailyBriefing[] = [morning, midday, evening];
