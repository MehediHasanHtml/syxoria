import type { Metadata } from "next";
import { BriefingConcept } from "@/components/concept/briefing-concept";

export const metadata: Metadata = {
  title: "Briefing concept",
  robots: { index: false, follow: false },
};

/**
 * A static study of the executive briefing's new direction, for review before it is built.
 *
 *   ?frame=first   the briefing alone, at 1440 × 900 (also: later, or a step of the reveal 0 to 4)
 */
export default async function BriefingConceptPage({ searchParams }: PageProps<"/concept/briefing">) {
  const { frame } = await searchParams;
  return <BriefingConcept frame={typeof frame === "string" ? frame : undefined} />;
}
