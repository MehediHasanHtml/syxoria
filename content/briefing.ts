import { spellNumber } from "@/lib/format";
import type { AutonomyLevel, BriefingActionStatus, BriefingChangeKind, BriefingDimension, BriefingPeriod, BriefingSeverity, BriefingStageState, BriefingStepChange } from "@/types";

/** A small count as a word, opening a sentence ("Three proposals") */
const spell = (n: number) => spellNumber(n).replace(/^./, (c) => c.toUpperCase());

/**
 * The executive briefing's own words (components/briefing). Business content comes from the
 * service; this is only how the screen names things. No dashes or hyphenated words in UI copy.
 */
export const dailyBriefing = {
  eyebrow: "Executive briefing",
  /** The greeting follows the briefing, not the clock: "Good evening" opens the evening one */
  greeting: { morning: "Good morning", midday: "Good afternoon", evening: "Good evening" } satisfies Record<BriefingPeriod, string>,
  follow: {
    title: "Follow through",
    all: "All actions",
    thread: "Back to the thread",
    states: { done: "done", now: "under way", next: "to come", failed: "did not go through" },
  },
  autonomy: {
    title: "Autonomy mode",
    /** What each mode lets Syxoria do */
    promises: {
      guided: "Prepares everything. Nothing happens until you approve.",
      assisted: "Handles the routine. Asks you before it sends.",
      autonomous: "Acts on its own within your rules.",
    } satisfies Record<AutonomyLevel, string>,
    /** What never changes with the mode */
    limit: "Quotes, contracts and money always wait for you.",
  },
  /** When each briefing of the day is prepared */
  times: { morning: "8:00", midday: "13:00", evening: "18:30" } satisfies Record<BriefingPeriod, string>,
  upcoming: (time: string) => `Prepared at ${time}`,
  /** The first briefing, worded from what the onboarding found (lib/onboarding/first-daily-briefing.ts) */
  first: {
    waiting: "waiting on your reply",
    largest: (company: string, value: string) => `Largest: ${company}, ${value}`,
    quiet: (company: string, value: string, days: number) => `${company}, ${value}: ${days} days without an answer`,
    slips: (threshold: number) => `close after ${threshold} quiet days`,
    inTime: (rate: string) => `${rate} when they hear back in time`,
    answered: (threshold: number, rate: string) => `Answered within ${threshold} days: ${rate} closed`,
    late: (rate: string) => `Left waiting longer: ${rate} closed`,
    proposals: (n: number) => `${n} ${n === 1 ? "proposal" : "proposals"}`,
    pending: "Pending",
    reply: (contact: string) => `Reply to ${contact}`,
    draft: (contact: string) => `Draft a reply to ${contact}`,
    keep: "Keep these deals at the top of your day",
    caption: { handle: "replies scheduled", prepare: "replies for your approval", offer: "replies ready to draft", list: "deals kept in view" },
    logged: "Their answer is logged on the deal",
    afterApproval: "Sent as soon as you approve",
    onWord: "Drafted once you say so",
    outcome: "Each client hears back before the deal goes cold.",
    wroteLast: (contact: string, days: number) => `${contact} wrote last, ${days} days ago`,
    history: "Your own history: it says what usually happens, not what will.",
    unmeasured: "Not measured yet: too few closed deals to put a figure on it.",
    average: "Your past average, not a promise for these deals.",
    /** Where the thread stands, on the day's rail */
    stage: (n: number) => (n === 1 ? "One proposal waiting" : `${spell(n)} proposals waiting`),
    nothing: "Nothing pressing",
    /** What Syxoria did since the tools were connected: the first briefing's history */
    since: {
      mandate: "Your mandate is set",
      mode: (name: string, promise: string) => `${name}: ${promise}`,
      found: (n: number) => (n === 1 ? "One proposal found waiting" : `${spell(n)} proposals found waiting`),
      foundDetail: (worth: string) => `${worth} without an answer`,
      read: "Your history read",
      connected: (names: string[]) => `${names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0]} connected`,
      readOnly: "Read only. Nothing was changed",
    },
  },
  periods: { morning: "Morning", midday: "Afternoon", evening: "Evening" } satisfies Record<BriefingPeriod, string>,
  periodsLabel: "Today’s briefings",
  /** On the first day, the periods without a briefing yet open an example of a usual day */
  example: "Example",
  exampleNote: "An example of a usual day. Your own briefing for this time of day starts tomorrow.",
  latest: "Latest",
  /** The day's briefings, and under them where the day's main thread stood at each one */
  day: {
    upcoming: "Upcoming",
    stages: { identified: "Identified", "in-progress": "In progress", completed: "Completed", blocked: "On hold" } satisfies Record<BriefingStageState, string>,
    /** The follow through's key: the steps that moved since the previous briefing */
    moved: (since: string) => `Moved since ${since}`,
    briefing: (period: string, time: string) => `${period} briefing, ${time}`,
    /** The briefing in view, on the day's choice */
    name: (period: string) => `${period} briefing`,
  },
  dimensions: { priority: "Priority", insight: "Insight", recommendation: "Recommendation", action: "Action" } satisfies Record<BriefingDimension, string>,
  /** The question each dimension answers: the centre's heading, so each step says what it is for */
  questions: {
    priority: "What needs attention now",
    insight: "What Syxoria discovered",
    recommendation: "What should happen next",
    action: "What has been prepared or done",
  } satisfies Record<BriefingDimension, string>,
  /** The line of reasoning, in order: each dimension says which it follows from and leads to */
  chain: ["priority", "insight", "recommendation", "action"] as BriefingDimension[],
  severity: { critical: "Critical", high: "High", watch: "Watch", routine: "Routine" } satisfies Record<BriefingSeverity, string>,
  stepChange: { new: "New", unchanged: "Unchanged", changed: "Changed", resolved: "Resolved" } satisfies Record<BriefingStepChange["kind"], string>,
  was: "Before",
  why: "Why",
  /** The reasoning behind a step, under "Why" */
  reasoning: {
    title: (dimension: string) => `Why this ${dimension.toLowerCase()}`,
    basis: "Based on",
    follows: (dimension: string) => `Follows from the ${dimension.toLowerCase()}`,
    outcome: "Meant to achieve",
    limits: "Worth knowing",
    close: "Close the explanation",
  },
  /** What the centre's figures say beside their value */
  figure: {
    from: (was: string) => `from ${was}`,
    due: (date: string) => `Due ${date}`,
    up: "up",
    down: "down",
  },
  changes: {
    title: "Since your last briefing",
    /** The very first briefing: what Syxoria did since the tools were connected */
    sinceConnected: "Since you connected",
    /** Which briefing the updates are counted from */
    against: (period: string, time: string, yesterday: boolean) => (yesterday ? `Yesterday, ${time}` : `${period}, ${time}`),
    first: "Your first briefing",
    firstNote: "It sets the baseline. From your next briefing, this shows what changed in between.",
    more: "View full history",
    /** The full history: the day's updates, briefing by briefing */
    history: "Today’s history",
    group: (period: string, time: string) => `${period} briefing · ${time}`,
    count: (n: number) => `${n} ${n === 1 ? "update" : "updates"}`,
    close: "Close the history",
    kinds: {
      new: "New",
      unresolved: "Still open",
      decided: "Decided",
      changed: "Changed",
      "in-progress": "Under way",
      completed: "Completed",
      risk: "Risk",
      opportunity: "Opportunity",
    } satisfies Record<BriefingChangeKind, string>,
  },
  actions: {
    title: "What Syxoria is doing",
    statuses: {
      suggested: "Suggested",
      drafted: "Drafted",
      "awaiting-approval": "Awaiting approval",
      approved: "Approved",
      scheduled: "Scheduled",
      "in-progress": "In progress",
      sent: "Sent",
      completed: "Completed",
      unsuccessful: "Unsuccessful",
    } satisfies Record<BriefingActionStatus, string>,
    /** What each status means, and what it does not: the same everywhere an action appears */
    meanings: {
      suggested: "Recommended. Nothing is prepared yet.",
      drafted: "Prepared by Syxoria. Not shown to you for approval yet.",
      "awaiting-approval": "Prepared and waiting for your decision. Nothing has gone out.",
      approved: "You said yes. It has not gone out yet.",
      scheduled: "Set for a time. Not running yet.",
      "in-progress": "Being carried out now.",
      sent: "Gone out. Its outcome is still open.",
      completed: "Done, with its result recorded.",
      unsuccessful: "It did not go through. It stays here until it is resolved.",
    } satisfies Record<BriefingActionStatus, string>,
    /** The panel's summary of where things stand, most pressing first */
    counts: {
      unsuccessful: (n: number) => `${n} unsuccessful`,
      "awaiting-approval": (n: number) => `${n} ${n === 1 ? "needs" : "need"} you`,
      approved: (n: number) => `${n} approved`,
      suggested: (n: number) => `${n} suggested`,
      drafted: (n: number) => `${n} drafted`,
      scheduled: (n: number) => `${n} scheduled`,
      "in-progress": (n: number) => `${n} in progress`,
      sent: (n: number) => `${n} sent`,
      completed: (n: number) => `${n} completed`,
    } satisfies Record<BriefingActionStatus, (n: number) => string>,
    needsYou: "Needs you",
    next: "Next",
    carriesOut: "Carries out",
    earlier: "an earlier recommendation",
    summary: (failed: number, waiting: number, running: number) =>
      [failed && `${failed} unsuccessful`, waiting && `${waiting} ${waiting === 1 ? "needs" : "need"} you`, running && `${running} under way`].filter(Boolean).join(" · ") || "Nothing waiting on you",
    mode: (name: string) => `${name} mode`,
    /** Approving happens in the workspace: the preview says so rather than pretending */
    approveElsewhere: "You approve it in the workspace, not in this preview.",
  },
};

/** "8:00" from an ISO date and time, pinned so server and browser agree */
export const briefingTime = (iso: string) => iso.slice(11, 16).replace(/^0/, "");

/** How the briefing a step is compared with is named in passing: "8:00", or "yesterday 18:30" */
export const sinceOf = (briefing: { preparedAt: string; comparedWith: { preparedAt: string } | null }) => {
  const c = briefing.comparedWith;
  if (!c) return null;
  const time = briefingTime(c.preparedAt);
  return c.preparedAt.slice(0, 10) === briefing.preparedAt.slice(0, 10) ? time : `yesterday ${time}`;
};
