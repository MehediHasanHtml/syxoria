import type { CurveStage, PricingPlan, ProgressionStage } from "@/types";

/**
 * Marketing copy. Kept out of components so it can move to a CMS or i18n
 * dictionaries later without touching layout code.
 */

export const hero = {
  eyebrow: "The operating system for growing companies",
  titleLead: "Your company grows into",
  titleAccent: "a new dimension.",
  body: "Syxoria connects the tools you already use, understands what is happening across your business, and turns every signal into measurable progress.",
  primaryCta: { label: "Start free for 14 days", href: "/signup" },
  secondaryCta: { label: "Watch the product tour" },
  pillars: [
    { key: "lume", label: "Signal" },
    { key: "nexo", label: "Understanding" },
    { key: "volt", label: "Action" },
  ] as const,
};

export const proofStats = [
  { value: "6h 42m", label: "saved per person, per week" },
  { value: "+€18,420", label: "recovered in the first quarter" },
  { value: "12", label: "workflows running on autopilot" },
];

export const manifesto = {
  eyebrow: "Why Syxoria",
  lines: ["Growth is rarely a leap.", "It is a thousand small signals,", "noticed early and acted on well."],
  body: "Most companies already have the data they need — spread across inboxes, spreadsheets, CRMs and bank feeds. Syxoria gives it roots, structure and direction, so growth stops being accidental.",
};

export const progression: { eyebrow: string; title: string; body: string; stages: ProgressionStage[] } = {
  eyebrow: "How it works",
  title: "From first signal to lasting outcome.",
  body: "Every workspace follows the same natural progression. You see exactly where you are — and what moves you forward next.",
  stages: [
    {
      id: "roots",
      label: "01 · Roots",
      title: "Connect what you already use",
      body: "Email, drive, CRM, invoicing and bank feeds connect in minutes. Nothing to migrate, nothing to re-type.",
      metric: { value: "10 min", label: "average setup" },
    },
    {
      id: "trunk",
      label: "02 · Trunk",
      title: "Nexo builds understanding",
      body: "Clients, projects, invoices and conversations are linked into one living model of your company.",
      metric: { value: "1 model", label: "of your whole business" },
    },
    {
      id: "branches",
      label: "03 · Branches",
      title: "Work turns into quiet automation",
      body: "Repetitive tasks become approval-first automations. You stay in control; Volt does the typing.",
      metric: { value: "12", label: "flows running weekly" },
    },
    {
      id: "canopy",
      label: "04 · Canopy",
      title: "Momentum becomes visible",
      body: "Kairo and Zento show what is moving, what is stuck and where time goes — before it becomes a problem.",
      metric: { value: "6h 42m", label: "saved per person / week" },
    },
    {
      id: "fruit",
      label: "05 · Outcome",
      title: "Growth you can measure",
      body: "Recovered revenue, faster responses, calmer teams. Orion turns it into a story your board understands.",
      metric: { value: "+€18,420", label: "recovered in Q1" },
    },
  ],
};

export const useCases = [
  {
    id: "founders",
    team: "Founders",
    title: "See the whole company in one calm view",
    body: "Cash, pipeline, delivery and team load on a single page — with the three things that need you today.",
    outcome: "Weekly review in 15 minutes",
  },
  {
    id: "operations",
    team: "Operations",
    title: "Remove the glue work between tools",
    body: "Onboarding, handovers and follow-ups run as automations you approve once and trust afterwards.",
    outcome: "31 hours saved per month",
  },
  {
    id: "finance",
    team: "Finance",
    title: "Shorten the cash cycle without chasing",
    body: "Late invoices are spotted early and followed up respectfully, reconciled automatically with your bank.",
    outcome: "−9 days average collection",
  },
  {
    id: "sales",
    team: "Client teams",
    title: "Never let a good relationship go quiet",
    body: "Every conversation is logged, every silence noticed. Lume makes sure the next step is always clear.",
    outcome: "2.4h average response time",
  },
];

export const testimonial = {
  quote:
    "We didn't need another dashboard. We needed something that notices things before we do. Syxoria quietly became the place where our week starts.",
  name: "Maël Laurent",
  role: "Founder, Northfield Studio",
  metrics: [
    { value: "−9 days", label: "cash collection" },
    { value: "31h", label: "saved monthly" },
    { value: "4 weeks", label: "to full adoption" },
  ],
};

export const security = {
  eyebrow: "Security & trust",
  title: "Built for the data that runs your company.",
  body: "Syxoria is designed so your information stays yours: isolated, encrypted and fully auditable.",
  items: [
    { title: "Encryption everywhere", body: "TLS 1.3 in transit, AES-256 at rest, keys rotated automatically." },
    { title: "EU data residency", body: "Workspaces hosted in the EU by default, with regional options for enterprise." },
    { title: "Approval-first automation", body: "Nothing leaves your company without an explicit rule you approved." },
    { title: "Granular access", body: "Roles, SSO / SAML and per-module permissions for every member." },
    { title: "Complete audit trail", body: "Every automated action is logged, explained and reversible." },
    { title: "Your data, not our model", body: "Workspace data is never used to train shared models." },
  ],
};

