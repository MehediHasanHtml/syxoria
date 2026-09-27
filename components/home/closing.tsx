import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LivingTree } from "@/components/brand/living-tree";
import { begin } from "@/content/home";

/**
 * The end of the story returns to the beginning: the tree, fully grown.
 * One line, one action — nothing else competes with it.
 */
export function Begin() {
  return (
    <section id="begin" aria-labelledby="begin-title" className="relative overflow-hidden pb-32 pt-16 sm:pb-44">
      <div className="container-page flex flex-col items-center text-center">
        <div className="relative h-[58svh] min-h-[360px] w-full max-w-4xl lg:h-[72svh]">
          <LivingTree growth={1} className="absolute inset-0" label="The same tree, fully grown." />
        </div>
        <h2 id="begin-title" className="mt-14 text-headline font-light text-fg">
          {begin.title}
        </h2>
        <p className="mt-5 text-base text-fg-3">{begin.body}</p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
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
    </section>
  );
}
