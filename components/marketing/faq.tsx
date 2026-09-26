import { Accordion } from "@/components/ui/accordion";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { faqs } from "@/content/marketing";
import { siteConfig } from "@/lib/site-config";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-line py-20 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading id="faq-title" eyebrow="Resources" title="Questions, answered." />
          <Reveal delay={100}>
            <p className="mt-6 text-[15px] leading-relaxed text-fg-2">
              Something else on your mind?{" "}
              <a href={`mailto:${siteConfig.contactEmail}`} className="text-fg underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-accent">
                Write to us
              </a>{" "}
              — a human answers within a day.
            </p>
          </Reveal>
        </div>
        <Reveal delay={80} className="lg:col-span-7 lg:col-start-6">
          <Accordion items={faqs} defaultOpen={faqs[0].id} />
        </Reveal>
      </div>
    </section>
  );
}
