/**
 * The workspace areas still to come, as the planned pages describe them: what each will hold, in
 * which phase it arrives, and where its information already lives today. Phases follow the
 * dashboard brief: 2 briefings and assistant, 3 business operations, 4 supporting areas.
 * No dashes or hyphenated words in UI copy.
 */

export type PlannedArea = {
  title: string;
  phase: 2 | 3 | 4;
  intro: string;
  /** What the area will let the owner do */
  holds: string[];
  /** Where the same information can already be seen */
  today?: { label: string; href: string }[];
};

export const areas = {
  actions: {
    title: "Actions & Approvals",
    phase: 3,
    intro: "Everything Syxoria suggests, prepares, waits on or carries out, in one place you control.",
    holds: [
      "Review a proposed action with its context and the reasoning behind it",
      "Approve or reject it, with what each decision will set in motion",
      "Follow it while it runs, and read its result",
      "Understand why an action failed, and what it needs from you",
    ],
    today: [
      { label: "Today’s briefing, All actions", href: "/app/briefings" },
      { label: "Waiting for you, on Home", href: "/app" },
    ],
  },
  clients: {
    title: "Clients & Prospects",
    phase: 3,
    intro: "The relationships that need you: who is waiting, who is promising, who has gone quiet.",
    holds: [
      "Important customer developments and ongoing discussions",
      "Overdue follow ups, and what Syxoria suggests saying",
      "Promising opportunities and unresolved issues",
      "One page per relationship, with what to do next",
    ],
    today: [{ label: "Alerts and opportunities, on Home", href: "/app" }],
  },
  documents: {
    title: "Documents & Data",
    phase: 4,
    intro: "What Syxoria can read about your business, where it comes from, and how current it is.",
    holds: [
      "Your documents, by category, with search",
      "The business information Syxoria has learned",
      "Every data source and whether it is available",
      "Clear states for what is uploaded, read or still missing",
    ],
    today: [{ label: "Integrations", href: "/app/integrations" }],
  },
  history: {
    title: "History & Reports",
    phase: 4,
    intro: "A trustworthy record of what happened, why, what was decided and what came of it.",
    holds: [
      "Every recommendation, the decision taken and the action that followed",
      "Results, where they are known",
      "Periodic reports and performance summaries",
    ],
    today: [{ label: "Today’s history, in the briefing", href: "/app/briefings" }],
  },
  integrations: {
    title: "Integrations",
    phase: 4,
    intro: "The tools Syxoria reads from and acts in: email, calendars, storage, CRM.",
    holds: [
      "Each supported tool and its state: connected, not connected, needs attention",
      "What Syxoria may read and do in each one",
      "Setup, renewal and disconnection",
    ],
    today: [{ label: "Settings & Autonomy", href: "/app/settings" }],
  },
  assistant: {
    title: "Syxoria Assistant",
    phase: 2,
    intro: "Ask about your business, explore a recommendation, or give an instruction.",
    holds: [],
  },
} satisfies Record<string, PlannedArea>;

/** Business Management: one area, four sections */
export const business = {
  title: "Business Management",
  phase: 3 as const,
  intro: "How the company performs, section by section, with what Syxoria recommends in each.",
  sections: {
    sales: {
      label: "Sales",
      holds: ["Sales performance", "Opportunities and the pipeline", "Trends and risks", "Recommended sales actions"],
    },
    marketing: {
      label: "Marketing",
      holds: ["Marketing performance", "Campaigns, where your tools report them", "Developments and opportunities", "Recommended improvements"],
    },
    finance: {
      label: "Finance",
      holds: ["Revenue and expenses, where available", "Outstanding invoices", "Financial risks and opportunities", "Deadlines and recommended actions"],
    },
    goals: {
      label: "Goals & KPIs",
      holds: ["Your objectives and progress towards them", "The indicators that matter to you", "Deviations from targets", "Recommended corrective actions"],
    },
  },
};

export type BusinessSection = keyof typeof business.sections;
export const isBusinessSection = (v: string): v is BusinessSection => v in business.sections;

export const planned = {
  phase: (n: number) => `Arrives in phase ${n}`,
  holds: "What it will hold",
  today: "Already in the workspace",
  preview: "From today’s briefing",
};
