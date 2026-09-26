import { ArrowNudge, ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { finalCta } from "@/content/marketing";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="relative isolate overflow-hidden border-t border-line py-28 sm:py-40">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 left-1/2 h-[70%] w-[90%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(214_168_113/0.12),transparent)]" />
        {/* A seedling: the story starts again */}
        <svg viewBox="0 0 200 200" className="absolute bottom-0 left-1/2 h-48 w-48 -translate-x-1/2 opacity-70">
          <path d="M100 200 C 100 170, 98 150, 100 120" stroke="#d6a871" strokeWidth="1.2" fill="none" className="gt-draw" style={{ ["--d" as string]: 0 }} pathLength={1} />
          <path d="M100 140 C 88 128, 76 126, 66 128 C 74 138, 88 142, 100 140" stroke="#d6a871" strokeWidth="1" fill="rgb(214 168 113 / 0.12)" pathLength={1} className="gt-draw" style={{ ["--d" as string]: 0.4 }} />
          <path d="M100 124 C 110 110, 124 106, 136 108 C 128 120, 114 126, 100 124" stroke="#d6a871" strokeWidth="1" fill="rgb(214 168 113 / 0.12)" pathLength={1} className="gt-draw" style={{ ["--d" as string]: 0.6 }} />
        </svg>
      </div>
      <div className="container-page text-center">
        <Reveal>
          <h2 id="cta-title" className="text-headline font-medium text-fg">
            {finalCta.title}
            <span className="block font-display font-light text-accent-strong">{finalCta.accent}</span>
          </h2>
          <p className="mx-auto mt-7 max-w-md text-lead text-fg-2">{finalCta.body}</p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup" size="lg">
              Create my account
              <ArrowNudge />
            </ButtonLink>
            <ButtonLink href="/app" size="lg" variant="outline">
              Explore the sample workspace
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
