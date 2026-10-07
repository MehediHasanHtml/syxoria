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
  initializing: { lit: 0.1, light: 0.22, open: 0, motion: "breathe" },
  searching: { lit: 0.2, light: 0.34, open: 0.04, motion: "scan" },
  identifying: { lit: 0.3, light: 0.42, open: 0.06, motion: "still" },
  receiving: { lit: 0.45, light: 0.52, open: 0.1, motion: "flow" },
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
