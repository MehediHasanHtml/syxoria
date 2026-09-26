import type { AnalyticsReport, Metric, TimeRange } from "@/types";
import { growthSeries } from "./series";

const rangeDays: Record<TimeRange, { days: number; step: number }> = {
  "7d": { days: 7, step: 1 },
  "30d": { days: 30, step: 1 },
  "90d": { days: 90, step: 3 },
  "12m": { days: 364, step: 14 },
};

/** Scales values so shorter ranges show proportionally smaller totals. */
const rangeScale: Record<TimeRange, number> = { "7d": 0.22, "30d": 1, "90d": 2.6, "12m": 9.4 };

export const mockOverviewMetrics: Metric[] = [
  {
    id: "recovered",
    label: "Revenue recovered",
    value: 18420,
    format: "currency",
    delta: 12.4,
    positiveIsGood: true,
    trend: [6, 7, 7, 9, 10, 12, 11, 14, 15, 17, 18],
    module: "nexo",
  },
  {
    id: "hours",
    label: "Time saved this week",
    value: 6.7,
    format: "duration",
    delta: 8.1,
    positiveIsGood: true,
    trend: [3, 3.4, 4, 3.8, 4.6, 5.1, 5.4, 5.9, 6.2, 6.7],
    module: "volt",
  },
  {
    id: "flows",
    label: "Active automations",
    value: 12,
    format: "number",
    delta: 20,
    positiveIsGood: true,
    trend: [4, 5, 5, 6, 7, 8, 8, 9, 10, 12],
    module: "volt",
  },
  {
    id: "response",
    label: "Avg. client response",
    value: 2.4,
    format: "duration",
    delta: -18.2,
    positiveIsGood: false,
    trend: [4.1, 3.9, 3.8, 3.4, 3.2, 3.1, 2.9, 2.7, 2.5, 2.4],
    module: "lume",
  },
];

export function buildAnalyticsReport(range: TimeRange): AnalyticsReport {
  const { days, step } = rangeDays[range];
  const scale = rangeScale[range];
  const growth = growthSeries({ days, stepDays: step, from: 1200 * scale, to: 18420 * scale, seed: 7 + days });
  const baseline = growthSeries({ days, stepDays: step, from: 900 * scale, to: 11200 * scale, seed: 99 + days, noise: 0.05 });
  const hours = growthSeries({ days: 70, stepDays: 7, from: 2, to: 7, seed: 5, noise: 0.08 });

  return {
    range,
    summary: [
      { ...mockOverviewMetrics[0], value: Math.round(18420 * scale) },
      { ...mockOverviewMetrics[1], label: "Time saved", value: Math.round(6.7 * scale * 4.3 * 10) / 10 },
      mockOverviewMetrics[2],
      mockOverviewMetrics[3],
    ],
    growth: { id: "growth", label: "Value created", points: growth },
    baseline: { id: "baseline", label: "Previous period", points: baseline },
    automationsByModule: [
      { label: "Volt", value: Math.round(412 * scale), module: "volt" },
      { label: "Nexo", value: Math.round(286 * scale), module: "nexo" },
      { label: "Lume", value: Math.round(198 * scale), module: "lume" },
      { label: "Zento", value: Math.round(121 * scale), module: "zento" },
      { label: "Kairo", value: Math.round(74 * scale), module: "kairo" },
      { label: "Orion", value: Math.round(39 * scale), module: "orion" },
    ],
    weeklyHours: hours,
  };
}
