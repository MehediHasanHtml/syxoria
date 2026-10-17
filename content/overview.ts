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
  /** Syxoria itself, in the header: what it is doing right now */
  presence: {
    mode: (name: string) => `${name} mode`,
    running: "Watching your tools and acting on its own within your rules.",
    partly: "Acting on its own, except what you paused.",
    suspended: "Observing and preparing only. Nothing starts on its own.",
    next: (name: string) => `Next on its own: ${name}`,
    held: (n: number) => (n === 1 ? "1 action is held" : `${n} actions are held`),
    resume: "Review and resume",
  },
  figures: "Key figures",
  /** Quick access to the assistant */
  ask: {
    label: "Ask Syxoria",
    placeholder: "Ask Syxoria about your business",
    prompts: ["What needs my attention today?", "Where does Atelier Rive stand?", "Why did Nora’s quote fail?"],
  },
  motion: { title: "In motion", all: "All actions" },
  agenda: {
    title: "Coming up",
    all: "Clients and meetings",
    kinds: { meeting: "Meeting", call: "Call", deadline: "Deadline", "follow-up": "Follow up", action: "Scheduled" },
  },
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
