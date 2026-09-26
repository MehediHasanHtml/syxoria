import { createRandom } from "@/lib/random";
import type { TimePoint } from "@/types";

/** Reference "now" for all mock data so relative dates are stable across renders. */
export const REFERENCE_NOW = "2026-09-24T09:30:00.000Z";

const DAY = 86_400_000;

/**
 * Organic growth series: an S-curve with gentle noise.
 * `from` / `to` are the start/end values; `days` is length; `seed` makes it repeatable.
 */
export function growthSeries({
  days,
  from,
  to,
  seed,
  noise = 0.04,
  stepDays = 1,
  end = REFERENCE_NOW,
}: {
  days: number;
  from: number;
  to: number;
  seed: number;
  noise?: number;
  stepDays?: number;
  end?: string;
}): TimePoint[] {
  const rand = createRandom(seed);
  const endMs = new Date(end).getTime();
  const count = Math.floor(days / stepDays);
  const points: TimePoint[] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    // logistic S-curve centred slightly after the midpoint
    const s = 1 / (1 + Math.exp(-9 * (t - 0.55)));
    const s0 = 1 / (1 + Math.exp(9 * 0.55));
    const s1 = 1 / (1 + Math.exp(-9 * 0.45));
    const eased = (s - s0) / (s1 - s0);
    const base = from + (to - from) * eased;
    const jitter = (rand() - 0.5) * 2 * noise * (to - from);
    points.push({
      date: new Date(endMs - (count - i) * stepDays * DAY).toISOString(),
      value: Math.max(0, Math.round(base + jitter)),
    });
  }
  return points;
}
