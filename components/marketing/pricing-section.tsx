import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { pricing } from "@/content/marketing";
import { PricingTable } from "./pricing";

export function PricingSection() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="border-t border-line bg-canvas-2/40 py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading id="pricing-title" align="center" eyebrow="Pricing" title={pricing.title} body={pricing.body} />
        <Reveal delay={100} className="mt-12">
          <PricingTable plans={pricing.plans} />
        </Reveal>
      </div>
    </section>
  );
}
