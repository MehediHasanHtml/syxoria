import type { Metadata } from "next";
import { HistoryView } from "@/components/dashboard/history/history-view";
import { getHistory, getReports } from "@/services/workspace";

export const metadata: Metadata = { title: "History & Reports" };

/** History & Reports. ?event= opens an event, ?tab=reports the reports */
export default async function HistoryPage({ searchParams }: PageProps<"/app/history">) {
  const [{ event, tab }, events, reports] = await Promise.all([searchParams, getHistory(), getReports()]);
  return <HistoryView events={events} reports={reports} initial={typeof event === "string" ? event : undefined} initialTab={tab === "reports" ? "reports" : "activity"} />;
}
