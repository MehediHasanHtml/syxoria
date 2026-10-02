/**
 * The homepage's sections, in order — all of them positions on the one pinned
 * Core story's scroll timeline (0 → 100), from the first look at the Core to
 * pricing in front of its vitrine.
 *
 *   start  where the section begins (the numbered navigation turns active)
 *   land   where a jump to it lands — the moment its content is fully shown
 */
export type Chapter = { id: string; label: string; start: number; land: number };

/** Story height in viewports; the pinned range is one viewport less. */
export const STORY_VH = 10;

export const STORY_CHAPTERS: Chapter[] = [
  { id: "core", label: "Core", start: 0, land: 0 },
  { id: "one-core", label: "One core", start: 6, land: 12 },
  { id: "modules", label: "Modules", start: 30, land: 41 },
  { id: "workspace", label: "Workspace", start: 56, land: 71 },
  { id: "integrations", label: "Integrations", start: 80, land: 86 },
  { id: "pricing", label: "Pricing", start: 91, land: 99 },
];

export const NAV_SECTIONS = STORY_CHAPTERS.map(({ id, label }) => ({ id, label }));

const index = (id: string) => STORY_CHAPTERS.findIndex((c) => c.id === id);
/** The one-core chapter — its three zones are lit on the Core. */
export const ONE_CORE_CHAPTER = index("one-core");
/** The modules chapter — the one where the Core can be explored. */
export const MODULES_CHAPTER = index("modules");
export const WORKSPACE_CHAPTER = index("workspace");
export const INTEGRATIONS_CHAPTER = index("integrations");
export const PRICING_CHAPTER = index("pricing");

/** Where, in the modules chapter, the scroll walks through the six modules one by one. */
export const MODULE_WALK = { from: 42, to: 54 };

/** A timeline position as a CSS offset from the top of the story. */
export const storyOffset = (at: number) => `${(at / 100) * (STORY_VH - 1) * 100}svh`;
