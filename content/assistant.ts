import type { ActivityLane, ActivityState } from "@/types/workspace";

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
/** A small count said in words, as Syxoria would say it ("five things") */
const say = (n: number) => WORDS[n] ?? String(n);

/**
 * The assistant's own words (components/dashboard/assistant): Syxoria at work for the company,
 * speaking in the first person. No dashes or hyphenated words in UI copy.
 */
export const assistant = {
  name: "Syxoria",
  eyebrow: (date: string, now: string) => `Syxoria at work · ${date}, ${now}`,

  /** What it says first, from what its day holds */
  statement: {
    watching: (n: number) => `I’m watching ${say(n)} ${n === 1 ? "thing" : "things"} for you`,
    deciding: (n: number) => (n === 0 ? "and nothing waits for you." : n === 1 ? "and one decision is yours." : `and ${say(n)} decisions are yours.`),
    oldest: (at: string) => `The oldest has waited since ${at}.`,
    held: "My actions are paused. I keep watching and analysing, and nothing goes out until you resume.",
  },

  now: {
    label: "Right now",
    at: (t: string) => `Now · ${t}`,
    next: "Next",
    held: "Paused by you",
    paused: "Paused",
  },

  lanes: {
    monitoring: { name: "Monitoring", sub: (n: number) => `${n} ongoing` },
    analysing: { name: "Analysing", sub: (n: number) => `${n} today` },
    deciding: { name: "Deciding", sub: (n: number) => (n ? `${n} for you` : "Nothing for you") },
    doing: { name: "Doing", sub: (n: number) => `${n} done today` },
  } satisfies Record<ActivityLane, { name: string; sub: (n: number) => string }>,
  exchanges: { name: "Exchanges", all: "All exchanges" },
  states: {
    ongoing: "Ongoing",
    done: "Done",
    waiting: "Waiting for you",
    failed: "Did not go through",
    ahead: "Planned",
  } satisfies Record<ActivityState, string>,
  decidedBy: { you: "Your decision", syxoria: "Decided by Syxoria, within your rules" },
  tomorrow: (n: number) => `${n} tomorrow`,
  since: (when: string) => `Since ${when}`,
  until: (when: string) => `Until ${when.charAt(0).toLowerCase()}${when.slice(1)}`,

  desk: {
    waiting: "Waiting for you",
    waited: (since: string) => `Since ${since}`,
    nothingWaits: "Nothing waits for you.",
    ahead: "Ahead",
    tonight: "Tonight",
    tomorrow: "Tomorrow",
    mandate: (mode: string) => `${mode} mode`,
    mandateLine: "Routine replies, records and calendar holds on my own. Anything that speaks for you in a new way, money, contracts and campaigns always wait for you.",
    mandateLink: "What I may do",
    back: "Back to my day",
    next: "What I’ll do next",
    ask: "Ask about this",
    exchange: "Our exchange about it",
    client: "Open the client",
    open: "Open",
    review: "Review",
    held: "Paused, like everything I do on my own",
  },

  history: {
    title: "Our exchanges",
    groups: { Today: "Today", Yesterday: "Yesterday", "Previous 7 days": "Earlier this week" },
    now: "Now",
  },

  turn: {
    you: "You",
    prepared: "Prepared example",
    notYet: "Not connected yet",
  },
  notYet:
    "I can’t answer that one yet. In this preview I only know the answers to the questions I suggest. Once I’m connected, I’ll answer anything from your tools and show you where it comes from.",
  reading: "Reading",
  writing: "Putting it in words",
  howIKnow: "How I know",
  slip: { waits: "Waits for your approval", approved: "Approved by you", own: "Runs on its own", review: "Review" },
  draft: { label: "Draft", to: "To", subject: "Subject" },

  composer: {
    label: "Your message to Syxoria",
    placeholder: "Ask, or tell me what to do",
    listening: "I’m listening",
    speak: "Speak to Syxoria",
    stop: "Stop listening",
    send: "Send",
    in: "In",
    leave: "Start a new exchange",
    try: "Try",
    micOff: "Microphone access is off for this site.",
    micFailed: "I couldn’t hear you. Try again, or type instead.",
  },

  exchange: "Exchange",
  day: "Syxoria’s day",
  previewNote: "Preview: what I say is prepared for this demo. Nothing is generated or sent.",
};
