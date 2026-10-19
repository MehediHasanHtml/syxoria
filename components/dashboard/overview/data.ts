import { mockClientsFocus, mockLenses, type LensId, type LensTone } from "@/lib/mock-data/overview-lenses";
import { getDailyBriefings } from "@/services/briefings";
import { getHomeOverview } from "@/services/overview";
import { getCalendar, getFinance, getGoals, getMarketing, getSales, getWorkspaceActions } from "@/services/workspace";
import type { BusinessIndicator } from "@/types";
import type { FocusPriority, Kpi } from "@/types/workspace";

/** One lens on the business: where it stands tonight, its own story, and the figures behind it */
export type Lens = { id: LensId; name: string; word: string; tone: LensTone; href: string; focus: FocusPriority; kpis: Kpi[] };

/** A business indicator with the few points of its recent trend, when the section has them */
export type Figure = BusinessIndicator & { spark?: number[] };

/**
 * Everything the Executive Overview reads, from the workspace's services: the day's briefings,
 * the indicators, alerts and recommendations, the actions, the calendar, and each business lens
 * with its own story. The overview has no data of its own.
 */
export async function loadOverview({ first = false }: { first?: boolean } = {}) {
  const [set, home, actions, events, sales, marketing, finance, goals] = await Promise.all([
    getDailyBriefings("autonomous", { first }),
    getHomeOverview(),
    getWorkspaceActions(),
    getCalendar(),
    getSales(),
    getMarketing(),
    getFinance(),
    getGoals(),
  ]);

  const month = { sales: sales.periods.month.kpis, marketing: marketing.periods.month.kpis, finance: finance.periods.month.kpis, goals: goals.periods.month.kpis };
  const stories: Record<LensId, { focus: FocusPriority; kpis: Kpi[] }> = {
    sales: { focus: sales.focus, kpis: month.sales },
    clients: { focus: mockClientsFocus, kpis: month.sales.filter((k) => k.id === "open" || k.id === "win") },
    finance: { focus: finance.focus, kpis: month.finance },
    marketing: { focus: marketing.focus, kpis: month.marketing },
    goals: { focus: goals.focus, kpis: month.goals },
  };
  const lenses: Lens[] = mockLenses.map((l) => ({ ...l, ...stories[l.id] }));

  // the home's four indicators, each with its section's recent trend
  const sparkOf: Record<string, number[] | undefined> = {
    revenue: month.sales.find((k) => k.id === "revenue")?.spark,
    pipeline: month.sales.find((k) => k.id === "open")?.spark,
    invoices: month.finance.find((k) => k.id === "due")?.spark,
  };
  const figures: Figure[] = home.indicators.map((i) => ({ ...i, spark: sparkOf[i.id] }));

  return {
    first,
    set,
    figures,
    signals: home.signals,
    recommendations: home.recommendations,
    actions,
    events,
    lenses,
  };
}

export type OverviewData = Awaited<ReturnType<typeof loadOverview>>;
