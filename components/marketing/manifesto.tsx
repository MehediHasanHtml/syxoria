import { Reveal } from "@/components/shared/reveal";
import { manifesto } from "@/content/marketing";

/** Quiet, typography-led breathing space between two dense sections. */
export function Manifesto() {
  return (
    <section aria-labelledby="manifesto-title" className="relative py-28 sm:py-40">
      <div className="container-page">
        <Reveal className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          <p className="eyebrow">{manifesto.eyebrow}</p>
        </Reveal>
        <h2 id="manifesto-title" className="mt-10 max-w-4xl font-display font-light text-[clamp(1.625rem,1.2rem+1.6vw,2.75rem)] leading-[1.2] tracking-[-0.015em] text-fg">
          {manifesto.lines.map((line, i) => (
            <Reveal key={line} as="span" delay={i * 140} className="block">
              <span className={i === manifesto.lines.length - 1 ? "font-normal text-accent-strong" : undefined}>{line}</span>
            </Reveal>
          ))}
        </h2>
        <Reveal delay={420} className="mt-12 grid gap-8 lg:grid-cols-12">
          <p className="text-lead text-fg-2 lg:col-span-6 lg:col-start-7">{manifesto.body}</p>
        </Reveal>
      </div>
    </section>
  );
}
