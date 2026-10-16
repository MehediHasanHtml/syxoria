import type { Metadata } from "next";
import { DailyBriefingView } from "@/components/briefing/daily-briefing";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { DemoNote } from "@/components/onboarding/primitives";
import { milestones } from "@/content/onboarding";
import { getDailyBriefings } from "@/services/briefings";

export const metadata: Metadata = {
  title: "Executive briefing preview",
  robots: { index: false, follow: false },
};

/**
 * The refined executive briefing, for the client's review before it replaces the onboarding's
 * final screen. It sits in the onboarding's own environment, the Core in the bar at the top.
 *
 *   ?briefing=b_midday   open on another of the day's briefings (b_morning · b_midday · b_evening)
 */
export default async function ExecutiveBriefingPreview({ searchParams }: PageProps<"/concept/executive-briefing">) {
  const [{ briefing }, set] = await Promise.all([searchParams, getDailyBriefings("autonomous")]);
  return (
    <OnboardingShell
      layout="briefing"
      awake={1}
      bar={{ core: { state: "ready", word: "Ready" }, coreHere: true, milestones: milestones.map((m) => ({ ...m, on: true })), email: "mael@northfield.co" }}
      announcement="Executive briefing."
    >
      <DailyBriefingView set={set} initial={typeof briefing === "string" ? briefing : undefined} />
      <DemoNote lines={["Preview: the whole day is open, so the three briefings can be compared.", "Approving and sending happen in the workspace, not here."]} />
    </OnboardingShell>
  );
}
