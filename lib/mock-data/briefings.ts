import type { BriefingChange, DailyBriefing } from "@/types";

/**
 * One day of executive briefings for the demo company, in order. The morning is compared with
 * yesterday evening's briefing; midday and evening each with the one before. (For a brand new
 * user, the service drops the morning's comparison: the very first briefing has no past.)
 * The three tell one coherent story:
 *
 *   08:00  three proposals wait on a reply → two routine replies are scheduled, a quote waits for you
 *   13:00  the replies went out, Camille answered: the contract is now the priority
 *   18:30  the contract went out, Nora's quote bounced: call her tomorrow
 *
 * The centre of the dial reads each step in its own way: money, a fall in a rate, a multiplier,
 * a count, a deadline, a result, a statement without a figure, a client's issue, a time, progress.
 * Each briefing names where the day's main thread stands (stage: identified, in progress, completed).
 * Updates are listed newest first, the two or three that matter most marked as highlights; those
 * about an action name it (actionId), so their status is read from the action itself. The mandate is Autonomous: routine replies go out on
 * their own, while quotes, contracts and anything involving money still wait for the owner (see
 * mockAutonomyPolicy). The UI only reads this through services/briefings.ts.
 */

const morning: DailyBriefing = {
  id: "b_morning",
  period: "morning",
  preparedAt: "2026-10-14T08:00:00",
  headline: "Three clients are waiting on your reply.",
  priority: {
    dimension: "priority",
    severity: "high",
    title: "Three proposals are waiting on your reply.",
    why: "In each one the client wrote last, more than ten days ago.",
    metric: { kind: "money", value: "€78,300", caption: "waiting on your reply" },
    detail: "Largest: Atelier Rive, €42,000",
    evidence: ["Atelier Rive, €42,000: 12 days without an answer", "Maison Lenoir, €21,500: 11 days", "Côté Sud Hôtels, €14,800: 15 days"],
  },
  insight: {
    dimension: "insight",
    title: "Past ten quiet days, your deals close half as often.",
    why: "All three have crossed that line.",
    metric: { kind: "change", value: "31%", caption: "close after ten quiet days", direction: "down", from: "62%" },
    detail: "Half the rate of deals answered in time",
    evidence: ["128 proposals over the last two years", "Answered within 10 days: 62% closed", "Left waiting longer: 31% closed"],
    limits: "Your own history: it says what usually happens, not what will.",
  },
  recommendation: {
    dimension: "recommendation",
    id: "rec_morning",
    title: "Reply to all three this morning.",
    why: "It is the quickest way to double their chances.",
    metric: { kind: "change", value: "2×", caption: "as likely to close once answered", direction: "up" },
    detail: "Start with Camille: one line answers her question",
    evidence: ["Camille asked when you need a decision", "Hugo asked for a timeline, drafted from your last project", "Nora’s revised quote needs your eye on the price"],
    outcome: "Each client hears back before the deal goes cold.",
    limits: "Doubling is your past average, not a promise for these three.",
  },
  action: {
    dimension: "action",
    title: "Two replies go out at 10:00. One waits for you.",
    why: "Routine replies are within your mandate. A quote always needs your approval.",
    metric: { kind: "count", value: "3", caption: "replies prepared this morning" },
    detail: "Nothing involving money is sent without you",
    evidence: ["Autonomous mode: routine replies go out on their own", "Quotes, contracts and money always wait for you"],
    outcome: "All three clients answered today, Nora as soon as you approve.",
  },
  actions: [
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
    { id: "reply_camille", name: "Reply to Camille Roy", status: "scheduled", timing: "Today 10:00", next: "Her answer is logged on the deal", needsApproval: false, recommendationId: "rec_morning" },
    { id: "reply_hugo", name: "Reply to Hugo Lenoir", status: "scheduled", timing: "Today 10:00", next: "His answer is logged on the deal", needsApproval: false, recommendationId: "rec_morning" },
  ],
  followThrough: {
    title: "Two replies go out at 10:00. Nora’s quote waits for you.",
    steps: [
      { id: "found", label: "Found", when: "Today", detail: "3 proposals", state: "done" },
      { id: "drafted", label: "Drafted", when: "7:45", detail: "3 messages", state: "done" },
      { id: "scheduled", label: "Scheduled", when: "10:00", detail: "2 go on their own", state: "now" },
      { id: "replied", label: "Replied", when: "Pending", state: "next" },
      { id: "closed", label: "Closed", when: "Pending", detail: "€78,300", state: "next" },
    ],
  },
  stage: { state: "identified", label: "Three proposals waiting" },
  changes: [
    { id: "c1", kind: "new", title: "Nora’s revised quote is ready", detail: "It waits for your approval", at: "7:45", dimension: "action", actionId: "quote_nora", highlight: true },
    { id: "c2", kind: "completed", title: "Replies drafted for Camille and Hugo", detail: "They go out on their own at 10:00", at: "7:40", dimension: "action", highlight: true },
    { id: "c3", kind: "risk", title: "All three passed ten quiet days", detail: "Maison Lenoir crossed the line overnight", at: "Overnight", dimension: "priority", highlight: true },
    { id: "c4", kind: "new", title: "Hugo reopened your proposal", detail: "Maison Lenoir, after a week without a word", at: "Yesterday 21:14", dimension: "insight" },
  ],
  comparedWith: { period: "evening", preparedAt: "2026-10-13T18:30:00" },
};