export const pricing: { title: string; body: string; plans: PricingPlan[] } = {
  title: "Simple plans that grow with you.",
  body: "Every plan includes all six modules. Prices exclude VAT and are billed per workspace.",
  plans: [
    {
      id: "starter",
      name: "Starter",
      description: "For founders and small teams getting organised.",
      price: { monthly: 29, yearly: 24 },
      highlighted: false,
      cta: { label: "Start free", href: "/signup?plan=starter" },
      features: ["Up to 3 members", "5 integrations", "Core automations", "Weekly digest"],
    },
    {
      id: "growth",
      name: "Growth",
      description: "For teams ready to run the company on Syxoria.",
      price: { monthly: 69.99, yearly: 58 },
      highlighted: true,
      cta: { label: "Create my account", href: "/signup?plan=growth" },
      features: ["Up to 10 members", "Unlimited integrations", "Nexo insights & recommendations", "Advanced automations with approvals", "Mobile app"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For organisations with advanced security needs.",
      price: { monthly: null, yearly: null },
      highlighted: false,
      cta: { label: "Talk to us", href: "mailto:hello@syxoria.com?subject=Enterprise" },
      features: ["Unlimited members", "SSO / SAML & audit exports", "Orion Advanced", "Dedicated success manager", "Custom data residency"],
    },
  ],
};

export const faqs = [
  {
    id: "setup",
    title: "How long does it take to get started?",
    content: "Most teams connect their first tools in about ten minutes. Nexo starts building understanding immediately, and useful insights usually appear within the first day.",
  },
  {
    id: "replace",
    title: "Do we need to replace our existing tools?",
    content: "No. Syxoria sits on top of the tools you already use — email, drive, CRM, invoicing, bank — and connects them. Nothing needs to be migrated.",
  },
  {
    id: "control",
    title: "Will automations act without our approval?",
    content: "Never by default. Every automation starts in approval mode. You decide when a flow has earned enough trust to run on its own, and every action stays logged and reversible.",
  },
  {
    id: "data",
    title: "Where is our data stored?",
    content: "Workspaces are hosted in the EU by default and encrypted at rest and in transit. Your data is never used to train shared models.",
  },
  {
    id: "cancel",
    title: "Can we cancel at any time?",
    content: "Yes. Plans are monthly or yearly with no lock-in, and you can export everything at any time.",
  },
];

export const finalCta = {
  title: "Plant it today.",
  accent: "Watch it grow.",
  body: "Fourteen days, all six modules, no credit card.",
};

export const growthCurve: {
  eyebrow: string;
  title: string;
  accent: string;
  body: string;
  points: number[];
  baseline: number[];
  stages: CurveStage[];
} = {
  eyebrow: "Progress",
  title: "Growth compounds.",
  accent: "Quietly, then all at once.",
  body: "Each connection teaches Nexo something. Each insight becomes an automation. Each automation frees time for the next improvement. This is what a typical first year looks like.",
  points: [4, 5, 6.5, 8, 10, 12.5, 15.5, 19, 24, 30, 37, 45, 54, 63, 71, 78, 84, 89, 93],
  baseline: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
  stages: [
    {
      id: "start",
      label: "Starting point",
      when: "Day 1",
      title: "Everything connected",
      body: "Your tools are connected and Nexo starts learning how your company actually works.",
      metric: { value: "10 min", label: "to connect" },
      index: 0,
    },
    {
      id: "development",
      label: "Development",
      when: "Week 2",
      title: "The first insights arrive",
      body: "Late invoices, quiet deals and overloaded weeks are surfaced — with reasons, not just alerts.",
      metric: { value: "14", label: "insights surfaced" },
      index: 4,
    },
    {
      id: "progression",
      label: "Progression",
      when: "Month 1",
      title: "Work becomes automation",
      body: "The insights you trust become approval-first automations that run every week.",
      metric: { value: "12", label: "automations running" },
      index: 8,
    },
    {
      id: "acceleration",
      label: "Acceleration",
      when: "Month 3",
      title: "Returns start compounding",
      body: "Recovered revenue and saved hours are reinvested into the next improvements.",
      metric: { value: "+€18,420", label: "recovered" },
      index: 13,
    },
    {
      id: "outcome",
      label: "Outcome",
      when: "Year 1",
      title: "A calmer, faster company",
      body: "Decisions are made on live information, and the team spends its time on the work that matters.",
      metric: { value: "6h 42m", label: "saved per person, weekly" },
      index: 18,
    },
  ],
};
