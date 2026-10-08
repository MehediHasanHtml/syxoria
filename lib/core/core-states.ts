/**
 * The Syxoria Core's states — one Core, everywhere (onboarding, workspace), whose look says
 * how much it knows and what it is doing. Each state is a look, not a different object:
 *
 *   lit     share of its fissures carrying light (0–1) — how much it understands
 *   light   how strong that emerald light is (0–1) — restrained early, confident at the end
 *   open    how far its two halves have parted (0–1) — it opens as it understands
 *   motion  still · breathe (working, waiting) · scan (searching) · flow (taking information in)
 */

export type CoreState =
  | "dormant"
  | "initializing"
  | "searching"
  | "identifying"
  | "receiving"
  | "learning"
  | "understanding"
  | "active"
  | "ready"
  | "executing";

export type CoreMotion = "still" | "breathe" | "scan" | "flow";
export type CoreLook = { lit: number; light: number; open: number; motion: CoreMotion };

export const coreLooks: Record<CoreState, CoreLook> = {
  dormant: { lit: 0, light: 0.1, open: 0, motion: "still" },
  initializing: { lit: 0.5, light: 0.36, open: 0.03, motion: "breathe" },
  searching: { lit: 0.5, light: 0.4, open: 0.05, motion: "scan" },
  identifying: { lit: 0.5, light: 0.46, open: 0.06, motion: "still" },
  receiving: { lit: 0.55, light: 0.52, open: 0.1, motion: "flow" },
  learning: { lit: 0.7, light: 0.68, open: 0.4, motion: "flow" },
  understanding: { lit: 1, light: 0.86, open: 0.7, motion: "breathe" },
  active: { lit: 1, light: 0.74, open: 0.22, motion: "still" },
  ready: { lit: 1, light: 0.86, open: 0.18, motion: "breathe" },
  executing: { lit: 1, light: 1, open: 0.26, motion: "flow" },
};

/** Spoken names, for screen readers and tooltips */
export const coreStateNames: Record<CoreState, string> = {
  dormant: "Dormant",
  initializing: "Initializing",
  searching: "Searching",
  identifying: "Identifying",
  receiving: "Receiving",
  learning: "Learning",
  understanding: "Understanding",
  active: "Active",
  ready: "Ready",
  executing: "Executing",
};

/** A look part-way from one state to the next, for a Core waking by degrees (0 = `from`, 1 = `to`) */
export function blendLook(from: CoreLook, to: CoreLook, t: number): CoreLook {
  const k = Math.max(0, Math.min(1, t));
  const mix = (a: number, b: number) => a + (b - a) * k;
  return { lit: mix(from.lit, to.lit), light: mix(from.light, to.light), open: mix(from.open, to.open), motion: k >= 1 ? to.motion : from.motion };
}

/**
 * The first awakening — dormant → initializing — which begins on the landing page's "Start free"
 * and continues on the first onboarding moment, so the Core the visitor presses is the Core that
 * greets them. How far it has woken at each point of that journey:
 *
 *   rest      the button at rest: quiet, its folds barely there
 *   stirring  pointed at: the first folds catch the light
 *   pressed   pressed: the light runs in — exactly how the onboarding's Core arrives
 *   ready     the account form complete and valid: initializing in full (then it goes to work)
 */
export const awakening = { rest: 0.08, stirring: 0.35, pressed: 0.55, ready: 1 } as const;
