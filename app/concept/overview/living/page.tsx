import type { Metadata } from "next";
import { loadOverviewConcept } from "@/components/concept/overview/data";
import { LivingEnvironment } from "@/components/concept/overview/living-environment";
import { ConceptFrame } from "@/components/concept/overview/shared";

export const metadata: Metadata = { title: "Concept B, Living Intelligence" };

/**
 * Concept B: the overview as one environment around the Core.
 *
 *   ?briefing=b_morning   open on another of the day's briefings (b_morning · b_midday · b_evening)
 *   ?first=1              a brand new user's first day: nothing earlier to compare with
 */
export default async function LivingConcept({ searchParams }: PageProps<"/concept/overview/living">) {
  const { briefing, first } = await searchParams;
  const data = await loadOverviewConcept({ first: first === "1" });
  return (
    <ConceptFrame automation={data.automation} first={data.first}>
      <LivingEnvironment data={data} initial={typeof briefing === "string" ? briefing : undefined} />
    </ConceptFrame>
  );
}
