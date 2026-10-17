import type { Metadata } from "next";
import { DailyBriefingView } from "@/components/briefing/daily-briefing";
import { getDailyBriefings } from "@/services/briefings";

export const metadata: Metadata = { title: "Daily Briefings" };

/**
 * The day's briefings, as approved: the same view as the onboarding's finale, inside the workspace.
 *   ?briefing=b_morning · b_midday · b_evening   open on one of them (the latest by default)
 */
export default async function BriefingsPage({ searchParams }: PageProps<"/app/briefings">) {
  const [{ briefing }, set] = await Promise.all([searchParams, getDailyBriefings()]);
  const initial = typeof briefing === "string" ? briefing : set.briefings[set.briefings.length - 1].id;
  return (
    <div className="app-briefing">
      <DailyBriefingView set={set} initial={initial} />
    </div>
  );
}