const midday: DailyBriefing = {
  id: "b_midday",
  period: "midday",
  preparedAt: "2026-10-14T13:00:00",
  headline: "Atelier Rive is ready to sign.",
  priority: {
    dimension: "priority",
    severity: "critical",
    title: "Atelier Rive wants the contract by Friday.",
    why: "Camille answered at 11:40: they want to be live for the spring launch.",
    metric: { kind: "deadline", value: "2 days", caption: "until Camille’s deadline", due: "Friday 16 October" },
    detail: "€42,000, your largest open deal",
    evidence: ["Camille’s reply, 11:40: “Send the contract and we sign this week”", "Spring launch planned for 3 March", "No other deal is this close to signing"],
    change: { kind: "new" },
  },
  insight: {
    dimension: "insight",
    title: "Answered deals moved within hours.",
    why: "Both clients who heard back at 10:00 replied before noon.",
    metric: { kind: "result", value: "2 of 2", caption: "answered the same morning" },
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
    outcome: "Camille signs before Friday, as she asked.",
    limits: "Read the contract before it goes: Syxoria drafted it, it is not legal advice.",
    change: { kind: "changed", was: "Reply to all three this morning." },
  },
  action: {
    dimension: "action",
    title: "The contract is drafted. Two items need you.",
    why: "Contracts and quotes wait for your approval, even in Autonomous mode.",
    metric: { kind: "count", value: "2", caption: "waiting for your approval" },
    detail: "Both replies went out at 10:00",
    evidence: ["Contract drafted at 12:50", "Nora’s quote ready since 7:45"],
    outcome: "Both go out as soon as you approve them.",
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
      recommendationId: "rec_morning",
    },
    { id: "stages", name: "Update deal stages in HubSpot", status: "in-progress", timing: "2 of 3 deals", next: "Done by 13:30", needsApproval: false, recommendationId: "rec_midday" },
    { id: "reply_camille", name: "Reply to Camille Roy", status: "completed", timing: "Sent 10:00", next: "Camille answered at 11:40", needsApproval: false, recommendationId: "rec_morning" },
    { id: "reply_hugo", name: "Reply to Hugo Lenoir", status: "completed", timing: "Sent 10:00", next: "Hugo answered at 12:15", needsApproval: false, recommendationId: "rec_morning" },
  ],
  followThrough: {
    title: "Two clients answered. The contract waits for your approval.",
    steps: [
      { id: "found", label: "Found", when: "8:00", detail: "3 proposals", state: "done" },
      { id: "sent", label: "Sent", when: "10:00", detail: "2 replies", state: "done" },
      { id: "replied", label: "Replied", when: "12:15", detail: "2 of 3", state: "done" },
      { id: "contract", label: "Contract", when: "By you", detail: "Drafted 12:50", state: "now" },
      { id: "closed", label: "Signed", when: "By Friday", detail: "€42,000", state: "next" },
    ],
  },
  stage: { state: "in-progress", label: "Contract drafted" },
  changes: [
    { id: "c1", kind: "changed", title: "The priority moved to the contract", detail: "This morning: reply to all three", at: "12:50", dimension: "priority", highlight: true },
    { id: "c2", kind: "opportunity", title: "Hugo wants to start in March", detail: "A month earlier than planned", at: "12:15", dimension: "insight" },
    { id: "c3", kind: "new", title: "Camille replied", detail: "Atelier Rive wants to sign by Friday", at: "11:40", dimension: "priority", highlight: true },
    { id: "c4", kind: "completed", title: "Both replies went out", detail: "To Camille and Hugo, as scheduled", at: "10:00", dimension: "action", highlight: true },
    { id: "c5", kind: "unresolved", title: "Nora’s quote still waits for you", detail: "Ready since this morning", at: "7:45", dimension: "action", actionId: "quote_nora" },
  ],
  comparedWith: { period: "morning", preparedAt: "2026-10-14T08:00:00" },
};

