import type { FindingTone, KnowledgeKind, OnboardingStage, PermissionMode, PermissionRule, SourceCategory } from "@/types";

/**
 * Onboarding copy — the moment the system meets a company. The voice is the
 * system's own: calm, specific, never "AI magic". Titles follow the brand's
 * pattern (a light lead, then an italic serif accent).
 */

/**
 * What the system is, at each moment — shown beside the Core in the top bar.
 * Unknown → Known → Connected → Understood → Prepared → Trusted → Ready.
 */
export const systemStates: { id: string; word: string; reached: (s: Reached) => boolean }[] = [
  { id: "unknown", word: "Unknown", reached: () => true },
  { id: "known", word: "Known", reached: (s) => s.company },
  { id: "connected", word: "Connected", reached: (s) => s.sources > 0 },
  { id: "understood", word: "Understood", reached: (s) => s.understood },
  { id: "prepared", word: "Prepared", reached: (s) => s.stage === "autonomy" || s.mandate },
  { id: "trusted", word: "Trusted", reached: (s) => s.mandate },
  { id: "ready", word: "Ready", reached: (s) => s.stage === "complete" },
];
export type Reached = { stage: OnboardingStage; company: boolean; sources: number; understood: boolean; mandate: boolean };

/** Shown to screen readers (and in the top bar on hover): where we are */
export const stageNames: Record<OnboardingStage, string> = {
  account: "Your account",
  company: "Your company",
  connections: "Your sources",
  syncing: "Understanding",
  analysis: "First analysis",
  autonomy: "Autonomy",
  briefing: "First briefing",
  complete: "Workspace",
};

export const account = {
  eyebrow: "Syxoria",
  create: { lead: "Let’s get your", accent: "workspace ready.", body: "An email and a password. Syxoria does the rest." },
  signin: { lead: "Welcome", accent: "back.", body: "Sign in and pick up where you left off." },
  reset: { lead: "Reset your", accent: "password.", body: "We’ll email you a secure link." },
  sent: { lead: "Check your", accent: "inbox.", body: "If an account exists for this address, a reset link is on its way." },
  passwordRules: [
    { id: "length", label: "10+ characters", test: (v: string) => v.length >= 10 },
    { id: "digit", label: "A number", test: (v: string) => /\d/.test(v) },
    { id: "upper", label: "An upper-case letter", test: (v: string) => /[A-Z]/.test(v) },
  ],
  signinHint: "Demo: any password of 8+ characters. A teammate’s email (mael@northfield.co) goes straight to the workspace.",
  takenHint: "Tip: taken@… shows an address already in use.",
};

export const company = {
  ask: { lead: "Which company will Syxoria", accent: "work for?" },
  body: "Your SIREN or SIRET is enough. We’ll retrieve the rest from the national register.",
  label: "SIREN or SIRET",
  demo: "Use the demo company",
  lookupSteps: ["Reading the number", "Searching the national register", "Retrieving your company"],
  found: { lead: "We found", accent: "your company." },
  foundBody: "Check that this is right. You can correct anything.",
  notFound: "This number isn’t in the national register yet. Check the digits, or tell us about your company yourself.",
  manual: { lead: "Tell us about", accent: "your company." },
  manualBody: "Just the essentials — Syxoria will learn the rest from your data.",
  headcountBands: ["1 to 5 employees", "6 to 9 employees", "10 to 19 employees", "20 to 49 employees", "50 to 99 employees", "100+ employees"],
};

export const connections = {
  ask: { lead: "Where does your company’s", accent: "work live?" },
  body: "Connect the tools you already use. Syxoria only reads — nothing is changed, nothing is sent.",
  recommended: "Suggested for a",
  empty: "Connect at least one source so Syxoria has something to learn from.",
  categories: { email: "Email", crm: "Clients & deals", documents: "Documents", finance: "Finance", files: "Files" } satisfies Record<SourceCategory, string>,
};

export const understanding = {
  noticed: "Noticed so far",
};

export const knowledgeLabels: Record<KnowledgeKind, string> = {
  clients: "Clients & prospects",
  opportunities: "Quotes & deals",
  invoices: "Invoices",
  documents: "Documents",
  conversations: "Conversations",
};

export const analysis = {
  title: { lead: "Your first analysis", accent: "is ready." },
  intro: "Nothing to configure. Syxoria read your activity and started with what matters most.",
  objectives: "What Syxoria will work towards",
  kpis: "The numbers worth following",
  kpisNote: "Chosen from your data. You can change them any time.",
  tones: { priority: "Priority", observation: "Observation", opportunity: "Opportunity", attention: "Needs attention" } satisfies Record<FindingTone, string>,
};

export const autonomy = {
  title: { lead: "How much should Syxoria", accent: "do on its own?" },
  body: "Choose a level. You can adjust each action, and change your mind at any time.",
  auto: "Does on its own",
  ask: "Asks you first",
  never: "Never, whatever you choose",
  adjust: "Adjust action by action",
  modes: { auto: "Automatic", ask: "Ask me", off: "Off" } satisfies Record<PermissionMode, string>,
  groups: { understand: "Understand", prepare: "Prepare", act: "Act" } satisfies Record<PermissionRule["group"], string>,
};

export const briefing = {
  eyebrow: "Your first briefing",
  lead: "Here’s what matters",
  accent: "today.",
  labels: { priority: "Priority", observation: "Observation", kpi: "Key number", recommendation: "Recommendation" },
};
