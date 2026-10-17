import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FinanceView } from "@/components/dashboard/business/finance-view";
import { GoalsView } from "@/components/dashboard/business/goals-view";
import { MarketingView } from "@/components/dashboard/business/marketing-view";
import { SalesView } from "@/components/dashboard/business/sales-view";
import { getFinance, getGoals, getMarketing, getPeriods, getSales, getWorkspaceActions } from "@/services/workspace";
import type { PeriodId } from "@/types/workspace";

const SECTIONS = { sales: "Sales", marketing: "Marketing", finance: "Finance", goals: "Goals & KPIs" } as const;
type Section = keyof typeof SECTIONS;
const isSection = (s: string): s is Section => s in SECTIONS;
const isPeriod = (p: unknown): p is PeriodId => p === "month" || p === "half" || p === "year";

export async function generateMetadata({ params }: PageProps<"/app/business/[section]">): Promise<Metadata> {
  const { section } = await params;
  return { title: isSection(section) ? `${SECTIONS[section]} · Business Management` : "Business Management" };
}

/**
 * Business Management: one area, four categories (Sales, Marketing, Finance, Goals & KPIs), each
 * with its own workspace. The reporting period follows from one to the next (?period=).
 */
export default async function BusinessSectionPage({ params, searchParams }: PageProps<"/app/business/[section]">) {
  const { section } = await params;
  const { period } = await searchParams;
  if (!isSection(section)) notFound();
  const initial: PeriodId = isPeriod(period) ? period : "month";
  const [periods, actions] = await Promise.all([getPeriods(), getWorkspaceActions()]);
  const statuses = Object.fromEntries(actions.map((a) => [a.id, a.status]));

  if (section === "sales") return <SalesView data={await getSales()} periods={periods} initial={initial} statuses={statuses} />;
  if (section === "marketing") return <MarketingView data={await getMarketing()} periods={periods} initial={initial} statuses={statuses} />;
  if (section === "finance") return <FinanceView data={await getFinance()} periods={periods} initial={initial} statuses={statuses} />;
  return <GoalsView data={await getGoals()} periods={periods} initial={initial} statuses={statuses} />;
}