const evening: DailyBriefing = {
  id: "b_evening",
  period: "evening",
  preparedAt: "2026-10-14T18:30:00",
  headline: "The contract is out. Nora’s quote did not reach her.",
  priority: {
    dimension: "priority",
    severity: "high",
    title: "Nora’s revised quote did not reach her.",
    why: "Her address at Côté Sud Hôtels no longer receives mail.",
    metric: { kind: "message", value: "Address no longer in use", caption: "Returned by her mail server, 14:12", urgency: "high" },
    detail: "€14,800 quote, 15 days without news",
    evidence: ["Returned at 14:12: address no longer in use", "Her phone number is on the deal", "No other contact at Côté Sud Hôtels yet"],
    change: { kind: "new" },
  },
  insight: {
    dimension: "insight",
    title: "Two of three deals moved forward today.",
    why: "This morning, all three were waiting on you.",
    metric: { kind: "money", value: "€63,500", caption: "in deals that moved today" },
    detail: "Camille opened the contract at 16:02",
    evidence: ["Atelier Rive: contract sent, opened at 16:02", "Maison Lenoir: start moved to March", "Côté Sud Hôtels: no contact yet"],
    change: { kind: "changed", was: "Answered deals moved within hours." },
  },
  recommendation: {
    dimension: "recommendation",
    id: "rec_evening",
    title: "Call Nora tomorrow at 9:30.",
    why: "Email no longer reaches her, and she returns calls the same day.",
    metric: { kind: "time", value: "9:30", caption: "tomorrow, free in your calendar" },
    detail: "Syxoria holds the slot. The call is yours.",
    evidence: ["Nora returned your last two calls the same day", "9:30 is free in your calendar tomorrow"],
    outcome: "Her new address, so the quote can go out again.",
    limits: "Syxoria cannot make the call. It only holds the time.",
    change: { kind: "changed", was: "Review the contract this afternoon." },
  },
  action: {
    dimension: "action",
    title: "Four went through today. One was returned.",
    why: "The quote was approved and sent, then bounced.",
    metric: { kind: "progress", value: "4 of 5", caption: "of today’s actions went through", share: 0.8 },
    detail: "A payment reminder is drafted for Monday",
    evidence: ["Replies to Camille and Hugo, contract, deal stages: through", "Nora’s quote: returned at 14:12"],
    outcome: "The quote goes out again once you have her new address.",
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
    {
      id: "timeline_hugo",
      name: "Revised timeline for Maison Lenoir",
      status: "awaiting-approval",
      timing: "Drafted 17:20",
      next: "Sent to Hugo as soon as you approve",
      needsApproval: true,
      note: "A change to a quote always waits for you",
      recommendationId: "rec_midday",
    },
    { id: "hold_call", name: "Hold 9:30 tomorrow for Nora", status: "scheduled", timing: "Tomorrow 9:30", next: "Moves if you book something else", needsApproval: false, recommendationId: "rec_evening" },
    { id: "contract_rive", name: "Contract for Atelier Rive", status: "sent", timing: "Sent 14:10", next: "Camille opened it at 16:02. Signature due Friday", needsApproval: true, recommendationId: "rec_midday" },
    { id: "stages", name: "Update deal stages in HubSpot", status: "completed", timing: "Done 13:24", needsApproval: false, recommendationId: "rec_midday" },
    { id: "reply_camille", name: "Reply to Camille Roy", status: "completed", timing: "Sent 10:00", next: "Camille answered at 11:40", needsApproval: false, recommendationId: "rec_morning" },
    { id: "reply_hugo", name: "Reply to Hugo Lenoir", status: "completed", timing: "Sent 10:00", next: "Hugo answered at 12:15", needsApproval: false, recommendationId: "rec_morning" },
  ],
  followThrough: {
    title: "The contract is with Camille. Nora’s quote did not arrive.",
    steps: [
      { id: "found", label: "Found", when: "8:00", detail: "3 proposals", state: "done" },
      { id: "sent", label: "Sent", when: "10:00", detail: "2 replies", state: "done" },
      { id: "replied", label: "Replied", when: "12:15", detail: "2 of 3", state: "done" },
      { id: "contract", label: "Contract", when: "14:10", detail: "Opened 16:02", state: "done" },
      { id: "quote", label: "Quote", when: "14:12", detail: "Returned", state: "failed" },
      { id: "closed", label: "Signed", when: "By Friday", detail: "€42,000", state: "next" },
    ],
  },
  stage: { state: "completed", label: "Contract sent" },
  changes: [
    { id: "c0", kind: "new", title: "Hugo’s March timeline is drafted", detail: "It waits for your approval", at: "17:20", dimension: "action", actionId: "timeline_hugo" },
    { id: "c1", kind: "new", title: "A payment reminder is ready", detail: "Brasserie Ondine’s invoice is due Monday", at: "17:05", dimension: "action", actionId: "reminder_ondine", highlight: true },
    { id: "c2", kind: "opportunity", title: "Camille opened the contract", detail: "Atelier Rive, signature due Friday", at: "16:02", dimension: "insight", highlight: true },
    { id: "c3", kind: "risk", title: "Nora’s quote was returned", detail: "Her address no longer receives mail", at: "14:12", dimension: "priority", actionId: "quote_nora", highlight: true },
    { id: "c4", kind: "completed", title: "The contract went to Atelier Rive", detail: "Sent as soon as you approved it", at: "14:10", dimension: "action", actionId: "contract_rive" },
    { id: "c5", kind: "decided", title: "You approved the contract and the quote", at: "14:05", dimension: "recommendation" },
  ],
  comparedWith: { period: "midday", preparedAt: "2026-10-14T13:00:00" },
};

export const mockDailyBriefings: DailyBriefing[] = [morning, midday, evening];

/**
 * A brand new user's first briefing has no earlier briefing: its history is what Syxoria did since
 * the tools were connected, a few minutes before.
 */
export const mockFirstDayChanges: BriefingChange[] = [
  { id: "f1", kind: "completed", title: "Replies drafted for all three", detail: "Two go out on their own, one waits for you", at: "7:58", dimension: "action", highlight: true },
  { id: "f2", kind: "risk", title: "Three proposals found waiting", detail: "€78,300 without an answer for ten days or more", at: "7:56", dimension: "priority", highlight: true },
  { id: "f3", kind: "completed", title: "Two years of proposals read", detail: "128 proposals and their replies", at: "7:54", dimension: "insight", highlight: true },
  { id: "f4", kind: "decided", title: "HubSpot and Gmail connected", detail: "Read only. Nothing was changed", at: "7:51" },
];
