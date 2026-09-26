import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { productModules } from "@/lib/mock-data/modules";
import { ModulesShowcase } from "./modules-showcase";
import type { PreviewData } from "./product-screens";

export function ModulesSection({ data }: { data: PreviewData }) {
  return (
    <section id="modules" aria-labelledby="modules-title" className="border-t border-line bg-canvas-2/40 py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          id="modules-title"
          eyebrow="Six modules · one living system"
          title="Each branch does one thing beautifully."
          body="Signal, understanding, action, momentum, time and direction. Use them together — every module feeds the others."
        />
        <Reveal delay={100} className="mt-14">
          <ModulesShowcase modules={productModules} data={data} />
        </Reveal>
      </div>
    </section>
  );
}
