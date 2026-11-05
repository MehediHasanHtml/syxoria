/**
 * The assistant's own words (components/dashboard/assistant): Syxoria speaking as a colleague,
 * in the first person. No dashes or hyphenated words in UI copy.
 */
export const assistant = {
  name: "Syxoria",
  status: {
    listening: "Listening",
    thinking: "Looking into it",
    answering: "Answering",
    held: "Actions paused",
  },
  held: "I keep answering and preparing. Nothing goes out until you resume.",

  opening: {
    brought: "Worth a minute",
    talk: "Talk it through",
  },

  threads: {
    title: "Conversations",
    open: "Conversations",
    show: "Show conversations",
    hide: "Hide conversations",
    newConversation: "New conversation",
    search: "Search",
    close: "Close",
    groups: { Today: "Today", Yesterday: "Yesterday", "Previous 7 days": "Earlier this week" },
    now: "Now",
    waits: "Waits for you",
    none: "No conversation matches.",
  },

  turn: {
    you: "You",
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
    suggestions: "You could ask",
    micOff: "Microphone access is off for this site.",
    micFailed: "I couldn’t hear you. Try again, or type instead.",
  },

  /** How it works, said once and quietly, at the foot of the conversations */
  mandate: (mode: string) => `${mode} mode. Routine replies, records and calendar holds on my own. Quotes, contracts, money and campaigns always wait for you.`,
  mandateLink: "What I may do",
  previewNote: "Preview: my answers are prepared examples. Nothing is generated or sent.",
};
