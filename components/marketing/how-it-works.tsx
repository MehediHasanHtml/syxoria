import { SectionHeading } from "@/components/shared/section-heading";
import { progression } from "@/content/marketing";
import { GrowthStory } from "./growth-story";
import { GrowthTree } from "./growth-tree";

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="relative border-t border-line py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading id="how-title" eyebrow={progression.eyebrow} title={progression.title} body={progression.body} />
        <div className="mt-10 lg:mt-4">
          <GrowthStory stages={progression.stages} tree={<GrowthTree idPrefix="story-tree" showLabels />} />
        </div>
      </div>
    </section>
  );
}
