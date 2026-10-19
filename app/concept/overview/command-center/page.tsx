import type { Metadata } from "next";
import { CommandCenter } from "@/components/concept/overview/command-center";
import { loadOverviewConcept } from "@/components/concept/overview/data";
import { ConceptFrame } from "@/components/concept/overview/shared";

export const metadata: Metadata = { title: "Concept A, Executive Command Center" };

/**
 * Concept A: the overview as an edition of the business.
 *
 *   ?briefing=b_morning   open on another of the day's briefings (b_morning · b_midday · b_evening)
 *   ?first=1              a brand new user's first day: nothing earlier to compare with
 */
export default async function CommandCenterConcept({ searchParams }: PageProps<"/concept/overview/command-center">) {
  const { briefing, first } = await searchParams;
  const data = await loadOverviewConcept({ first: first === "1" });
  return (
    <ConceptFrame automation={data.automation} first={data.first}>
      <CommandCenter data={data} initial={typeof briefing === "string" ? briefing : undefined} />
    </ConceptFrame>
  );
}
