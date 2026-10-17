import type { HomeSignal } from "@/types";

/**
 * The workspace home's own words (components/dashboard/home). Business content comes from the
 * service; the briefing's words (statuses, periods, greetings) come from content/briefing.ts so
 * both screens say the same thing. No dashes or hyphenated words in UI copy.
 */
export const overview = {
  briefing: (period: string, time: string) => `${period} briefing, ${time}`,
  since: (n: number, period: string) => `${n} ${n === 1 ? "update" : "updates"} since your ${period.toLowerCase()} briefing`,
  openBriefing: "Open today’s briefing",
  figures: "Key figures",
  priority: {
    title: "Today’s priority",
    since: (time: string) => `Since ${time}`,
    next: "Recommended next step",
    outcome: "Meant to achieve",
    open: "Open in the briefing",
    why: "See the reasoning",
  },
  approvals: {
    title: "Waiting for you",
    count: (n: number) => (n === 1 ? "waits for your approval" : "wait for your approval"),
    none: "Nothing waits for your approval right now.",
    review: "Review",
    drafted: "Also prepared",
    attention: "Needs attention",
    open: "Open Actions & Approvals",
    /** Approving happens in Actions & Approvals: the home only says what waits */
    where: "Nothing is sent until you approve it.",
  },
  signals: {
    title: "Alerts and opportunities",
    kinds: { risk: "Risk", opportunity: "Opportunity", deadline: "Deadline", decline: "Decline" } satisfies Record<HomeSignal["kind"], string>,
    due: (when: string) => `Due ${when}`,
  },
  recommendations: {
    title: "Recommended next",
    suggested: "Suggested",
    outcome: "Meant to achieve",
  },
  activity: {
    title: "Recent activity",
    all: "View full history",
  },
};
