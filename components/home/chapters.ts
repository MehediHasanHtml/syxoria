/**
 * The homepage's sections, in order. The first five live inside the pinned
 * Core story and are positions on its scroll timeline (0 → 100); pricing is a
 * regular section after it.
 *
 *   start  where the section begins (the numbered navigation turns active)
 *   land   where a jump to it lands — the moment its content is fully shown
 */
export type Chapter = { id: string; label: string; start: number; land: number };

/** Story height in viewports; the pinned range is one viewport less. */
export const STORY_VH = 10;

export const STORY_CHAPTERS: Chapter[] = [
  { id: "core", label: "Core", start: 0, land: 0 },
  { id: "one-core", label: "One core", start: 6, land: 19 },
  { id: "modules", label: "Modules", start: 24, land: 43 },
  { id: "workspace", label: "Workspace", start: 60, land: 70 },
  { id: "integrations", label: "Integrations", start: 77, land: 86 },
];

export const PRICING_SECTION = { id: "pricing", label: "Pricing" };

export const NAV_SECTIONS = [...STORY_CHAPTERS.map(({ id, label }) => ({ id, label })), PRICING_SECTION];

/** Index of the modules chapter — the one where the Core can be explored. */
export const MODULES_CHAPTER = STORY_CHAPTERS.findIndex((c) => c.id === "modules");
export const WORKSPACE_CHAPTER = STORY_CHAPTERS.findIndex((c) => c.id === "workspace");

/** A timeline position as a CSS offset from the top of the story. */
export const storyOffset = (at: number) => `${(at / 100) * (STORY_VH - 1) * 100}svh`;
