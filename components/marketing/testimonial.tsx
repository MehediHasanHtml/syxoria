import { Avatar } from "@/components/ui/avatar";
import { Reveal } from "@/components/shared/reveal";
import { testimonial } from "@/content/marketing";

export function Testimonial() {
  return (
    <section id="customers" aria-labelledby="customers-title" className="relative overflow-hidden border-t border-line bg-canvas-2/40 py-24 sm:py-36">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      <div className="container-page">
        <h2 id="customers-title" className="sr-only">
          What customers say
        </h2>
        <Reveal as="figure" className="mx-auto max-w-4xl text-center">
          <span aria-hidden="true" className="font-display text-7xl leading-none text-accent">
            “
          </span>
          <blockquote className="-mt-4 font-display font-light text-[clamp(1.375rem,1.05rem+1.25vw,2.125rem)] leading-[1.3] tracking-[-0.01em] text-fg text-balance">
            {testimonial.quote}
          </blockquote>
          <figcaption className="mt-10 flex items-center justify-center gap-3">
            <Avatar initials="ML" name={testimonial.name} size="md" />
            <span className="text-left">
              <span className="block text-sm font-medium text-fg">{testimonial.name}</span>
              <span className="block text-[13px] text-fg-3">{testimonial.role}</span>
            </span>
          </figcaption>
        </Reveal>
        <Reveal delay={150}>
          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-3 divide-x divide-line border-y border-line">
            {testimonial.metrics.map((m) => (
              <div key={m.label} className="flex flex-col-reverse items-center px-2 py-6 text-center">
                <dt className="mt-1.5 text-xs text-fg-3">{m.label}</dt>
                <dd className="tabular text-xl font-medium tracking-tight text-fg sm:text-3xl">{m.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
