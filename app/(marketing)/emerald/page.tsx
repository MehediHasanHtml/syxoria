import type { Metadata } from "next";
import { CoreExperience } from "@/components/home/core-experience";
import { FilmProvider } from "@/components/home/film";
import { SectionNavigation } from "@/components/home/section-navigation";
import { SmoothScrollProvider } from "@/components/home/smooth-scroll";

export const metadata: Metadata = {
  title: "Emerald test",
  robots: { index: false, follow: false },
};

/**
 * The emerald test: the homepage exactly as it is — the same Core, stone,
 * materials and journey — with only the gold of its light replaced by a dark,
 * deep emerald, to compare the two. The homepage itself (/) stays gold.
 */
export default function EmeraldTestPage() {
  return (
    <SmoothScrollProvider>
      <FilmProvider>
        <CoreExperience palette="emerald" />
        <SectionNavigation />
      </FilmProvider>
    </SmoothScrollProvider>
  );
}
