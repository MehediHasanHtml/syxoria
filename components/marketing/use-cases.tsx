import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { useCases } from "@/content/marketing";

export function UseCases() {
  return (
    <section id="solutions" aria-labelledby="solutions-title" className="border-t border-line py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading id="solutions-title" eyebrow="Solutions" title="Built around how teams actually work." />
        <ol className="mt-14 border-t border-line">
          {useCases.map((u, i) => (
            <Reveal as="li" key={u.id} delay={i * 80} className="border-b border-line">
              <div className="group grid gap-3 py-8 transition-colors duration-500 sm:grid-cols-[4rem_10rem_1fr] sm:gap-6 lg:grid-cols-[4rem_12rem_1fr_16rem] lg:py-10">
                <span className="tabular text-sm text-fg-3 transition-colors group-hover:text-accent">{String(i + 1).padStart(2, "0")}</span>
                <p className="eyebrow pt-1 text-fg-2">{u.team}</p>
                <div>
                  <h3 className="text-title font-medium text-fg transition-transform duration-500 ease-out-soft lg:group-hover:translate-x-1">{u.title}</h3>
                  <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-fg-2">{u.body}</p>
                </div>
                <p className="flex items-center gap-2 self-center text-sm text-fg sm:col-start-3 lg:col-start-auto lg:justify-end">
                  <ArrowUpRight className="size-4 text-accent" aria-hidden="true" />
                  {u.outcome}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
