import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LivingTree } from "@/components/brand/living-tree";
import { begin, voice } from "@/content/home";
import { pricing } from "@/content/marketing";

const price = (n: number | null) => (n === null ? "Custom" : `€${Number.isInteger(n) ? n : n.toFixed(2)}`);

/** One voice. Big, quiet, alone on the page. */
export function Voice() {
  return (
    <section aria-label="What customers say" className="border-t border-line py-28 sm:py-44">
      <figure className="container-page mx-auto max-w-5xl">
        <blockquote className="font-display text-[clamp(1.625rem,1.1rem+2vw,2.75rem)] font-light leading-[1.25] tracking-[-0.02em] text-fg text-balance">
          “{voice.quote}”
        </blockquote>
        <figcaption className="mt-10 flex items-center gap-4 text-sm">
          <span aria-hidden="true" className="h-px w-10 bg-fg-3" />
          <span className="text-fg">{voice.name}</span>
          <span className="text-fg-3">{voice.role}</span>
        </figcaption>
      </figure>
    </section>
  );
}

/**
 * The end of the story returns to the beginning: the tree, fully grown.
 * Plans are set as type, not cards.
 */
export function Begin() {
  return (
    <section id="begin" aria-labelledby="begin-title" className="relative overflow-hidden border-t border-line">
      <div className="container-page grid items-center gap-10 py-24 sm:py-32 lg:grid-cols-12 lg:py-36">
        <div className="lg:col-span-6">
          <h2 id="begin-title" className="text-headline font-light text-fg">
            {begin.title}
          </h2>
          <p className="mt-5 text-base text-fg-3 sm:text-lg">{begin.body}</p>

          <dl className="mt-14 grid grid-cols-3 border-t border-line">
            {pricing.plans.map((p) => (
              <div key={p.id} className="border-r border-line pr-4 pt-6 last:border-r-0 [&:not(:first-child)]:pl-4 sm:[&:not(:first-child)]:pl-6">
                <dt className="text-[11px] uppercase tracking-[0.22em] text-fg-3">{p.name}</dt>
                <dd className="mt-4">
                  <span className="tabular font-display text-[clamp(1.25rem,0.95rem+1.2vw,2rem)] font-light tracking-tight text-fg">{price(p.price.monthly)}</span>
                  {p.price.monthly !== null && <span className="ml-1 text-xs text-fg-3">/mo</span>}
                </dd>
                <dd className="mt-2 hidden text-[13px] leading-snug text-fg-3 sm:block">{p.description}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-fg-3">Excl. VAT · every plan includes all six modules</p>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href={begin.primaryCta.href}
              className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-fg pl-6 pr-5 text-sm font-medium text-canvas transition-[background-color,gap] duration-300 ease-out-soft hover:gap-3.5 hover:bg-white"
            >
              {begin.primaryCta.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a href={begin.secondaryCta.href} className="text-sm text-fg-2 underline decoration-line-strong underline-offset-8 transition-colors hover:text-fg hover:decoration-fg">
              {begin.secondaryCta.label}
            </a>
          </div>
        </div>
        <div className="relative h-[52svh] min-h-[340px] lg:col-span-6 lg:h-[70svh]">
          <LivingTree growth={1} className="absolute inset-0" label="The same tree, fully grown." />
        </div>
      </div>
    </section>
  );
}
