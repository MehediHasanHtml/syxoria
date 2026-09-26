/**
 * Chart geometry helpers — dependency-free, deterministic.
 * Coordinates are in a normalised viewBox (0..W, 0..H).
 */

export type Pt = { x: number; y: number };

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Map values to points inside a W×H box with vertical padding. */
export function toPoints(values: number[], W: number, H: number, { min, max, padTop = 0.08 }: { min?: number; max?: number; padTop?: number } = {}): Pt[] {
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const span = hi - lo || 1;
  const usable = H * (1 - padTop);
  return values.map((v, i) => ({
    x: r2(values.length === 1 ? W / 2 : (i / (values.length - 1)) * W),
    y: r2(H - ((v - lo) / span) * usable),
  }));
}

/** Monotone cubic interpolation (Fritsch–Carlson): smooth, never overshoots. */
export function smoothPath(points: Pt[]): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${points[0].x},${points[0].y}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    m.push((points[i + 1].y - points[i].y) / (dx[i] || 1));
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    t.push(m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]));
  }
  t.push(m[n - 2]);
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const h = dx[i] / 3;
    d += `C${r2(p0.x + h)},${r2(p0.y + t[i] * h)} ${r2(p1.x - h)},${r2(p1.y - t[i + 1] * h)} ${p1.x},${p1.y}`;
  }
  return d;
}

/** Close a line path down to the baseline for area fills. */
export function areaPath(line: string, points: Pt[], H: number): string {
  if (!points.length) return "";
  return `${line}L${points[points.length - 1].x},${H}L${points[0].x},${H}Z`;
}

/** "Nice" axis ticks (1, 2, 2.5, 5 × 10^n). */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 1000) / 1000);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}
