/**
 * Homepage copy — written as chapters of one story:
 * universe (the tree) → evolution → progression (the curve) → the product.
 * Deliberately short: few words, strong moments — the page should intrigue,
 * not explain everything.
 */

export const genesis = {
  titleLead: "Your company",
  titleAccent: "takes on a new dimension.",
  body: "Syxoria connects your tools, understands your business and turns every signal into progress.",
  primaryCta: { label: "Start free", href: "/signup" },
  filmCta: "Watch the film",
  // One word per chapter — the tree carries the meaning.
  chapters: [
    { id: "roots", index: "01", word: "Roots." },
    { id: "structure", index: "02", word: "Structure." },
    { id: "canopy", index: "03", word: "Canopy." },
  ],
};

export const trajectory = {
  eyebrow: "Progression",
  stages: [
    { id: "start", label: "Start", when: "Day 1", line: "Everything connected.", at: 0.06 },
    { id: "progression", label: "Progression", when: "Month 1", line: "What you trust becomes automatic.", at: 0.5 },
    { id: "outcome", label: "Outcome", when: "Year 1", line: "A calmer, faster company.", at: 0.95 },
  ],
  closing: { value: "6h 42m", label: "returned to every person, every week" },
};

export const product = {
  title: "This is where it happens.",
  film: { label: "Play the film", duration: "0:21" },
  enter: { label: "Enter the workspace", href: "/app" },
};

export const begin = {
  title: "Start with your roots.",
  body: "Fourteen days free. No credit card.",
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
