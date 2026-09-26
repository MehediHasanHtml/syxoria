import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { proofStats } from "@/content/marketing";
import { ProductPreview } from "./product-preview";
import type { PreviewData } from "./product-screens";

export function ProductSection({ data }: { data: PreviewData }) {
  return (
    <section id="product" aria-labelledby="product-title" className="relative py-20 sm:py-28">
      <div className="container-page">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <SectionHeading
            id="product-title"
            className="lg:col-span-7"
            eyebrow="The product"
            title="Everything moves forward."
            accent="With you, not around you."
          />
          <Reveal delay={120} className="lg:col-span-5">
            <dl className="grid grid-cols-3 divide-x divide-line border-y border-line">
              {proofStats.map((s) => (
                <div key={s.label} className="px-3 py-5 first:pl-0 sm:px-5">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="tabular whitespace-nowrap text-lg font-medium tracking-tight text-fg sm:text-2xl xl:text-[28px]">{s.value}</dd>
                  <dd className="mt-1.5 text-[11px] leading-snug text-fg-3 sm:text-xs">{s.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
        <div className="mt-14 sm:mt-16">
          <ProductPreview data={data} />
        </div>
      </div>
    </section>
  );
}
