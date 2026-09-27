/**
 * Homepage copy — written as chapters of one story:
 * universe (the tree) → evolution → progression (the curve) → the product.
 * Deliberately short: the page should intrigue, not explain everything.
 */

export const genesis = {
  titleLead: "Your company",
  titleAccent: "takes on a new dimension.",
  body: "Syxoria connects your tools, understands your business and turns every signal into progress.",
  primaryCta: { label: "Start free", href: "/signup" },
  filmCta: "Watch the film",
  chapters: [
    { id: "roots", index: "01", word: "Roots.", line: "Everything grows from what you already have. Your tools, finally connected." },
    { id: "structure", index: "02", word: "Structure.", line: "One shared understanding of how your company really works." },
    { id: "branches", index: "03", word: "Branches.", line: "Work that moves on its own — always with your approval." },
    { id: "canopy", index: "04", word: "Canopy.", line: "Progress you can see, and a clear direction for what comes next." },
  ],
};

export const trajectory = {
  eyebrow: "Progression",
  stages: [
    { id: "start", label: "Start", when: "Day 1", line: "Everything connected. Nexo begins to learn.", at: 0.04 },
    { id: "development", label: "Development", when: "Week 2", line: "The first signals surface — with reasons, not alerts.", at: 0.27 },
    { id: "progression", label: "Progression", when: "Month 1", line: "What you trust becomes quiet automation.", at: 0.5 },
    { id: "acceleration", label: "Acceleration", when: "Month 3", line: "Time and revenue return, and compound.", at: 0.73 },
    { id: "outcome", label: "Outcome", when: "Year 1", line: "A calmer, faster company.", at: 0.96 },
  ],
  closing: { value: "6h 42m", label: "returned to every person, every week" },
};

export const product = {
  eyebrow: "The product",
  title: "This is where it happens.",
  body: "One calm place for everything your company knows — and everything it does next.",
  views: [
    { id: "overview", label: "Overview" },
    { id: "insights", label: "Insights" },
    { id: "projects", label: "Projects" },
  ],
  film: { label: "Play the film", duration: "0:21" },
  integrations: "Connects to the tools you already use",
};

export const organism = {
  eyebrow: "Modules",
  title: "Six modules. One living system.",
};

export const voice = {
  quote: "We didn’t need another dashboard. We needed something that notices things before we do.",
  name: "Maël Laurent",
  role: "Founder, Northfield Studio",
};

export const begin = {
  title: "Start with your roots.",
  body: "Fourteen days, all six modules, no credit card.",
  primaryCta: { label: "Start free", href: "/signup" },
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
