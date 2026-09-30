import type { ModuleKey } from "@/types";

/**
 * Homepage copy — one short story around the Core:
 * the Core → one core → six modules → the workspace → integrations → pricing.
 * Deliberately brief: the Core carries the meaning, words name the moment and
 * the details wait one hover or tap away. Accent fragments are set in the
 * italic serif.
 */

export const hero = {
  eyebrow: "The OS for growing companies",
  titleLead: "Your company takes on a new",
  titleAccent: "dimension.",
  body: "Syxoria connects your tools, understands your business and turns every signal into progress.",
  primaryCta: { label: "Start free", href: "/signup" },
  filmCta: "Watch the film",
  coreHint: "Open the core",
  scrollHint: "Scroll to awaken",
};

export const oneCore = {
  eyebrow: "One core",
  titleLead: "A single core runs through",
  titleAccent: "your entire company.",
  body: "Your business lives in a dozen tools. Syxoria gathers every signal into one core that understands it.",
  // each step is written on the Core, at the zone where it happens
  steps: [
    { title: "Connect", zone: "Signals in", body: "Email, CRM, payments and files flow in — plugged in once." },
    { title: "Understand", zone: "The heart", body: "Every signal linked to its client, project and number." },
    { title: "Act", zone: "Action out", body: "The next step prepared. You approve, it’s done." },
  ],
};

export const modules = {
  eyebrow: "Modules",
  titleLead: "Six modules,",
  titleAccent: "one core.",
  body: "Each module does one job. Because they share one core, they think as one.",
  hint: { pointer: "Scroll through them, or hover a branch", touch: "Scroll through them, or tap a module" },
  open: "Open",
};

/** What each module looks like in the product — shown in its detail sheet. */
export const moduleExamples: Record<ModuleKey, { title: string; detail: string; impact: string }> = {
  lume: { title: "Two deals have gone quiet", detail: "No contact in 12 days. Lume found an unanswered question in one thread.", impact: "€24,000 pipeline" },
  nexo: { title: "4 invoices can be followed up today", detail: "Clients with a good payment history, 14+ days overdue.", impact: "€6,380 cash in" },
  volt: { title: "Kickoff scheduling can run on its own", detail: "Slots proposed and invites sent after signature — with your approval.", impact: "≈ 6h saved / month" },
  kairo: { title: "Momentum is up this week", detail: "Three goals moved forward; one leading indicator needs attention.", impact: "+12% momentum" },
  zento: { title: "The team is over capacity on Friday", detail: "Two deadlines overlap. Moving one review keeps everyone on track.", impact: "3 deadlines safe" },
  orion: { title: "Quarter summary is ready", detail: "Decisions, numbers and open questions, gathered for the board.", impact: "Ready in 1 click" },
};

export const workspace = {
  eyebrow: "Workspace",
  titleLead: "Everything moves forward,",
  titleAccent: "with you.",
  body: "Your six modules meet in one calm screen. Syxoria prepares the work — you stay in control.",
  steps: ["Everything arrives in one stream", "Syxoria proposes the next step", "You approve — it’s done"],
  demo: {
    label: "Play the demo",
    duration: "0:21",
    hint: { pointer: "Hover to preview · click to open", touch: "Tap to preview" },
    live: "Live preview",
    openFull: "Open the full demo",
    tapAgain: "Tap again to open the full demo",
  },
  enter: { label: "Enter the workspace", href: "/app" },
  cards: {
    insight: { module: "Nexo", title: "4 invoices can be followed up today", impact: "€6,380", action: "Review" },
    momentum: { module: "Kairo", label: "Momentum", value: "+12%", note: "this week" },
  },
};

type Tool = { name: string; logo?: string };

export const integrations = {
  eyebrow: "Integrations",
  titleLead: "Connected to",
  titleAccent: "your tools.",
  body: "Email, chat, CRM, payments — Syxoria plugs into what you already use and lets information flow on its own.",
  // shown around the Core (examples, not the full list)
  tools: [
    { id: "gmail", name: "Gmail" },
    { id: "slack", name: "Slack" },
    { id: "notion", name: "Notion" },
    { id: "hubspot", name: "HubSpot" },
    { id: "stripe", name: "Stripe" },
    { id: "drive", name: "Google Drive" },
    { id: "outlook", name: "Outlook" },
    { id: "salesforce", name: "Salesforce" },
  ],
  more: {
    label: "More integrations",
    count: "40+",
    note: "Shown here: a few examples.",
    title: "40+ integrations, and counting",
    body: "Syxoria connects to the services your company already runs on — and to everything else through its API and webhooks.",
    groups: [
      { name: "Communication", tools: [{ name: "Gmail", logo: "gmail" }, { name: "Outlook", logo: "outlook" }, { name: "Slack", logo: "slack" }, { name: "Microsoft Teams" }, { name: "Google Calendar" }, { name: "Zoom" }, { name: "WhatsApp Business" }] },
      { name: "Sales & CRM", tools: [{ name: "HubSpot", logo: "hubspot" }, { name: "Salesforce", logo: "salesforce" }, { name: "Pipedrive" }, { name: "Intercom" }, { name: "Calendly" }] },
      { name: "Finance & payments", tools: [{ name: "Stripe", logo: "stripe" }, { name: "PayPal", logo: "paypal" }, { name: "QuickBooks" }, { name: "Xero" }, { name: "Pennylane" }, { name: "Qonto" }] },
      { name: "Documents & knowledge", tools: [{ name: "Notion", logo: "notion" }, { name: "Google Drive", logo: "drive" }, { name: "Excel", logo: "excel" }, { name: "Dropbox" }, { name: "Confluence" }, { name: "DocuSign" }] },
      { name: "Projects & operations", tools: [{ name: "Asana" }, { name: "Trello" }, { name: "Jira" }, { name: "Linear" }, { name: "Airtable" }, { name: "Zapier" }] },
      { name: "Commerce & support", tools: [{ name: "Shopify" }, { name: "Zendesk" }, { name: "Mailchimp" }] },
    ] satisfies { name: string; tools: Tool[] }[],
    api: "Anything else connects through the Syxoria API and webhooks.",
    request: { label: "Request an integration", href: "mailto:hello@syxoria.com?subject=Integration%20request" },
  },
};

export const pricingIntro = {
  eyebrow: "Pricing",
  titleLead: "Simple plans that",
  titleAccent: "grow with you.",
  billing: { monthly: "Monthly", yearly: "Yearly", save: "Save 17%" },
  highlight: "Most chosen",
  notes: ["All six modules in every plan", "14 days free — no credit card", "Cancel anytime", "Prices exclude VAT, per workspace"],
};

/** Scenes for the product film preview (used until the real film is delivered). */
export const filmScenes = [
  { image: "overview", caption: "Everything, in one calm place.", zoom: 1, origin: "50% 50%" },
  { image: "overview", caption: "Progress, made visible.", zoom: 1.7, origin: "38% 62%" },
  { image: "insights", caption: "Signals, before they become problems.", zoom: 1.08, origin: "50% 40%" },
  { image: "insights", caption: "Act in one click. You stay in control.", zoom: 1.75, origin: "72% 50%" },
  { image: "projects", caption: "Every project, growing.", zoom: 1.1, origin: "55% 45%" },
] as const;
