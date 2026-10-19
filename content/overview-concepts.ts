import { overviewCopy } from "./overview";

/**
 * Copy for the two Executive Overview concepts (/concept/overview): the workspace overview's own
 * lines, plus the concepts' navigation and review strip. No dashes, no hyphenated words.
 */
export const overviewConcepts = {
  ...overviewCopy,
  /** The six spaces of the simplified navigation */
  spaces: {
    overview: { label: "Overview", full: "Executive Overview" },
    business: { label: "Business", full: "Business Management" },
    assistant: { label: "Assistant", full: "Syxoria Assistant" },
    actions: { label: "Actions", full: "Actions & Approvals" },
    workspace: { label: "Workspace", full: "Workspace & History" },
    settings: { label: "Settings", full: "Integrations & Settings" },
  },
  review: {
    label: "Design exploration",
    a: "Concept A",
    aName: "Executive Command Center",
    b: "Concept B",
    bName: "Living Intelligence",
    notes: "Review notes",
    first: "New user view",
    usual: "Usual day view",
    simulated: "Preview. Approvals and holds are simulated in this browser, nothing is sent.",
  },
} as const;
