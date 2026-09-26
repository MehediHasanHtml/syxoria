import { ArrowNudge, ButtonLink } from "@/components/ui/button";
import { ModuleIcon } from "@/components/shared/module-icon";
import { hero } from "@/content/marketing";
import { GrowthTree } from "./growth-tree";
import { HeroTreeStage } from "./hero-tree-stage";
import { DemoTrigger } from "./demo-trigger";
import type { PreviewData } from "./product-screens";

export function Hero({ data }: { data: PreviewData }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden pt-(--header-h)">
      {/* Atmosphere: warm light behind the tree, vignette to canvas */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-[4%] h-[80%] w-[70%] rounded-full bg-[radial-gradient(closest-side,rgb(214_168_113/0.10),transparent)] max-lg:left-[-10%] max-lg:right-auto max-lg:top-[40%] max-lg:w-[120%]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas" />
      </div>

      <div className="container-page grid items-center gap-y-6 pb-10 pt-10 sm:pt-16 lg:min-h-[calc(100svh-var(--header-h))] lg:max-h-[1000px] lg:grid-cols-12 lg:gap-x-8 lg:pb-16 lg:pt-6">
        <div className="relative z-[1] lg:col-span-6">
          <div className="animate-fade-in">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-accent" />
              <p className="eyebrow text-fg-2">{hero.eyebrow}</p>
            </div>
            <h1 id="hero-title" className="mt-6 max-w-[17ch] text-display font-medium text-fg">
              {hero.titleLead}{" "}
              <span className="block font-display font-light text-accent-strong">{hero.titleAccent}</span>
            </h1>
            <p className="mt-6 max-w-[32rem] text-lead text-fg-2">{hero.body}</p>
          </div>

          <ul aria-label="Core modules" className="mt-9 flex max-w-md items-stretch divide-x divide-line animate-fade-in [animation-delay:120ms]">
            {hero.pillars.map((p) => (
              <li key={p.key} className="flex flex-1 flex-col gap-2.5 px-4 first:pl-0">
                <ModuleIcon module={p.key} className="size-5 text-fg" />
                <span className="text-[11px] font-medium uppercase tracking-label text-fg">{p.key}</span>
                <span className="-mt-1.5 text-xs text-fg-3">{p.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3 animate-fade-in [animation-delay:200ms] sm:flex-row sm:items-center">
            <ButtonLink href={hero.primaryCta.href} size="lg">
              {hero.primaryCta.label}
              <ArrowNudge />
            </ButtonLink>
            <DemoTrigger label={hero.secondaryCta.label} data={data} />
          </div>
          <p className="mt-5 text-xs text-fg-3 animate-fade-in [animation-delay:260ms]">No credit card · 10-minute setup · Hosted in the EU</p>
        </div>

        <div className="relative lg:col-span-6">
          <HeroTreeStage className="mx-auto w-full max-w-[560px] sm:max-w-[640px] lg:-mr-8 lg:max-w-none xl:-mr-16">
            <GrowthTree idPrefix="hero-tree" />
          </HeroTreeStage>
        </div>
      </div>

      <div className="container-page">
        <a
          href="#product"
          className="group mx-auto hidden w-fit flex-col items-center gap-2 pb-8 text-[11px] uppercase tracking-label text-fg-3 transition-colors hover:text-fg-2 lg:flex"
        >
          Scroll to grow
          <span aria-hidden="true" className="relative h-10 w-px overflow-hidden bg-line">
            <span className="absolute inset-x-0 top-0 h-4 animate-[scroll-cue_2.2s_var(--ease-in-out-soft)_infinite] bg-accent" />
          </span>
        </a>
      </div>
    </section>
  );
}
