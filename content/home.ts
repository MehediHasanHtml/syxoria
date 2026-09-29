/**
 * Homepage copy — one continuous story around the Core:
 * genesis → growth → one pulse → six modules → the workspace → connections → access.
 * Deliberately short: the Core carries the meaning, words only name the moment.
 * Accent fragments are set in the italic serif.
 */

export const hero = {
  eyebrow: "The operating core",
  titleLead: "Your company takes on a new",
  titleAccent: "dimension.",
  body: "Syxoria connects your tools, understands your business and turns every signal into progress.",
  primaryCta: { label: "Start free", href: "/signup" },
  filmCta: "Watch the film",
  scrollHint: "Scroll to awaken",
};

export const growth = {
  eyebrow: "Growth",
  titleLead: "It grows",
  titleAccent: "with you.",
  body: "Every module you switch on wakes a little more of the Core.",
};

export const pulse = {
  titleLead: "A single core runs through",
  titleAccent: "your entire company.",
  body: "Data, tools and people — one intelligence, dense and alive.",
};

export const organism = {
  eyebrow: "Modules",
  titleLead: "Six modules,",
  titleAccent: "one organism.",
  body: "Each one does its part. Together they think as one.",
  // `orb` is the index of the module orb lit around the Core (see productModules order)
  moments: [
    { id: "activity", orb: 0, index: "01", titleLead: "Your activity,", titleAccent: "in real time.", body: "Figures, requests and conversations gathered in one calm stream." },
    { id: "priorities", orb: 3, index: "02", titleLead: "Your priorities,", titleAccent: "clarified.", body: "What matters today rises to the surface. The rest can wait." },
    { id: "projects", orb: 4, index: "03", titleLead: "Your projects", titleAccent: "move forward.", body: "Deadlines, workload and progress balanced before they become problems." },
  ],
};

export const workspace = {
  eyebrow: "Workspace",
  titleLead: "Everything moves forward,",
  titleAccent: "with you.",
  body: "Your six modules meet in one screen. Nothing to learn, everything to see.",
  film: { label: "Play the film", duration: "0:21" },
  enter: { label: "Enter the workspace", href: "/app" },
};

export const connect = {
  eyebrow: "Connections",
  titleLead: "Connected to",
  titleAccent: "your tools.",
  body: "Email, chat, CRM, payments — Syxoria plugs into what you already use and lets information flow on its own.",
  note: "40+ integrations",
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
};

export const access = {
  eyebrow: "Access",
  titleLead: "Your space,",
  titleAccent: "wherever you are.",
  body: "Fourteen days free. No credit card.",
  planId: "growth",
  primaryCta: { label: "Start free", href: "/signup?plan=growth" },
  secondaryCta: { label: "Talk to us", href: "mailto:hello@syxoria.com" },
};

/** Scenes for the product film preview (used until the real film is delivered). */
export const filmScenes = [
  { image: "overview", caption: "Everything, in one calm place.", zoom: 1, origin: "50% 50%" },
  { image: "overview", caption: "Progress, made visible.", zoom: 1.7, origin: "38% 62%" },
  { image: "insights", caption: "Signals, before they become problems.", zoom: 1.08, origin: "50% 40%" },
  { image: "insights", caption: "Act in one click. You stay in control.", zoom: 1.75, origin: "72% 50%" },
  { image: "projects", caption: "Every project, growing.", zoom: 1.1, origin: "55% 45%" },
] as const;
