/**
 * The assistant's own words (components/dashboard/assistant): Syxoria speaking as a colleague,
 * in the first person. No dashes or hyphenated words in UI copy.
 */
export const assistant = {
  name: "Syxoria",
  role: (company: string) => `Chief of staff, ${company}`,
  since: "With you since 11 October",
  status: {
    available: "Available",
    listening: "Listening",
    thinking: "Looking into it",
    answering: "Answering",
    held: "Actions paused",
  },
  held: "You paused my actions. I keep answering and preparing, and nothing goes out until you resume.",

  opening: {
    brought: "Worth a minute",
    talk: "Talk it through",
    review: "Review",
  },

  threads: {
    title: "Between us",
    newConversation: "New conversation",
    search: "Search our conversations",
    open: "Our conversations",
    close: "Close",
    groups: { now: "Now", needs: "Waiting on you", following: "I’m following up", done: "Talked through" },
    settled: "Talked through",
    none: "No conversation matches.",
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
  slip: { waits: "Waits for your approval", own: "Runs on its own", review: "Review" },
  draft: { label: "Draft", to: "To", subject: "Subject" },

  composer: {
    label: "Your message",
    placeholder: "Ask me, or tell me what to do",
    listening: "I’m listening",
    speak: "Speak to Syxoria",
    stop: "Stop listening",
    send: "Send",
    mention: "Mention a client",
    attach: "Attach a document",
    suggestions: "You could ask",
    micOff: "Microphone access is off for this site.",
    micFailed: "I couldn’t hear you. Try again, or type instead.",
  },

  table: {
    title: "On the table",
    people: "Who it’s about",
    actions: "What we set in motion",
    recalls: "What I remembered",
    coming: "Coming up",
    memory: "Everything I know",
    empty: "Nothing here yet. The people we talk about and what we set in motion will appear here.",
  },

  agreement: {
    title: "How we work together",
    mode: (name: string) => `${name} mode`,
    own: "On my own",
    ask: "Always with you",
    never: "Never",
    change: "Change what I may do",
  },

  previewNote: "Preview: my answers are prepared examples. Nothing is generated or sent.",
};
