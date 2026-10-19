/**
 * Copy for the Executive Overview (components/dashboard/overview), in Syxoria's own voice. The
 * concept pages (/concept/overview) add their own lines in content/overview-concepts.ts.
 * No dashes, no hyphenated words, no decorative numbers.
 */
export const overviewCopy = {
  /** The five questions every screen answers, in the order the owner asks them */
  questions: {
    matters: "What matters now",
    why: "Why it matters",
    recommend: "What I recommend",
    can: "What I can do",
    done: "What is already done",
  },
  why: { open: "Why?", close: "Close", basis: "What it rests on", outcome: "What it should achieve", limits: "Worth knowing" },
  briefing: {
    open: "Open the full briefing",
    title: "Executive briefing",
    earlier: "Earlier days",
    latest: "Latest",
    example: "Example",
    newSince: (time: string) => `New since ${time}`,
    changedSince: (time: string) => `Changed since ${time}`,
    updates: (n: number, since: string) => (n === 1 ? `One update since ${since}` : `${n} updates since ${since}`),
    firstDay: "Your first briefing. Nothing earlier to compare with yet.",
  },
  approvals: {
    title: "Waiting on you",
    none: "Nothing waits for your approval.",
    review: "Review",
    approve: "Approve",
    decline: "Not now",
    edit: "Edit in Actions",
    approved: "Approved in this preview. Nothing was sent.",
    declined: "Set aside in this preview. Nothing was sent.",
    rule: "Runs under",
    sources: "Sources",
    preview: "What Syxoria will send",
    why: "Why it exists",
  },
  agenda: { title: "Coming up" },
  signals: { title: "Also on your desk" },
  figures: { title: "The business in figures", all: "Open Business" },
  done: { title: "What is already done", today: "Today" },
  ask: {
    placeholder: "Ask Syxoria about your business",
    about: "Ask about this",
    send: "Ask",
  },
  workflow: { pause: "Pause this workflow", paused: "Workflow paused", resume: "Resume" },
} as const;
