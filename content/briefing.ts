import type { BriefingActionStatus, BriefingChangeKind, BriefingDimension, BriefingPeriod, BriefingSeverity, BriefingStepChange } from "@/types";

/**
 * The executive briefing's own words (components/briefing). Business content comes from the
 * service; this is only how the screen names things. No dashes or hyphenated words in UI copy.
 */
export const dailyBriefing = {
  eyebrow: "Executive briefing",
  periods: { morning: "Morning", midday: "Midday", evening: "Evening" } satisfies Record<BriefingPeriod, string>,
  periodsLabel: "Today’s briefings",
  latest: "Latest",
  dimensions: { priority: "Priority", insight: "Insight", recommendation: "Recommendation", action: "Action" } satisfies Record<BriefingDimension, string>,
  /** The question each dimension answers, for screen readers and the reasoning view */
  questions: {
    priority: "What needs your attention",
    insight: "What Syxoria found, and why it matters",
    recommendation: "What to do next",
    action: "What Syxoria is doing about it",
  } satisfies Record<BriefingDimension, string>,
  /** The line of reasoning, in order: each dimension says which it follows from and leads to */
  chain: ["priority", "insight", "recommendation", "action"] as BriefingDimension[],
  severity: { critical: "Critical", high: "High", watch: "Watch", routine: "Routine" } satisfies Record<BriefingSeverity, string>,
  stepChange: { new: "New", unchanged: "Unchanged", changed: "Changed", resolved: "Resolved" } satisfies Record<BriefingStepChange["kind"], string>,
  was: "Before",
  why: "Why",
  whyClose: "Back",
  whyTitle: "Why it matters",
  follows: "Follows from",
  leads: "Leads to",
  changes: {
    title: (since: string) => `Since ${since}`,
    first: "Your first briefing.",
    firstNote: "From the next one, this shows what changed in between.",
    more: (n: number) => `Show ${n} more`,
    less: "Show less",
    kinds: {
      new: "New",
      unresolved: "Still open",
      decided: "Decided",
      changed: "Changed",
      "in-progress": "Under way",
      completed: "Done",
      risk: "Risk",
      opportunity: "Opportunity",
    } satisfies Record<BriefingChangeKind, string>,
  },
  actions: {
    title: "What Syxoria is doing",
    statuses: {
      drafted: "Drafted",
      "awaiting-approval": "Awaiting approval",
      scheduled: "Scheduled",
      "in-progress": "In progress",
      completed: "Completed",
      unsuccessful: "Unsuccessful",
    } satisfies Record<BriefingActionStatus, string>,
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
