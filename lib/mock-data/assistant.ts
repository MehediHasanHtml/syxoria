import type { AssistantSample } from "@/types";

/**
 * The assistant's suggested questions for the demo evening, each with a prepared sample answer
 * taken from the day's briefings (lib/mock-data/briefings.ts). They are shown as samples: the
 * assistant is not connected to an AI yet. The UI only reads this through services/assistant.ts.
 */
export const mockAssistantSamples: AssistantSample[] = [
  {
    id: "q_today",
    question: "What needs my attention today?",
    answer:
      "Two things. Nora’s revised quote did not reach her: her address no longer receives mail, and 9:30 tomorrow is held for you to call her. And Hugo’s March timeline is drafted and waits for your approval.",
    references: [
      { label: "Evening briefing, 18:30", href: "/app/briefings?briefing=b_evening" },
      { label: "Actions & Approvals", href: "/app/actions" },
    ],
    actionId: "timeline_hugo",
  },
  {
    id: "q_nora",
    question: "Why did Nora’s quote fail?",
    answer:
      "Her mail server returned it at 14:12: the address at Côté Sud Hôtels no longer receives mail. Nothing is wrong with the quote itself. A call is the quickest way to a new address, then the quote can go out again.",
    references: [{ label: "Evening briefing, the priority", href: "/app/briefings?briefing=b_evening" }],
    actionId: "quote_nora",
  },
  {
    id: "q_rive",
    question: "Where does Atelier Rive stand?",
    answer:
      "The contract went out at 14:10 and Camille opened it at 16:02. She asked to sign by Friday, so two days remain. If it is still unsigned on Thursday, I suggest a short check in.",
    references: [{ label: "Evening briefing, follow through", href: "/app/briefings?briefing=b_evening" }],
    actionId: "contract_rive",
  },
];
