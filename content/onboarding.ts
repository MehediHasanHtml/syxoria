import type { KnowledgeKind, OnboardingStage, PermissionMode, PermissionRule, SourceCategory } from "@/types";

/**
 * Onboarding copy — the moment the system meets a company. The voice is the system's own:
 * calm, specific, never "AI magic". Titles follow the brand's pattern (a light lead, then an
 * italic serif accent).
 */

/**
 * What Syxoria has become, marked as a quiet line beside the Core once the account exists.
 * Each word says exactly what has happened — "Identified" before anything is connected.
 */
export const milestones = [
  { id: "identified", word: "Identified" },
  { id: "connected", word: "Connected" },
  { id: "understood", word: "Understood" },
  { id: "prioritized", word: "Prioritized" },
  { id: "mandated", word: "Mandated" },
  { id: "ready", word: "Ready" },
] as const;
export type MilestoneId = (typeof milestones)[number]["id"];

/** Shown to screen readers: where we are */
export const stageNames: Record<OnboardingStage, string> = {
  account: "Your account",
  company: "Your company",
  connections: "Your tools",
  syncing: "Understanding",
  analysis: "Priorities",
  autonomy: "Mandate",
  briefing: "First briefing",
  complete: "Workspace",
};

export const account = {
  create: { lead: "Let’s get your", accent: "workspace ready.", body: "An email and a password. Syxoria does the rest." },
  signin: { lead: "Welcome", accent: "back.", body: "Sign in and pick up where you left off." },
  reset: { lead: "Reset your", accent: "password.", body: "We’ll email you a secure link." },
  sent: { lead: "Check your", accent: "inbox.", body: "If an account exists for this address, a reset link is on its way." },
  passwordRules: [
    { id: "length", label: "10+ characters", test: (v: string) => v.length >= 10 },
    { id: "digit", label: "A number", test: (v: string) => /\d/.test(v) },
    { id: "upper", label: "An upper-case letter", test: (v: string) => /[A-Z]/.test(v) },
  ],
  /** Demo only — shown in the demo note, never part of the screen's design */
  demo: [
    "Sign in with any password of 8+ characters.",
    "mael@northfield.co signs in to an existing workspace.",
    "taken@… shows an address already in use.",
  ],
};

export const company = {
  ask: { lead: "Which company will Syxoria", accent: "work for?" },
  body: "Your SIREN or SIRET is enough. Syxoria finds the rest in the national register.",
  label: "SIREN or SIRET",
  demo: "Use the demo company",
  /** The search, as it happens: what each moment really is */
  search: { reading: "Reading the number", register: "Searching the national register", identified: "Company identified" },
  found: { lead: "We found", accent: "your company." },
  foundBody: "Syxoria found this in the national register. Check it’s you.",
  verified: "Verified in the national register",
  notFound: "This number isn’t in the national register yet. Check the digits, or describe your company yourself.",
  manual: { lead: "Tell us about", accent: "your company." },
  manualBody: "Just the essentials — Syxoria will learn the rest from your data.",
  correct: { lead: "What should", accent: "we correct?" },
  correctBody: "Only what the register can’t vouch for can be changed here.",
  headcountBands: ["1 to 5 employees", "6 to 9 employees", "10 to 19 employees", "20 to 49 employees", "50 to 99 employees", "100+ employees"],
};

export const connections = {
  ask: { lead: "Where does your company’s", accent: "work live?" },
  body: "Connect the tools you already use. Syxoria only reads — nothing is changed, nothing is sent.",
  recommended: "Recommended for",
  more: "Add another tool",
  moreTitle: "More integrations",
  empty: "Connect one tool so Syxoria has something to learn from.",
  readOnly: "Read-only. Syxoria never changes or sends anything from your tools, and you can disconnect at any time.",
  categories: { email: "Email", crm: "Clients & deals", documents: "Documents", finance: "Finance", files: "Files" } satisfies Record<SourceCategory, string>,
  states: { available: "Available", connecting: "Connecting", connected: "Connected", error: "Not connected", reconnect: "Needs reconnecting" },
};

export const knowledgeLabels: Record<KnowledgeKind, string> = {
  clients: "Clients",
  conversations: "Conversations",
  quotes: "Quotes",
  opportunities: "Opportunities",
  invoices: "Invoices",
  documents: "Documents",
};

export const understanding = {
  understood: { lead: "Syxoria now", accent: "understands" },
};

export const analysis = {
  title: { lead: "What deserves", accent: "your attention." },
  intro: "Nothing to configure — Syxoria identified these from your activity.",
};

export const autonomy = {
  title: { lead: "How much should Syxoria", accent: "do on its own?" },
  promise: "You set the boundaries. Syxoria works within them.",
  auto: "Does on its own",
  ask: "Asks you first",
  never: "Never, whatever you choose",
  adjust: "Adjust action by action",
  boundary: "Your boundary",
  modes: { auto: "Automatic", ask: "Ask me", off: "Off" } satisfies Record<PermissionMode, string>,
  groups: { understand: "Understand", prepare: "Prepare", act: "Act" } satisfies Record<PermissionRule["group"], string>,
};

export const briefing = {
  /** The short moment before the briefing: what Syxoria now holds */
  prelude: ["I understand your business.", "I know your priorities.", "I know how you want me to work."],
  ready: "I’m ready.",
  lead: "Here’s what matters",
  accent: "today.",
  labels: { priority: "Priority", insight: "Insight", recommendation: "Recommendation", action: "Action" },
  enter: "Enter Syxoria",
};
